#!/usr/bin/env python
"""
RQ Worker Daemon
Processes background jobs from Redis queues

Usage:
    # Start worker for all queues
    python worker.py

    # Start worker for specific queue
    python worker.py --queue messages

    # Start with verbose logging
    python worker.py --verbose

    # Production mode with supervisord
    supervisord -c supervisord.conf
"""

import sys
import os
import logging
import signal
from rq import Worker, Queue, Connection
from redis import Redis

# Add app to path
sys.path.insert(0, os.path.dirname(__file__))

from app import create_app
from app.workers import deliver_message, send_push_notification

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='[%(asctime)s] %(levelname)s in %(module)s: %(message)s',
    handlers=[
        logging.StreamHandler(sys.stdout),
        logging.FileHandler('logs/worker.log')
    ]
)

logger = logging.getLogger(__name__)


def signal_handler(signum, frame):
    """Handle shutdown signals gracefully"""
    logger.info(f"Received signal {signum}, shutting down worker...")
    sys.exit(0)


def run_worker(queue_names=None, verbose=False):
    """
    Run RQ worker

    Args:
        queue_names: List of queue names to process (default: ['messages', 'notifications'])
        verbose: Enable verbose logging
    """
    # Create Flask app context
    app = create_app()

    with app.app_context():
        # Setup Redis connection
        redis_url = os.environ.get('REDIS_URL', 'redis://localhost:6379/0')
        redis_conn = Redis.from_url(redis_url)

        # Default queues
        if queue_names is None:
            queue_names = ['messages', 'notifications']

        # Create queue objects
        queues = [Queue(name, connection=redis_conn) for name in queue_names]

        logger.info(f"Starting worker for queues: {queue_names}")
        logger.info(f"Redis URL: {redis_url}")

        # Setup signal handlers
        signal.signal(signal.SIGTERM, signal_handler)
        signal.signal(signal.SIGINT, signal_handler)

        # Create and run worker
        worker = Worker(
            queues,
            connection=redis_conn,
            log_job_description=verbose,
            name=f"worker-{os.getpid()}"
        )

        try:
            logger.info("Worker started successfully")
            worker.work(with_scheduler=True, logging_level='INFO' if verbose else 'WARNING')
        except Exception as e:
            logger.error(f"Worker error: {e}", exc_info=True)
            sys.exit(1)


if __name__ == '__main__':
    import argparse

    parser = argparse.ArgumentParser(description='RQ Worker for message processing')
    parser.add_argument(
        '--queue',
        '-q',
        action='append',
        dest='queues',
        help='Queue name to process (can be specified multiple times)'
    )
    parser.add_argument(
        '--verbose',
        '-v',
        action='store_true',
        help='Enable verbose logging'
    )

    args = parser.parse_args()

    # Ensure logs directory exists
    os.makedirs('logs', exist_ok=True)

    # Run worker
    run_worker(queue_names=args.queues, verbose=args.verbose)
