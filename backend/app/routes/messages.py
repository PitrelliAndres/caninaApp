"""
Rutas de mensajes y chat
"""
import os
from flask import Blueprint, request, jsonify, current_app
from app import db, socketio
from app.models import Message, Conversation, Match, User
from app.utils.auth import login_required
from app.services.notification_service import NotificationService
from flask_socketio import emit, join_room, leave_room
from datetime import datetime
from sqlalchemy import or_, and_

# Import new security and performance utilities
from app.utils.redis_client import redis_client
from app.utils.rate_limiter import (
    rate_limit_messages, 
    rate_limit_api,
    check_message_rate_limit,
    check_typing_rate_limit,
    check_websocket_event_rate_limit
)
from app.utils.sanitizer import sanitizer, validate_message_data
from app.utils.message_ids import generate_message_id

messages_bp = Blueprint('messages', __name__)

@messages_bp.route('/conversations', methods=['GET'])
@login_required
@rate_limit_api
def get_conversations():
    """Obtener lista de conversaciones"""
    try:
        # Obtener conversaciones usando método optimizado del modelo
        conversations = Conversation.get_user_conversations(request.current_user_id)
        
        conv_list = []
        
        # Batch query for users to reduce database hits
        user_ids = []
        for conv in conversations:
            other_user_id = conv.user2_id if conv.user1_id == request.current_user_id else conv.user1_id
            user_ids.append(other_user_id)
        
        # Get all users in one query
        users_dict = {}
        if user_ids:
            users = User.query.filter(User.id.in_(user_ids), User.is_active == True).all()
            users_dict = {user.id: user for user in users}
        
        # Build conversation list efficiently
        for conv in conversations:
            other_user_id = conv.user2_id if conv.user1_id == request.current_user_id else conv.user1_id
            other_user = users_dict.get(other_user_id)
            
            if not other_user:
                continue
            
            # Check online status from Redis (faster than DB)
            is_online = redis_client.is_user_online(other_user_id)
            
            # Get last message text efficiently
            last_message = None
            if conv.last_message_id:
                last_msg = Message.query.get(conv.last_message_id)
                if last_msg and not last_msg.is_deleted:
                    last_message = last_msg.text[:50] + '...' if len(last_msg.text) > 50 else last_msg.text
            
            # Use optimized unread count method
            unread_count = Message.get_unread_count(request.current_user_id, other_user_id)
            
            conv_data = {
                'chat_id': conv.id,
                'user': {
                    'id': other_user.id,
                    'nickname': other_user.nickname,
                    'avatar': other_user.avatar_url,
                    'is_online': is_online  # From Redis cache
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
        
        # TODO: PRODUCTION - More specific error handling and logging
        if os.environ.get('FLASK_ENV', 'development') == 'development':
            return jsonify({'error': 'Internal server error', 'debug': str(e)}), 500
        else:
            return jsonify({'error': 'Internal server error'}), 500

@messages_bp.route('/chats/<int:chat_id>/messages', methods=['GET'])
@login_required
@rate_limit_api
def get_chat_messages(chat_id):
    """Obtener mensajes de un chat con optimizaciones"""
    try:
        # Verificar que el usuario es parte de la conversación
        conversation = Conversation.query.get(chat_id)
        if not conversation or conversation.is_deleted:
            return jsonify({'error': 'Chat not found'}), 404
        
        if (conversation.user1_id != request.current_user_id and 
            conversation.user2_id != request.current_user_id):
            return jsonify({'error': 'Unauthorized'}), 403
        
        # Determinar el otro usuario
        other_user_id = (conversation.user2_id if conversation.user1_id == request.current_user_id 
                        else conversation.user1_id)
        
        # Paginación mejorada con cursor-based pagination (ULID)
        before_id = request.args.get('before')  # ULID for cursor pagination
        limit = min(request.args.get('limit', 50, type=int), 100)  # Max 100 messages
        
        # Use optimized model method
        messages = Message.get_conversation_messages(
            request.current_user_id, 
            other_user_id,
            limit=limit,
            before_id=before_id
        )
        
        # Marcar mensajes como leídos usando método optimizado
        if messages:
            updated_count = Message.mark_conversation_as_read(request.current_user_id, other_user_id)
            if updated_count > 0:
                db.session.commit()
                
                # Notify via Redis Pub/Sub for real-time updates
                redis_client.publish('messages_read', {
                    'chat_id': chat_id,
                    'reader_id': request.current_user_id,
                    'other_user_id': other_user_id
                })
        
        # Use minimal dict for better performance
        messages_data = [msg.to_dict_minimal() for msg in reversed(messages)]
        
        # Pagination info for cursor-based approach
        pagination_info = {
            'has_more': len(messages) == limit,
            'next_cursor': messages[-1].id if messages else None,
            'count': len(messages_data)
        }
        
        return jsonify({
            'messages': messages_data,
            'pagination': pagination_info
        }), 200
        
    except Exception as e:
        current_app.logger.error(f"Get messages error: {str(e)}")
        
        # TODO: PRODUCTION - More specific error handling
        if os.environ.get('FLASK_ENV', 'development') == 'development':
            return jsonify({'error': 'Internal server error', 'debug': str(e)}), 500
        else:
            return jsonify({'error': 'Internal server error'}), 500

@messages_bp.route('/chats/<int:chat_id>/messages', methods=['POST'])
@login_required
@rate_limit_messages
def send_message(chat_id):
    """Enviar mensaje con validaciones de seguridad y performance"""
    try:
        # WebSocket rate limiting check
        if not check_message_rate_limit(request.current_user_id):
            return jsonify({'error': 'Rate limit exceeded'}), 429
        
        # Verificar que el usuario es parte de la conversación
        conversation = Conversation.query.get(chat_id)
        if not conversation or conversation.is_deleted:
            return jsonify({'error': 'Chat not found'}), 404
        
        if (conversation.user1_id != request.current_user_id and 
            conversation.user2_id != request.current_user_id):
            return jsonify({'error': 'Unauthorized'}), 403
        
        # Determinar el otro usuario
        other_user_id = (conversation.user2_id if conversation.user1_id == request.current_user_id 
                        else conversation.user1_id)
        
        # TODO: harden for production - Enable strict match validation
        if os.environ.get('FLASK_ENV', 'development') != 'development':
            # Re-check membership in DB; never trust client-sent user IDs
            match = Match.query.filter_by(
                user_id=request.current_user_id,
                matched_user_id=other_user_id,
                is_mutual=True
            ).first()
            
            if not match:
                return jsonify({'error': 'No mutual match exists'}), 403
        
        # Validar y sanitizar datos de entrada
        data = request.get_json()
        if not data:
            return jsonify({'error': 'No data provided'}), 400
            
        validated_data, warnings = validate_message_data(data)
        
        if not validated_data.get('text'):
            return jsonify({'error': 'Message text required'}), 400
        
        # Log warnings in development
        if warnings and os.environ.get('FLASK_ENV', 'development') == 'development':
            current_app.logger.warning(f"Message validation warnings: {warnings}")
        
        # Generate ULID for message
        message_id = generate_message_id()
        
        # Crear mensaje con ID optimizado
        message = Message(
            id=message_id,
            sender_id=request.current_user_id,
            receiver_id=other_user_id,
            text=validated_data['text'],
            message_type=validated_data.get('message_type', 'text'),
            created_at=datetime.utcnow()
        )
        db.session.add(message)
        
        # Actualizar conversación
        conversation.update_last_message(message)
        
        # Commit transaction
        db.session.commit()
        
        # Publish to Redis Pub/Sub for scalability
        message_data = message.to_dict_minimal()
        redis_client.publish('new_message', {
            'message': message_data,
            'chat_id': chat_id,
            'sender_id': request.current_user_id,
            'receiver_id': other_user_id
        })
        
        # TODO: PRODUCTION - Use Redis pub/sub instead of direct socketio emit
        # Direct WebSocket emit for development (fallback)
        socketio.emit('new_message', {
            'message': message_data,
            'chat_id': chat_id
        }, room=f'user_{other_user_id}')
        
        # Notificar al receptor (asíncrono)
        try:
            NotificationService.notify_new_message(request.current_user_id, other_user_id, message)
        except Exception as notification_error:
            current_app.logger.error(f"Notification failed: {notification_error}")
            # Continue - notification failure shouldn't break message sending
        
        return jsonify({
            'message': message_data,
            'warnings': warnings if os.environ.get('FLASK_ENV') == 'development' else []
        }), 201
        
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"Send message error: {str(e)}")
        
        # TODO: PRODUCTION - More specific error handling
        if os.environ.get('FLASK_ENV', 'development') == 'development':
            return jsonify({'error': 'Internal server error', 'debug': str(e)}), 500
        else:
            return jsonify({'error': 'Internal server error'}), 500

# Import WebSocket middleware
from app.utils.websocket_middleware import (
    websocket_rate_limit,
    websocket_auth_required,
    websocket_input_validation,
    websocket_error_handler
)

# WebSocket handlers with enhanced security and Redis integration
@socketio.on('connect')
@websocket_error_handler
def handle_connect(auth):
    """WebSocket connection with enhanced security."""
    try:
        # Rate limit connections
        client_ip = request.environ.get('REMOTE_ADDR', 'unknown')
        connection_key = f"ws_connect:{client_ip}"
        
        if not redis_client.check_rate_limit(connection_key, 10, 60):  # 10 connections per minute
            current_app.logger.warning(f"Connection rate limit exceeded for IP: {client_ip}")
            if os.environ.get('FLASK_ENV', 'development') != 'development':
                return False  # TODO: PRODUCTION - Reject in production
        
        # Verificar token de autenticación
        token = auth.get('token') if auth else None
        if not token:
            current_app.logger.error("No token provided for WebSocket connection")
            return False
        
        # Use strict WebSocket token validation
        from app.utils.jwt_validator import validate_websocket_token
        
        payload = validate_websocket_token(token)
        if not payload:
            current_app.logger.error("WebSocket token validation failed")
            return False
        
        user_id = payload['user_id']
        
        # Verificar que el usuario existe y está activo
        user = User.query.get(user_id)
        if not user or not user.is_active:
            current_app.logger.error(f"User not found or inactive for WebSocket connection: {user_id}")
            return False
        
        # Guardar user_id en la sesión de socket
        from flask_socketio import session
        session['user_id'] = user_id
        session['connected_at'] = datetime.utcnow().isoformat()
        
        # Join user room for targeted messaging
        join_room(f'user_{user_id}')
        
        # Update presence in Redis (more efficient than DB)
        socket_id = request.sid
        redis_client.set_user_online(user_id, socket_id)
        
        # Also update DB for consistency (TODO: PRODUCTION - Could be async)
        user.is_online = True
        db.session.commit()
        
        current_app.logger.info(f"User {user_id} connected via WebSocket from {client_ip}")
        emit('connected', {
            'user_id': user_id,
            'server_time': datetime.utcnow().isoformat()
        })
        
        # Publish user online event via Redis Pub/Sub
        redis_client.publish('user_presence', {
            'user_id': user_id,
            'status': 'online',
            'socket_id': socket_id,
            'timestamp': datetime.utcnow().isoformat()
        })
        
        # TODO: PRODUCTION - Use Redis pub/sub instead of direct broadcast
        socketio.emit('user_online', {
            'user_id': user_id,
            'timestamp': datetime.utcnow().isoformat()
        }, broadcast=True, include_self=False)
        
        return True
        
    except Exception as e:
        current_app.logger.error(f"WebSocket connection error: {str(e)}")
        return False

@socketio.on('disconnect')
def handle_disconnect():
    """Manejar desconexión WebSocket con limpieza mejorada"""
    try:
        from flask_socketio import session
        user_id = session.get('user_id')
        
        if user_id:
            leave_room(f'user_{user_id}')
            
            # Remove from Redis presence
            redis_client.set_user_offline(user_id)
            
            # Update DB status (TODO: PRODUCTION - Could be async/batched)
            user = User.query.get(user_id)
            if user:
                user.is_online = False
                db.session.commit()
            
            current_app.logger.info(f"User {user_id} disconnected from WebSocket")
            
            # Publish offline event via Redis Pub/Sub
            redis_client.publish('user_presence', {
                'user_id': user_id,
                'status': 'offline',
                'timestamp': datetime.utcnow().isoformat()
            })
            
            # TODO: PRODUCTION - Use Redis pub/sub instead of direct broadcast
            socketio.emit('user_offline', {
                'user_id': user_id,
                'timestamp': datetime.utcnow().isoformat()
            }, broadcast=True, include_self=False)
            
    except Exception as e:
        current_app.logger.error(f"WebSocket disconnection error: {str(e)}")

@socketio.on('typing')
@websocket_auth_required
@websocket_rate_limit(60)  # 60 typing events per minute
@websocket_input_validation(['chat_id', 'other_user_id'])
@websocket_error_handler
def handle_typing(data):
    """Typing indicator with rate limiting and validation."""
    from flask_socketio import session
    user_id = session.get('user_id')
    
    # Extract and validate IDs (middleware already validated presence)
    try:
        chat_id = int(data['chat_id'])
        other_user_id = int(data['other_user_id'])
    except (ValueError, TypeError):
        current_app.logger.error(f"Invalid ID format in typing event")
        return
    
    # Verify user is part of the conversation (security check)
    conversation = Conversation.query.get(chat_id)
    if not conversation or conversation.is_deleted:
        current_app.logger.warning(f"Typing event for non-existent chat {chat_id}")
        return
    
    if not (conversation.user1_id == user_id or conversation.user2_id == user_id):
        current_app.logger.warning(f"Unauthorized typing event from user {user_id} for chat {chat_id}")
        return
    
    # Publish typing event via Redis Pub/Sub
    redis_client.publish('typing_events', {
        'chat_id': chat_id,
        'user_id': user_id,
        'other_user_id': other_user_id,
        'timestamp': datetime.utcnow().isoformat()
    })
    
    # TODO: harden for production - Use Redis pub/sub instead of direct emit
    emit('user_typing', {
        'chat_id': chat_id,
        'user_id': user_id,
        'timestamp': datetime.utcnow().isoformat()
    }, room=f'user_{other_user_id}')

@socketio.on('mark_read')
@websocket_auth_required
@websocket_rate_limit(30)  # 30 mark_read events per minute
@websocket_input_validation(['chat_id'])
@websocket_error_handler
def handle_mark_read(data):
    """Mark messages as read with optimizations and validation."""
    from flask_socketio import session
    user_id = session.get('user_id')
    
    # Extract and validate ID (middleware already validated presence)
    try:
        chat_id = int(data['chat_id'])
    except (ValueError, TypeError):
        current_app.logger.error(f"Invalid chat_id format in mark_read event")
        return
    
    # Verify conversation exists and user has access
    conversation = Conversation.query.get(chat_id)
    if not conversation or conversation.is_deleted:
        current_app.logger.warning(f"Mark read for non-existent chat {chat_id}")
        return
    
    if not (conversation.user1_id == user_id or conversation.user2_id == user_id):
        current_app.logger.warning(f"Unauthorized mark_read from user {user_id} for chat {chat_id}")
        return
    
    # Determine other user
    other_user_id = (conversation.user2_id if conversation.user1_id == user_id 
                   else conversation.user1_id)
    
    # Use optimized mark as read method
    try:
        updated_count = Message.mark_conversation_as_read(user_id, other_user_id)
        
        if updated_count > 0:
            db.session.commit()
            
            # Publish read event via Redis Pub/Sub  
            redis_client.publish('messages_read', {
                'chat_id': chat_id,
                'reader_id': user_id,
                'other_user_id': other_user_id,
                'count': updated_count,
                'timestamp': datetime.utcnow().isoformat()
            })
            
            # TODO: harden for production - Use Redis pub/sub instead of direct emit
            emit('messages_read', {
                'chat_id': chat_id,
                'reader_id': user_id,
                'count': updated_count,
                'timestamp': datetime.utcnow().isoformat()
            }, room=f'user_{other_user_id}')
            
            current_app.logger.debug(f"Marked {updated_count} messages as read for user {user_id} in chat {chat_id}")
    
    except Exception as e:
        current_app.logger.error(f"Mark read event error: {str(e)}")
        db.session.rollback()
