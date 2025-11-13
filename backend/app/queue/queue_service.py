"""
Queue Service
Handles async message processing using RQ (Redis Queue)
"""

import logging
from typing import Optional, Dict, Any
from redis import Redis
from rq import Queue, Retry
from flask import current_app

logger = logging.getLogger(__name__)


class QueueService:
    """Service for managing async job queues"""

    def __init__(self):
        self._redis = None
        self._message_queue = None
        self._notification_queue = None
        self._initialized = False

    def initialize_app(self, app):
        """Initialize RQ with Redis connection"""
        try:
            redis_url = app.config.get('REDIS_URL', 'redis://localhost:6379/0')

            # Create Redis connection
            self._redis = Redis.from_url(
                redis_url,
                decode_responses=False,  # RQ needs bytes
                socket_keepalive=True,
                socket_keepalive_options={
                    6: 60,   # TCP_KEEPIDLE
                    5: 10,   # TCP_KEEPINTVL
                    4: 3     # TCP_KEEPCNT
                },
                health_check_interval=30
            )

            # Create queues
            self._message_queue = Queue('messages', connection=self._redis, default_timeout='30s')
            self._notification_queue = Queue('notifications', connection=self._redis, default_timeout='15s')

            self._initialized = True
            logger.info('[QueueService] Initialized successfully with Redis')

        except Exception as e:
            logger.error(f'[QueueService] Failed to initialize: {e}')
            self._initialized = False

    def is_initialized(self) -> bool:
        """Check if service is initialized"""
        return self._initialized

    def enqueue_message_delivery(
        self,
        message_id: str,
        receiver_id: str,
        conversation_id: str
    ) -> Optional[str]:
        """
        Queue message for async delivery (WebSocket + Push)

        Args:
            message_id: Message ULID
            receiver_id: Recipient user ID
            conversation_id: Conversation ID

        Returns:
            Job ID or None if failed
        """
        if not self._initialized:
            logger.warning('[QueueService] Not initialized, skipping message delivery queue')
            return None

        try:
            job = self._message_queue.enqueue(
                'app.workers.message_worker.deliver_message',
                message_id=message_id,
                receiver_id=receiver_id,
                conversation_id=conversation_id,
                job_timeout='30s',
                retry=Retry(max=3, interval=[10, 30, 60])  # Exponential backoff
            )

            logger.info(f'[QueueService] Queued message delivery: {message_id} (job: {job.id})')
            return job.id

        except Exception as e:
            logger.error(f'[QueueService] Failed to queue message delivery: {e}')
            return None

    def enqueue_push_notification(
        self,
        user_id: str,
        notification_data: Dict[str, Any]
    ) -> Optional[str]:
        """
        Queue push notification for async sending

        Args:
            user_id: Target user ID
            notification_data: Notification payload

        Returns:
            Job ID or None if failed
        """
        if not self._initialized:
            logger.warning('[QueueService] Not initialized, skipping notification queue')
            return None

        try:
            job = self._notification_queue.enqueue(
                'app.workers.notification_worker.send_push_notification',
                user_id=user_id,
                notification_data=notification_data,
                job_timeout='15s',
                retry=Retry(max=2, interval=[5, 15])  # Limited retries for notifications
            )

            logger.info(f'[QueueService] Queued push notification for user {user_id} (job: {job.id})')
            return job.id

        except Exception as e:
            logger.error(f'[QueueService] Failed to queue push notification: {e}')
            return None

    def get_queue_stats(self) -> Dict[str, Any]:
        """Get queue statistics"""
        if not self._initialized:
            return {'initialized': False}

        try:
            return {
                'initialized': True,
                'messages': {
                    'pending': len(self._message_queue),
                    'started': self._message_queue.started_job_registry.count,
                    'finished': self._message_queue.finished_job_registry.count,
                    'failed': self._message_queue.failed_job_registry.count,
                },
                'notifications': {
                    'pending': len(self._notification_queue),
                    'started': self._notification_queue.started_job_registry.count,
                    'finished': self._notification_queue.finished_job_registry.count,
                    'failed': self._notification_queue.failed_job_registry.count,
                }
            }
        except Exception as e:
            logger.error(f'[QueueService] Failed to get queue stats: {e}')
            return {'initialized': True, 'error': str(e)}

    def get_job_status(self, job_id: str) -> Optional[Dict[str, Any]]:
        """Get status of a specific job"""
        if not self._initialized:
            return None

        try:
            from rq.job import Job

            job = Job.fetch(job_id, connection=self._redis)

            return {
                'id': job.id,
                'status': job.get_status(),
                'created_at': job.created_at.isoformat() if job.created_at else None,
                'started_at': job.started_at.isoformat() if job.started_at else None,
                'ended_at': job.ended_at.isoformat() if job.ended_at else None,
                'result': job.result,
                'exc_info': job.exc_info,
            }
        except Exception as e:
            logger.error(f'[QueueService] Failed to get job status: {e}')
            return None


# Singleton instance
queue_service = QueueService()


# Export
__all__ = ['queue_service', 'QueueService']
