"""
Rutas de mensajes y chat
"""
from flask import Blueprint, request, jsonify, current_app
from app import db, socketio
from app.models import Message, Conversation, Match, User
from app.utils.auth import login_required
from app.services.notification_service import NotificationService
from flask_socketio import emit, join_room, leave_room
from datetime import datetime
from sqlalchemy import or_, and_

messages_bp = Blueprint('messages', __name__)

@messages_bp.route('/conversations', methods=['GET'])
@login_required
def get_conversations():
    """Obtener lista de conversaciones"""
    try:
        # Obtener conversaciones del usuario
        conversations = Conversation.query.filter(
            or_(
                Conversation.user1_id == request.current_user_id,
                Conversation.user2_id == request.current_user_id
            )
        ).order_by(Conversation.last_message_at.desc().nullsfirst()).all()
        
        conv_list = []
        for conv in conversations:
            # Determinar el otro usuario
            other_user_id = conv.user2_id if conv.user1_id == request.current_user_id else conv.user1_id
            other_user = User.query.get(other_user_id)
            
            if not other_user or not other_user.is_active:
                continue
            
            # Obtener último mensaje
            last_message = None
            if conv.last_message_id:
                last_msg = Message.query.get(conv.last_message_id)
                if last_msg:
                    last_message = last_msg.text[:50] + '...' if len(last_msg.text) > 50 else last_msg.text
            
            # Contar mensajes no leídos
            unread_count = Message.query.filter(
                Message.sender_id == other_user_id,
                Message.receiver_id == request.current_user_id,
                Message.is_read == False
            ).count()
            
            conv_data = {
                'chat_id': conv.id,
                'user': {
                    'id': other_user.id,
                    'nickname': other_user.nickname,
                    'avatar': other_user.avatar_url,
                    'is_online': other_user.is_online
                },
                'last_message': last_message,
                'last_message_time': conv.last_message_at.isoformat() if conv.last_message_at else None,
                'unread': unread_count
            }
            conv_list.append(conv_data)
        
        return jsonify({
            'conversations': conv_list,
            'total': len(conv_list)
        }), 200
        
    except Exception as e:
        current_app.logger.error(f"Get conversations error: {str(e)}")
        return jsonify({'error': 'Internal server error'}), 500

@messages_bp.route('/chats/<int:chat_id>/messages', methods=['GET'])
@login_required
def get_chat_messages(chat_id):
    """Obtener mensajes de un chat"""
    try:
        # Verificar que el usuario es parte de la conversación
        conversation = Conversation.query.get(chat_id)
        if not conversation:
            return jsonify({'error': 'Chat not found'}), 404
        
        if (conversation.user1_id != request.current_user_id and 
            conversation.user2_id != request.current_user_id):
            return jsonify({'error': 'Unauthorized'}), 403
        
        # Determinar el otro usuario
        other_user_id = (conversation.user2_id if conversation.user1_id == request.current_user_id 
                        else conversation.user1_id)
        
        # Obtener mensajes
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 50, type=int)
        
        messages_query = Message.query.filter(
            or_(
                and_(Message.sender_id == request.current_user_id,
                     Message.receiver_id == other_user_id),
                and_(Message.sender_id == other_user_id,
                     Message.receiver_id == request.current_user_id)
            )
        ).order_by(Message.created_at.desc())
        
        paginated = messages_query.paginate(page=page, per_page=per_page, error_out=False)
        
        # Marcar mensajes como leídos
        Message.query.filter(
            Message.sender_id == other_user_id,
            Message.receiver_id == request.current_user_id,
            Message.is_read == False
        ).update({'is_read': True, 'read_at': datetime.utcnow()})
        db.session.commit()
        
        messages = [m.to_dict() for m in reversed(paginated.items)]
        
        return jsonify({
            'messages': messages,
            'total': paginated.total,
            'pages': paginated.pages,
            'current_page': page
        }), 200
        
    except Exception as e:
        current_app.logger.error(f"Get messages error: {str(e)}")
        return jsonify({'error': 'Internal server error'}), 500

@messages_bp.route('/chats/<int:chat_id>/messages', methods=['POST'])
@login_required
def send_message(chat_id):
    """Enviar mensaje"""
    try:
        # Verificar que el usuario es parte de la conversación
        conversation = Conversation.query.get(chat_id)
        if not conversation:
            return jsonify({'error': 'Chat not found'}), 404
        
        if (conversation.user1_id != request.current_user_id and 
            conversation.user2_id != request.current_user_id):
            return jsonify({'error': 'Unauthorized'}), 403
        
        # Verificar que aún hay match mutuo
        other_user_id = (conversation.user2_id if conversation.user1_id == request.current_user_id 
                        else conversation.user1_id)
        
        match = Match.query.filter_by(
            user_id=request.current_user_id,
            matched_user_id=other_user_id,
            is_mutual=True
        ).first()
        
        if not match:
            return jsonify({'error': 'No mutual match exists'}), 403
        
        data = request.get_json()
        text = data.get('text', '').strip()
        
        if not text:
            return jsonify({'error': 'Message text required'}), 400
        
        if len(text) > 1000:
            return jsonify({'error': 'Message too long (max 1000 characters)'}), 400
        
        # Crear mensaje
        message = Message(
            sender_id=request.current_user_id,
            receiver_id=other_user_id,
            text=text,
            created_at=datetime.utcnow()
        )
        db.session.add(message)
        
        # Actualizar conversación
        conversation.last_message_id = message.id
        conversation.last_message_at = message.created_at
        
        db.session.commit()
        
        # Notificar al receptor
        NotificationService.notify_new_message(request.current_user_id, other_user_id, message)
        
        # Emitir por WebSocket si está conectado
        socketio.emit('new_message', {
            'message': message.to_dict(),
            'chat_id': chat_id
        }, room=f'user_{other_user_id}')
        
        return jsonify({
            'message': message.to_dict()
        }), 201
        
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"Send message error: {str(e)}")
        return jsonify({'error': 'Internal server error'}), 500

# WebSocket handlers
@socketio.on('connect')
@login_required
def handle_connect():
    """Manejar conexión WebSocket"""
    user_id = request.current_user_id
    join_room(f'user_{user_id}')
    
    # Actualizar estado online
    user = User.query.get(user_id)
    if user:
        user.is_online = True
        db.session.commit()
    
    emit('connected', {'user_id': user_id})

@socketio.on('disconnect')
@login_required
def handle_disconnect():
    """Manejar desconexión WebSocket"""
    user_id = request.current_user_id
    leave_room(f'user_{user_id}')
    
    # Actualizar estado offline
    user = User.query.get(user_id)
    if user:
        user.is_online = False
        db.session.commit()

@socketio.on('typing')
@login_required
def handle_typing(data):
    """Manejar indicador de escritura"""
    chat_id = data.get('chat_id')
    other_user_id = data.get('other_user_id')
    
    if chat_id and other_user_id:
        emit('user_typing', {
            'chat_id': chat_id,
            'user_id': request.current_user_id
        }, room=f'user_{other_user_id}')

@socketio.on('mark_read')
@login_required
def handle_mark_read(data):
    """Marcar mensajes como leídos"""
    chat_id = data.get('chat_id')
    
    if chat_id:
        # Marcar todos los mensajes del chat como leídos
        conversation = Conversation.query.get(chat_id)
        if conversation:
            other_user_id = (conversation.user2_id if conversation.user1_id == request.current_user_id 
                           else conversation.user1_id)
            
            Message.query.filter(
                Message.sender_id == other_user_id,
                Message.receiver_id == request.current_user_id,
                Message.is_read == False
            ).update({'is_read': True, 'read_at': datetime.utcnow()})
            
            db.session.commit()
            
            # Notificar al emisor
            emit('messages_read', {
                'chat_id': chat_id,
                'reader_id': request.current_user_id
            }, room=f'user_{other_user_id}')
