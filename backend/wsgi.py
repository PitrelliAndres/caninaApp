import os
from app import create_app, socketio, db

app = create_app(os.environ.get('FLASK_ENV', 'production'))


# Ejecutar migraciones automáticamente
with app.app_context():
    from flask_migrate import upgrade
    upgrade()
    
    # Inicializar datos solo la primera vez
    from app.models import User
    if User.query.count() == 0:
        from scripts.init_db import init_database
        init_database()

if __name__ == "__main__":
    socketio.run(app)
