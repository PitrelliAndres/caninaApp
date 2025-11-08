"""
Rutas de onboarding de nuevos usuarios con validaciones mejoradas
"""
from flask import Blueprint, request, jsonify, current_app
from app import db
from app.models import User, Dog, UserPreference, UserRole
from app.utils.auth import login_required
from app.utils.validators import (
    validate_nickname, validate_age, validate_dog_age,
    validate_dog_name, sanitize_text, validate_interests
)
from datetime import datetime

onboarding_bp = Blueprint('onboarding', __name__)

# Almacenamiento temporal de datos de onboarding (en producción usar Redis)
onboarding_data = {}

@onboarding_bp.route('/check-nickname', methods=['POST'])
@login_required
def check_nickname():
    """Verificar disponibilidad de nickname con validaciones mejoradas"""
    try:
        data = request.get_json()
        nickname = data.get('nickname', '').strip()
        
        # Validar formato y contenido
        is_valid, message = validate_nickname(nickname)
        if not is_valid:
            return jsonify({
                'available': False,
                'message': message
            }), 200
        
        # Verificar si ya existe (case-insensitive)
        existing = User.query.filter(
            db.func.lower(User.nickname) == nickname.lower()
        ).first()
        
        if existing and existing.id != request.current_user_id:
            return jsonify({
                'available': False,
                'message': 'Este apodo ya está en uso'
            }), 200
        
        return jsonify({
            'available': True,
            'message': 'Apodo disponible'
        }), 200
        
    except Exception as e:
        current_app.logger.error(f"Check nickname error: {str(e)}")
        return jsonify({'error': 'Error interno del servidor'}), 500

@onboarding_bp.route('/step1', methods=['POST'])
@login_required
def step1_user_profile():
    """Paso 1: Perfil de usuario con validaciones mejoradas"""
    try:
        user = User.query.get(request.current_user_id)
        if not user:
            return jsonify({'error': 'Usuario no encontrado'}), 404
        
        data = request.get_json()
        
        # Validaciones
        nickname = data.get('nickname', '').strip()
        is_valid, message = validate_nickname(nickname)
        if not is_valid:
            return jsonify({'error': message}), 400
        
        # Verificar unicidad (case-insensitive)
        existing = User.query.filter(
            db.func.lower(User.nickname) == nickname.lower(),
            User.id != user.id
        ).first()
        if existing:
            return jsonify({'error': 'Este apodo ya está en uso'}), 400
        
        age = data.get('age')
        is_valid, message = validate_age(age)
        if not is_valid:
            return jsonify({'error': message}), 400
        
        # Guardar en memoria temporal
        if user.id not in onboarding_data:
            onboarding_data[user.id] = {}
        
        onboarding_data[user.id]['step1'] = {
            'nickname': nickname,
            'age': int(age),
            'avatar': data.get('avatar')
        }
        
        # Log de actividad
        current_app.logger.info(f"User {user.id} completed onboarding step 1")
        
        return jsonify({'success': True}), 200
        
    except Exception as e:
        current_app.logger.error(f"Onboarding step 1 error: {str(e)}")
        return jsonify({'error': 'Error interno del servidor'}), 500

@onboarding_bp.route('/step2', methods=['POST'])
@login_required
def step2_dog_profile():
    """Paso 2: Perfil de mascota con validaciones mejoradas"""
    try:
        user_id = request.current_user_id
        
        # Verificar que pasó por step 1
        if user_id not in onboarding_data or 'step1' not in onboarding_data[user_id]:
            return jsonify({'error': 'Debe completar el paso 1 primero'}), 400
        
        data = request.get_json()
        dog_data = data.get('dog', {})
        
        # Validaciones
        name = dog_data.get('name', '').strip()
        is_valid, message = validate_dog_name(name)
        if not is_valid:
            return jsonify({'error': f"Nombre del perro: {message}"}), 400
        
        age = dog_data.get('age')
        is_valid, message = validate_dog_age(age)
        if not is_valid:
            return jsonify({'error': f"Edad del perro: {message}"}), 400
        
        breed = sanitize_text(dog_data.get('breed') or 'Mestizo', max_length=100)
        
        # Guardar en memoria temporal
        onboarding_data[user_id]['step2'] = {
            'dog': {
                'name': name,
                'age': int(age),
                'breed': breed,
                'photo_url': dog_data.get('avatar')
            }
        }
        
        current_app.logger.info(f"User {user_id} completed onboarding step 2")
        
        return jsonify({'success': True}), 200
        
    except Exception as e:
        current_app.logger.error(f"Onboarding step 2 error: {str(e)}")
        return jsonify({'error': 'Error interno del servidor'}), 500

@onboarding_bp.route('/step3', methods=['POST'])
@login_required
def step3_preferences():
    """Paso 3: Preferencias y privacidad - Guardar todo con transacción"""
    try:
        user_id = request.current_user_id
        
        # Verificar que pasó por steps anteriores
        if (user_id not in onboarding_data or 
            'step1' not in onboarding_data[user_id] or 
            'step2' not in onboarding_data[user_id]):
            return jsonify({'error': 'Debe completar los pasos anteriores'}), 400
        
        user = User.query.get(user_id)
        if not user:
            return jsonify({'error': 'Usuario no encontrado'}), 404
        
        data = request.get_json()
        privacy = data.get('privacy', {})
        interests = data.get('interests', [])
        
        # Validar intereses
        is_valid, message = validate_interests(interests)
        if not is_valid:
            return jsonify({'error': message}), 400
        
        # Iniciar transacción
        try:
            # 1. Actualizar usuario con datos del step 1
            step1_data = onboarding_data[user_id]['step1']
            user.nickname = step1_data['nickname']
            user.age = step1_data['age']
            if step1_data.get('avatar'):
                user.avatar_url = step1_data['avatar']
            
            # 2. Actualizar configuración de privacidad
            user.is_public = bool(privacy.get('public_profile', True))
            user.allow_matching = bool(privacy.get('enable_match', True))
            user.allow_proximity = bool(privacy.get('enable_proximity', False))
            
            # 3. Crear perro
            step2_data = onboarding_data[user_id]['step2']['dog']
            dog = Dog(
                user_id=user_id,
                name=step2_data['name'],
                age=step2_data['age'],
                breed=step2_data['breed'],
                photo_url=step2_data.get('photo_url'),
                is_vaccinated=True,
                created_at=datetime.utcnow()
            )
            db.session.add(dog)
            
            # 4. Crear preferencias
            preferences = UserPreference(
                user_id=user_id,
                interests=interests,
                preferred_age_min=max(user.age - 10, 18) if user.age else 18,
                preferred_age_max=min(user.age + 10, 100) if user.age else 100
            )
            db.session.add(preferences)

            # 5. Marcar usuario como onboarded
            user.onboarded = True

            # Commit todo
            db.session.commit()
            
            # Limpiar datos temporales
            del onboarding_data[user_id]
            
            current_app.logger.info(f"User {user_id} completed onboarding successfully")
            
            return jsonify({
                'success': True,
                'redirect': '/'
            }), 200
            
        except Exception as e:
            db.session.rollback()
            raise e
        
    except Exception as e:
        current_app.logger.error(f"Onboarding step 3 error: {str(e)}")
        return jsonify({'error': 'Error interno del servidor'}), 500

@onboarding_bp.route('/skip', methods=['POST'])
@login_required
def skip_onboarding():
    """Permitir saltar onboarding (solo para testing)"""
    try:
        if current_app.config.get('FLASK_ENV') != 'development':
            return jsonify({'error': 'No permitido en producción'}), 403
        
        user = User.query.get(request.current_user_id)
        if not user:
            return jsonify({'error': 'Usuario no encontrado'}), 404
        
        # Crear datos mínimos
        user.nickname = f"user_{user.id}"
        user.age = 25
        
        # Crear perro por defecto
        dog = Dog(
            user_id=user.id,
            name='Mi Perro',
            age=3,
            breed='Mestizo',
            created_at=datetime.utcnow()
        )
        db.session.add(dog)
        
        # Crear preferencias por defecto
        preferences = UserPreference(
            user_id=user.id,
            interests=[],
            preferred_age_min=18,
            preferred_age_max=99
        )
        db.session.add(preferences)

        # Marcar como onboarded
        user.onboarded = True

        db.session.commit()
        
        return jsonify({
            'success': True,
            'redirect': '/'
        }), 200
        
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"Skip onboarding error: {str(e)}")
        return jsonify({'error': 'Error interno del servidor'}), 500