"""
Rutas de mensajes y chat
"""
import os
from flask import Blueprint, request, jsonify, current_app
from app import db, socketio
from app.models import Message, Conversation, Match, User, MessageRead, UserBlock
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
from app.utils.logger import structured_logger, log_route_errors, log_websocket_errors

messages_bp = Blueprint('messages', __name__)

@messages_bp.route('/conversations', methods=['GET'])
@login_required
@rate_limit_api
@log_route_errors
def get_conversations():
    """Obtener lista de conversaciones del usuario - solo con matches"""
    try:
        # Verificar que el usuario existe
        current_user = User.query.get(request.current_user_id)
        if not current_user:
            return jsonify({'error': 'User not found'}), 404
        
        # Obtener conversaciones del usuario
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
            
            # Use new watermark-based unread count
            unread_count = MessageRead.get_unread_count(conv.id, request.current_user_id)
            
            # Verificar si hay match activo (requerimiento DM)
            has_match = Match.query.filter(
                Match.user_id == request.current_user_id,
                Match.matched_user_id == other_user_id,
                Match.is_mutual == True
            ).first() is not None
            
            # Solo incluir conversaciones con match mutuo activo
            if not has_match:
                continue
            
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
        error_id = structured_logger.log_error(
            current_app.logger,
            e,
            context={
                'user_id': request.current_user_id,
                'route': 'get_conversations'
            }
        )
        
        if os.environ.get('FLASK_ENV', 'development') == 'development':
            return jsonify({
                'error': 'Internal server error', 
                'error_id': error_id,
                'debug': str(e),
                'type': type(e).__name__
            }), 500
        else:
            return jsonify({
                'error': 'Internal server error', 
                'error_id': error_id
            }), 500

@messages_bp.route('/chats/<int:chat_id>/messages', methods=['GET'])
@login_required
@rate_limit_api
@log_route_errors
def get_chat_messages(chat_id):
    """Obtener mensajes de un chat con autorización por match"""
    try:
        # Verificar que el usuario es parte de la conversación
        conversation = Conversation.query.get(chat_id)
        if not conversation or conversation.is_deleted:
            return jsonify({'error': 'Chat not found'}), 404
        
        if not conversation.has_user(request.current_user_id):
            return jsonify({'error': 'Unauthorized'}), 403
        
        # Determinar el otro usuario
        other_user_id = conversation.get_other_user_id(request.current_user_id)
        
        # Verificar que existe match mutuo activo
        has_match = Match.query.filter(
            Match.user_id == request.current_user_id,
            Match.matched_user_id == other_user_id,
            Match.is_mutual == True
        ).first() is not None
        
        if not has_match:
            return jsonify({'error': 'No mutual match exists'}), 403
        
        # Verificar que no hay bloqueos
        if UserBlock.is_blocked(request.current_user_id, other_user_id):
            return jsonify({'error': 'User is blocked'}), 403
        
        # Paginación mejorada con cursor-based pagination (ULID)
        before_id = request.args.get('before')  # ULID for cursor pagination
        limit = min(request.args.get('limit', 50, type=int), 100)  # Max 100 messages
        
        # Use conversation-based method with new schema
        messages = Message.get_conversation_messages(
            conversation_id=chat_id,
            limit=limit,
            before_id=before_id
        )
        
        # Marcar mensajes como leídos usando watermark
        if messages:
            # Update read watermark to latest message
            latest_message = messages[0]  # messages are ordered by newest first
            MessageRead.update_read_watermark(chat_id, request.current_user_id, latest_message.id)
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
@log_route_errors
def send_message(chat_id):
    """Enviar mensaje con validaciones DM estrictas"""
    try:
        # WebSocket rate limiting check
        if not check_message_rate_limit(request.current_user_id):
            return jsonify({'error': 'Rate limit exceeded'}), 429
        
        # Verificar que el usuario es parte de la conversación
        conversation = Conversation.query.get(chat_id)
        if not conversation or conversation.is_deleted:
            return jsonify({'error': 'Chat not found'}), 404
        
        if not conversation.has_user(request.current_user_id):
            return jsonify({'error': 'Unauthorized'}), 403
        
        # Determinar el otro usuario
        other_user_id = conversation.get_other_user_id(request.current_user_id)
        
        # Verificar match mutuo activo - REQUERIDO para DM
        has_match = Match.query.filter(
            Match.user_id == request.current_user_id,
            Match.matched_user_id == other_user_id,
            Match.is_mutual == True
        ).first() is not None
        
        if not has_match:
            return jsonify({'error': 'No mutual match exists - DM requires active match'}), 403
        
        # Verificar que no hay bloqueos
        if UserBlock.is_blocked(request.current_user_id, other_user_id):
            return jsonify({'error': 'Cannot send message - user is blocked'}), 403
        
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
        
        # Crear mensaje con nueva estructura de conversación
        message = Message(
            id=message_id,
            conversation_id=chat_id,
            sender_id=request.current_user_id,
            receiver_id=other_user_id,  # Para compatibilidad con código existente
            text=validated_data['text'],
            message_type=validated_data.get('message_type', 'text'),
            client_temp_id=validated_data.get('temp_id'),  # Para idempotencia
            created_at=datetime.utcnow()
        )
        db.session.add(message)
        
        # Commit message first to ensure it exists in database
        db.session.flush()
        
        # Actualizar conversación after message is committed
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

# TODO: Re-enable WebSocket middleware for production
# Import WebSocket middleware
# from app.utils.websocket_middleware import (
#     websocket_rate_limit,
#     websocket_auth_required,  
#     websocket_input_validation,
#     websocket_error_handler
# )

# WebSocket handlers with enhanced security and Redis integration
@socketio.on('connect')
@log_websocket_errors
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
        
        # Verificar token de autenticación realtime (modo desarrollo más permisivo)
        token = auth.get('token') if auth else None
        
        # En desarrollo, permitir conexiones sin token para debuggear
        if not token and current_app.debug:
            current_app.logger.warning("WebSocket connection without token in development mode")
            # Crear payload temporal para desarrollo
            payload = {'user_id': 7}  # Usuario de prueba por defecto
        elif not token:
            structured_logger.log_error(
                current_app.logger,
                ValueError("No realtime token provided for WebSocket connection"),
                context={
                    'client_ip': client_ip,
                    'auth_data': auth,
                    'connection_attempt': 'websocket_connect'
                }
            )
            return False
        else:
            # Use strict WebSocket token validation (expects aud=realtime)
            from app.utils.jwt_validator import validate_websocket_token
            
            payload = validate_websocket_token(token)
            if not payload:
                # En desarrollo, intentar validación más relajada
                if current_app.debug:
                    current_app.logger.warning("Strict token validation failed, trying relaxed validation in dev mode")
                    try:
                        from app.utils.jwt_validator import decode_token
                        payload = decode_token(token, 'access')  # Permitir access tokens en dev
                        current_app.logger.info(f"Accepted access token for WebSocket in dev mode: user {payload.get('user_id')}")
                    except:
                        current_app.logger.error("All token validation failed")
                        return False
                else:
                    structured_logger.log_error(
                        current_app.logger,
                        ValueError("WebSocket realtime token validation failed"),
                        context={
                            'client_ip': client_ip,
                            'token_preview': token[:20] + '...' if token else None,
                            'connection_attempt': 'websocket_token_validation'
                        }
                    )
                    return False
        
        user_id = payload['user_id']
        
        # Verificar que el usuario existe y está activo
        user = User.query.get(user_id)
        if not user or not user.is_active:
            current_app.logger.error(f"User not found or inactive for WebSocket connection: {user_id}")
            return False
        
        # Guardar user_id asociado al socket_id para la sesión
        socket_id = request.sid
        # Usamos Redis para almacenar la relación socket_id -> user_id
        redis_client.set_socket_user(socket_id, user_id)
        
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
        }, skip_sid=request.sid)
        
        return True
        
    except Exception as e:
        current_app.logger.error(f"WebSocket connection error: {str(e)}")
        return False

@socketio.on('disconnect')
@log_websocket_errors
def handle_disconnect():
    """Manejar desconexión WebSocket con limpieza mejorada"""
    try:
        socket_id = request.sid
        user_id = redis_client.get_socket_user(socket_id)
        
        if user_id:
            leave_room(f'user_{user_id}')
            
            # Remove from Redis presence
            redis_client.set_user_offline(user_id)
            
            # Clean up socket-user mapping
            redis_client.remove_socket_user(socket_id)
            
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
            }, skip_sid=request.sid)
            
    except Exception as e:
        current_app.logger.error(f"WebSocket disconnection error: {str(e)}")

@socketio.on('typing')
def handle_typing(data):
    """Typing indicator with rate limiting and validation."""
    socket_id = request.sid
    user_id = redis_client.get_socket_user(socket_id)
    
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
def handle_mark_read(data):
    """Mark messages as read with optimizations and validation."""
    socket_id = request.sid
    user_id = redis_client.get_socket_user(socket_id)
    
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


# New DM Socket.IO handlers based on specification

@socketio.on('connect')
def handle_connect(auth):
    """Handle WebSocket connection and authenticate user"""
    from app.utils.jwt_validator import validate_websocket_token
    from app.utils.logger import structured_logger
    
    socket_id = request.sid
    client_ip = request.environ.get('REMOTE_ADDR', 'unknown')
    user_agent = request.environ.get('HTTP_USER_AGENT', 'unknown')
    
    current_app.logger.info(f"🔌 WebSocket connection attempt - Socket: {socket_id}, IP: {client_ip}, Agent: {user_agent[:100]}")
    
    # Process authentication token
    token = auth.get('token') if auth else None
    
    current_app.logger.info(f"🔑 Auth data received - Has token: {bool(token)}, Token length: {len(token) if token else 0}")
    
    if not token:
        current_app.logger.error(f"❌ WebSocket connection rejected - No auth token provided. Socket: {socket_id}")
        structured_logger.log_error(
            current_app.logger,
            ValueError("No realtime token provided for WebSocket connection"),
            context={'client_ip': client_ip, 'socket_id': socket_id}
        )
        return False
    
    # Validate WebSocket token
    current_app.logger.info(f"🔍 Validating WebSocket token for socket {socket_id}")
    payload = validate_websocket_token(token)
    if not payload:
        current_app.logger.error(f"❌ WebSocket token validation failed for socket {socket_id}")
        structured_logger.log_error(
            current_app.logger,
            ValueError("WebSocket realtime token validation failed"),
            context={'client_ip': client_ip, 'socket_id': socket_id}
        )
        return False
    
    user_id = payload.get('user_id')
    if not user_id:
        structured_logger.log_error(
            current_app.logger,
            ValueError("No user_id in WebSocket token payload"),
            context={'client_ip': client_ip, 'socket_id': socket_id, 'payload': payload}
        )
        return False
    
    # Store user_id for this socket in Redis
    redis_client.set_socket_user(socket_id, user_id)
    
    # Join user to individual room for messaging
    join_room(f'user_{user_id}')
    current_app.logger.info(f"✅ User {user_id} authenticated and joined room user_{user_id} (Socket: {socket_id}, IP: {client_ip})")
    
    return True

@socketio.on('dm:join')
@log_websocket_errors
def handle_dm_join(data):
    """Join a conversation for DM - with match validation"""
    socket_id = request.sid
    user_id = redis_client.get_socket_user(socket_id)
    
    try:
        conversation_id = int(data['conversationId'])
    except (ValueError, TypeError):
        emit('error', {'code': 'INVALID_CONVERSATION_ID', 'message': 'Invalid conversation ID'})
        return
    
    # Verify conversation exists and user has access
    conversation = Conversation.query.get(conversation_id)
    if not conversation or conversation.is_deleted:
        emit('error', {'code': 'CONVERSATION_NOT_FOUND', 'message': 'Conversation not found'})
        return
    
    if not conversation.has_user(user_id):
        emit('error', {'code': 'UNAUTHORIZED', 'message': 'Not authorized to join this conversation'})
        return
    
    # Get other user and verify mutual match
    other_user_id = conversation.get_other_user_id(user_id)
    has_match = Match.query.filter(
        Match.user_id == user_id,
        Match.matched_user_id == other_user_id,
        Match.is_mutual == True
    ).first() is not None
    
    if not has_match:
        emit('error', {'code': 'NO_MATCH', 'message': 'No mutual match exists'})
        return
    
    # Check for blocks
    if UserBlock.is_blocked(user_id, other_user_id):
        emit('error', {'code': 'BLOCKED', 'message': 'User is blocked'})
        return
    
    # Join conversation and individual user rooms
    conversation_room = f'conversation_{conversation_id}'
    user_room = f'user_{user_id}'
    
    join_room(conversation_room)
    join_room(user_room)
    
    # Usuario unido a salas de conversación
    
    current_app.logger.info(f"User {user_id} joined rooms: {conversation_room}, {user_room}")
    
    # Get recent messages
    messages = Message.get_conversation_messages(
        conversation_id=conversation_id,
        limit=50
    )
    
    messages_data = [msg.to_dict_minimal() for msg in reversed(messages)]
    
    # Get cursor for pagination
    cursor = messages[-1].id if messages else None
    
    # Get key version for E2EE (future)
    key_version = conversation.current_key_version
    
    emit('dm:joined', {
        'messages': messages_data,
        'cursor': cursor,
        'keyVersion': key_version,
        'conversationId': conversation_id
    })
    
    current_app.logger.info(f"User {user_id} joined conversation {conversation_id}")

@socketio.on('dm:send')
@log_websocket_errors
def handle_dm_send(data):
    """Send DM message with full validation"""
    socket_id = request.sid
    user_id = redis_client.get_socket_user(socket_id)
    
    try:
        conversation_id = int(data['conversationId'])
        temp_id = data['tempId']
        text = data.get('text', '').strip()
        
        # Validate message content
        if not text or len(text.encode('utf-8')) > 4096:  # 4KB limit
            emit('error', {'code': 'INVALID_MESSAGE', 'message': 'Message text invalid or too long'})
            return
            
    except (ValueError, TypeError) as e:
        emit('error', {'code': 'INVALID_DATA', 'message': 'Invalid message data'})
        return
    
    # Verify conversation and access
    conversation = Conversation.query.get(conversation_id)
    if not conversation or conversation.is_deleted:
        emit('error', {'code': 'CONVERSATION_NOT_FOUND', 'message': 'Conversation not found'})
        return
    
    if not conversation.has_user(user_id):
        emit('error', {'code': 'UNAUTHORIZED', 'message': 'Not authorized for this conversation'})
        return
    
    # Verify mutual match (critical for DM)
    other_user_id = conversation.get_other_user_id(user_id)
    has_match = Match.query.filter(
        Match.user_id == user_id,
        Match.matched_user_id == other_user_id,
        Match.is_mutual == True
    ).first() is not None
    
    if not has_match:
        emit('error', {'code': 'NO_MATCH', 'message': 'No mutual match exists'})
        return
    
    # Check for blocks
    if UserBlock.is_blocked(user_id, other_user_id):
        emit('error', {'code': 'BLOCKED', 'message': 'User is blocked'})
        return
    
    # Check for duplicate temp_id (idempotency)
    existing = Message.query.filter_by(client_temp_id=temp_id).first()
    if existing:
        # Return existing message
        emit('dm:ack', {
            'tempId': temp_id,
            'serverId': existing.id,
            'timestamp': existing.created_at.isoformat()
        })
        return
    
    # Create message
    message_id = generate_message_id()
    message = Message(
        id=message_id,
        conversation_id=conversation_id,
        sender_id=user_id,
        receiver_id=other_user_id,  # For compatibility
        text=text,
        client_temp_id=temp_id,
        # E2EE fields for future use
        ciphertext=data.get('ciphertext'),
        nonce=data.get('nonce'),
        tag=data.get('tag'),
        key_version=data.get('keyVersion', 1),
        algorithm=data.get('algorithm'),
        metadata_json=data.get('metadata')
    )
    
    db.session.add(message)
    
    # Commit message first to ensure it exists in database
    db.session.flush()
    
    # Update conversation last message after message is committed
    conversation.update_last_message(message)
    
    try:
        db.session.commit()
        
        # Send acknowledgment to sender
        emit('dm:ack', {
            'tempId': temp_id,
            'serverId': message.id,
            'timestamp': message.created_at.isoformat()
        })
        
        # Broadcast to all conversation participants
        message_data = message.to_dict_minimal()
        
        # Debug logging for message broadcasting
        conversation_room = f'conversation_{conversation_id}'
        sender_room = f'user_{user_id}'
        receiver_room = f'user_{other_user_id}'
        
        # Broadcasting mensaje a salas relevantes
        
        # Emit to conversation room
        socketio.emit('dm:new', {
            'message': message_data,
            'conversationId': conversation_id
        }, room=conversation_room)
        # Emitido a sala de conversación
        
        # Also emit to individual user rooms
        socketio.emit('dm:new', {
            'message': message_data,
            'conversationId': conversation_id
        }, room=sender_room)
        # Emitido a sala del emisor
        
        socketio.emit('dm:new', {
            'message': message_data,
            'conversationId': conversation_id
        }, room=receiver_room)
        # Emitido a sala del receptor
        
        # Publish for scaling/notifications
        redis_client.publish('dm_new_message', {
            'message': message_data,
            'conversationId': conversation_id,
            'senderId': user_id,
            'receiverId': other_user_id
        })
        
        current_app.logger.info(f"DM message sent: {user_id} -> {other_user_id} in conversation {conversation_id}")
        
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"DM send error: {str(e)}")
        emit('error', {'code': 'MESSAGE_FAILED', 'message': 'Failed to send message'})

@socketio.on('dm:read')
def handle_dm_read(data):
    """Mark messages as read using watermark approach"""
    socket_id = request.sid
    user_id = redis_client.get_socket_user(socket_id)
    
    try:
        conversation_id = int(data['conversationId'])
        up_to_message_id = data['upToMessageId']
    except (ValueError, TypeError):
        emit('error', {'code': 'INVALID_DATA', 'message': 'Invalid read data'})
        return
    
    # Verify conversation and access
    conversation = Conversation.query.get(conversation_id)
    if not conversation or conversation.is_deleted:
        emit('error', {'code': 'CONVERSATION_NOT_FOUND', 'message': 'Conversation not found'})
        return
    
    if not conversation.has_user(user_id):
        emit('error', {'code': 'UNAUTHORIZED', 'message': 'Not authorized for this conversation'})
        return
    
    # Update read watermark
    MessageRead.update_read_watermark(conversation_id, user_id, up_to_message_id)
    db.session.commit()
    
    # Get other user for read receipt
    other_user_id = conversation.get_other_user_id(user_id)
    
    # Send read receipt to other user
    emit('dm:read-receipt', {
        'conversationId': conversation_id,
        'userId': user_id,
        'upToMessageId': up_to_message_id,
        'timestamp': datetime.utcnow().isoformat()
    }, room=f'user_{other_user_id}')
    
    current_app.logger.debug(f"Read watermark updated: user {user_id}, conversation {conversation_id}, up to {up_to_message_id}")

@socketio.on('dm:typing')
def handle_dm_typing(data):
    """Handle typing indicators for DM"""
    socket_id = request.sid
    user_id = redis_client.get_socket_user(socket_id)
    
    try:
        conversation_id = int(data['conversationId'])
        is_typing = bool(data['isTyping'])
    except (ValueError, TypeError):
        emit('error', {'code': 'INVALID_DATA', 'message': 'Invalid typing data'})
        return
    
    # Verify conversation and access
    conversation = Conversation.query.get(conversation_id)
    if not conversation or conversation.is_deleted or not conversation.has_user(user_id):
        return  # Silently ignore invalid typing events
    
    # Send typing indicator to other user
    other_user_id = conversation.get_other_user_id(user_id)
    
    emit('dm:typing', {
        'conversationId': conversation_id,
        'userId': user_id,
        'isTyping': is_typing,
        'timestamp': datetime.utcnow().isoformat()
    }, room=f'user_{other_user_id}')

@socketio.on('dm:leave')
def handle_dm_leave(data):
    """Handle user leaving conversation - trigger push notifications"""
    socket_id = request.sid
    user_id = redis_client.get_socket_user(socket_id)
    
    try:
        conversation_id = int(data['conversationId'])
    except (ValueError, TypeError):
        emit('error', {'code': 'INVALID_DATA', 'message': 'Invalid conversation ID'})
        return
    
    # Verify conversation and access
    conversation = Conversation.query.get(conversation_id)
    if not conversation or conversation.is_deleted or not conversation.has_user(user_id):
        return
    
    # Leave conversation room
    leave_room(f'conversation_{conversation_id}')
    leave_room(f'user_{user_id}')
    
    current_app.logger.info(f"User {user_id} left conversation {conversation_id}")
    
    # TODO: Enable push notifications for offline users
    # When user leaves chat, any new messages should trigger push notifications
    # until they return to the conversation
    
    # Mark user as "away from conversation" in Redis
    redis_client.publish('user_left_conversation', {
        'user_id': user_id,
        'conversation_id': conversation_id,
        'timestamp': datetime.utcnow().isoformat(),
        'should_push_notify': True  # Flag for push notification service
    })
    
    # Notify other user that this user left (for UI updates)
    other_user_id = conversation.get_other_user_id(user_id)
    emit('dm:user-left', {
        'conversationId': conversation_id,
        'userId': user_id,
        'timestamp': datetime.utcnow().isoformat()
    }, room=f'user_{other_user_id}')
