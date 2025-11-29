"""
Inicialización de la aplicación Flask
"""
import os
from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate
from flask_cors import CORS
from flask_socketio import SocketIO

# Inicializar extensiones
db = SQLAlchemy()
migrate = Migrate()
socketio = SocketIO(async_mode='eventlet')  # Forzar uso de eventlet para WebSocket

def create_app(config_name=None):
    """Factory pattern para crear la aplicación Flask"""
    app = Flask(__name__)
    
    # Cargar configuración
    if config_name is None:
        config_name = os.environ.get('FLASK_ENV', 'development')
    
    from app.config import config
    app.config.from_object(config[config_name])
    
    # Crear carpeta de uploads
    upload_folder = app.config.get('UPLOAD_FOLDER', 'uploads')
    if not os.path.exists(upload_folder):
        os.makedirs(upload_folder)
    
    # Inicializar extensiones
    db.init_app(app)
    migrate.init_app(app, db)

    # Inicializar notification service (Firebase Cloud Messaging)
    from app.services.notification_service import notification_service
    notification_service.initialize_app(app)

    # Inicializar queue service (RQ - Redis Queue)
    # TODO: harden for production - install rq dependency
    try:
        from app.queue.queue_service import queue_service
        queue_service.initialize_app(app)
    except ImportError as e:
        print(f'[App] Queue service not available: {e} - async processing disabled')
    
    # Configurar CORS
    CORS(app, 
         origins=app.config['CORS_ORIGINS'],
         supports_credentials=True,
         allow_headers=['Content-Type', 'Authorization'])
    
    # Configurar SocketIO con Redis para escalabilidad
    redis_url = os.environ.get('REDIS_URL', 'redis://localhost:6379/0')
    
    try:
        import socketio as sio
        
        # Configurar Redis Manager para escalabilidad horizontal
        if redis_url and 'redis://' in redis_url:
            redis_parts = redis_url.replace('redis://', '').split(':')
            redis_host = redis_parts[0] if redis_parts else 'redis'
            redis_port = int(redis_parts[1].split('/')[0]) if len(redis_parts) > 1 else 6379
            
            redis_manager = sio.RedisManager(redis_host, redis_port)
            
            socketio.init_app(app, 
                              client_manager=redis_manager,
                              cors_allowed_origins="*",
                              logger=True,
                              engineio_logger=True,
                              async_mode='threading',
                              ping_timeout=20,        # Más agresivo para detectar desconexiones
                              ping_interval=10,       # Heartbeat más frecuente
                              max_http_buffer_size=4096,  # 4KB límite de mensaje
                              compression=True)       # Comprimir mensajes automáticamente
            app.logger.info(f"✅ Socket.IO optimizado con Redis en {redis_host}:{redis_port}")
        else:
            raise Exception("Redis URL no válida")
            
    except Exception as e:
        app.logger.warning(f"⚠️ Redis no disponible ({e}), usando configuración en memoria")
        # Fallback sin Redis pero con optimizaciones
        socketio.init_app(app, 
                          cors_allowed_origins="*",
                          logger=True,
                          engineio_logger=True,
                          async_mode='threading',
                          ping_timeout=30,
                          ping_interval=15,
                          max_http_buffer_size=4096,
                          compression=True)
        app.logger.info("✅ Socket.IO optimizado en modo memoria")
    
    # Registrar blueprints
    from app.routes.auth import auth_bp
    from app.routes.users import users_bp
    from app.routes.parks import parks_bp
    from app.routes.visits import visits_bp
    from app.routes.matches import matches_bp
    from app.routes.messages import messages_bp
    from app.routes.onboarding import onboarding_bp
    from app.routes.admin import admin_bp
    # TODO: harden for production - install flask_jwt_extended to enable devices blueprint
    # from app.routes.devices import bp as devices_bp

    app.register_blueprint(auth_bp, url_prefix='/api/auth')
    app.register_blueprint(users_bp, url_prefix='/api/users')
    app.register_blueprint(parks_bp, url_prefix='/api/parks')
    app.register_blueprint(visits_bp, url_prefix='/api/visits')
    app.register_blueprint(matches_bp, url_prefix='/api/matches')
    app.register_blueprint(messages_bp, url_prefix='/api/messages')
    app.register_blueprint(admin_bp, url_prefix='/api/admin')
    app.register_blueprint(onboarding_bp, url_prefix='/api/onboarding')
    # app.register_blueprint(devices_bp)  # Already has /api/v1/devices prefix
    
    # Registrar manejadores de WebSocket
    from app.routes import messages
    
    # Healthcheck endpoint
    @app.route('/api/health')
    def health_check():
        return {'status': 'healthy', 'message': 'ParkDog API is running'}
    
    # Servir archivos estáticos de uploads
    @app.route('/uploads/<path:filename>')
    def uploaded_file(filename):
        from flask import send_from_directory
        return send_from_directory(app.config['UPLOAD_FOLDER'], filename)
    
    # Manejo de errores global
    @app.errorhandler(404)
    def not_found_error(error):
        return {'error': 'Not found'}, 404
    
    @app.errorhandler(500)
    def internal_error(error):
        db.session.rollback()
        return {'error': 'Internal server error'}, 500
    
    @app.errorhandler(413)
    def request_entity_too_large(error):
        return {'error': 'File too large (max 3MB)'}, 413
    
    return app
