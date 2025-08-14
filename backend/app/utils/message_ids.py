"""
ULID/Snowflake ID generator with development fallbacks
Provides time-sortable unique identifiers for messages
"""
import os
import time
import logging
from typing import Union

try:
    from ulid import ULID
    ULID_AVAILABLE = True
except ImportError:
    ULID_AVAILABLE = False

logger = logging.getLogger(__name__)

class MessageIDGenerator:
    """Generate unique, time-sortable IDs for messages"""
    
    def __init__(self):
        self.is_development = os.environ.get('FLASK_ENV', 'development') == 'development'
        self._counter = 0
        self._last_timestamp = 0
        
        if not ULID_AVAILABLE and not self.is_development:
            # TODO: PRODUCTION - ULID is required for production
            logger.error("ULID library is required for production. Install: pip install ulid-py==1.1.0")
            raise RuntimeError("ULID required for production")
        
        if not ULID_AVAILABLE and self.is_development:
            logger.warning("ULID not available, using timestamp+counter fallback for development")
    
    def generate_id(self) -> str:
        """Generate a unique, time-sortable ID"""
        try:
            if ULID_AVAILABLE:
                # Use ULID for production-quality IDs
                ulid_obj = ULID()
                return str(ulid_obj)
            else:
                # Development fallback - timestamp + counter
                # TODO: PRODUCTION - Replace with proper ULID implementation
                current_time = int(time.time() * 1000)  # milliseconds
                
                if current_time == self._last_timestamp:
                    self._counter += 1
                else:
                    self._counter = 0
                    self._last_timestamp = current_time
                
                # Format: timestamp(13 digits) + counter(6 digits padded)
                fallback_id = f"{current_time}{self._counter:06d}"
                logger.debug(f"Generated fallback ID: {fallback_id}")
                return fallback_id
                
        except Exception as e:
            logger.error(f"ID generation failed: {e}")
            # Ultimate fallback - basic timestamp
            return str(int(time.time() * 1000000))  # microseconds
    
    def validate_id(self, id_str: str) -> bool:
        """Validate ID format"""
        try:
            if ULID_AVAILABLE and len(id_str) == 26:
                # Validate ULID format
                ULID.from_str(id_str)
                return True
            elif len(id_str) == 19:
                # Validate development fallback format (13 + 6 digits)
                return id_str.isdigit()
            else:
                # Accept any numeric string as fallback
                return id_str.isdigit()
                
        except Exception:
            return False
    
    def extract_timestamp(self, id_str: str) -> int:
        """Extract timestamp from ID (milliseconds since epoch)"""
        try:
            if ULID_AVAILABLE and len(id_str) == 26:
                # Extract from ULID
                ulid_obj = ULID.from_str(id_str)
                return int(ulid_obj.timestamp * 1000)  # Convert to milliseconds
            elif len(id_str) >= 13:
                # Extract from development fallback
                return int(id_str[:13])
            else:
                return 0
                
        except Exception:
            return 0
    
    def is_newer(self, id1: str, id2: str) -> bool:
        """Check if id1 is newer than id2"""
        try:
            # IDs are lexicographically sortable
            return id1 > id2
        except Exception:
            return False


class SnowflakeGenerator:
    """
    Snowflake-style ID generator as alternative to ULID
    Format: timestamp(41 bits) + machine_id(10 bits) + sequence(12 bits)
    """
    
    def __init__(self, machine_id: int = 1):
        self.machine_id = machine_id & 0x3FF  # 10 bits
        self.sequence = 0
        self.last_timestamp = 0
        self.epoch = 1640995200000  # 2022-01-01 00:00:00 UTC in milliseconds
        
        if not self.is_development:
            # TODO: PRODUCTION - Set unique machine_id for each instance
            pass
    
    @property
    def is_development(self):
        return os.environ.get('FLASK_ENV', 'development') == 'development'
    
    def generate_id(self) -> int:
        """Generate Snowflake ID"""
        timestamp = int(time.time() * 1000) - self.epoch
        
        if timestamp == self.last_timestamp:
            self.sequence = (self.sequence + 1) & 0xFFF  # 12 bits
            if self.sequence == 0:
                # Wait for next millisecond
                while timestamp <= self.last_timestamp:
                    timestamp = int(time.time() * 1000) - self.epoch
        else:
            self.sequence = 0
        
        self.last_timestamp = timestamp
        
        # Combine: timestamp(41) + machine_id(10) + sequence(12) = 63 bits
        snowflake_id = (timestamp << 22) | (self.machine_id << 12) | self.sequence
        
        return snowflake_id


# Global instances
message_id_generator = MessageIDGenerator()
snowflake_generator = SnowflakeGenerator()

def generate_message_id() -> str:
    """Convenient function to generate message ID"""
    return message_id_generator.generate_id()

def validate_message_id(id_str: str) -> bool:
    """Convenient function to validate message ID"""
    return message_id_generator.validate_id(id_str)