"""
Script para poblar la base de datos con datos iniciales
"""
import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app import create_app, db
from app.models import Park, User, UserRole
from datetime import datetime

def seed_parks():
    """Crear parques de CABA"""
    parks = [
        {
            'name': 'Parque Centenario',
            'neighborhood': 'caballito',
            'description': 'Un gran pulmón verde con un lago, ideal para paseos largos y socializar.',
            'address': 'Av. Díaz Vélez 4700',
            'latitude': -34.6064,
            'longitude': -58.4362,
            'has_dog_area': True,
            'is_fenced': True,
            'has_water': True,
            'size_sqm': 110000
        },
        {
            'name': 'Plaza Irlanda',
            'neighborhood': 'caballito',
            'description': 'Amplia plaza con un canil cercado muy popular entre los vecinos.',
            'address': 'Av. Gaona y Donato Álvarez',
            'latitude': -34.6137,
            'longitude': -58.4416,
            'has_dog_area': True,
            'is_fenced': True,
            'has_water': True,
            'size_sqm': 8000
        },
        {
            'name': 'Parque Rivadavia',
            'neighborhood': 'caballito',
            'description': 'Famoso por su feria de libros, también tiene mucho espacio para perros.',
            'address': 'Av. Rivadavia 4600',
            'latitude': -34.6186,
            'longitude': -58.4372,
            'has_dog_area': False,
            'is_fenced': False,
            'has_water': True,
            'size_sqm': 60000
        },
        {
            'name': 'Bosques de Palermo',
            'neighborhood': 'palermo',
            'description': 'El espacio verde más grande de la ciudad, con lagos y áreas para correr.',
            'address': 'Av. Infanta Isabel 410',
            'latitude': -34.5711,
            'longitude': -58.4167,
            'has_dog_area': True,
            'is_fenced': False,
            'has_water': True,
            'size_sqm': 250000
        },
        {
            'name': 'Plaza Inmigrantes de Armenia',
            'neighborhood': 'palermo',
            'description': 'Plaza concurrida en el corazón de Palermo Soho, con un canil bien mantenido.',
            'address': 'Armenia y Costa Rica',
            'latitude': -34.5886,
            'longitude': -58.4301,
            'has_dog_area': True,
            'is_fenced': True,
            'has_water': True,
            'size_sqm': 5000
        },
        {
            'name': 'Parque Las Heras',
            'neighborhood': 'palermo',
            'description': 'Muy popular para deportes y paseos, con un canil grande y activo.',
            'address': 'Av. Las Heras y Av. Coronel Díaz',
            'latitude': -34.5859,
            'longitude': -58.4073,
            'has_dog_area': True,
            'is_fenced': True,
            'has_water': True,
            'size_sqm': 120000
        },
        {
            'name': 'Parque Lezama',
            'neighborhood': 'san telmo',
            'description': 'Histórico parque con barrancas y mucho espacio para explorar con tu mascota.',
            'address': 'Av. Brasil y Defensa',
            'latitude': -34.6289,
            'longitude': -58.3694,
            'has_dog_area': False,
            'is_fenced': False,
            'has_water': True,
            'size_sqm': 80000
        },
        {
            'name': 'Plaza Dorrego',
            'neighborhood': 'san telmo',
            'description': 'El corazón de San Telmo, ideal para un paseo tranquilo entre semana.',
            'address': 'Defensa y Humberto Primo',
            'latitude': -34.6204,
            'longitude': -58.3717,
            'has_dog_area': False,
            'is_fenced': False,
            'has_water': False,
            'size_sqm': 3000
        }
    ]
    
    for park_data in parks:
        park = Park.query.filter_by(name=park_data['name']).first()
        if not park:
            park = Park(**park_data, is_active=True, created_at=datetime.utcnow())
            db.session.add(park)
    
    db.session.commit()
    print(f"✓ {len(parks)} parques creados/actualizados")

def seed_admin():
    """Crear usuario administrador"""
    admin = User.query.filter_by(email='admin@parkdog.com').first()
    if not admin:
        admin = User(
            google_id='admin-google-id',
            email='admin@parkdog.com',
            name='Admin ParkDog',
            nickname='admin',
            age=30,
            role=UserRole.ADMIN,
            is_active=True,
            is_public=False,
            allow_matching=False,
            created_at=datetime.utcnow()
        )
        db.session.add(admin)
        db.session.commit()
        print("✓ Usuario admin creado")

def main():
    app = create_app('development')
    
    with app.app_context():
        print("Inicializando base de datos...")
        db.create_all()
        
        print("Poblando datos...")
        seed_parks()
        seed_admin()
        
        print("✅ Base de datos inicializada con éxito")

if __name__ == '__main__':
    main()
