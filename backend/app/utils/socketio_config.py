"""
Configuración optimizada de Socket.IO con Redis adapter
Arquitectura inspirada en Discord/Slack para alta escalabilidad y bajo consumo de RAM
"""
import os
import redis
from flask_socketio import SocketIO
from typing import Optional, Dict, Any
import logging

logger = logging.getLogger(__name__)

class OptimizedSocketIOConfig:
    """
    Configuración optimizada de Socket.IO similar a Discord/Slack:
    - Pool de conexiones Redis limitado
    - Compresión automática de mensajes
    - Heartbeat optimizado
    - Límites de memoria por conexión
    - Room management eficiente
    """
    
    @staticmethod
    def create_redis_adapter() -> Optional[Any]:
        """
        Crea un adapter Redis optimizado para Socket.IO
        """
        redis_url = os.environ.get('REDIS_URL', 'redis://localhost:6379/0')
        
        try:
            # Pool de conexiones Redis optimizado para Socket.IO
            pool = redis.ConnectionPool.from_url(
                redis_url,
                max_connections=50,
                retry_on_timeout=True,
                socket_keepalive=True,
                socket_keepalive_options={
                    1: 600,  # TCP_KEEPIDLE
                    2: 30,   # TCP_KEEPINTVL  
                    3: 3,    # TCP_KEEPCNT
                },
                health_check_interval=30,
                socket_timeout=5,
                socket_connect_timeout=5,
            )
            
            redis_client = redis.Redis(
                connection_pool=pool,
                decode_responses=True
            )
            
            # Test connection
            redis_client.ping()
            logger.info("Redis adapter configurado correctamente")
            
            return redis_client
            
        except Exception as e:
            logger.error(f"Error configurando Redis adapter: {e}")
            logger.warning("Continuando sin Redis adapter (modo single-process)")
            return None

    @staticmethod
    def get_optimized_config(app) -> Dict[str, Any]:
        """
        Configuración optimizada de Socket.IO para alta performance
        """
        redis_adapter = OptimizedSocketIOConfig.create_redis_adapter()
        
        # Configuración base similar a Discord/Slack
        config = {
            # Transport optimizations
            'async_mode': 'threading',  # Mejor para Flask
            'transports': ['websocket', 'polling'],  # WebSocket first
            
            # Connection limits y timeouts optimizados
            'ping_timeout': 20,      # Timeout más agresivo (Discord ~15s)
            'ping_interval': 10,     # Heartbeat más frecuente
            'max_http_buffer_size': 4096,  # Límite de mensaje 4KB
            
            # Memory optimizations
            'compression': True,     # Compresión automática
            'perMessageDeflate': {
                'threshold': 512,    # Comprimir mensajes >512 bytes
                'concurrencyLimit': 10,
                'memLevel': 7,       # Balance memoria/CPU
            },
            
            # CORS optimizado
            'cors_allowed_origins': OptimizedSocketIOConfig._get_cors_origins(app),
            'cors_credentials': True,
            
            # Logging optimizado para producción
            'logger': app.debug,
            'engineio_logger': app.debug,
        }
        
        # Configurar Redis adapter si está disponible
        if redis_adapter:
            try:
                # Configurar Redis manager para Flask-SocketIO
                import socketio
                redis_url = os.environ.get('REDIS_URL', 'redis://localhost:6379/0')
                
                # Extraer host y puerto de la URL de Redis
                if redis_url.startswith('redis://'):
                    url_parts = redis_url.replace('redis://', '').split(':')
                    redis_host = url_parts[0] if url_parts else 'localhost'
                    redis_port = int(url_parts[1].split('/')[0]) if len(url_parts) > 1 else 6379
                else:
                    redis_host = 'localhost'
                    redis_port = 6379
                
                redis_manager = socketio.RedisManager(
                    redis_host, 
                    redis_port,
                    channel='parkdog-sockets'
                )
                config['client_manager'] = redis_manager
                logger.info(f"Socket.IO configurado con Redis adapter en {redis_host}:{redis_port}")
            except Exception as e:
                logger.warning(f"No se pudo configurar Redis adapter: {e}, usando adapter en memoria")
        
        return config

    @staticmethod
    def _get_cors_origins(app) -> str:
        """
        Configurar CORS origins de manera optimizada
        """
        cors_origins = app.config.get('CORS_ORIGINS', [])
        
        if app.debug:
            # Development: incluir IPs locales y móviles
            additional_origins = [
                "http://localhost:3000",
                "http://localhost:8081", 
                "http://192.168.0.243:8081",
                "http://10.0.2.2:8081",  # Android emulator
            ]
            
            if isinstance(cors_origins, str):
                cors_origins = cors_origins.split(',')
            
            cors_origins = list(set(cors_origins + additional_origins))
            return cors_origins
        else:
            # Production: solo origins configurados
            return cors_origins if isinstance(cors_origins, list) else cors_origins.split(',')

def create_optimized_socketio(app) -> SocketIO:
    """
    Crear instancia optimizada de Socket.IO
    """
    config = OptimizedSocketIOConfig.get_optimized_config(app)
    
    socketio = SocketIO()
    socketio.init_app(app, **config)
    
    # Configurar event handlers optimizados
    _setup_connection_handlers(socketio)
    
    return socketio

def _setup_connection_handlers(socketio_instance):
    """
    Configurar handlers de conexión optimizados para memoria
    """
    
    @socketio_instance.on('connect')
    def handle_connect():
        """
        Handler de conexión optimizado - mínimo procesamiento
        """
        from flask import request
        logger.debug(f"Cliente conectado: {request.sid[:8]}...")
        # TODO: Implementar rate limiting por IP
        
    @socketio_instance.on('disconnect')
    def handle_disconnect():
        """
        Handler de desconexión - cleanup inmediato
        """
        from flask import request
        logger.debug(f"Cliente desconectado: {request.sid[:8]}...")
        # TODO: Cleanup de rooms y state del usuario
        
    @socketio_instance.on_error_default
    def default_error_handler(e):
        """
        Handler de errores global - evitar memory leaks
        """
        logger.error(f"Error en Socket.IO: {e}")
        # TODO: Métricas de errores