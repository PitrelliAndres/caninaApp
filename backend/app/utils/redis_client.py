"""Redis client with DEV fallbacks and PROD pub/sub capabilities."""
import os
import json
import logging
from typing import Optional, Dict, Any, List
from datetime import datetime, timedelta

try:
    import redis
    from redis.exceptions import ConnectionError, RedisError
    REDIS_AVAILABLE = True
except ImportError:
    REDIS_AVAILABLE = False
    # Mock Redis for development
    class MockRedis:
        @staticmethod
        def from_url(*args, **kwargs):
            return None
    redis = MockRedis()

logger = logging.getLogger(__name__)

class RedisClient:
    """Redis client with in-memory fallback for DEV."""
    
    def __init__(self):
        self.redis_client = None
        self.pubsub = None
        self.is_development = os.environ.get('FLASK_ENV', 'development') == 'development'
        
        # Fallback in-memory storage for development
        self._memory_store = {}
        self._memory_pubsub = {}
        self._presence = {}
        
        self._initialize_redis()
    
    def _initialize_redis(self):
        """Initialize Redis connection with fallback"""
        if not REDIS_AVAILABLE:
            if not self.is_development:
                # TODO: PRODUCTION - Redis is required in production
                logger.error("Redis is required for production. Install: pip install redis")
                raise RuntimeError("Redis required for production")
            else:
                logger.warning("Redis not available, using in-memory fallback for development")
                return
        
        try:
            redis_url = os.environ.get('REDIS_URL', 'redis://localhost:6379/0')
            self.redis_client = redis.from_url(redis_url, decode_responses=True)
            
            # Test connection
            self.redis_client.ping()
            self.pubsub = self.redis_client.pubsub()
            logger.info("Redis connected successfully")
            
        except (ConnectionError, RedisError) as e:
            if not self.is_development:
                # TODO: PRODUCTION - Redis connection must work in production
                logger.error(f"Redis connection failed in production: {e}")
                raise
            else:
                logger.warning(f"Redis connection failed, using fallback: {e}")
                self.redis_client = None
    
    def is_connected(self) -> bool:
        """Check if Redis is connected"""
        if not self.redis_client:
            return False
        try:
            self.redis_client.ping()
            return True
        except:
            return False
    
    # Pub/Sub operations
    def publish(self, channel: str, message: Dict[str, Any]):
        """Publish message to channel"""
        try:
            if self.redis_client:
                self.redis_client.publish(channel, json.dumps(message))
                return True
            else:
                # Development fallback - store in memory
                if channel not in self._memory_pubsub:
                    self._memory_pubsub[channel] = []
                self._memory_pubsub[channel].append(message)
                logger.debug(f"Published to memory channel {channel}: {message}")
                return True
                
        except Exception as e:
            logger.error(f"Publish failed: {e}")
            return False
    
    def subscribe(self, channels: List[str]):
        """Subscribe to channels"""
        try:
            if self.pubsub:
                self.pubsub.subscribe(*channels)
                return self.pubsub
            else:
                # Development fallback - return mock pubsub
                logger.debug(f"Subscribed to memory channels: {channels}")
                return MockPubSub(self._memory_pubsub, channels)
                
        except Exception as e:
            logger.error(f"Subscribe failed: {e}")
            return None
    
    # Presence system
    def set_user_online(self, user_id: int, socket_id: str = None):
        """Set user as online"""
        try:
            if self.redis_client:
                key = f"presence:user:{user_id}"
                data = {
                    'online': True,
                    'last_seen': datetime.utcnow().isoformat(),
                    'socket_id': socket_id
                }
                self.redis_client.setex(key, 3600, json.dumps(data))  # 1 hour TTL
            else:
                # Development fallback
                self._presence[user_id] = {
                    'online': True,
                    'last_seen': datetime.utcnow().isoformat(),
                    'socket_id': socket_id
                }
                
        except Exception as e:
            logger.error(f"Set user online failed: {e}")
    
    def set_user_offline(self, user_id: int):
        """Set user as offline"""
        try:
            if self.redis_client:
                key = f"presence:user:{user_id}"
                self.redis_client.delete(key)
            else:
                # Development fallback
                self._presence.pop(user_id, None)
                
        except Exception as e:
            logger.error(f"Set user offline failed: {e}")
    
    def is_user_online(self, user_id: int) -> bool:
        """Check if user is online"""
        try:
            if self.redis_client:
                key = f"presence:user:{user_id}"
                return self.redis_client.exists(key) == 1
            else:
                # Development fallback
                return user_id in self._presence
                
        except Exception as e:
            logger.error(f"Check user online failed: {e}")
            return False
    
    def get_online_users(self) -> List[int]:
        """Get list of online user IDs"""
        try:
            if self.redis_client:
                keys = self.redis_client.keys("presence:user:*")
                return [int(key.split(":")[-1]) for key in keys]
            else:
                # Development fallback
                return list(self._presence.keys())
                
        except Exception as e:
            logger.error(f"Get online users failed: {e}")
            return []
    
    # Socket-User mapping for SocketIO sessions
    def set_socket_user(self, socket_id: str, user_id: int):
        """Map socket_id to user_id"""
        try:
            if self.redis_client:
                key = f"socket:user:{socket_id}"
                self.redis_client.setex(key, 7200, str(user_id))  # 2 hours TTL
            else:
                # Development fallback
                if not hasattr(self, '_socket_users'):
                    self._socket_users = {}
                self._socket_users[socket_id] = user_id
                
        except Exception as e:
            logger.error(f"Set socket user failed: {e}")
    
    def get_socket_user(self, socket_id: str) -> Optional[int]:
        """Get user_id from socket_id"""
        try:
            if self.redis_client:
                key = f"socket:user:{socket_id}"
                user_id_str = self.redis_client.get(key)
                return int(user_id_str) if user_id_str else None
            else:
                # Development fallback
                if not hasattr(self, '_socket_users'):
                    self._socket_users = {}
                return self._socket_users.get(socket_id)
                
        except Exception as e:
            logger.error(f"Get socket user failed: {e}")
            return None
    
    def remove_socket_user(self, socket_id: str):
        """Remove socket_id to user_id mapping"""
        try:
            if self.redis_client:
                key = f"socket:user:{socket_id}"
                self.redis_client.delete(key)
            else:
                # Development fallback
                if hasattr(self, '_socket_users'):
                    self._socket_users.pop(socket_id, None)
                
        except Exception as e:
            logger.error(f"Remove socket user failed: {e}")
    
    # Rate limiting
    def check_rate_limit(self, key: str, limit: int, window: int) -> bool:
        """Check rate limit (requests per window in seconds)"""
        try:
            if self.redis_client:
                pipe = self.redis_client.pipeline()
                pipe.incr(key)
                pipe.expire(key, window)
                results = pipe.execute()
                
                current_count = results[0]
                return current_count <= limit
            else:
                # Development fallback - very permissive
                # TODO: PRODUCTION - Implement proper rate limiting
                logger.debug(f"Rate limit check (dev mode): {key} - always allowing")
                return True
                
        except Exception as e:
            logger.error(f"Rate limit check failed: {e}")
            # Fail open in case of Redis issues
            return True
    
    # Chat rooms
    def join_room(self, room: str, user_id: int):
        """Add user to room"""
        try:
            if self.redis_client:
                self.redis_client.sadd(f"room:{room}", user_id)
            else:
                # Development fallback
                if room not in self._memory_store:
                    self._memory_store[room] = set()
                self._memory_store[room].add(user_id)
                
        except Exception as e:
            logger.error(f"Join room failed: {e}")
    
    def leave_room(self, room: str, user_id: int):
        """Remove user from room"""
        try:
            if self.redis_client:
                self.redis_client.srem(f"room:{room}", user_id)
            else:
                # Development fallback
                if room in self._memory_store:
                    self._memory_store[room].discard(user_id)
                    
        except Exception as e:
            logger.error(f"Leave room failed: {e}")
    
    def get_room_users(self, room: str) -> List[int]:
        """Get users in room"""
        try:
            if self.redis_client:
                users = self.redis_client.smembers(f"room:{room}")
                return [int(u) for u in users]
            else:
                # Development fallback
                return list(self._memory_store.get(room, set()))
                
        except Exception as e:
            logger.error(f"Get room users failed: {e}")
            return []


class MockPubSub:
    """Mock PubSub for development fallback"""
    
    def __init__(self, memory_store: Dict, channels: List[str]):
        self.memory_store = memory_store
        self.channels = channels
        self.message_index = {channel: 0 for channel in channels}
    
    def get_message(self, timeout=1):
        """Get next message from subscribed channels"""
        for channel in self.channels:
            if channel in self.memory_store:
                messages = self.memory_store[channel]
                current_index = self.message_index[channel]
                
                if current_index < len(messages):
                    message = messages[current_index]
                    self.message_index[channel] += 1
                    
                    return {
                        'type': 'message',
                        'channel': channel,
                        'data': json.dumps(message)
                    }
        
        return None


# Global Redis client instance
redis_client = RedisClient()