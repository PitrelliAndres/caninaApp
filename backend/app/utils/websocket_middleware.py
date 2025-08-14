"""WebSocket middleware for rate limiting and security."""
import logging
from functools import wraps
from datetime import datetime
from flask import current_app
from flask_socketio import disconnect
from app.utils.rate_limiter import check_websocket_event_rate_limit
from app.utils.error_handler import generate_correlation_id, mask_sensitive_data

logger = logging.getLogger(__name__)

def websocket_rate_limit(events_per_minute: int = 30):
    """Rate limiting decorator for WebSocket events."""
    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            from flask_socketio import session
            
            user_id = session.get('user_id')
            if not user_id:
                logger.warning("WebSocket event without valid user session")
                disconnect()
                return
            
            # Apply rate limiting
            if not check_websocket_event_rate_limit(user_id, events_per_minute):
                correlation_id = generate_correlation_id()
                logger.warning(
                    f"Rate limit exceeded for WebSocket event {f.__name__}",
                    extra={
                        'user_id': user_id,
                        'event': f.__name__,
                        'correlation_id': correlation_id,
                        'limit': events_per_minute
                    }
                )
                
                # TODO: harden for production - Disconnect abusive users
                if not current_app.debug:
                    disconnect()
                return
            
            return f(*args, **kwargs)
            
        return decorated_function
    return decorator

def websocket_auth_required(f):
    """Authentication decorator for WebSocket events."""
    @wraps(f)
    def decorated_function(*args, **kwargs):
        from flask_socketio import session
        
        user_id = session.get('user_id')
        if not user_id:
            correlation_id = generate_correlation_id()
            logger.warning(
                f"Unauthenticated WebSocket event {f.__name__}",
                extra={
                    'event': f.__name__,
                    'correlation_id': correlation_id
                }
            )
            disconnect()
            return
        
        return f(*args, **kwargs)
        
    return decorated_function

def websocket_input_validation(required_fields: list = None):
    """Input validation decorator for WebSocket events."""
    def decorator(f):
        @wraps(f)
        def decorated_function(data, *args, **kwargs):
            from flask_socketio import session
            
            user_id = session.get('user_id')
            correlation_id = generate_correlation_id()
            
            # Validate data structure
            if not isinstance(data, dict):
                logger.warning(
                    f"Invalid data type for WebSocket event {f.__name__}",
                    extra={
                        'user_id': user_id,
                        'event': f.__name__,
                        'correlation_id': correlation_id,
                        'data_type': type(data).__name__
                    }
                )
                return
            
            # Validate required fields
            if required_fields:
                missing_fields = [field for field in required_fields if field not in data]
                if missing_fields:
                    logger.warning(
                        f"Missing required fields in WebSocket event {f.__name__}",
                        extra={
                            'user_id': user_id,
                            'event': f.__name__,
                            'correlation_id': correlation_id,
                            'missing_fields': missing_fields,
                            'provided_data': mask_sensitive_data(data)
                        }
                    )
                    return
            
            return f(data, *args, **kwargs)
            
        return decorated_function
    return decorator

def websocket_error_handler(f):
    """Error handling decorator for WebSocket events."""
    @wraps(f)
    def decorated_function(*args, **kwargs):
        from flask_socketio import session, emit
        
        user_id = session.get('user_id')
        correlation_id = generate_correlation_id()
        
        try:
            return f(*args, **kwargs)
        except Exception as e:
            logger.error(
                f"Error in WebSocket event {f.__name__}: {str(e)}",
                extra={
                    'user_id': user_id,
                    'event': f.__name__,
                    'correlation_id': correlation_id,
                    'error': str(e)
                }
            )
            
            # Send error to client in development only
            if current_app.debug:
                emit('error', {
                    'event': f.__name__,
                    'message': 'Event processing failed',
                    'traceId': correlation_id
                })
            
            return None
            
    return decorated_function