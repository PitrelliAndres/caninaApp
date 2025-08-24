"""
Script principal para ejecutar la aplicación en desarrollo
"""
import os
from app import create_app, db, socketio
from app.models import User, UserRole

# Crear aplicación
app = create_app()

# Contexto de shell para debugging
@app.shell_context_processor
def make_shell_context():
    """Agregar modelos al contexto de shell para facilitar debugging"""
    from app.models import User, Dog, Park, Visit, Match, Message
    return {
        'db': db,
        'User': User,
        'Dog': Dog,
        'Park': Park,
        'Visit': Visit,
        'Match': Match,
        'Message': Message
    }

@app.cli.command()
def init_db():
    """Inicializar la base de datos con datos de ejemplo"""
    print("Creando tablas...")
    db.create_all()
    print("✓ Tablas creadas")
    
    # Crear usuario admin si no existe
    admin = User.query.filter_by(email='admin@parkdog.com').first()
    if not admin:
        admin = User(
            google_id='admin-google-id',
            email='admin@parkdog.com',
            name='Admin ParkDog',
            role=UserRole.ADMIN,
            is_active=True
        )
        db.session.add(admin)
        db.session.commit()
        print("✓ Usuario admin creado")
    
    print("Base de datos inicializada correctamente")

if __name__ == '__main__':
    # Obtener puerto del entorno o usar 5000 por defecto
    port = int(os.environ.get('PORT', 5000))
    debug = os.environ.get('FLASK_ENV') == 'development'
    
    print(f"""
    ParkDog Backend
    =================
    Servidor corriendo en: http://localhost:{port}
    Modo: {'Desarrollo' if debug else 'Produccion'}
    
    Endpoints disponibles:
    - API Health: http://localhost:{port}/api/health
    - Auth: http://localhost:{port}/api/auth/...
    - Users: http://localhost:{port}/api/users/...
    - Parks: http://localhost:{port}/api/parks/...
    - Visits: http://localhost:{port}/api/visits/...
    - Matches: http://localhost:{port}/api/matches/...
    - Messages: http://localhost:{port}/api/messages/...
    """)
    
    # Run compatibility check in development
    if debug:
        try:
            from app.utils.compatibility_check import log_compatibility_status
            with app.app_context():
                log_compatibility_status()
        except Exception as e:
            print(f"Compatibility check failed: {e}")
    
    # Ejecutar con SocketIO para soporte de WebSocket
    socketio.run(app, 
                 host='0.0.0.0', 
                 port=port, 
                 debug=debug,
                 use_reloader=False,  # Deshabilitar reloader en Docker para evitar WERKZEUG_SERVER_FD
                 allow_unsafe_werkzeug=True)  # TODO: harden for production - Use proper WSGI server
