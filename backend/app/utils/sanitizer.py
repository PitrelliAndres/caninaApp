"""
Input sanitization and validation with development-friendly behavior
Prevents XSS, injection attacks, and validates message content
"""
import os
import re
import logging
from typing import Optional, Dict, Any, List
import html

try:
    import bleach
    BLEACH_AVAILABLE = True
except ImportError:
    BLEACH_AVAILABLE = False
    # Mock bleach for development
    class MockBleach:
        @staticmethod
        def clean(text, tags=None, attributes=None, strip=False):
            return text
    bleach = MockBleach()

logger = logging.getLogger(__name__)

class MessageSanitizer:
    """Sanitize and validate message content"""
    
    def __init__(self):
        self.is_development = os.environ.get('FLASK_ENV', 'development') == 'development'
        
        if not BLEACH_AVAILABLE and not self.is_development:
            # TODO: PRODUCTION - bleach is required for production security
            logger.error("bleach library is required for production. Install: pip install bleach")
            raise RuntimeError("bleach required for production")
        
        if not BLEACH_AVAILABLE and self.is_development:
            logger.warning("bleach not available, using basic HTML escaping for development")
        
        # Allowed HTML tags and attributes (very restrictive)
        self.allowed_tags = ['b', 'i', 'em', 'strong', 'br']
        self.allowed_attributes = {}
        
        # Message validation rules
        self.min_length = 1
        self.max_length = 1000  # TODO: PRODUCTION - Adjust based on your requirements
        
        # Patterns to detect potentially malicious content
        self.suspicious_patterns = [
            r'<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>',  # Script tags
            r'javascript:',                                          # Javascript URLs  
            r'on\w+\s*=',                                           # Event handlers
            r'data:text/html',                                      # Data URLs
            r'vbscript:',                                           # VBScript URLs
        ]
        
        # Compile patterns for performance
        self.compiled_patterns = [re.compile(pattern, re.IGNORECASE) 
                                for pattern in self.suspicious_patterns]
    
    def sanitize_message_text(self, text: str) -> tuple[str, List[str]]:
        """
        Sanitize message text content
        Returns: (cleaned_text, warnings)
        """
        warnings = []
        
        if not text or not isinstance(text, str):
            return "", ["Empty or invalid message text"]
        
        # Length validation
        if len(text) < self.min_length:
            warning = f"Message too short (min: {self.min_length} chars)"
            warnings.append(warning)
            if not self.is_development:
                # TODO: PRODUCTION - Reject short messages in production
                return "", warnings
        
        if len(text) > self.max_length:
            warning = f"Message too long (max: {self.max_length} chars), truncating"
            warnings.append(warning)
            text = text[:self.max_length]
        
        # Check for suspicious patterns
        for pattern in self.compiled_patterns:
            if pattern.search(text):
                warning = f"Suspicious content detected: {pattern.pattern}"
                warnings.append(warning)
                if not self.is_development:
                    # TODO: PRODUCTION - Reject suspicious content in production
                    return "", warnings + ["Message rejected due to security concerns"]
        
        # Sanitize HTML
        if BLEACH_AVAILABLE:
            # Use bleach for comprehensive sanitization
            cleaned_text = bleach.clean(
                text, 
                tags=self.allowed_tags, 
                attributes=self.allowed_attributes,
                strip=True
            )
            
            # Check if content was modified
            if cleaned_text != text:
                warnings.append("HTML content was sanitized")
        else:
            # Development fallback - basic HTML escaping
            cleaned_text = html.escape(text)
            if cleaned_text != text:
                warnings.append("HTML content was escaped (dev mode)")
        
        # Additional cleanup
        cleaned_text = self._clean_whitespace(cleaned_text)
        cleaned_text = self._remove_excessive_newlines(cleaned_text)
        
        if self.is_development and warnings:
            logger.warning(f"Message sanitization warnings (dev mode): {warnings}")
        
        return cleaned_text, warnings
    
    def validate_message_data(self, data: Dict[str, Any]) -> tuple[Dict[str, Any], List[str]]:
        """
        Validate complete message data structure
        Returns: (validated_data, warnings)
        """
        warnings = []
        validated_data = {}
        
        # Required fields
        required_fields = ['text']
        for field in required_fields:
            if field not in data:
                warnings.append(f"Missing required field: {field}")
                if not self.is_development:
                    # TODO: PRODUCTION - Reject incomplete data in production
                    return {}, warnings
        
        # Sanitize text content
        if 'text' in data:
            clean_text, text_warnings = self.sanitize_message_text(data['text'])
            validated_data['text'] = clean_text
            warnings.extend(text_warnings)
        
        # Optional fields with validation
        optional_fields = {
            'reply_to_id': self._validate_id_field,
            'attachment_url': self._validate_url_field,
            'message_type': self._validate_message_type,
        }
        
        for field, validator in optional_fields.items():
            if field in data:
                try:
                    validated_value, field_warnings = validator(data[field])
                    if validated_value is not None:
                        validated_data[field] = validated_value
                    warnings.extend(field_warnings)
                except Exception as e:
                    warning = f"Validation failed for {field}: {str(e)}"
                    warnings.append(warning)
                    if not self.is_development:
                        # TODO: PRODUCTION - Reject invalid fields in production
                        continue
        
        return validated_data, warnings
    
    def _validate_id_field(self, value: Any) -> tuple[Optional[str], List[str]]:
        """Validate ID field (ULID or numeric)"""
        warnings = []
        
        if not value:
            return None, warnings
        
        str_value = str(value)
        
        # Basic validation - accept alphanumeric IDs
        if not re.match(r'^[a-zA-Z0-9]+$', str_value):
            warnings.append(f"Invalid ID format: {str_value}")
            return None, warnings
        
        return str_value, warnings
    
    def _validate_url_field(self, value: Any) -> tuple[Optional[str], List[str]]:
        """Validate URL field"""
        warnings = []
        
        if not value:
            return None, warnings
        
        str_value = str(value)
        
        # Basic URL validation
        if not str_value.startswith(('http://', 'https://')):
            warnings.append(f"Invalid URL scheme: {str_value}")
            if self.is_development:
                # TODO: PRODUCTION - Only allow HTTPS URLs in production
                return str_value, warnings
            else:
                return None, warnings
        
        # Check for suspicious URLs
        suspicious_domains = ['javascript', 'data', 'vbscript']
        for domain in suspicious_domains:
            if domain in str_value.lower():
                warnings.append(f"Suspicious URL detected: {str_value}")
                return None, warnings
        
        return str_value, warnings
    
    def _validate_message_type(self, value: Any) -> tuple[Optional[str], List[str]]:
        """Validate message type"""
        warnings = []
        allowed_types = ['text', 'image', 'file', 'system']
        
        if not value:
            return 'text', warnings  # Default type
        
        str_value = str(value).lower()
        if str_value not in allowed_types:
            warnings.append(f"Invalid message type: {str_value}, using 'text'")
            return 'text', warnings
        
        return str_value, warnings
    
    def _clean_whitespace(self, text: str) -> str:
        """Clean excessive whitespace"""
        # Replace multiple spaces with single space
        text = re.sub(r' +', ' ', text)
        # Strip leading/trailing whitespace
        text = text.strip()
        return text
    
    def _remove_excessive_newlines(self, text: str) -> str:
        """Remove excessive newlines (max 2 consecutive)"""
        return re.sub(r'\n{3,}', '\n\n', text)
    
    def is_message_empty(self, text: str) -> bool:
        """Check if message is effectively empty after cleaning"""
        if not text:
            return True
        
        # Check if only whitespace/newlines
        return not text.strip()


# Global sanitizer instance  
sanitizer = MessageSanitizer()

def sanitize_message(text: str) -> tuple[str, List[str]]:
    """Convenient function to sanitize message text"""
    return sanitizer.sanitize_message_text(text)

def validate_message_data(data: Dict[str, Any]) -> tuple[Dict[str, Any], List[str]]:
    """Convenient function to validate message data"""
    return sanitizer.validate_message_data(data)