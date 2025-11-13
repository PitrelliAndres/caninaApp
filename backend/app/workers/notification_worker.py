"""
Notification Worker
Processes push notification jobs from the queue
"""

import logging
from app import create_app
from app.models.user import User
from app.models.conversation import Conversation
from app.services.notification_service import notification_service

logger = logging.getLogger(__name__)

# Create app context for workers
app = create_app()


def send_push_notification(user_id: str, notification_data: dict):
    """
    Worker function to send push notification

    This runs asynchronously in a worker process.

    Args:
        user_id: Target user ID
        notification_data: Notification payload with keys:
            - type: 'message' | 'typing' | 'match' | 'custom'
            - title: Notification title
            - body: Notification body
            - data: Additional data payload

    Returns:
        Dict with delivery stats
    """
    with app.app_context():
        try:
            notification_type = notification_data.get('type', 'custom')

            if not notification_service.is_initialized():
                logger.warning('[NotificationWorker] Notification service not initialized')
                return {'success': False, 'error': 'Service not initialized'}

            # Handle different notification types
            if notification_type == 'message':
                # Message notification (already sent via message_worker)
                # This is a fallback path
                logger.info(f'[NotificationWorker] Skipping message notification (handled by message_worker)')
                return {'success': True, 'skipped': True}

            elif notification_type == 'typing':
                # Typing indicator notification
                sender_name = notification_data.get('sender_name')
                conversation_id = notification_data.get('conversation_id')

                if not sender_name or not conversation_id:
                    return {'success': False, 'error': 'Missing sender_name or conversation_id'}

                result = notification_service.send_typing_notification(
                    user_id=user_id,
                    sender_name=sender_name,
                    conversation_id=conversation_id
                )

                logger.info(
                    f'[NotificationWorker] Typing notification sent: '
                    f'{result["success"]} success, {result["failure"]} failed'
                )
                return result

            elif notification_type == 'match':
                # New match notification
                title = notification_data.get('title', 'New Match!')
                body = notification_data.get('body', 'You have a new match')
                data = notification_data.get('data', {})

                # Use generic notification method
                result = notification_service.send_notification(
                    user_id=user_id,
                    title=title,
                    body=body,
                    data=data
                )

                logger.info(
                    f'[NotificationWorker] Match notification sent: '
                    f'{result["success"]} success, {result["failure"]} failed'
                )
                return result

            elif notification_type == 'custom':
                # Custom notification
                title = notification_data.get('title', 'Notification')
                body = notification_data.get('body', '')
                data = notification_data.get('data', {})

                result = notification_service.send_notification(
                    user_id=user_id,
                    title=title,
                    body=body,
                    data=data
                )

                logger.info(
                    f'[NotificationWorker] Custom notification sent: '
                    f'{result["success"]} success, {result["failure"]} failed'
                )
                return result

            else:
                logger.error(f'[NotificationWorker] Unknown notification type: {notification_type}')
                return {'success': False, 'error': f'Unknown type: {notification_type}'}

        except Exception as e:
            logger.error(f'[NotificationWorker] Notification failed: {e}', exc_info=True)
            return {'success': False, 'error': str(e)}
