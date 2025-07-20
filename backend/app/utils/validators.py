"""
Validadores personalizados mejorados con más funcionalidades
"""
import re
from werkzeug.datastructures import FileStorage

# Lista de palabras ofensivas básica (expandir según necesidad)
OFFENSIVE_WORDS = [
    'mierda', 'puta', 'pendejo', 'boludo', 'pelotudo', 
    'concha', 'carajo', 'culo', 'verga', 'pija'
]

def validate_email(email):
    """Validar formato de email"""
    pattern = r'^[\w\.-]+@[\w\.-]+\.\w+$'
    return re.match(pattern, email) is not None

def validate_nickname(nickname):
    """Validar nickname: alfanumérico, 3-20 caracteres, no ofensivo"""
    if not nickname or len(nickname) < 3 or len(nickname) > 20:
        return False, "El apodo debe tener entre 3 y 20 caracteres"
    
    if not re.match(r'^[a-zA-Z0-9_]+$', nickname):
        return False, "El apodo solo puede contener letras, números y guiones bajos"
    
    # Verificar palabras ofensivas
    nickname_lower = nickname.lower()
    for word in OFFENSIVE_WORDS:
        if word in nickname_lower:
            return False, "El apodo contiene palabras no permitidas"
    
    return True, "Válido"

def validate_dog_name(name):
    """Validar nombre de perro: no vacío, no ofensivo"""
    if not name or len(name.strip()) < 2:
        return False, "El nombre debe tener al menos 2 caracteres"
    
    if len(name) > 50:
        return False, "El nombre es demasiado largo (máximo 50 caracteres)"
    
    # Verificar palabras ofensivas
    name_lower = name.lower()
    for word in OFFENSIVE_WORDS:
        if word in name_lower:
            return False, "El nombre contiene palabras no permitidas"
    
    return True, "Válido"

def validate_age(age):
    """Validar edad de usuario"""
    try:
        age_int = int(age)
        if 10 <= age_int <= 99:
            return True, "Válido"
        return False, "La edad debe estar entre 10 y 99 años"
    except:
        return False, "Edad inválida"

def validate_dog_age(age):
    """Validar edad de perro"""
    try:
        age_int = int(age)
        if 0 <= age_int <= 25:
            return True, "Válido"
        return False, "La edad del perro debe estar entre 0 y 25 años"
    except:
        return False, "Edad inválida"

def validate_image(file):
    """Validar archivo de imagen"""
    if not isinstance(file, FileStorage):
        return False, "Archivo inválido"
    
    if file.filename == '':
        return False, "No se seleccionó ningún archivo"
    
    # Verificar extensión
    allowed_extensions = {'png', 'jpg', 'jpeg', 'gif', 'webp'}
    if '.' not in file.filename:
        return False, "Extensión de archivo inválida"
        
    ext = file.filename.rsplit('.', 1)[1].lower()
    if ext not in allowed_extensions:
        return False, f"Extensiones permitidas: {', '.join(allowed_extensions)}"
    
    # Verificar tamaño (3MB max)
    file.seek(0, 2)  # Mover al final
    size = file.tell()
    file.seek(0)  # Volver al inicio
    
    if size > 3 * 1024 * 1024:
        return False, "El archivo es muy grande (máximo 3MB)"
    
    # Verificar tipo MIME básico
    mime_type = file.content_type
    allowed_mimes = {'image/jpeg', 'image/png', 'image/gif', 'image/webp'}
    if mime_type not in allowed_mimes:
        return False, "Tipo de archivo no permitido"
    
    return True, "Válido"

def validate_time_slot(time_str):
    """Validar formato de hora HH:MM en bloques de 10 minutos"""
    try:
        hour, minute = map(int, time_str.split(':'))
        if not (0 <= hour <= 23):
            return False, "Hora inválida"
        if minute % 10 != 0 or not (0 <= minute <= 50):
            return False, "Los minutos deben ser en bloques de 10 (00, 10, 20, etc.)"
        return True, "Válido"
    except:
        return False, "Formato de hora inválido (use HH:MM)"

def validate_visit_duration(duration):
    """Validar duración de visita"""
    try:
        duration_int = int(duration)
        allowed_durations = [30, 60, 90, 120, 180, 240]
        if duration_int in allowed_durations:
            return True, "Válido"
        return False, f"Duración debe ser una de: {allowed_durations}"
    except:
        return False, "Duración inválida"

def validate_location(latitude, longitude):
    """Validar coordenadas geográficas"""
    try:
        lat = float(latitude)
        lng = float(longitude)
        
        # Verificar rangos válidos
        if not (-90 <= lat <= 90):
            return False, "Latitud debe estar entre -90 y 90"
        if not (-180 <= lng <= 180):
            return False, "Longitud debe estar entre -180 y 180"
        
        # Verificar que esté aproximadamente en Buenos Aires
        if not (-35.0 <= lat <= -34.0 and -59.0 <= lng <= -58.0):
            return False, "La ubicación debe estar en Buenos Aires"
        
        return True, "Válido"
    except:
        return False, "Coordenadas inválidas"

def sanitize_text(text, max_length=None):
    """Sanitizar texto removiendo caracteres peligrosos"""
    if not text:
        return ""
    
    # Remover caracteres de control y HTML básico
    text = re.sub(r'<[^>]+>', '', text)  # Remover tags HTML
    text = re.sub(r'[\x00-\x1F\x7F]', '', text)  # Remover caracteres de control
    text = text.strip()
    
    if max_length and len(text) > max_length:
        text = text[:max_length]
    
    return text

def validate_interests(interests):
    """Validar lista de intereses"""
    if not isinstance(interests, list):
        return False, "Los intereses deben ser una lista"
    
    if len(interests) > 10:
        return False, "Máximo 10 intereses permitidos"
    
    # Lista de intereses válidos
    valid_interests = [
        "Paseos largos", "Juegos en el parque", "Entrenamiento",
        "Socialización", "Deportes caninos", "Caminatas",
        "Fotografía de mascotas", "Cuidados y salud",
        "Adopción responsable", "Eventos caninos"
    ]
    
    for interest in interests:
        if interest not in valid_interests:
            return False, f"Interés '{interest}' no válido"
    
    return True, "Válido"