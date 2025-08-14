"""
Configuración completa de la aplicación Flask
"""
import os
from datetime import timedelta
from dotenv import load_dotenv

load_dotenv()

class Config:
    """Configuración base"""
    # Flask
    SECRET_KEY = os.environ.get('SECRET_KEY') or 'dev-secret-key-change-in-production'
    DEBUG = False
    TESTING = False
    
    # Security environment flags
    IS_PRODUCTION = os.environ.get('FLASK_ENV') == 'production'
    IS_DEVELOPMENT = os.environ.get('FLASK_ENV') == 'development'
    
    # Database
    SQLALCHEMY_DATABASE_URI = os.environ.get('DATABASE_URL') or 'postgresql://localhost/parkdog'
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    
    # OAuth2 Google
    GOOGLE_CLIENT_ID = os.environ.get('GOOGLE_CLIENT_ID')
    GOOGLE_CLIENT_SECRET = os.environ.get('GOOGLE_CLIENT_SECRET')
    GOOGLE_DISCOVERY_URL = "https://accounts.google.com/.well-known/openid-configuration"
    
    # JWT (security-first configuration)
    JWT_SECRET_KEY = os.environ.get('JWT_SECRET_KEY') or SECRET_KEY
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(hours=2)  # DEV: 2h, PROD: overridden below
    JWT_REFRESH_TOKEN_EXPIRES = timedelta(days=7)  # Reduced from 30 days
    JWT_ALGORITHM = 'HS256'
    JWT_ISSUER = os.environ.get('JWT_ISSUER', 'parkdog-api')
    JWT_AUDIENCE = os.environ.get('JWT_AUDIENCE', 'parkdog-client')
    
    # Authentication security settings
    STRICT_JWT_VALIDATION = os.environ.get('STRICT_JWT_VALIDATION', 'false').lower() == 'true'
    ENABLE_TOKEN_BLACKLIST = os.environ.get('ENABLE_TOKEN_BLACKLIST', 'false').lower() == 'true'
    REQUIRE_HTTPS = os.environ.get('REQUIRE_HTTPS', 'false').lower() == 'true'
    
    # CORS
    CORS_ORIGINS = os.environ.get('CORS_ORIGINS', 'http://localhost:3000').split(',')
    
    # Proximity (en metros)
    PROXIMITY_RADIUS = float(os.environ.get('PROXIMITY_RADIUS', '1000'))  # 1km por defecto
    
    # Google Maps
    GOOGLE_MAPS_API_KEY = os.environ.get('GOOGLE_MAPS_API_KEY')
    
    # URLs
    FRONTEND_URL = os.environ.get('FRONTEND_URL', 'http://localhost:3000')
    BACKEND_URL = os.environ.get('BACKEND_URL', 'http://localhost:5000')
    
    # Upload limits
    MAX_CONTENT_LENGTH = 3 * 1024 * 1024  # 3MB
    ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif'}
    UPLOAD_FOLDER = 'uploads'
    
    # Pagination
    ITEMS_PER_PAGE = 20
    
    # Match scoring weights
    MATCH_WEIGHTS = {
        'schedule_overlap': 0.3,
        'interests': 0.25,
        'park_proximity': 0.2,
        'age_compatibility': 0.15,
        'breed_compatibility': 0.1
    }

class DevelopmentConfig(Config):
    """Configuración de desarrollo"""
    DEBUG = True
    SQLALCHEMY_ECHO = True
    IS_DEVELOPMENT = True
    IS_PRODUCTION = False
    
    # DEV: Relaxed JWT settings
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(hours=2)
    STRICT_JWT_VALIDATION = False
    ENABLE_TOKEN_BLACKLIST = False
    REQUIRE_HTTPS = False

class ProductionConfig(Config):
    """Configuración de producción"""
    DEBUG = False
    IS_DEVELOPMENT = False
    IS_PRODUCTION = True
    
    # PROD: Strict security settings
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(minutes=15)  # Short-lived tokens
    STRICT_JWT_VALIDATION = True
    ENABLE_TOKEN_BLACKLIST = True
    REQUIRE_HTTPS = True
    
    if os.environ.get('DATABASE_URL', '').startswith('postgres://'):
        SQLALCHEMY_DATABASE_URI = os.environ.get('DATABASE_URL').replace('postgres://', 'postgresql://')

class TestingConfig(Config):
    """Configuración de testing"""
    TESTING = True
    SQLALCHEMY_DATABASE_URI = 'sqlite:///:memory:'

config = {
    'development': DevelopmentConfig,
    'production': ProductionConfig,
    'testing': TestingConfig,
    'default': DevelopmentConfig
}
