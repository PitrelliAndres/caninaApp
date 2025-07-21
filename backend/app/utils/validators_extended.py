"""
Validadores extendidos con más funcionalidades
"""
import re
from datetime import datetime, date
import unicodedata

# Lista expandida de palabras ofensivas en español e inglés
OFFENSIVE_WORDS_ES = [
    'mierda', 'puta', 'pendejo', 'boludo', 'pelotudo', 
    'concha', 'carajo', 'culo', 'verga', 'pija',
    'hdp', 'sorete', 'forro', 'choto', 'pete'
]

OFFENSIVE_WORDS_EN = [
    'fuck', 'shit', 'bitch', 'asshole', 'dick',
    'pussy', 'cock', 'cunt', 'bastard', 'whore'
]

OFFENSIVE_WORDS = OFFENSIVE_WORDS_ES + OFFENSIVE_WORDS_EN

def normalize_text(text):
    """Normalizar texto removiendo acentos y caracteres especiales"""
    if not text:
        return ""
    # Remover acentos
    nfd_form = unicodedata.normalize('NFD', text)
    return ''.join(char for char in nfd_form if unicodedata.category(char) != 'Mn')

def contains_offensive_content(text):
    """Verificar si el texto contiene contenido ofensivo"""
    if not text:
        return False
    
    normalized = normalize_text(text.lower())
    
    # Verificar palabras exactas
    for word in OFFENSIVE_WORDS:
        if word in normalized:
            return True
    
    # Verificar variaciones con números (l33t speak)
    leet_replacements = {
        '0': 'o', '1': 'i', '3': 'e', '4': 'a', 
        '5': 's', '7': 't', '@': 'a'
    }
    
    for old, new in leet_replacements.items():
        normalized = normalized.replace(old, new)
    
    for word in OFFENSIVE_WORDS:
        if word in normalized:
            return True
    
    return False

def validate_park_visit_time(visit_date, visit_time, park):
    """Validar horario de visita contra horarios del parque"""
    if not park.opening_hours:
        return True, "Válido"
    
    # Obtener día de la semana
    weekday = visit_date.strftime('%A').lower()
    
    if weekday not in park.opening_hours:
        return False, "El parque no abre este día"
    
    hours = park.opening_hours[weekday]
    if hours == 'closed':
        return False, "El parque está cerrado este día"
    
    # Verificar horario
    open_time = datetime.strptime(hours['open'], '%H:%M').time()
    close_time = datetime.strptime(hours['close'], '%H:%M').time()
    
    if not (open_time <= visit_time <= close_time):
        return False, f"El parque abre de {hours['open']} a {hours['close']}"
    
    return True, "Válido"

def validate_password_strength(password):
    """Validar fortaleza de contraseña (para futuro uso)"""
    if len(password) < 8:
        return False, "La contraseña debe tener al menos 8 caracteres"
    
    if not re.search(r'[A-Z]', password):
        return False, "Debe contener al menos una mayúscula"
    
    if not re.search(r'[a-z]', password):
        return False, "Debe contener al menos una minúscula"
    
    if not re.search(r'[0-9]', password):
        return False, "Debe contener al menos un número"
    
    if not re.search(r'[!@#$%^&*(),.?":{}|<>]', password):
        return False, "Debe contener al menos un carácter especial"
    
    return True, "Contraseña segura"

def validate_phone_number(phone, country_code='AR'):
    """Validar número de teléfono por país"""
    patterns = {
        'AR': r'^\+?54?9?11\d{8}$|^11\d{8}$',  # Argentina
        'US': r'^\+?1?\d{10}$',  # USA
        'ES': r'^\+?34?\d{9}$',  # España
    }
    
    pattern = patterns.get(country_code, patterns['AR'])
    
    # Limpiar número
    clean_phone = re.sub(r'[\s\-\(\)]', '', phone)
    
    if re.match(pattern, clean_phone):
        return True, "Válido"
    
    return False, f"Formato de teléfono inválido para {country_code}"

def calculate_age_from_birthdate(birthdate):
    """Calcular edad desde fecha de nacimiento"""
    today = date.today()
    age = today.year - birthdate.year - ((today.month, today.day) < (birthdate.month, birthdate.day))
    return age

def validate_coordinates_in_area(lat, lng, area_bounds):
    """Validar que coordenadas estén dentro de un área específica"""
    return (
        area_bounds['min_lat'] <= lat <= area_bounds['max_lat'] and
        area_bounds['min_lng'] <= lng <= area_bounds['max_lng']
    )

# Bounds para Buenos Aires
BUENOS_AIRES_BOUNDS = {
    'min_lat': -34.705,
    'max_lat': -34.527,
    'min_lng': -58.531,
    'max_lng': -58.335
}
