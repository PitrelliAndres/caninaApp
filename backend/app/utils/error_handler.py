"""Centralized error handling with correlation IDs and safe responses."""
import uuid
import logging
from typing import Dict, Any, Optional
from flask import jsonify, current_app

logger = logging.getLogger(__name__)

def generate_correlation_id() -> str:
    """Generate unique correlation ID for error tracking."""
    return str(uuid.uuid4())

def safe_error_response(
    message: str,
    status_code: int = 500,
    error_code: str = "INTERNAL_ERROR",
    details: Optional[Dict[str, Any]] = None,
    correlation_id: Optional[str] = None
) -> tuple:
    """Return safe error response with correlation ID."""
    
    if not correlation_id:
        correlation_id = generate_correlation_id()
    
    # Log error with full context (not exposed to client)
    logger.error(
        f"Error {correlation_id}: {message}",
        extra={
            'correlation_id': correlation_id,
            'error_code': error_code,
            'status_code': status_code,
            'details': details
        }
    )
    
    # Safe response for client
    response = {
        'error': {
            'code': error_code,
            'message': message,
            'traceId': correlation_id
        }
    }
    
    # Include details only in DEV
    if current_app and current_app.debug and details:
        response['error']['details'] = details
    
    return jsonify(response), status_code

def mask_sensitive_data(data: Dict[str, Any]) -> Dict[str, Any]:
    """Mask PII and sensitive data in logs."""
    sensitive_fields = [
        'password', 'token', 'jwt', 'secret', 'key',
        'email', 'phone', 'ssn', 'credit_card',
        'authorization', 'cookie'
    ]
    
    if not isinstance(data, dict):
        return data
    
    masked = {}
    for key, value in data.items():
        key_lower = key.lower()
        
        if any(field in key_lower for field in sensitive_fields):
            if isinstance(value, str) and len(value) > 4:
                masked[key] = value[:2] + '*' * (len(value) - 4) + value[-2:]
            else:
                masked[key] = '***MASKED***'
        elif isinstance(value, dict):
            masked[key] = mask_sensitive_data(value)
        elif isinstance(value, list):
            masked[key] = [mask_sensitive_data(item) if isinstance(item, dict) else item for item in value]
        else:
            masked[key] = value
    
    return masked