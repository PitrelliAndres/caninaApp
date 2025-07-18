"""
Rutas de autenticación
"""
from flask import Blueprint, request, jsonify, current_app
import jwt
from datetime import datetime, timedelta

auth_bp = Blueprint('auth', __name__)

@auth_bp.route('/google/login', methods=['POST'])
def google_login():
    """Login con Google OAuth2 - Simulado para desarrollo"""
    try:
        data = request.get_json()
        
        # En producción, aquí verificarías el token con Google
        # Por ahora simulamos la respuesta
        
        # Generar JWT token
        token_payload = {
            'user_id': 1,
            'email': 'test@example.com',
            'exp': datetime.utcnow() + timedelta(days=1),
            'type': 'access'
        }
        
        access_token = jwt.encode(
            token_payload,
            current_app.config['JWT_SECRET_KEY'],
            algorithm='HS256'
        )
        
        return jsonify({
            'tokens': {
                'access_token': access_token,
                'refresh_token': access_token,
                'token_type': 'Bearer'
            },
            'user': {
                'id': 1,
                'name': 'Usuario Test',
                'email': 'test@example.com',
                'nickname': 'Test',
                'age': 30
            },
            'is_new': True
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@auth_bp.route('/verify', methods=['GET'])
def verify_token():
    """Verificar token"""
    return jsonify({'valid': True, 'user': {'id': 1, 'name': 'Test User'}}), 200
