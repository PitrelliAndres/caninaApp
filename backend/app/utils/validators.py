"""
Validadores personalizados
"""
import re
from werkzeug.datastructures import FileStorage

def validate_email(email):
    """Validar formato de email"""
    pattern = r'^[\w\.-]+@[\w\.-]+\.\w+$'
    return re.match(pattern, email) is not None

def validate_nickname(nickname):
    """Validar nickname: alfanumérico, 3-20 caracteres"""
    if not nickname or len(nickname) < 3 or len(nickname) > 20:
        return False
    return re.match(r'^[a-zA-Z0-9_]+$', nickname) is not None

def validate_age(age):
    """Validar edad"""
    try:
        age_int = int(age)
        return 10 <= age_int <= 99
    except:
        return False

def validate_dog_age(age):
    """Validar edad de perro"""
    try:
        age_int = int(age)
        return 0 <= age_int <= 25
    except:
        return False

def validate_image(file):
    """Validar archivo de imagen"""
    if not isinstance(file, FileStorage):
        return False, "Invalid file"
    
    if file.filename == '':
        return False, "No file selected"
    
    # Verificar extensión
    allowed_extensions = {'png', 'jpg', 'jpeg', 'gif'}
    if '.' not in file.filename:
        return False, "Invalid file extension"
        
    ext = file.filename.rsplit('.', 1)[1].lower()
    if ext not in allowed_extensions:
        return False, f"Allowed extensions: {', '.join(allowed_extensions)}"
    
    # Verificar tamaño (3MB max)
    file.seek(0, 2)  # Mover al final
    size = file.tell()
    file.seek(0)  # Volver al inicio
    
    if size > 3 * 1024 * 1024:
        return False, "File too large (max 3MB)"
    
    return True, "Valid"

def validate_time_slot(time_str):
    """Validar formato de hora HH:MM en bloques de 10 minutos"""
    try:
        hour, minute = map(int, time_str.split(':'))
        if not (0 <= hour <= 23):
            return False
        if minute % 10 != 0 or not (0 <= minute <= 50):
            return False
        return True
    except:
        return False
