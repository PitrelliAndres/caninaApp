"""Authentication utilities with strict JWT validation for PROD."""
import os
import time
from functools import wraps
from flask import request, jsonify, current_app
import jwt
from datetime import datetime, timedelta
from google.oauth2 import id_token
from google.auth.transport import requests
import requests as http_requests
from app.utils.error_handler import safe_error_response, mask_sensitive_data

def verify_google_token(token):
    """Verificar token de Google (ID token o access token)"""
    try:
        # Primero intentar como ID token (JWT)
        if token.startswith('eyJ'):
            try:
                # Verificar ID token con Google
                client_id = os.environ.get('GOOGLE_CLIENT_ID', '301209986798-fuk4h414g85ljkaho0b4hgn6qgb4o16p.apps.googleusercontent.com')
                idinfo = id_token.verify_oauth2_token(token, requests.Request(), client_id)
                
                if idinfo['iss'] not in ['accounts.google.com', 'https://accounts.google.com']:
                    raise ValueError('Wrong issuer.')
                
                return {
                    'sub': idinfo['sub'],
                    'email': idinfo['email'],
                    'name': idinfo.get('name'),
                    'picture': idinfo.get('picture'),
                    'email_verified': idinfo.get('email_verified', False)
                }
            except ValueError as e:
                current_app.logger.error(f"Error verificando ID token: {str(e)}")
                # Si falla, intentar como access token
                pass
        
        # Intentar como access token
        response = http_requests.get(
            'https://www.googleapis.com/oauth2/v1/userinfo',
            headers={'Authorization': f'Bearer {token}'}
        )
        
        if response.status_code != 200:
            return None
            
        user_info = response.json()
        
        # Transformar a formato esperado
        return {
            'sub': user_info.get('id'),  # Google ID
            'email': user_info.get('email'),
            'name': user_info.get('name'),
            'picture': user_info.get('picture'),
            'email_verified': user_info.get('verified_email', False)
        }
        
    except Exception as e:
        current_app.logger.error(f"Error verificando token Google: {str(e)}")
        return None

def generate_tokens(user_id):
    """Generate JWT tokens with strict validation claims and realtime token."""
    now = datetime.utcnow()
    
    # Environment-based configuration
    is_dev = os.environ.get('FLASK_ENV', 'development') == 'development'
    
    # DEV: longer-lived tokens, PROD: short-lived (10-15 min)
    access_ttl = timedelta(hours=2) if is_dev else timedelta(minutes=int(os.environ.get('JWT_ACCESS_TTL_MIN', 15)))
    realtime_ttl = timedelta(hours=1) if is_dev else timedelta(minutes=int(os.environ.get('WS_JWT_TTL_MIN', 10)))
    
    # Access token for REST API
    access_payload = {
        'user_id': user_id,
        'iss': os.environ.get('JWT_ISSUER', 'parkdog-api'),
        'aud': os.environ.get('JWT_AUDIENCE', 'parkdog-client'),
        'iat': now,
        'nbf': now,
        'exp': now + access_ttl,
        'type': 'access',
        'jti': f"access-{user_id}-{int(now.timestamp())}"
    }
    
    access_token = jwt.encode(
        access_payload,
        current_app.config['JWT_SECRET_KEY'],
        algorithm='HS256'
    )
    
    # Realtime token for WebSocket (shorter-lived, different audience)
    realtime_payload = {
        'user_id': user_id,
        'iss': os.environ.get('JWT_ISSUER', 'parkdog-api'),
        'aud': os.environ.get('WS_AUDIENCE', 'realtime'),  # Different audience for WebSocket
        'iat': now,
        'nbf': now,
        'exp': now + realtime_ttl,
        'type': 'realtime',
        'jti': f"realtime-{user_id}-{int(now.timestamp())}"
    }
    
    realtime_token = jwt.encode(
        realtime_payload,
        current_app.config['JWT_SECRET_KEY'],
        algorithm='HS256'
    )
    
    # Refresh token (longer-lived)
    refresh_payload = {
        'user_id': user_id,
        'iss': os.environ.get('JWT_ISSUER', 'parkdog-api'),
        'aud': os.environ.get('JWT_AUDIENCE', 'parkdog-client'),
        'iat': now,
        'nbf': now,
        'exp': now + current_app.config.get('JWT_REFRESH_TOKEN_EXPIRES', timedelta(days=7)),
        'type': 'refresh',
        'jti': f"refresh-{user_id}-{int(now.timestamp())}"
    }
    
    refresh_token = jwt.encode(
        refresh_payload,
        current_app.config['JWT_SECRET_KEY'],
        algorithm='HS256'
    )
    
    return {
        'access_token': access_token,
        'realtime_token': realtime_token,  # New: separate token for WebSocket
        'refresh_token': refresh_token,
        'token_type': 'Bearer',
        'expires_in': int(access_ttl.total_seconds()),
        'realtime_expires_in': int(realtime_ttl.total_seconds())
    }

""" def verify_google_token(token):
    ""Verificar token de Google OAuth2 - VERSIÓN SIMPLIFICADA PARA DESARROLLO""
    try:
        # Para producción, descomentar este código:
        from google.oauth2 import id_token
        from google.auth.transport import requests
        
        idinfo = id_token.verify_oauth2_token(
            token, 
            requests.Request(), 
            current_app.config['GOOGLE_CLIENT_ID']
        )
        
        if idinfo['iss'] not in ['accounts.google.com', 'https://accounts.google.com']:
            raise ValueError('Wrong issuer.')
            
        return idinfo
        
    except Exception as e:
        current_app.logger.error(f"Error verificando token Google: {str(e)}")
        return None """

def login_required(f):
    """Decorator with strict JWT validation for API routes."""
    @wraps(f)
    def decorated_function(*args, **kwargs):
        from app.utils.jwt_validator import decode_token
        from app.utils.error_handler import safe_error_response
        
        auth_header = request.headers.get('Authorization')
        
        if not auth_header or not auth_header.startswith('Bearer '):
            return safe_error_response(
                'No authorization token provided', 
                401, 
                'MISSING_TOKEN'
            )
        
        token = auth_header.split(' ')[1]
        
        try:
            payload = decode_token(token, 'access')
            request.current_user_id = payload['user_id']
            
        except jwt.ExpiredSignatureError:
            return safe_error_response('Token has expired', 401, 'TOKEN_EXPIRED')
        except jwt.InvalidAudienceError:
            return safe_error_response('Invalid token audience', 401, 'INVALID_AUDIENCE')
        except jwt.InvalidIssuerError:
            return safe_error_response('Invalid token issuer', 401, 'INVALID_ISSUER')
        except jwt.ImmatureSignatureError:
            return safe_error_response('Token not yet valid', 401, 'TOKEN_NOT_YET_VALID')
        except jwt.InvalidTokenError:
            return safe_error_response('Invalid token', 401, 'INVALID_TOKEN')
        except Exception:
            return safe_error_response('Token validation failed', 401, 'AUTH_FAILED')
            
        return f(*args, **kwargs)
    
    return decorated_function

def role_required(roles):
    """Decorator para rutas que requieren roles específicos"""
    def decorator(f):
        @wraps(f)
        @login_required
        def decorated_function(*args, **kwargs):
            from app.models import User
            
            user = User.query.get(request.current_user_id)
            if not user or user.role.value not in roles:
                return jsonify({'error': 'Insufficient permissions'}), 403
                
            request.current_user = user
            return f(*args, **kwargs)
            
        return decorated_function
    return decorator

def admin_required(f):
    """Decorator para rutas que requieren rol admin"""
    return role_required(['admin'])(f)
