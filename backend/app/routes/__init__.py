"""
Rutas de la API
"""
from app.routes.auth import auth_bp
from app.routes.users import users_bp
from app.routes.parks import parks_bp
from app.routes.visits import visits_bp
from app.routes.matches import matches_bp
from app.routes.messages import messages_bp

__all__ = [
    'auth_bp',
    'users_bp',
    'parks_bp',
    'visits_bp',
    'matches_bp',
    'messages_bp'
]
