"""
Rutas de parques
"""
from flask import Blueprint, jsonify, request

parks_bp = Blueprint('parks', __name__)

# Datos de parques de CABA
PARKS_DATA = [
    {
        'id': 1,
        'name': 'Parque Centenario',
        'neighborhood': 'caballito',
        'description': 'Un gran pulmón verde con un lago, ideal para paseos largos y socializar.',
        'latitude': -34.6064,
        'longitude': -58.4362,
        'has_dog_area': True,
        'is_fenced': True,
        'has_water': True
    },
    {
        'id': 2,
        'name': 'Plaza Irlanda',
        'neighborhood': 'caballito',
        'description': 'Amplia plaza con un canil cercado muy popular entre los vecinos.',
        'latitude': -34.6137,
        'longitude': -58.4416,
        'has_dog_area': True,
        'is_fenced': True,
        'has_water': True
    },
    {
        'id': 3,
        'name': 'Parque Rivadavia',
        'neighborhood': 'caballito',
        'description': 'Famoso por su feria de libros, también tiene mucho espacio para perros.',
        'latitude': -34.6186,
        'longitude': -58.4372,
        'has_dog_area': False,
        'is_fenced': False,
        'has_water': True
    },
    {
        'id': 4,
        'name': 'Bosques de Palermo',
        'neighborhood': 'palermo',
        'description': 'El espacio verde más grande de la ciudad, con lagos y áreas para correr.',
        'latitude': -34.5711,
        'longitude': -58.4167,
        'has_dog_area': True,
        'is_fenced': False,
        'has_water': True
    },
    {
        'id': 5,
        'name': 'Plaza Inmigrantes de Armenia',
        'neighborhood': 'palermo',
        'description': 'Plaza concurrida en el corazón de Palermo Soho, con un canil bien mantenido.',
        'latitude': -34.5886,
        'longitude': -58.4301,
        'has_dog_area': True,
        'is_fenced': True,
        'has_water': True
    },
    {
        'id': 6,
        'name': 'Parque Las Heras',
        'neighborhood': 'palermo',
        'description': 'Muy popular para deportes y paseos, con un canil grande y activo.',
        'latitude': -34.5859,
        'longitude': -58.4073,
        'has_dog_area': True,
        'is_fenced': True,
        'has_water': True
    },
    {
        'id': 7,
        'name': 'Parque Lezama',
        'neighborhood': 'san telmo',
        'description': 'Histórico parque con barrancas y mucho espacio para explorar con tu mascota.',
        'latitude': -34.6289,
        'longitude': -58.3694,
        'has_dog_area': False,
        'is_fenced': False,
        'has_water': True
    },
    {
        'id': 8,
        'name': 'Plaza Dorrego',
        'neighborhood': 'san telmo',
        'description': 'El corazón de San Telmo, ideal para un paseo tranquilo entre semana.',
        'latitude': -34.6204,
        'longitude': -58.3717,
        'has_dog_area': False,
        'is_fenced': False,
        'has_water': False
    }
]

@parks_bp.route('', methods=['GET'])
def get_parks():
    """Obtener lista de parques"""
    neighborhood = request.args.get('neighborhood')
    search = request.args.get('search')
    
    parks = PARKS_DATA.copy()
    
    # Filtrar por barrio
    if neighborhood and neighborhood != 'all':
        parks = [p for p in parks if p['neighborhood'] == neighborhood]
    
    # Buscar por nombre
    if search:
        parks = [p for p in parks if search.lower() in p['name'].lower()]
    
    return jsonify({'parks': parks, 'total': len(parks)}), 200

@parks_bp.route('/neighborhoods', methods=['GET'])
def get_neighborhoods():
    """Obtener barrios disponibles"""
    neighborhoods = list(set(p['neighborhood'] for p in PARKS_DATA))
    return jsonify({'neighborhoods': sorted(neighborhoods)}), 200
