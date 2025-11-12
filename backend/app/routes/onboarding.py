"""
Rutas de onboarding con 10 pasos para nuevos usuarios
Flujo: ONB_PARKDOG_V1
"""
from flask import Blueprint, request, jsonify, current_app
from app import db
from app.models import User, Dog, UserPreference, UserRole
from app.utils.auth import login_required
from app.utils.validators import (
    validate_nickname, validate_age, validate_dog_age,
    validate_dog_name, sanitize_text, validate_interests
)
from datetime import datetime, date
import calendar

onboarding_bp = Blueprint('onboarding', __name__)

# Almacenamiento temporal de datos de onboarding (en producción usar Redis)
onboarding_data = {}

# Constantes de validación
MIN_AGE = 18
MAX_AGE = 120
MAX_INTERESTS = 10
MAX_PHOTOS = 6
MIN_PHOTOS = 2


def calculate_age(birthdate):
    """Calcular edad a partir de fecha de nacimiento"""
    today = date.today()
    age = today.year - birthdate.year - ((today.month, today.day) < (birthdate.month, birthdate.day))
    return age


def calculate_zodiac_sign(birthdate):
    """Calcular signo del zodíaco a partir de fecha de nacimiento"""
    month, day = birthdate.month, birthdate.day

    if (month == 3 and day >= 21) or (month == 4 and day <= 19):
        return "Aries"
    elif (month == 4 and day >= 20) or (month == 5 and day <= 20):
        return "Tauro"
    elif (month == 5 and day >= 21) or (month == 6 and day <= 20):
        return "Géminis"
    elif (month == 6 and day >= 21) or (month == 7 and day <= 22):
        return "Cáncer"
    elif (month == 7 and day >= 23) or (month == 8 and day <= 22):
        return "Leo"
    elif (month == 8 and day >= 23) or (month == 9 and day <= 22):
        return "Virgo"
    elif (month == 9 and day >= 23) or (month == 10 and day <= 22):
        return "Libra"
    elif (month == 10 and day >= 23) or (month == 11 and day <= 21):
        return "Escorpio"
    elif (month == 11 and day >= 22) or (month == 12 and day <= 21):
        return "Sagitario"
    elif (month == 12 and day >= 22) or (month == 1 and day <= 19):
        return "Capricornio"
    elif (month == 1 and day >= 20) or (month == 2 and day <= 18):
        return "Acuario"
    else:  # (month == 2 and day >= 19) or (month == 3 and day <= 20)
        return "Piscis"


@onboarding_bp.route('/check-nickname', methods=['POST'])
@login_required
def check_nickname():
    """Verificar disponibilidad de nickname"""
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


@onboarding_bp.route('/step', methods=['POST'])
@login_required
def save_step():
    """
    Guardar un paso del onboarding (1-10)
    Body: {
        "stepId": "ONB_NAME",
        "data": { ... },
        "clientTimestamp": "ISO_8601"
    }
    """
    try:
        user_id = request.current_user_id
        user = User.query.get(user_id)
        if not user:
            return jsonify({'error': 'Usuario no encontrado'}), 404

        data = request.get_json()
        step_id = data.get('stepId')
        step_data = data.get('data', {})

        if not step_id:
            return jsonify({'error': 'stepId requerido'}), 400

        # Inicializar almacenamiento temporal si no existe
        if user_id not in onboarding_data:
            onboarding_data[user_id] = {}

        # Validar y guardar según el paso
        if step_id == 'ONB_NAME':
            # Paso 1: Nombre
            name = step_data.get('name', '').strip()
            if not name or len(name) < 2 or len(name) > 30:
                return jsonify({'error': 'Nombre debe tener entre 2 y 30 caracteres'}), 400

            onboarding_data[user_id]['ONB_NAME'] = {'name': name}

        elif step_id == 'ONB_BIRTHDATE':
            # Paso 2: Fecha de nacimiento
            birthdate_str = step_data.get('birthdate')
            if not birthdate_str:
                return jsonify({'error': 'Fecha de nacimiento requerida'}), 400

            try:
                birthdate = datetime.strptime(birthdate_str, '%Y-%m-%d').date()
            except ValueError:
                return jsonify({'error': 'Formato de fecha inválido'}), 400

            age = calculate_age(birthdate)
            if age < MIN_AGE:
                return jsonify({'error': f'Debés tener al menos {MIN_AGE} años para usar Parkdog'}), 400
            if age > MAX_AGE:
                return jsonify({'error': 'Fecha de nacimiento inválida'}), 400

            zodiac_sign = calculate_zodiac_sign(birthdate)
            show_zodiac_sign = step_data.get('showZodiacSign', True)

            onboarding_data[user_id]['ONB_BIRTHDATE'] = {
                'birthdate': birthdate_str,
                'age': age,
                'zodiacSign': zodiac_sign,
                'showZodiacSign': show_zodiac_sign
            }

        elif step_id == 'ONB_GENDER':
            # Paso 3: Género
            genders = step_data.get('genders', [])
            if not genders or len(genders) == 0:
                return jsonify({'error': 'Seleccioná al menos un género'}), 400
            if len(genders) > 3:
                return jsonify({'error': 'Máximo 3 géneros'}), 400

            valid_genders = ['MALE', 'FEMALE', 'NON_BINARY', 'PREFER_NOT_TO_SAY']
            for gender in genders:
                if gender not in valid_genders:
                    return jsonify({'error': f'Género inválido: {gender}'}), 400

            show_gender = step_data.get('showGenderOnProfile', True)

            onboarding_data[user_id]['ONB_GENDER'] = {
                'genders': genders,
                'showGenderOnProfile': show_gender
            }

        elif step_id == 'ONB_ORIENTATION':
            # Paso 4: Orientación sexual (opcional)
            orientations = step_data.get('orientations', [])
            show_orientation = step_data.get('showOrientationOnProfile', False)
            skipped = step_data.get('skipped', False)

            onboarding_data[user_id]['ONB_ORIENTATION'] = {
                'orientations': orientations,
                'showOrientationOnProfile': show_orientation,
                'skipped': skipped
            }

        elif step_id == 'ONB_LOOKING_FOR':
            # Paso 5: Qué está buscando (opcional)
            looking_for = step_data.get('lookingFor')

            valid_options = [
                'SERIOUS_RELATIONSHIP', 'RELATIONSHIP_OR_CASUAL', 'CASUAL_OR_RELATIONSHIP',
                'CASUAL', 'MAKE_FRIENDS', 'NOT_SURE'
            ]
            if looking_for and looking_for not in valid_options:
                return jsonify({'error': 'Opción inválida'}), 400

            onboarding_data[user_id]['ONB_LOOKING_FOR'] = {
                'lookingFor': looking_for
            }

        elif step_id == 'ONB_DISTANCE':
            # Paso 6: Distancia preferida
            max_distance = step_data.get('maxDistanceKm')
            if not max_distance:
                return jsonify({'error': 'Distancia requerida'}), 400

            try:
                max_distance = int(max_distance)
            except ValueError:
                return jsonify({'error': 'Distancia debe ser un número'}), 400

            if max_distance < 1 or max_distance > 100:
                return jsonify({'error': 'Distancia debe estar entre 1 y 100 km'}), 400

            onboarding_data[user_id]['ONB_DISTANCE'] = {
                'maxDistanceKm': max_distance
            }

        elif step_id == 'ONB_LOCATION_PERMISSION':
            # Paso 7: Permiso de ubicación (crítico)
            location_granted = step_data.get('locationPermissionGranted', False)
            if not location_granted:
                return jsonify({'error': 'Permiso de ubicación requerido'}), 400

            lat = step_data.get('lat')
            lng = step_data.get('lng')
            accuracy = step_data.get('accuracy')

            if not lat or not lng:
                return jsonify({'error': 'Coordenadas de ubicación requeridas'}), 400

            onboarding_data[user_id]['ONB_LOCATION_PERMISSION'] = {
                'locationPermissionGranted': True,
                'lat': lat,
                'lng': lng,
                'accuracy': accuracy
            }

        elif step_id == 'ONB_HABITS_DOG':
            # Paso 8: Hábitos de paseo (opcional)
            walk_frequency = step_data.get('walkFrequency', [])
            walk_types = step_data.get('walkTypes', [])
            dog_sociability = step_data.get('dogSociability', [])
            other_pets = step_data.get('otherPets', [])

            onboarding_data[user_id]['ONB_HABITS_DOG'] = {
                'walkFrequency': walk_frequency,
                'walkTypes': walk_types,
                'dogSociability': dog_sociability,
                'otherPets': other_pets
            }

        elif step_id == 'ONB_INTERESTS_DOG':
            # Paso 9: Intereses con perro (opcional)
            interests = step_data.get('interests', [])
            if len(interests) > MAX_INTERESTS:
                return jsonify({'error': f'Máximo {MAX_INTERESTS} intereses'}), 400

            onboarding_data[user_id]['ONB_INTERESTS_DOG'] = {
                'interests': interests
            }

        elif step_id == 'ONB_PHOTOS':
            # Paso 10: Fotos de perfil
            photos = step_data.get('photos', [])
            if len(photos) < MIN_PHOTOS:
                return jsonify({'error': f'Agregá al menos {MIN_PHOTOS} fotos'}), 400
            if len(photos) > MAX_PHOTOS:
                return jsonify({'error': f'Máximo {MAX_PHOTOS} fotos'}), 400

            # Validar estructura de fotos
            for photo in photos:
                if 'url' not in photo or 'type' not in photo:
                    return jsonify({'error': 'Estructura de foto inválida'}), 400
                if photo['type'] not in ['USER', 'DOG']:
                    return jsonify({'error': 'Tipo de foto inválido'}), 400

            # Validar al menos 1 foto de usuario
            user_photos = [p for p in photos if p['type'] == 'USER']
            if len(user_photos) == 0:
                return jsonify({'error': 'Agregá al menos 1 foto tuya'}), 400

            onboarding_data[user_id]['ONB_PHOTOS'] = {
                'photos': photos
            }

        else:
            return jsonify({'error': 'stepId inválido'}), 400

        # Guardar el último paso completado
        user.onboarding_step = step_id
        db.session.commit()

        current_app.logger.info(f"User {user_id} completed onboarding step {step_id}")

        return jsonify({
            'success': True,
            'stepId': step_id,
            'message': 'Paso guardado exitosamente'
        }), 200

    except Exception as e:
        current_app.logger.error(f"Onboarding step error: {str(e)}")
        return jsonify({'error': 'Error interno del servidor'}), 500


@onboarding_bp.route('/complete', methods=['POST'])
@login_required
def complete_onboarding():
    """
    Finalizar el onboarding: guardar todos los datos en BD
    """
    try:
        user_id = request.current_user_id
        user = User.query.get(user_id)
        if not user:
            return jsonify({'error': 'Usuario no encontrado'}), 404

        # Verificar que existan datos de onboarding
        if user_id not in onboarding_data:
            return jsonify({'error': 'No hay datos de onboarding'}), 400

        steps = onboarding_data[user_id]

        # Verificar pasos obligatorios
        required_steps = ['ONB_NAME', 'ONB_BIRTHDATE', 'ONB_GENDER', 'ONB_DISTANCE', 'ONB_LOCATION_PERMISSION', 'ONB_PHOTOS']
        for step in required_steps:
            if step not in steps:
                return jsonify({'error': f'Paso obligatorio faltante: {step}'}), 400

        # Iniciar transacción
        try:
            # Paso 1: Nombre
            if 'ONB_NAME' in steps:
                user.name = steps['ONB_NAME']['name']

            # Paso 2: Fecha de nacimiento
            if 'ONB_BIRTHDATE' in steps:
                birthdate_str = steps['ONB_BIRTHDATE']['birthdate']
                user.birthdate = datetime.strptime(birthdate_str, '%Y-%m-%d').date()
                user.age = steps['ONB_BIRTHDATE']['age']
                user.zodiac_sign = steps['ONB_BIRTHDATE']['zodiacSign']
                user.show_zodiac_sign = steps['ONB_BIRTHDATE']['showZodiacSign']

            # Paso 3: Género
            if 'ONB_GENDER' in steps:
                user.genders = steps['ONB_GENDER']['genders']
                user.show_gender_on_profile = steps['ONB_GENDER']['showGenderOnProfile']

            # Paso 4: Orientación sexual
            if 'ONB_ORIENTATION' in steps:
                user.orientations = steps['ONB_ORIENTATION']['orientations']
                user.show_orientation_on_profile = steps['ONB_ORIENTATION']['showOrientationOnProfile']

            # Paso 5: Qué está buscando
            if 'ONB_LOOKING_FOR' in steps:
                user.looking_for = steps['ONB_LOOKING_FOR']['lookingFor']

            # Paso 6: Distancia preferida
            if 'ONB_DISTANCE' in steps:
                user.max_distance_km = steps['ONB_DISTANCE']['maxDistanceKm']

            # Paso 7: Ubicación
            if 'ONB_LOCATION_PERMISSION' in steps:
                location = steps['ONB_LOCATION_PERMISSION']
                user.last_latitude = location['lat']
                user.last_longitude = location['lng']
                user.last_location_update = datetime.utcnow()

            # Paso 8: Hábitos de paseo
            if 'ONB_HABITS_DOG' in steps:
                habits = steps['ONB_HABITS_DOG']
                user.walk_frequency = habits['walkFrequency']
                user.walk_types = habits['walkTypes']
                user.dog_sociability = habits['dogSociability']
                user.other_pets = habits['otherPets']

            # Paso 9: Intereses
            if 'ONB_INTERESTS_DOG' in steps:
                user.interests = steps['ONB_INTERESTS_DOG']['interests']

            # Paso 10: Fotos
            if 'ONB_PHOTOS' in steps:
                user.photos = steps['ONB_PHOTOS']['photos']

            # Marcar usuario como onboarded
            user.onboarded = True
            user.onboarding_step = 'COMPLETED'

            # Commit todo
            db.session.commit()

            # Limpiar datos temporales
            del onboarding_data[user_id]

            current_app.logger.info(f"User {user_id} completed onboarding successfully")

            return jsonify({
                'success': True,
                'user': user.to_dict(include_private=True),
                'message': 'Perfil completado exitosamente'
            }), 200

        except Exception as e:
            db.session.rollback()
            raise e

    except Exception as e:
        current_app.logger.error(f"Complete onboarding error: {str(e)}")
        return jsonify({'error': 'Error interno del servidor'}), 500


@onboarding_bp.route('/progress', methods=['GET'])
@login_required
def get_onboarding_progress():
    """
    Obtener el progreso actual del onboarding del usuario
    """
    try:
        user_id = request.current_user_id
        user = User.query.get(user_id)
        if not user:
            return jsonify({'error': 'Usuario no encontrado'}), 404

        # Si ya completó el onboarding
        if user.onboarded:
            return jsonify({
                'onboarded': True,
                'lastStep': 'COMPLETED'
            }), 200

        # Obtener datos guardados temporalmente
        saved_steps = list(onboarding_data.get(user_id, {}).keys())

        return jsonify({
            'onboarded': False,
            'lastStep': user.onboarding_step,
            'completedSteps': saved_steps
        }), 200

    except Exception as e:
        current_app.logger.error(f"Get onboarding progress error: {str(e)}")
        return jsonify({'error': 'Error interno del servidor'}), 500


@onboarding_bp.route('/skip', methods=['POST'])
@login_required
def skip_onboarding():
    """Permitir saltar onboarding (solo para testing en development)"""
    try:
        if current_app.config.get('FLASK_ENV') != 'development':
            return jsonify({'error': 'No permitido en producción'}), 403

        user = User.query.get(request.current_user_id)
        if not user:
            return jsonify({'error': 'Usuario no encontrado'}), 404

        # Crear datos mínimos
        user.name = user.name or f"User {user.id}"
        user.age = 25
        user.birthdate = date(1999, 1, 1)
        user.genders = ['PREFER_NOT_TO_SAY']
        user.max_distance_km = 10
        user.onboarded = True
        user.onboarding_step = 'COMPLETED'

        db.session.commit()

        return jsonify({
            'success': True,
            'message': 'Onboarding saltado (solo development)'
        }), 200

    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"Skip onboarding error: {str(e)}")
        return jsonify({'error': 'Error interno del servidor'}), 500
