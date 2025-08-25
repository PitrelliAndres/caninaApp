"""
Cliente Redis optimizado para Socket.IO
- Pool de conexiones eficiente
- Pub/Sub para eventos en tiempo real
- Caché de presencia de usuarios
- Rate limiting distribuido
- Gestión de memoria optimizada
"""
import os
import json
import redis
import logging
from typing import Optional, Dict, Any, List
from datetime import datetime, timedelta
import threading
from contextlib import contextmanager

logger = logging.getLogger(__name__)

class OptimizedRedisClient:
    """
    Cliente Redis optimizado para aplicaciones de chat en tiempo real
    """
    
    def __init__(self):
        self._pool = None
        self._pubsub = None
        self._connection = None
        self._lock = threading.Lock()
        self._initialized = False
        
    def initialize(self, redis_url: Optional[str] = None) -> bool:
        """
        Inicializar cliente Redis con configuración optimizada
        """
        if self._initialized:
            return True
            
        try:
            redis_url = redis_url or os.environ.get('REDIS_URL', 'redis://localhost:6379/0')
            
            # Pool de conexiones optimizado para chat
            self._pool = redis.ConnectionPool.from_url(
                redis_url,
                # Configuración del pool optimizada
                max_connections=100,          # Conexiones máximas
                connection_class=redis.Connection,
                retry_on_timeout=True,
                socket_keepalive=True,
                socket_keepalive_options={
                    1: 300,   # TCP_KEEPIDLE - tiempo antes del primer keepalive
                    2: 30,    # TCP_KEEPINTVL - intervalo entre keepalives
                    3: 5,     # TCP_KEEPCNT - número de keepalives antes de timeout
                },
                health_check_interval=60,    # Health check cada minuto
                socket_connect_timeout=10,   # Timeout de conexión
                socket_timeout=30,           # Timeout de socket
            )
            
            # Cliente principal
            self._connection = redis.Redis(
                connection_pool=self._pool,
                decode_responses=True,
                socket_timeout=30,
                socket_connect_timeout=10,
                retry_on_timeout=True,
                health_check_interval=60,
            )
            
            # Test de conexión
            self._connection.ping()
            
            # Configurar pipeline de pub/sub para eventos en tiempo real
            self._setup_pubsub()
            
            self._initialized = True
            logger.info("✅ Redis client optimizado inicializado correctamente")
            return True
            
        except Exception as e:
            logger.error(f"❌ Error inicializando Redis: {e}")
            self._initialized = False
            return False
    
    def _setup_pubsub(self):
        """
        Configurar Pub/Sub para eventos en tiempo real
        """
        try:
            self._pubsub = self._connection.pubsub()
            
            # Canales para eventos en tiempo real
            channels = [
                'user_presence',        # Online/offline events
                'new_message',         # Nuevos mensajes
                'messages_read',       # Mensajes leídos
                'typing_events',       # Typing indicators
                'dm_new_message',      # DM específicos
                'connection_events',   # Eventos de conexión
            ]
            
            for channel in channels:
                self._pubsub.subscribe(channel)
                
            logger.info(f"📡 Pub/Sub configurado para {len(channels)} canales")
            
        except Exception as e:
            logger.error(f"Error configurando Pub/Sub: {e}")
    
    @contextmanager
    def get_connection(self):
        """
        Context manager para obtener conexión del pool
        """
        if not self._initialized:
            if not self.initialize():
                raise RuntimeError("Redis no inicializado")
        
        connection = None
        try:
            connection = self._connection
            yield connection
        finally:
            # El pool maneja automáticamente el retorno de conexiones
            pass
    
    # === PRESENCE MANAGEMENT ===
    
    def set_user_online(self, user_id: int, socket_id: str, ttl: int = 3600) -> bool:
        """
        Marcar usuario como online con TTL automático
        """
        try:
            with self.get_connection() as redis:
                pipe = redis.pipeline()
                
                # Set presence con TTL
                presence_key = f"presence:{user_id}"
                pipe.setex(presence_key, ttl, json.dumps({
                    'status': 'online',
                    'socket_id': socket_id,
                    'last_seen': datetime.utcnow().isoformat(),
                    'platform': 'web'  # TODO: detectar plataforma
                }))
                
                # Mapeo socket -> user
                socket_key = f"socket:{socket_id}"
                pipe.setex(socket_key, ttl, user_id)
                
                # Lista de usuarios online (set)
                pipe.sadd('online_users', user_id)
                pipe.expire('online_users', ttl)
                
                pipe.execute()
                return True
                
        except Exception as e:
            logger.error(f"Error setting user online: {e}")
            return False
    
    def set_user_offline(self, user_id: int) -> bool:
        """
        Marcar usuario como offline
        """
        try:
            with self.get_connection() as redis:
                pipe = redis.pipeline()
                
                # Update presence
                presence_key = f"presence:{user_id}"
                pipe.setex(presence_key, 300, json.dumps({  # 5 min cache for offline
                    'status': 'offline',
                    'last_seen': datetime.utcnow().isoformat()
                }))
                
                # Remove from online users
                pipe.srem('online_users', user_id)
                
                pipe.execute()
                return True
                
        except Exception as e:
            logger.error(f"Error setting user offline: {e}")
            return False
    
    def is_user_online(self, user_id: int) -> bool:
        """
        Verificar si usuario está online (más rápido que DB)
        """
        try:
            with self.get_connection() as redis:
                presence_key = f"presence:{user_id}"
                presence_data = redis.get(presence_key)
                
                if not presence_data:
                    return False
                    
                presence = json.loads(presence_data)
                return presence.get('status') == 'online'
                
        except Exception as e:
            logger.error(f"Error checking user online status: {e}")
            return False
    
    def get_online_users(self) -> List[int]:
        """
        Obtener lista de usuarios online
        """
        try:
            with self.get_connection() as redis:
                online_users = redis.smembers('online_users')
                return [int(uid) for uid in online_users if uid.isdigit()]
        except Exception as e:
            logger.error(f"Error getting online users: {e}")
            return []
    
    # === SOCKET MANAGEMENT ===
    
    def set_socket_user(self, socket_id: str, user_id: int, ttl: int = 3600) -> bool:
        """
        Asociar socket_id con user_id
        """
        try:
            with self.get_connection() as redis:
                socket_key = f"socket:{socket_id}"
                redis.setex(socket_key, ttl, user_id)
                return True
        except Exception as e:
            logger.error(f"Error setting socket user: {e}")
            return False
    
    def get_socket_user(self, socket_id: str) -> Optional[int]:
        """
        Obtener user_id de un socket_id
        """
        try:
            with self.get_connection() as redis:
                socket_key = f"socket:{socket_id}"
                user_id = redis.get(socket_key)
                return int(user_id) if user_id else None
        except Exception as e:
            logger.error(f"Error getting socket user: {e}")
            return None
    
    def remove_socket_user(self, socket_id: str) -> bool:
        """
        Remover asociación socket -> user
        """
        try:
            with self.get_connection() as redis:
                socket_key = f"socket:{socket_id}"
                redis.delete(socket_key)
                return True
        except Exception as e:
            logger.error(f"Error removing socket user: {e}")
            return False
    
    # === RATE LIMITING ===
    
    def check_rate_limit(self, key: str, limit: int, window: int) -> bool:
        """
        Rate limiting usando sliding window (más preciso que fixed window)
        """
        try:
            with self.get_connection() as redis:
                now = datetime.utcnow().timestamp()
                window_start = now - window
                
                pipe = redis.pipeline()
                
                # Remover entradas fuera del window
                pipe.zremrangebyscore(key, 0, window_start)
                
                # Contar requests en el window actual
                pipe.zcard(key)
                
                # Agregar request actual
                pipe.zadd(key, {str(now): now})
                
                # Set TTL
                pipe.expire(key, window + 10)
                
                results = pipe.execute()
                current_count = results[1]
                
                return current_count < limit
                
        except Exception as e:
            logger.error(f"Error checking rate limit: {e}")
            return True  # Permitir en caso de error
    
    # === PUB/SUB para eventos en tiempo real ===
    
    def publish(self, channel: str, data: Dict[str, Any]) -> bool:
        """
        Publicar evento en canal Pub/Sub
        """
        try:
            with self.get_connection() as redis:
                message = json.dumps(data, default=str)  # default=str para datetime
                redis.publish(channel, message)
                return True
        except Exception as e:
            logger.error(f"Error publishing to {channel}: {e}")
            return False
    
    def subscribe_to_events(self, callback):
        """
        Suscribirse a eventos en tiempo real (para workers)
        """
        if not self._pubsub:
            logger.error("Pub/Sub no inicializado")
            return
            
        try:
            for message in self._pubsub.listen():
                if message['type'] == 'message':
                    try:
                        data = json.loads(message['data'])
                        callback(message['channel'], data)
                    except json.JSONDecodeError as e:
                        logger.error(f"Error parsing Pub/Sub message: {e}")
                        
        except Exception as e:
            logger.error(f"Error en Pub/Sub listener: {e}")
    
    # === CONVERSATION CACHING ===
    
    def cache_conversation_users(self, conversation_id: int, user_ids: List[int], ttl: int = 1800) -> bool:
        """
        Cachear usuarios de una conversación (30 min TTL)
        """
        try:
            with self.get_connection() as redis:
                key = f"conv_users:{conversation_id}"
                redis.setex(key, ttl, json.dumps(user_ids))
                return True
        except Exception as e:
            logger.error(f"Error caching conversation users: {e}")
            return False
    
    def get_conversation_users(self, conversation_id: int) -> Optional[List[int]]:
        """
        Obtener usuarios de conversación desde caché
        """
        try:
            with self.get_connection() as redis:
                key = f"conv_users:{conversation_id}"
                data = redis.get(key)
                return json.loads(data) if data else None
        except Exception as e:
            logger.error(f"Error getting cached conversation users: {e}")
            return None
    
    # === HEALTH CHECK ===
    
    def health_check(self) -> Dict[str, Any]:
        """
        Health check del cliente Redis
        """
        try:
            if not self._initialized:
                return {'status': 'error', 'message': 'No inicializado'}
            
            start_time = datetime.utcnow()
            
            with self.get_connection() as redis:
                # Test ping
                redis.ping()
                
                # Test basic operations
                test_key = 'health_check_test'
                redis.setex(test_key, 10, 'test')
                value = redis.get(test_key)
                redis.delete(test_key)
                
                if value != 'test':
                    raise Exception("Test de lectura/escritura falló")
            
            latency = (datetime.utcnow() - start_time).total_seconds() * 1000
            
            return {
                'status': 'healthy',
                'latency_ms': round(latency, 2),
                'pool_size': self._pool.max_connections if self._pool else 0,
                'timestamp': datetime.utcnow().isoformat()
            }
            
        except Exception as e:
            return {
                'status': 'error',
                'message': str(e),
                'timestamp': datetime.utcnow().isoformat()
            }
    
    def close(self):
        """
        Cerrar conexiones Redis
        """
        try:
            if self._pubsub:
                self._pubsub.close()
            if self._pool:
                self._pool.disconnect()
            self._initialized = False
            logger.info("✅ Redis client cerrado correctamente")
        except Exception as e:
            logger.error(f"Error cerrando Redis client: {e}")

# Instancia global del cliente optimizado
redis_client = OptimizedRedisClient()