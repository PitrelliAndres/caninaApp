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
    # Crear instancia de Flask
    app = Flask(__name__)
    
    # Cargar configuración
    if config_name is None:
        config_name = os.environ.get('FLASK_ENV', 'development')
    
    from app.config import config
    app.config.from_object(config[config_name])
    
    # Inicializar extensiones con la app
    db.init_app(app)
    migrate.init_app(app, db)
    
    # Configurar CORS
    CORS(app, 
         origins=app.config['CORS_ORIGINS'],
         supports_credentials=True,
         allow_headers=['Content-Type', 'Authorization'])
    
    # Inicializar SocketIO con CORS
    socketio.init_app(app, 
                      cors_allowed_origins=app.config['CORS_ORIGINS'],
                      logger=True,
                      engineio_logger=True)
    
    # Registrar blueprints
    from app.routes.auth import auth_bp
    from app.routes.users import users_bp
    from app.routes.parks import parks_bp
    from app.routes.visits import visits_bp
    from app.routes.matches import matches_bp
    from app.routes.messages import messages_bp
    
    app.register_blueprint(auth_bp, url_prefix='/api/auth')
    app.register_blueprint(users_bp, url_prefix='/api/users')
    app.register_blueprint(parks_bp, url_prefix='/api/parks')
    app.register_blueprint(visits_bp, url_prefix='/api/visits')
    app.register_blueprint(matches_bp, url_prefix='/api/matches')
    app.register_blueprint(messages_bp, url_prefix='/api/messages')
    
    # Registrar manejadores de WebSocket
    from app.routes import messages
    
    # Healthcheck endpoint
    @app.route('/api/health')
    def health_check():
        return {'status': 'healthy', 'message': 'ParkDog API is running'}
    
    # Manejo de errores global
    @app.errorhandler(404)
    def not_found_error(error):
        return {'error': 'Not found'}, 404
    
    @app.errorhandler(500)
    def internal_error(error):
        db.session.rollback()
        return {'error': 'Internal server error'}, 500
    
    return app
