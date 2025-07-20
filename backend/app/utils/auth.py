"""
Utilidades de autenticación y autorización (versión simplificada para desarrollo)
"""
from functools import wraps
from flask import request, jsonify, current_app
import jwt
from datetime import datetime, timedelta
from google.oauth2 import id_token
from google.auth.transport import requests
import requests as http_requests

def verify_google_token(access_token):
    """Verificar token de acceso de Google y obtener info del usuario"""
    try:
        # Usar el access token para obtener la info del usuario
        response = http_requests.get(
            'https://www.googleapis.com/oauth2/v1/userinfo',
            headers={'Authorization': f'Bearer {access_token}'}
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
    """Generar tokens JWT de acceso y refresh"""
    # Access token
    access_payload = {
        'user_id': user_id,
        'exp': datetime.utcnow() + current_app.config['JWT_ACCESS_TOKEN_EXPIRES'],
        'iat': datetime.utcnow(),
        'type': 'access'
    }
    access_token = jwt.encode(
        access_payload,
        current_app.config['JWT_SECRET_KEY'],
        algorithm='HS256'
    )
    
    # Refresh token
    refresh_payload = {
        'user_id': user_id,
        'exp': datetime.utcnow() + current_app.config['JWT_REFRESH_TOKEN_EXPIRES'],
        'iat': datetime.utcnow(),
        'type': 'refresh'
    }
    refresh_token = jwt.encode(
        refresh_payload,
        current_app.config['JWT_SECRET_KEY'],
        algorithm='HS256'
    )
    
    return {
        'access_token': access_token,
        'refresh_token': refresh_token,
        'token_type': 'Bearer'
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
    """Decorator para rutas que requieren autenticación"""
    @wraps(f)
    def decorated_function(*args, **kwargs):
        auth_header = request.headers.get('Authorization')
        
        if not auth_header or not auth_header.startswith('Bearer '):
            return jsonify({'error': 'No authorization token provided'}), 401
        
        token = auth_header.split(' ')[1]
        
        try:
            payload = jwt.decode(
                token,
                current_app.config['JWT_SECRET_KEY'],
                algorithms=['HS256']
            )
            
            if payload.get('type') != 'access':
                return jsonify({'error': 'Invalid token type'}), 401
                
            request.current_user_id = payload['user_id']
            
        except jwt.ExpiredSignatureError:
            return jsonify({'error': 'Token has expired'}), 401
        except jwt.InvalidTokenError:
            return jsonify({'error': 'Invalid token'}), 401
            
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
