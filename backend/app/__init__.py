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
socketio = SocketIO()

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
    
    # Configurar CORS
    CORS(app, 
         origins=app.config['CORS_ORIGINS'],
         supports_credentials=True,
         allow_headers=['Content-Type', 'Authorization'])
    
    # Inicializar SocketIO con configuración más permisiva para desarrollo
    # Permitir conexiones desde dispositivos móviles en la red local
    cors_origins = app.config['CORS_ORIGINS']
    if app.debug:
        # Development: include local network and mobile IPs
        # TODO: Production - remove local IPs, use only CORS_ORIGINS from env
        additional_origins = [
            "http://localhost:3000",       # Frontend web
            "http://192.168.0.243:8081",  # Mobile device
            "http://10.0.2.2:8081",      # Android emulator
            "http://localhost:8081"       # Local mobile dev
        ]
        if isinstance(cors_origins, list):
            cors_origins = cors_origins + additional_origins
        else:
            cors_origins = cors_origins.split(',') + additional_origins
    
    # TODO: Production - use only cors_origins without "*"
    # Development: allow connections from any origin for testing
    socketio_cors_origins = cors_origins if not app.debug else "*"
    
    socketio.init_app(app, 
                      cors_allowed_origins=socketio_cors_origins,
                      logger=True,
                      engineio_logger=True,
                      async_mode='threading',
                      ping_timeout=60,
                      ping_interval=25)
    
    # Registrar blueprints
    from app.routes.auth import auth_bp
    from app.routes.users import users_bp
    from app.routes.parks import parks_bp
    from app.routes.visits import visits_bp
    from app.routes.matches import matches_bp
    from app.routes.messages import messages_bp
    from app.routes.onboarding import onboarding_bp
    from app.routes.admin import admin_bp
    
    app.register_blueprint(auth_bp, url_prefix='/api/auth')
    app.register_blueprint(users_bp, url_prefix='/api/users')
    app.register_blueprint(parks_bp, url_prefix='/api/parks')
    app.register_blueprint(visits_bp, url_prefix='/api/visits')
    app.register_blueprint(matches_bp, url_prefix='/api/matches')
    app.register_blueprint(messages_bp, url_prefix='/api/messages')
    app.register_blueprint(admin_bp, url_prefix='/api/admin')
    app.register_blueprint(onboarding_bp, url_prefix='/api/onboarding')
    
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
