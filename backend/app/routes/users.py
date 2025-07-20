"""
Rutas de usuarios y perfiles
"""
from flask import Blueprint, request, jsonify, current_app
from app import db
from app.models import User, Dog, UserPreference
from app.utils.auth import login_required, admin_required
from app.utils.validators import validate_nickname, validate_age
from app.utils.upload import save_base64_image, delete_file
from datetime import datetime

users_bp = Blueprint('users', __name__)

@users_bp.route('/me', methods=['GET'])
@login_required
def get_current_user():
    """Obtener perfil completo del usuario actual"""
    try:
        user = User.query.get(request.current_user_id)
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        # Incluir preferencias
        preferences = UserPreference.query.filter_by(user_id=user.id).first()
        
        return jsonify({
            'id': user.id,
            'name': user.name,
            'email': user.email,
            'nickname': user.nickname,
            'age': user.age,
            'avatar_url': user.avatar_url,
            'role': user.role.value,
            'is_public': user.is_public,
            'allow_matching': user.allow_matching,
            'allow_proximity': user.allow_proximity,
            'dog': user.dog.to_dict() if user.dog else None,
            'preferences': preferences.to_dict() if preferences else None,
            'member_since': user.created_at.strftime('%d/%m/%Y') if user.created_at else None
        }), 200
        
    except Exception as e:
        current_app.logger.error(f"Get profile error: {str(e)}")
        return jsonify({'error': 'Internal server error'}), 500

@users_bp.route('/<int:user_id>', methods=['PUT'])
@login_required
def update_user(user_id):
    """Actualizar perfil de usuario"""
    try:
        # Verificar que es el mismo usuario
        if user_id != request.current_user_id:
            return jsonify({'error': 'Unauthorized'}), 403
        
        user = User.query.get(user_id)
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        data = request.get_json()
        
        # Actualizar campos permitidos
        if 'nickname' in data:
            nickname = data['nickname'].strip()
            if not validate_nickname(nickname):
                return jsonify({'error': 'Invalid nickname format'}), 400
            
            # Verificar unicidad
            existing = User.query.filter_by(nickname=nickname).first()
            if existing and existing.id != user.id:
                return jsonify({'error': 'Nickname already taken'}), 400
            
            user.nickname = nickname
        
        if 'age' in data:
            if not validate_age(data['age']):
                return jsonify({'error': 'Invalid age'}), 400
            user.age = int(data['age'])
        
        if 'avatar' in data:
            # Eliminar avatar anterior si existe
            if user.avatar_url and user.avatar_url.startswith('/uploads/'):
                delete_file(user.avatar_url)
            
            # Guardar nuevo avatar
            avatar_url = save_base64_image(data['avatar'], 'avatars')
            if avatar_url:
                user.avatar_url = avatar_url
        
        # Actualizar privacidad
        if 'is_public' in data:
            user.is_public = bool(data['is_public'])
        if 'allow_matching' in data:
            user.allow_matching = bool(data['allow_matching'])
        if 'allow_proximity' in data:
            user.allow_proximity = bool(data['allow_proximity'])
        
        user.updated_at = datetime.utcnow()
        db.session.commit()
        
        return jsonify({'message': 'Profile updated successfully'}), 200
        
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"Update profile error: {str(e)}")
        return jsonify({'error': 'Internal server error'}), 500

@users_bp.route('/<int:user_id>', methods=['DELETE'])
@login_required
def delete_user(user_id):
    """Eliminar cuenta de usuario"""
    try:
        # Verificar que es el mismo usuario o admin
        if user_id != request.current_user_id:
            return jsonify({'error': 'Unauthorized'}), 403
        
        user = User.query.get(user_id)
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        # Eliminar archivos asociados
        if user.avatar_url and user.avatar_url.startswith('/uploads/'):
            delete_file(user.avatar_url)
        
        if user.dog and user.dog.photo_url and user.dog.photo_url.startswith('/uploads/'):
            delete_file(user.dog.photo_url)
        
        # Eliminar usuario (cascade eliminará relaciones)
        db.session.delete(user)
        db.session.commit()
        
        return jsonify({'message': 'Account deleted successfully'}), 200
        
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"Delete account error: {str(e)}")
        return jsonify({'error': 'Internal server error'}), 500

@users_bp.route('/dogs/<int:dog_id>', methods=['PUT'])
@login_required
def update_dog(dog_id):
    """Actualizar información del perro"""
    try:
        dog = Dog.query.get(dog_id)
        if not dog or dog.user_id != request.current_user_id:
            return jsonify({'error': 'Unauthorized'}), 403
        
        data = request.get_json()
        
        # Actualizar campos
        if 'name' in data:
            dog.name = data['name'].strip()
        
        if 'age' in data:
            if not validate_dog_age(data['age']):
                return jsonify({'error': 'Invalid dog age'}), 400
            dog.age = int(data['age'])
        
        if 'breed' in data:
            dog.breed = data['breed']
        
        if 'avatar' in data:
            # Eliminar foto anterior si existe
            if dog.photo_url and dog.photo_url.startswith('/uploads/'):
                delete_file(dog.photo_url)
            
            # Guardar nueva foto
            photo_url = save_base64_image(data['avatar'], 'dogs')
            if photo_url:
                dog.photo_url = photo_url
        
        dog.updated_at = datetime.utcnow()
        db.session.commit()
        
        return jsonify({'message': 'Dog profile updated successfully'}), 200
        
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"Update dog error: {str(e)}")
        return jsonify({'error': 'Internal server error'}), 500

@users_bp.route('/preferences/<int:user_id>', methods=['PUT'])
@login_required
def update_preferences(user_id):
    """Actualizar preferencias de usuario"""
    try:
        if user_id != request.current_user_id:
            return jsonify({'error': 'Unauthorized'}), 403
        
        preferences = UserPreference.query.filter_by(user_id=user_id).first()
        if not preferences:
            preferences = UserPreference(user_id=user_id)
            db.session.add(preferences)
        
        data = request.get_json()
        
        if 'interests' in data:
            preferences.interests = data['interests']
        
        if 'preferred_age_min' in data:
            preferences.preferred_age_min = max(18, int(data['preferred_age_min']))
        
        if 'preferred_age_max' in data:
            preferences.preferred_age_max = min(100, int(data['preferred_age_max']))
        
        db.session.commit()
        
        return jsonify({'message': 'Preferences updated successfully'}), 200
        
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"Update preferences error: {str(e)}")
        return jsonify({'error': 'Internal server error'}), 500

# Admin endpoints
@users_bp.route('/admin/users', methods=['GET'])
@admin_required
def admin_get_users():
    """Obtener lista de usuarios (solo admin)"""
    try:
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 20, type=int)
        
        query = User.query
        
        # Filtros opcionales
        if request.args.get('role'):
            query = query.filter_by(role=request.args.get('role'))
        
        if request.args.get('active'):
            query = query.filter_by(is_active=request.args.get('active') == 'true')
        
        # Paginación
        paginated = query.paginate(page=page, per_page=per_page, error_out=False)
        
        users = [{
            'id': u.id,
            'email': u.email,
            'name': u.name,
            'nickname': u.nickname,
            'role': u.role.value,
            'is_active': u.is_active,
            'created_at': u.created_at.isoformat() if u.created_at else None
        } for u in paginated.items]
        
        return jsonify({
            'users': users,
            'total': paginated.total,
            'pages': paginated.pages,
            'current_page': page
        }), 200
        
    except Exception as e:
        current_app.logger.error(f"Admin get users error: {str(e)}")
        return jsonify({'error': 'Internal server error'}), 500

@users_bp.route('/admin/users/<int:user_id>/role', methods=['PATCH'])
@admin_required
def admin_update_user_role(user_id):
    """Cambiar rol de usuario (solo admin)"""
    try:
        user = User.query.get(user_id)
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        data = request.get_json()
        new_role = data.get('role')
        
        # Validar rol
        valid_roles = ['free', 'premium', 'vip', 'admin']
        if new_role not in valid_roles:
            return jsonify({'error': 'Invalid role'}), 400
        
        # No permitir que un admin se quite el rol a sí mismo
        if user_id == request.current_user_id and new_role != 'admin':
            return jsonify({'error': 'Cannot remove admin role from yourself'}), 400
        
        from app.models import UserRole
        user.role = UserRole(new_role)
        db.session.commit()
        
        return jsonify({'message': 'Role updated successfully'}), 200
        
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"Update user role error: {str(e)}")
        return jsonify({'error': 'Internal server error'}), 500
