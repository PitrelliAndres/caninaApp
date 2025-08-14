"""
Rate limiting with development-friendly configurations
Prevents abuse while being permissive during development
"""
import os
import time
import logging
from functools import wraps
from typing import Dict, Optional, Callable
from flask import request, jsonify, current_app
from flask_socketio import disconnect

from .redis_client import redis_client

logger = logging.getLogger(__name__)

class RateLimiter:
    """Rate limiter with development/production configurations"""
    
    def __init__(self):
        self.is_development = os.environ.get('FLASK_ENV', 'development') == 'development'
        
        # Rate limits (requests per window in seconds)
        if self.is_development:
            # Very permissive limits for development
            self.limits = {
                'message_send': (1000, 60),     # 1000 messages per minute
                'typing_event': (500, 60),      # 500 typing events per minute  
                'connection': (100, 60),        # 100 connections per minute
                'api_general': (10000, 60),     # 10000 API calls per minute
                'websocket_event': (2000, 60), # 2000 WebSocket events per minute
            }
        else:
            # Production limits - TODO: PRODUCTION - Adjust these values based on your needs
            self.limits = {
                'message_send': (30, 60),       # 30 messages per minute
                'typing_event': (60, 60),       # 60 typing events per minute
                'connection': (10, 60),         # 10 connections per minute  
                'api_general': (300, 60),       # 300 API calls per minute
                'websocket_event': (120, 60),   # 120 WebSocket events per minute
            }
    
    def get_client_identifier(self, request_obj=None) -> str:
        """Get client identifier for rate limiting"""
        try:
            if request_obj:
                # Use user ID if authenticated, otherwise IP
                user_id = getattr(request_obj, 'current_user_id', None)
                if user_id:
                    return f"user:{user_id}"
                return f"ip:{request_obj.remote_addr}"
            elif request:
                # Flask request context
                user_id = getattr(request, 'current_user_id', None) 
                if user_id:
                    return f"user:{user_id}"
                return f"ip:{request.remote_addr}"
            else:
                return "unknown:0"
        except Exception:
            return "unknown:0"
    
    def check_rate_limit(self, 
                        limit_type: str, 
                        identifier: Optional[str] = None,
                        custom_limit: Optional[tuple] = None) -> tuple[bool, Dict]:
        """
        Check if request is within rate limit
        Returns: (allowed: bool, info: dict)
        """
        try:
            if identifier is None:
                identifier = self.get_client_identifier()
            
            # Use custom limit or default for type
            if custom_limit:
                limit, window = custom_limit
            else:
                limit, window = self.limits.get(limit_type, (1000, 60))  # Very high default
            
            # Create Redis key
            key = f"rate_limit:{limit_type}:{identifier}"
            
            # Check with Redis (or fallback)
            allowed = redis_client.check_rate_limit(key, limit, window)
            
            info = {
                'limit_type': limit_type,
                'identifier': identifier,
                'limit': limit,
                'window': window,
                'allowed': allowed
            }
            
            if not allowed:
                logger.warning(f"Rate limit exceeded: {info}")
            
            return allowed, info
            
        except Exception as e:
            logger.error(f"Rate limit check failed: {e}")
            # Fail open - allow request if rate limiting fails
            return True, {'error': str(e)}
    
    def rate_limit(self, 
                  limit_type: str, 
                  custom_limit: Optional[tuple] = None,
                  error_message: str = "Rate limit exceeded"):
        """Decorator for rate limiting Flask routes"""
        def decorator(f: Callable):
            @wraps(f)
            def decorated_function(*args, **kwargs):
                allowed, info = self.check_rate_limit(limit_type, custom_limit=custom_limit)
                
                if not allowed:
                    if self.is_development:
                        # TODO: PRODUCTION - In production, this should return 429
                        logger.warning(f"Rate limit would be exceeded in production: {info}")
                        # Continue in development
                    else:
                        return jsonify({
                            'error': error_message,
                            'rate_limit_info': {
                                'limit': info.get('limit'),
                                'window': info.get('window'),
                                'retry_after': info.get('window', 60)
                            }
                        }), 429
                
                return f(*args, **kwargs)
            return decorated_function
        return decorator
    
    def websocket_rate_limit(self,
                           limit_type: str,
                           user_id: int,
                           custom_limit: Optional[tuple] = None) -> bool:
        """Check rate limit for WebSocket events"""
        identifier = f"user:{user_id}"
        allowed, info = self.check_rate_limit(limit_type, identifier, custom_limit)
        
        if not allowed:
            if self.is_development:
                # TODO: PRODUCTION - In production, disconnect the user
                logger.warning(f"WebSocket rate limit would be exceeded in production: {info}")
                return True  # Allow in development
            else:
                logger.warning(f"WebSocket rate limit exceeded, disconnecting user {user_id}")
                disconnect()
                return False
        
        return True


# Global rate limiter instance
rate_limiter = RateLimiter()

# Convenient decorators
def rate_limit_messages(f):
    """Rate limit message sending"""
    return rate_limiter.rate_limit('message_send', 
                                  error_message="Too many messages sent")(f)

def rate_limit_api(f):
    """Rate limit general API calls"""  
    return rate_limiter.rate_limit('api_general',
                                  error_message="Too many API requests")(f)

def rate_limit_connections(f):
    """Rate limit connections"""
    return rate_limiter.rate_limit('connection',
                                  error_message="Too many connection attempts")(f)

# WebSocket event rate limiting helpers
def check_message_rate_limit(user_id: int) -> bool:
    """Check if user can send a message"""
    return rate_limiter.websocket_rate_limit('message_send', user_id)

def check_typing_rate_limit(user_id: int) -> bool:
    """Check if user can send typing event"""  
    return rate_limiter.websocket_rate_limit('typing_event', user_id)

def check_websocket_event_rate_limit(user_id: int) -> bool:
    """Check general WebSocket event rate limit"""
    return rate_limiter.websocket_rate_limit('websocket_event', user_id)