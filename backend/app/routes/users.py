"""
Rutas de usuarios
"""
from flask import Blueprint, request, jsonify

users_bp = Blueprint('users', __name__)

@users_bp.route('/me', methods=['GET'])
def get_current_user():
    """Obtener usuario actual"""
    return jsonify({
        'id': 1,
        'name': 'Usuario Test',
        'email': 'test@example.com',
        'nickname': 'Test',
        'age': 30,
        'dog': {
            'name': 'Bobby',
            'age': 3,
            'breed': 'Mestizo'
        }
    }), 200

@users_bp.route('/onboarding', methods=['POST'])
def complete_onboarding():
    """Completar onboarding"""
    return jsonify({'message': 'Onboarding completed', 'user': {'id': 1}}), 200
