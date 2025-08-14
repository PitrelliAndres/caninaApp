#!/usr/bin/env python
"""Script para reparar problemas de migración en la base de datos."""

import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app import create_app, db
from sqlalchemy import text, inspect
from alembic import command
from alembic.config import Config

def fix_migration_state():
    """Repara el estado de migraciones de la base de datos."""
    
    app = create_app()
    
    with app.app_context():
        try:
            # Verificar conexión
            result = db.session.execute(text("SELECT 1"))
            print("✅ Conexión a la base de datos establecida")
            
            # Obtener el inspector
            inspector = inspect(db.engine)
            
            # Verificar tablas existentes
            existing_tables = inspector.get_table_names()
            print(f"📋 Tablas existentes: {', '.join(existing_tables)}")
            
            # Verificar columnas problemáticas en conversations
            if 'conversations' in existing_tables:
                conv_columns = [col['name'] for col in inspector.get_columns('conversations')]
                print(f"📊 Columnas en conversations: {', '.join(conv_columns)}")
                
                if 'updated_at' in conv_columns:
                    print("⚠️  La columna 'updated_at' ya existe en conversations")
            
            # Verificar columnas problemáticas en messages
            if 'messages' in existing_tables:
                msg_columns = [col['name'] for col in inspector.get_columns('messages')]
                print(f"📊 Columnas en messages: {', '.join(msg_columns)}")
                
                if 'updated_at' in msg_columns:
                    print("⚠️  La columna 'updated_at' ya existe en messages")
            
            # Verificar estado de alembic
            if 'alembic_version' in existing_tables:
                result = db.session.execute(text("SELECT version_num FROM alembic_version"))
                current_version = result.scalar()
                print(f"📌 Versión actual de migración: {current_version}")
                
                # Si la migración problemática no se ha aplicado, marcarla como aplicada
                if current_version == '1d0b9618e540':
                    print("🔧 Marcando migración problemática como aplicada...")
                    db.session.execute(text("UPDATE alembic_version SET version_num = '5dd35e9ddf45'"))
                    db.session.commit()
                    print("✅ Estado de migración actualizado")
                elif current_version == '5dd35e9ddf45':
                    print("✅ La migración ya está marcada como aplicada")
                else:
                    print(f"ℹ️  Versión de migración diferente: {current_version}")
            else:
                print("⚠️  No se encontró tabla alembic_version")
                # Crear tabla alembic_version si no existe
                db.session.execute(text("""
                    CREATE TABLE IF NOT EXISTS alembic_version (
                        version_num VARCHAR(32) NOT NULL PRIMARY KEY
                    )
                """))
                db.session.execute(text("INSERT INTO alembic_version (version_num) VALUES ('5dd35e9ddf45')"))
                db.session.commit()
                print("✅ Tabla alembic_version creada y actualizada")
            
            print("\n✅ Proceso de reparación completado")
            print("\n📝 Próximos pasos:")
            print("1. Reinicia el contenedor backend: docker-compose restart backend")
            print("2. Verifica que no haya errores de migración")
            print("3. Si persisten problemas, ejecuta: flask db stamp head")
            
        except Exception as e:
            print(f"❌ Error durante la reparación: {str(e)}")
            return False
        
    return True

if __name__ == "__main__":
    if fix_migration_state():
        sys.exit(0)
    else:
        sys.exit(1)