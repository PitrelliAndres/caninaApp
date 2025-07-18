"""
Rutas de visitas
"""
from flask import Blueprint, request, jsonify

visits_bp = Blueprint('visits', __name__)

@visits_bp.route('', methods=['GET'])
def get_my_visits():
    """Obtener mis visitas"""
    return jsonify({
        'visits': [
            {
                'id': 1,
                'park_id': 1,
                'park_name': 'Parque Centenario',
                'date': '2025-07-20',
                'time': '17:00',
                'duration': '1 hora',
                'status': 'scheduled'
            }
        ]
    }), 200

@visits_bp.route('', methods=['POST'])
def create_visit():
    """Crear nueva visita"""
    data = request.get_json()
    return jsonify({
        'message': 'Visit created successfully',
        'visit': {
            'id': 2,
            'park_id': data.get('park_id'),
            'date': data.get('date'),
            'time': data.get('time'),
            'duration': data.get('duration')
        }
    }), 201
