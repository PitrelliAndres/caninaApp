"""
Rutas de mensajes
"""
from flask import Blueprint, jsonify

messages_bp = Blueprint('messages', __name__)

@messages_bp.route('/conversations', methods=['GET'])
def get_conversations():
    """Obtener conversaciones"""
    return jsonify({'conversations': []}), 200

@messages_bp.route('/send', methods=['POST'])
def send_message():
    """Enviar mensaje"""
    return jsonify({'message': 'Message sent'}), 201
