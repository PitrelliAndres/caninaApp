# backend/wsgi.py
import os
from app import create_app, socketio, db

app = create_app(os.environ.get('FLASK_ENV', 'production'))

# TODO: harden for production - fix migration conflicts before enabling
# Ejecutar migraciones automáticamente (comentado temporalmente)
# with app.app_context():
#     try:
#         from flask_migrate import upgrade
#         print("Ejecutando migraciones...")
#         upgrade()
#         print("✓ Migraciones completadas")
#     except Exception as e:
#         print(f"Error en migraciones: {e}")
#         # Intentar crear las tablas directamente
#         try:
#             db.create_all()
#             print("✓ Tablas creadas directamente")
#         except Exception as e2:
#             print(f"Error creando tablas: {e2}")
#
#     # Inicializar datos solo si las tablas existen
#     try:
#         # Verificar si la tabla users existe
#         if 'users' in db.engine.table_names():
#             from app.models import User
#             if User.query.count() == 0:
#                 print("Inicializando datos...")
#         else:
#             print("⚠ Las tablas no existen aún")
#     except Exception as e:
#         print(f"Error verificando/creando datos: {e}")

if __name__ == "__main__":
    socketio.run(app)