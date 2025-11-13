"""
Notification Service
Handles push notifications via Firebase Cloud Messaging (FCM) and APNs
Replaces the original stub with full implementation
"""

import logging
from typing import List, Optional, Dict, Any
from datetime import datetime, timedelta

from flask import current_app
import firebase_admin
from firebase_admin import credentials, messaging

from app import db
from app.models.device import DeviceToken
from app.models.message import Message
from app.models.user import User
from app.models.conversation import Conversation

logger = logging.getLogger(__name__)


class NotificationService:
    """Service for sending push notifications"""

    def __init__(self):
        self._initialized = False
        self._app = None

    def initialize_app(self, app):
        """Initialize Firebase Admin SDK"""
        self._app = app

        try:
            # Check if already initialized
            if firebase_admin._apps:
                logger.info('[NotificationService] Firebase Admin already initialized')
                self._initialized = True
                return

            # Get credentials path from config
            cred_path = app.config.get('FIREBASE_CREDENTIALS_PATH')

            if not cred_path:
                logger.warning('[NotificationService] FIREBASE_CREDENTIALS_PATH not configured - notifications disabled')
                return

            # Initialize Firebase Admin
            cred = credentials.Certificate(cred_path)
            firebase_admin.initialize_app(cred)

            self._initialized = True
            logger.info('[NotificationService] Firebase Admin initialized successfully')

        except Exception as e:
            logger.error(f'[NotificationService] Failed to initialize Firebase Admin: {e}')
            self._initialized = False

    def is_initialized(self) -> bool:
        """Check if service is initialized"""
        return self._initialized

    def send_message_notification(
        self,
        user_id: str,
        message: Message,
        sender: User,
        conversation: Conversation
    ) -> Dict[str, Any]:
        """
        Send push notification for a new message

        Args:
            user_id: Recipient user ID
            message: Message object
            sender: Sender user object
            conversation: Conversation object

        Returns:
            Dict with success/failure stats
        """
        if not self._initialized:
            logger.warning('[NotificationService] Service not initialized, skipping notification')
            return {'success': 0, 'failure': 0, 'errors': ['Service not initialized']}

        try:
            # Get recipient's device tokens
            tokens = DeviceToken.get_active_tokens(user_id)

            if not tokens:
                logger.debug(f'[NotificationService] No active tokens for user {user_id}')
                return {'success': 0, 'failure': 0, 'errors': ['No active tokens']}

            # Check if user is online (don't spam if connected)
            from app.utils.redis_client import redis_client
            online = redis_client.get(f'user:online:{user_id}')

            if online:
                logger.debug(f'[NotificationService] User {user_id} is online, skipping notification')
                return {'success': 0, 'failure': 0, 'errors': ['User online']}

            # Build notification payload
            notification = messaging.Notification(
                title=sender.name,
                body=self._truncate_message(message.content, 100),
                image=sender.profile_photo if hasattr(sender, 'profile_photo') else None
            )

            # Build data payload
            data = {
                'type': 'new_message',
                'conversation_id': conversation.id,
                'message_id': message.id,
                'sender_id': sender.id,
                'sender_name': sender.name,
                'deep_link': f'parkdog://chat/{conversation.id}',
                'timestamp': message.created_at.isoformat(),
            }

            # Get unread count for badge
            unread_count = self._get_unread_count(user_id)

            # Prepare FCM tokens list
            fcm_tokens = [t.token for t in tokens]

            # Build multicast message
            multi_message = messaging.MulticastMessage(
                tokens=fcm_tokens,
                notification=notification,
                data=data,
                android=messaging.AndroidConfig(
                    priority='high',
                    notification=messaging.AndroidNotification(
                        channel_id='messages',
                        sound='default',
                        priority='high',
                        notification_count=unread_count,
                    ),
                    ttl=timedelta(hours=1),  # Expire after 1 hour
                ),
                apns=messaging.APNSConfig(
                    headers={
                        'apns-priority': '10',  # High priority
                        'apns-expiration': str(int((datetime.utcnow() + timedelta(hours=1)).timestamp())),
                    },
                    payload=messaging.APNSPayload(
                        aps=messaging.Aps(
                            alert=messaging.ApsAlert(
                                title=sender.name,
                                body=self._truncate_message(message.content, 100),
                            ),
                            sound='default',
                            badge=unread_count,
                            thread_id=conversation.id,  # Group notifications by conversation
                            category='MESSAGE',
                        )
                    )
                ),
            )

            # Send multicast
            response = messaging.send_multicast(multi_message)

            logger.info(
                f'[NotificationService] Sent {response.success_count} notifications, '
                f'{response.failure_count} failed for user {user_id}'
            )

            # Handle failed tokens
            if response.failure_count > 0:
                self._handle_failed_tokens(tokens, response)

            return {
                'success': response.success_count,
                'failure': response.failure_count,
                'errors': [r.exception.code if r.exception else 'Unknown' for r in response.responses if not r.success]
            }

        except Exception as e:
            logger.error(f'[NotificationService] Failed to send notification: {e}', exc_info=True)
            return {'success': 0, 'failure': len(tokens) if tokens else 0, 'errors': [str(e)]}

    def send_typing_notification(
        self,
        user_id: str,
        sender_name: str,
        conversation_id: str
    ):
        """
        Send silent notification for typing indicator (data-only)
        """
        if not self._initialized:
            return

        try:
            tokens = DeviceToken.get_active_tokens(user_id)

            if not tokens:
                return

            # Data-only message (no notification alert)
            data = {
                'type': 'typing',
                'conversation_id': conversation_id,
                'sender_name': sender_name,
            }

            fcm_tokens = [t.token for t in tokens]

            multi_message = messaging.MulticastMessage(
                tokens=fcm_tokens,
                data=data,
                android=messaging.AndroidConfig(
                    priority='normal',  # Low priority for typing
                ),
                apns=messaging.APNSConfig(
                    headers={'apns-priority': '5'},  # Normal priority
                    payload=messaging.APNSPayload(
                        aps=messaging.Aps(
                            content_available=True,  # Silent notification
                        )
                    )
                ),
            )

            messaging.send_multicast(multi_message)

        except Exception as e:
            logger.error(f'[NotificationService] Failed to send typing notification: {e}')

    def _get_unread_count(self, user_id: str) -> int:
        """Get total unread message count for badge"""
        try:
            from sqlalchemy import func, or_
            from app.models.conversation import Conversation
            from app.models.message import Message

            # Count unread messages across all conversations
            result = db.session.query(
                func.count(Message.id)
            ).join(Conversation).filter(
                or_(
                    Conversation.user1_id == user_id,
                    Conversation.user2_id == user_id
                ),
                Message.sender_id != user_id,
                Message.is_read == False,
                Message.is_deleted == False,
            ).scalar()

            return result or 0

        except Exception as e:
            logger.error(f'[NotificationService] Failed to get unread count: {e}')
            return 0

    def _handle_failed_tokens(self, tokens: List[DeviceToken], response):
        """Deactivate invalid tokens"""
        try:
            for idx, result in enumerate(response.responses):
                if not result.success and result.exception:
                    error_code = result.exception.code

                    # Deactivate token if invalid or unregistered
                    if error_code in [
                        'invalid-registration-token',
                        'registration-token-not-registered',
                        'invalid-argument',
                    ]:
                        token = tokens[idx]
                        token.is_active = False
                        logger.info(f'[NotificationService] Deactivated invalid token {token.id}: {error_code}')

            db.session.commit()

        except Exception as e:
            logger.error(f'[NotificationService] Failed to handle failed tokens: {e}')

    @staticmethod
    def _truncate_message(text: str, max_length: int = 100) -> str:
        """Truncate message for notification preview"""
        if not text:
            return ''

        if len(text) <= max_length:
            return text

        return text[:max_length - 3] + '...'

    # ========================================
    # Legacy methods (for backward compatibility)
    # ========================================

    @staticmethod
    def notify_new_match(user1_id, user2_id):
        """Notificar nuevo match mutuo (legacy stub)"""
        # TODO: Implement match notifications
        logger.info(f'Match notification: {user1_id} <-> {user2_id}')
        pass

    @staticmethod
    def notify_new_message(sender_id, receiver_id, message):
        """Notificar nuevo mensaje (legacy stub - use send_message_notification instead)"""
        logger.warning('notify_new_message is deprecated, use send_message_notification')
        pass

    @staticmethod
    def notify_upcoming_visit(user_id, visit):
        """Recordatorio de visita próxima (legacy stub)"""
        # TODO: Implement visit reminders
        logger.info(f'Visit reminder: user={user_id}')
        pass

    def test_notification(self, token: str, title: str = 'Test', body: str = 'Test notification'):
        """Send a test notification (for debugging)"""
        if not self._initialized:
            raise Exception('NotificationService not initialized')

        try:
            message = messaging.Message(
                notification=messaging.Notification(
                    title=title,
                    body=body,
                ),
                data={'type': 'test'},
                token=token,
            )

            response = messaging.send(message)
            logger.info(f'[NotificationService] Test notification sent: {response}')
            return {'success': True, 'message_id': response}

        except Exception as e:
            logger.error(f'[NotificationService] Test notification failed: {e}')
            return {'success': False, 'error': str(e)}


# Singleton instance
notification_service = NotificationService()


# Export
__all__ = ['notification_service', 'NotificationService']
