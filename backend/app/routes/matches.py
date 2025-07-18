"""
Rutas de matches
"""
from flask import Blueprint, jsonify

matches_bp = Blueprint('matches', __name__)

@matches_bp.route('/discover', methods=['GET'])
def discover_users():
    """Descubrir usuarios para match"""
    return jsonify({
        'users': [
            {
                'id': 2,
                'name': 'María García',
                'age': 32,
                'dog': {'name': 'Luna', 'breed': 'Golden Retriever', 'age': 3},
                'compatibility_score': 92
            }
        ]
    }), 200

@matches_bp.route('/like/<int:user_id>', methods=['POST'])
def like_user(user_id):
    """Dar like a usuario"""
    return jsonify({
        'message': 'Like registered',
        'is_mutual': False
    }), 201
