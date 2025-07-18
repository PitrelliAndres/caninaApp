"""
Script para inicializar la base de datos
"""
import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app import create_app, db
from app.models import User, Park

def init_database():
    app = create_app('development')
    
    with app.app_context():
        print("Creando tablas...")
        db.create_all()
        print("✅ Base de datos inicializada")

if __name__ == '__main__':
    init_database()
