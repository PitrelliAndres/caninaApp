"""
Script mejorado para poblar la base de datos con datos iniciales completos
"""
import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app import create_app, db
from app.models import Park, User, UserRole, Dog, UserPreference
from datetime import datetime
import random

def seed_parks():
    """Crear parques de CABA con más detalles"""
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
            'size_sqm': 110000,
            'photo_url': 'https://images.unsplash.com/photo-1594736797933-d0501ba2fe65?w=800'
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
            'size_sqm': 8000,
            'photo_url': 'https://images.unsplash.com/photo-1588850561407-ed78c282ace0?w=800'
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
            'size_sqm': 60000,
            'photo_url': 'https://images.unsplash.com/photo-1585211969224-3e992986159d?w=800'
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
            'size_sqm': 250000,
            'photo_url': 'https://images.unsplash.com/photo-1585320806297-9794b3e4eeae?w=800'
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
            'size_sqm': 5000,
            'photo_url': 'https://images.unsplash.com/photo-1585211969224-3e992986159d?w=800'
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
            'size_sqm': 120000,
            'photo_url': 'https://images.unsplash.com/photo-1601280995763-7f4e5dc7ce3e?w=800'
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
            'size_sqm': 80000,
            'photo_url': 'https://images.unsplash.com/photo-1517638851339-a711cfcf3279?w=800'
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
            'size_sqm': 3000,
            'photo_url': 'https://images.unsplash.com/photo-1594736797933-d0501ba2fe65?w=800'
        },
        # Agregar más parques
        {
            'name': 'Parque Chacabuco',
            'neighborhood': 'parque chacabuco',
            'description': 'Amplio parque con canchas deportivas y zona para perros.',
            'address': 'Av. Asamblea y Emilio Mitre',
            'latitude': -34.6358,
            'longitude': -58.4376,
            'has_dog_area': True,
            'is_fenced': True,
            'has_water': True,
            'size_sqm': 220000,
            'photo_url': 'https://images.unsplash.com/photo-1575918338620-88d9e7c8e6f7?w=800'
        },
        {
            'name': 'Reserva Ecológica Costanera Sur',
            'neighborhood': 'puerto madero',
            'description': 'Reserva natural con senderos para largas caminatas con tu mascota.',
            'address': 'Av. Tristán Achával Rodríguez 1550',
            'latitude': -34.6128,
            'longitude': -58.3542,
            'has_dog_area': False,
            'is_fenced': False,
            'has_water': False,
            'size_sqm': 3500000,
            'photo_url': 'https://images.unsplash.com/photo-1573155993874-d5d48af862ba?w=800'
        }
    ]
    
    for park_data in parks:
        park = Park.query.filter_by(name=park_data['name']).first()
        if not park:
            park = Park(**park_data, is_active=True, created_at=datetime.utcnow())
            db.session.add(park)
    
    db.session.commit()
    print(f"✓ {len(parks)} parques creados/actualizados")

def seed_demo_users():
    """Crear usuarios de demostración para testing"""
    demo_users = [
        {
            'user': {
                'google_id': 'demo-user-1',
                'email': 'maria.gonzalez@example.com',
                'name': 'María González',
                'nickname': 'maria_g',
                'age': 28,
                'role': UserRole.FREE,
                'is_public': True,
                'allow_matching': True,
                'avatar_url': 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400'
            },
            'dog': {
                'name': 'Luna',
                'age': 3,
                'breed': 'Golden Retriever',
                'photo_url': 'https://images.unsplash.com/photo-1633722715463-d30f4f325e24?w=400'
            },
            'interests': ['Paseos largos', 'Socialización', 'Entrenamiento']
        },
        {
            'user': {
                'google_id': 'demo-user-2',
                'email': 'carlos.rodriguez@example.com',
                'name': 'Carlos Rodríguez',
                'nickname': 'carlitos',
                'age': 35,
                'role': UserRole.PREMIUM,
                'is_public': True,
                'allow_matching': True,
                'avatar_url': 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400'
            },
            'dog': {
                'name': 'Max',
                'age': 5,
                'breed': 'Labrador Retriever',
                'photo_url': 'https://images.unsplash.com/photo-1554456854-55a089fd4cb2?w=400'
            },
            'interests': ['Deportes caninos', 'Caminatas', 'Fotografía de mascotas']
        },
        {
            'user': {
                'google_id': 'demo-user-3',
                'email': 'sofia.martinez@example.com',
                'name': 'Sofía Martínez',
                'nickname': 'sofi_m',
                'age': 24,
                'role': UserRole.FREE,
                'is_public': True,
                'allow_matching': True,
                'avatar_url': 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400'
            },
            'dog': {
                'name': 'Coco',
                'age': 2,
                'breed': 'Beagle',
                'photo_url': 'https://images.unsplash.com/photo-1543466835-00a7907e9de1?w=400'
            },
            'interests': ['Juegos en el parque', 'Socialización', 'Eventos caninos']
        },
        {
            'user': {
                'google_id': 'demo-user-4',
                'email': 'alejandro.lopez@example.com',
                'name': 'Alejandro López',
                'nickname': 'ale_lopez',
                'age': 42,
                'role': UserRole.VIP,
                'is_public': True,
                'allow_matching': True,
                'avatar_url': 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400'
            },
            'dog': {
                'name': 'Rocky',
                'age': 7,
                'breed': 'Bulldog Francés',
                'photo_url': 'https://images.unsplash.com/photo-1583511655857-d19b40a7a54e?w=400'
            },
            'interests': ['Paseos largos', 'Cuidados y salud', 'Adopción responsable']
        }
    ]
    
    for demo_data in demo_users:
        user = User.query.filter_by(email=demo_data['user']['email']).first()
        if not user:
            # Crear usuario
            user = User(
                **demo_data['user'],
                is_active=True,
                is_online=False,
                created_at=datetime.utcnow()
            )
            db.session.add(user)
            db.session.flush()  # Para obtener el ID
            
            # Crear perro
            dog = Dog(
                user_id=user.id,
                **demo_data['dog'],
                is_vaccinated=True,
                is_neutered=True,
                created_at=datetime.utcnow()
            )
            db.session.add(dog)
            
            # Crear preferencias
            preferences = UserPreference(
                user_id=user.id,
                interests=demo_data['interests'],
                preferred_age_min=max(user.age - 10, 18),
                preferred_age_max=min(user.age + 10, 99)
            )
            db.session.add(preferences)
    
    db.session.commit()
    print(f"✓ {len(demo_users)} usuarios demo creados")

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
        
        print("\nPoblando datos...")
        seed_parks()
        seed_admin()
        seed_demo_users()
        
        print("\n✅ Base de datos inicializada con éxito")
        
        # Mostrar resumen
        print("\nResumen:")
        print(f"- Parques: {Park.query.count()}")
        print(f"- Usuarios: {User.query.count()}")
        print(f"- Perros: {Dog.query.count()}")

if __name__ == '__main__':
    main()