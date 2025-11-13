"""
Message Worker
Processes message delivery jobs from the queue
"""

import logging
from app import create_app, db, socketio
from app.models.message import Message
from app.models.user import User
from app.models.conversation import Conversation
from app.services.notification_service import notification_service
from app.utils.redis_client import redis_client

logger = logging.getLogger(__name__)

# Create app context for workers
app = create_app()


def deliver_message(message_id: str, receiver_id: str, conversation_id: str):
    """
    Worker function to deliver a message via WebSocket and/or Push

    This runs asynchronously in a worker process.

    Args:
        message_id: Message ULID
        receiver_id: Recipient user ID
        conversation_id: Conversation ID

    Returns:
        Dict with delivery stats
    """
    with app.app_context():
        try:
            # Get message from DB
            message = Message.query.get(message_id)

            if not message:
                logger.error(f'[MessageWorker] Message {message_id} not found')
                return {'success': False, 'error': 'Message not found'}

            # Get sender and conversation
            sender = User.query.get(message.sender_id)
            conversation = Conversation.query.get(conversation_id)

            if not sender or not conversation:
                logger.error(f'[MessageWorker] Sender or conversation not found')
                return {'success': False, 'error': 'Sender or conversation not found'}

            # Prepare message data
            message_data = message.to_dict_minimal()

            # Try WebSocket delivery
            websocket_delivered = False
            try:
                socketio.emit(
                    'dm:new',
                    {
                        'message': message_data,
                        'conversationId': conversation_id
                    },
                    room=f'user_{receiver_id}',
                    namespace='/'
                )
                websocket_delivered = True
                logger.info(f'[MessageWorker] WebSocket delivered to user {receiver_id}')

            except Exception as e:
                logger.warning(f'[MessageWorker] WebSocket delivery failed: {e}')

            # Check if user is online
            online = redis_client.get(f'user:online:{receiver_id}')

            # Send push notification if user is offline or WebSocket failed
            push_result = None
            if not online or not websocket_delivered:
                if notification_service.is_initialized():
                    try:
                        push_result = notification_service.send_message_notification(
                            user_id=receiver_id,
                            message=message,
                            sender=sender,
                            conversation=conversation
                        )

                        logger.info(
                            f'[MessageWorker] Push notification sent: '
                            f'{push_result["success"]} success, {push_result["failure"]} failed'
                        )

                    except Exception as e:
                        logger.error(f'[MessageWorker] Push notification failed: {e}')
                        push_result = {'success': 0, 'failure': 0, 'error': str(e)}
                else:
                    logger.warning('[MessageWorker] Notification service not initialized')

            return {
                'success': True,
                'message_id': message_id,
                'websocket_delivered': websocket_delivered,
                'push_result': push_result,
                'user_online': bool(online)
            }

        except Exception as e:
            logger.error(f'[MessageWorker] Delivery failed: {e}', exc_info=True)
            return {'success': False, 'error': str(e)}
