"""
Enhanced logging utilities with structured error reporting
"""
import os
import sys
import traceback
import logging
from datetime import datetime
from functools import wraps
from flask import current_app, request, g
import uuid

class StructuredLogger:
    @staticmethod
    def log_error(logger, error, context=None, user_id=None, request_id=None):
        """Log error with structured information"""
        error_id = str(uuid.uuid4())[:8]
        
        error_data = {
            'error_id': error_id,
            'timestamp': datetime.utcnow().isoformat(),
            'error_type': type(error).__name__,
            'error_message': str(error),
            'user_id': user_id or getattr(request, 'current_user_id', None),
            'request_id': request_id or getattr(g, 'request_id', None),
            'context': context or {},
        }
        
        # Add request info if available
        if request:
            error_data.update({
                'method': request.method,
                'url': request.url,
                'remote_addr': request.remote_addr,
                'user_agent': request.headers.get('User-Agent', 'Unknown')
            })
        
        # Add full traceback in development
        if os.environ.get('FLASK_ENV', 'development') == 'development':
            error_data['traceback'] = traceback.format_exc()
        
        logger.error(f"Error {error_id}: {error_data}")
        return error_id
    
    @staticmethod 
    def log_warning(logger, message, context=None, user_id=None):
        """Log warning with context"""
        warning_data = {
            'timestamp': datetime.utcnow().isoformat(),
            'message': message,
            'user_id': user_id or getattr(request, 'current_user_id', None),
            'context': context or {},
        }
        
        if request:
            warning_data.update({
                'method': request.method,
                'url': request.url,
                'remote_addr': request.remote_addr
            })
            
        logger.warning(f"Warning: {warning_data}")
    
    @staticmethod
    def log_info(logger, message, context=None, user_id=None):
        """Log info with context"""
        info_data = {
            'timestamp': datetime.utcnow().isoformat(), 
            'message': message,
            'user_id': user_id or getattr(request, 'current_user_id', None),
            'context': context or {},
        }
        
        logger.info(f"Info: {info_data}")

def log_route_errors(f):
    """Decorator to automatically log route errors with context"""
    @wraps(f)
    def decorated_function(*args, **kwargs):
        try:
            return f(*args, **kwargs)
        except Exception as e:
            error_id = StructuredLogger.log_error(
                current_app.logger,
                e,
                context={
                    'route': f.__name__,
                    'args': args,
                    'kwargs': kwargs
                }
            )
            
            # Return structured error response
            if os.environ.get('FLASK_ENV', 'development') == 'development':
                return {
                    'error': 'Internal server error',
                    'error_id': error_id,
                    'debug': str(e),
                    'type': type(e).__name__
                }, 500
            else:
                return {
                    'error': 'Internal server error', 
                    'error_id': error_id
                }, 500
    
    return decorated_function

def log_websocket_errors(f):
    """Decorator for WebSocket event error logging"""
    @wraps(f)
    def decorated_function(*args, **kwargs):
        try:
            return f(*args, **kwargs)
        except Exception as e:
            error_id = StructuredLogger.log_error(
                current_app.logger,
                e,
                context={
                    'websocket_event': f.__name__,
                    'args': args,
                    'kwargs': kwargs,
                    'socket_id': getattr(request, 'sid', None)
                }
            )
            
            # Emit error to client
            from flask_socketio import emit
            emit('error', {
                'code': 'INTERNAL_ERROR',
                'message': 'Internal server error',
                'error_id': error_id
            })
            
    return decorated_function

# Create logger instance
structured_logger = StructuredLogger()