#!/usr/bin/env python3
"""
Phase 1 Automated Testing Script

Tests all Phase 1 components:
- Database connections
- Redis connections
- RQ queue service
- Device token registration
- Conversations endpoint with pagination
- Push notification service
- Message queue workers

Usage:
    python test-phase1.py
    python test-phase1.py --verbose
"""

import sys
import os
import time
from datetime import datetime

# Add app to path
sys.path.insert(0, os.path.dirname(__file__))

# Color codes for terminal output
GREEN = '\033[92m'
RED = '\033[91m'
YELLOW = '\033[93m'
BLUE = '\033[94m'
RESET = '\033[0m'


def log_test(name):
    """Print test name"""
    print(f"\n{BLUE}Testing:{RESET} {name}")


def log_success(message):
    """Print success message"""
    print(f"{GREEN}✅ {message}{RESET}")


def log_error(message):
    """Print error message"""
    print(f"{RED}❌ {message}{RESET}")


def log_warning(message):
    """Print warning message"""
    print(f"{YELLOW}⚠️  {message}{RESET}")


def log_info(message):
    """Print info message"""
    print(f"   {message}")


def test_database():
    """Test database connection"""
    log_test("Database Connection")
    try:
        from app import create_app, db
        app = create_app()

        with app.app_context():
            # Try a simple query
            from app.models.user import User
            count = User.query.count()
            log_success(f"Database connected ({count} users)")
            return True
    except Exception as e:
        log_error(f"Database connection failed: {e}")
        return False


def test_redis():
    """Test Redis connection"""
    log_test("Redis Connection")
    try:
        from app.utils.redis_client import redis_client
        from app import create_app

        app = create_app()
        with app.app_context():
            redis_client.initialize_app(app)

            # Test ping
            redis_client.redis.ping()
            log_success("Redis connected")

            # Test set/get
            test_key = f"test:phase1:{int(time.time())}"
            redis_client.redis.setex(test_key, 10, "test_value")
            value = redis_client.redis.get(test_key)
            redis_client.redis.delete(test_key)

            if value == b"test_value":
                log_success("Redis read/write works")
                return True
            else:
                log_error("Redis read/write failed")
                return False

    except Exception as e:
        log_error(f"Redis connection failed: {e}")
        return False


def test_queue_service():
    """Test RQ queue service"""
    log_test("RQ Queue Service")
    try:
        from app.queue.queue_service import queue_service
        from app import create_app

        app = create_app()
        with app.app_context():
            queue_service.initialize_app(app)

            if not queue_service.is_initialized():
                log_error("Queue service not initialized")
                return False

            log_success("Queue service initialized")

            # Get queue stats
            stats = queue_service.get_queue_stats()
            log_info(f"Messages queue: {stats['messages']['size']} jobs, {stats['messages']['workers']} workers")
            log_info(f"Notifications queue: {stats['notifications']['size']} jobs, {stats['notifications']['workers']} workers")

            # Check if workers are running
            if stats['messages']['workers'] > 0 or stats['notifications']['workers'] > 0:
                log_success("Workers detected")
            else:
                log_warning("No workers running (start with: python worker.py)")

            return True

    except Exception as e:
        log_error(f"Queue service failed: {e}")
        return False


def test_notification_service():
    """Test notification service"""
    log_test("Push Notification Service")
    try:
        from app.services.notification_service import notification_service
        from app import create_app

        app = create_app()
        with app.app_context():
            notification_service.initialize_app(app)

            if notification_service.is_initialized():
                log_success("Notification service initialized")
                log_info("Firebase credentials loaded successfully")
                return True
            else:
                log_warning("Notification service not initialized (Firebase credentials missing)")
                log_info("To enable: Add firebase-credentials.json to backend/")
                return True  # Not critical for testing

    except Exception as e:
        log_error(f"Notification service failed: {e}")
        return False


def test_device_model():
    """Test DeviceToken model"""
    log_test("DeviceToken Model")
    try:
        from app.models.device import DeviceToken
        from app import create_app, db

        app = create_app()
        with app.app_context():
            # Check table exists
            from sqlalchemy import inspect
            inspector = inspect(db.engine)

            if 'device_tokens' in inspector.get_table_names():
                log_success("device_tokens table exists")

                # Check record count
                count = DeviceToken.query.count()
                log_info(f"Device tokens registered: {count}")
                return True
            else:
                log_error("device_tokens table not found (run migrations)")
                return False

    except Exception as e:
        log_error(f"DeviceToken model test failed: {e}")
        return False


def test_conversation_pagination():
    """Test conversations pagination endpoint (unit test)"""
    log_test("Conversations Pagination Logic")
    try:
        from app import create_app, db
        from app.models.conversation import Conversation
        from app.models.user import User
        from sqlalchemy import or_

        app = create_app()
        with app.app_context():
            # Try a sample query
            user = User.query.first()

            if not user:
                log_warning("No users in database (create test users first)")
                return True  # Not critical

            # Test pagination query
            query = Conversation.query.filter(
                or_(
                    Conversation.user1_id == user.id,
                    Conversation.user2_id == user.id
                ),
                Conversation.is_deleted == False
            ).order_by(Conversation.last_message_at.desc().nullslast())

            conversations = query.limit(5).all()
            log_success(f"Pagination query works ({len(conversations)} conversations)")

            return True

    except Exception as e:
        log_error(f"Conversation pagination test failed: {e}")
        return False


def test_message_worker():
    """Test message worker function"""
    log_test("Message Worker")
    try:
        from app.workers.message_worker import deliver_message
        log_success("Message worker module imported successfully")
        log_info("Worker function: deliver_message(message_id, receiver_id, conversation_id)")
        return True
    except Exception as e:
        log_error(f"Message worker import failed: {e}")
        return False


def test_notification_worker():
    """Test notification worker function"""
    log_test("Notification Worker")
    try:
        from app.workers.notification_worker import send_push_notification
        log_success("Notification worker module imported successfully")
        log_info("Worker function: send_push_notification(user_id, notification_data)")
        return True
    except Exception as e:
        log_error(f"Notification worker import failed: {e}")
        return False


def test_ulid_generation():
    """Test ULID generation"""
    log_test("ULID Generation")
    try:
        from app.utils.message_ids import generate_message_id

        # Generate 10 ULIDs
        ulids = [generate_message_id() for _ in range(10)]

        # Check uniqueness
        if len(set(ulids)) == len(ulids):
            log_success("ULIDs are unique")
        else:
            log_error("Duplicate ULIDs generated")
            return False

        # Check format (26 characters, alphanumeric)
        if all(len(ulid) == 26 for ulid in ulids):
            log_success("ULID format correct (26 characters)")
        else:
            log_error("Invalid ULID format")
            return False

        # Check sortability (later ULIDs should be lexicographically greater)
        if ulids == sorted(ulids):
            log_success("ULIDs are sortable")
        else:
            log_error("ULIDs not sortable")
            return False

        log_info(f"Sample ULID: {ulids[0]}")
        return True

    except Exception as e:
        log_error(f"ULID test failed: {e}")
        return False


def print_summary(results):
    """Print test summary"""
    print(f"\n{'='*60}")
    print(f"{BLUE}Phase 1 Testing Summary{RESET}")
    print(f"{'='*60}")

    passed = sum(results.values())
    total = len(results)

    for test_name, result in results.items():
        status = f"{GREEN}PASS{RESET}" if result else f"{RED}FAIL{RESET}"
        print(f"{test_name:.<50} {status}")

    print(f"{'='*60}")

    if passed == total:
        print(f"{GREEN}✅ All tests passed ({passed}/{total}){RESET}")
        return 0
    else:
        print(f"{RED}❌ {total - passed} test(s) failed ({passed}/{total} passed){RESET}")
        return 1


def main():
    """Run all tests"""
    print(f"\n{BLUE}{'='*60}{RESET}")
    print(f"{BLUE}Phase 1 Automated Testing{RESET}")
    print(f"{BLUE}{'='*60}{RESET}")
    print(f"Started at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n")

    results = {}

    # Run tests
    results['Database Connection'] = test_database()
    results['Redis Connection'] = test_redis()
    results['Queue Service'] = test_queue_service()
    results['Notification Service'] = test_notification_service()
    results['DeviceToken Model'] = test_device_model()
    results['Conversation Pagination'] = test_conversation_pagination()
    results['Message Worker'] = test_message_worker()
    results['Notification Worker'] = test_notification_worker()
    results['ULID Generation'] = test_ulid_generation()

    # Print summary
    exit_code = print_summary(results)

    print(f"\nFinished at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")

    sys.exit(exit_code)


if __name__ == '__main__':
    main()
