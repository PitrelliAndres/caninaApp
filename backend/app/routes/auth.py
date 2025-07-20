"""
Rutas de autenticación con OAuth2
"""
from flask import Blueprint, request, jsonify, current_app
from app import db
from app.models import User
from app.utils.auth import verify_google_token, generate_tokens, login_required
from datetime import datetime

auth_bp = Blueprint('auth', __name__)

@auth_bp.route('/google', methods=['POST'])
def google_login():
    """Login con Google OAuth2"""
    try:
        data = request.get_json()
        google_token = data.get('google_token')
        
        if not google_token:
            return jsonify({'error': 'Google token required'}), 400
        
        # Verificar token con Google
        google_data = verify_google_token(google_token)
        if not google_data:
            return jsonify({'error': 'Invalid Google token'}), 401
        
        # Verificar que el email esté verificado
        """if not google_data.get('email_verified'):
            return jsonify({'error': 'Email not verified'}), 401
        """
        # Buscar o crear usuario
        user = User.query.filter_by(google_id=google_data['sub']).first()
        
        if not user:
            # Crear nuevo usuario
            user = User(
                google_id=google_data['sub'],
                email=google_data['email'],
                name=google_data.get('name', ''),
                avatar_url=google_data.get('picture', ''),
                is_active=True,
                created_at=datetime.utcnow()
            )
            db.session.add(user)
            db.session.commit()
            is_new = True
        else:
            # Actualizar último login
            user.last_login = datetime.utcnow()
            user.is_online = True
            # Actualizar avatar si cambió
            if google_data.get('picture') and google_data['picture'] != user.avatar_url:
                user.avatar_url = google_data['picture']
            db.session.commit()
            is_new = False
        
        # Generar tokens JWT
        tokens = generate_tokens(user.id)
        
        return jsonify({
            'jwt': tokens['access_token'],
            'tokens': tokens,
            'user': {
                'id': user.id,
                'email': user.email,
                'name': user.name,
                'nickname': user.nickname,
                'avatar': user.avatar_url,
                'onboarded': user.nickname is not None
            },
            'is_new': is_new
        }), 200
        
    except Exception as e:
        current_app.logger.error(f"Login error: {str(e)}")
        db.session.rollback()
        return jsonify({'error': 'Internal server error'}), 500

@auth_bp.route('/me', methods=['GET'])
@login_required
def get_current_user():
    """Obtener usuario actual"""
    try:
        user = User.query.get(request.current_user_id)
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        return jsonify({
            'id': user.id,
            'email': user.email,
            'name': user.name,
            'nickname': user.nickname,
            'avatar': user.avatar_url,
            'onboarded': user.nickname is not None,
            'role': user.role.value
        }), 200
        
    except Exception as e:
        current_app.logger.error(f"Get user error: {str(e)}")
        return jsonify({'error': 'Internal server error'}), 500

@auth_bp.route('/refresh', methods=['POST'])
def refresh_token():
    """Refrescar token de acceso"""
    try:
        data = request.get_json()
        refresh_token = data.get('refresh_token')
        
        if not refresh_token:
            return jsonify({'error': 'Refresh token required'}), 400
        
        # Verificar y decodificar refresh token
        import jwt
        try:
            payload = jwt.decode(
                refresh_token,
                current_app.config['JWT_SECRET_KEY'],
                algorithms=['HS256']
            )
        except jwt.ExpiredSignatureError:
            return jsonify({'error': 'Refresh token expired'}), 401
        except jwt.InvalidTokenError:
            return jsonify({'error': 'Invalid refresh token'}), 401
        
        if payload.get('type') != 'refresh':
            return jsonify({'error': 'Invalid token type'}), 401
        
        # Verificar que el usuario existe y está activo
        user = User.query.get(payload['user_id'])
        if not user or not user.is_active:
            return jsonify({'error': 'User not found or inactive'}), 401
        
        # Generar nuevos tokens
        tokens = generate_tokens(payload['user_id'])
        
        return jsonify({
            'jwt': tokens['access_token'],
            'tokens': tokens
        }), 200
        
    except Exception as e:
        current_app.logger.error(f"Refresh token error: {str(e)}")
        return jsonify({'error': 'Internal server error'}), 500

@auth_bp.route('/logout', methods=['POST'])
@login_required
def logout():
    """Cerrar sesión"""
    try:
        user = User.query.get(request.current_user_id)
        if user:
            user.is_online = False
            db.session.commit()
        
        return jsonify({'message': 'Logged out successfully'}), 200
        
    except Exception as e:
        current_app.logger.error(f"Logout error: {str(e)}")
        return jsonify({'error': 'Internal server error'}), 500
