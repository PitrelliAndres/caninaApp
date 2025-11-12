"""
Modelo de Usuario
"""
from datetime import datetime
from sqlalchemy import Enum
import enum
from app import db

class UserRole(enum.Enum):
    """Roles de usuario disponibles"""
    ADMIN = "admin"
    FREE = "free"
    PREMIUM = "premium"
    VIP = "vip"

class User(db.Model):
    """Modelo de usuario"""
    __tablename__ = 'users'

    id = db.Column(db.Integer, primary_key=True)
    google_id = db.Column(db.String(100), unique=True, nullable=False, index=True)
    email = db.Column(db.String(255), unique=True, nullable=False, index=True)
    name = db.Column(db.String(255), nullable=False)
    nickname = db.Column(db.String(100))
    age = db.Column(db.Integer)
    avatar_url = db.Column(db.String(500))

    # Paso 2 - Fecha de nacimiento
    birthdate = db.Column(db.Date)
    zodiac_sign = db.Column(db.String(20))
    show_zodiac_sign = db.Column(db.Boolean, default=True)

    # Paso 3 - Género
    genders = db.Column(db.JSON, default=list)  # Array de géneros: ["MALE", "FEMALE", "NON_BINARY"]
    show_gender_on_profile = db.Column(db.Boolean, default=True)

    # Paso 4 - Orientación sexual
    orientations = db.Column(db.JSON, default=list)  # Array de orientaciones
    show_orientation_on_profile = db.Column(db.Boolean, default=False)

    # Paso 5 - Qué está buscando
    looking_for = db.Column(db.String(50))  # "SERIOUS_RELATIONSHIP", "MAKE_FRIENDS", etc.

    # Paso 6 - Distancia preferida
    max_distance_km = db.Column(db.Integer, default=10)

    # Paso 8 - Hábitos de paseo
    walk_frequency = db.Column(db.JSON, default=list)  # ["DAILY", "SEVERAL_TIMES_DAY"]
    walk_types = db.Column(db.JSON, default=list)  # ["PARKS", "URBAN", "HIKING"]
    dog_sociability = db.Column(db.JSON, default=list)  # ["VERY_SOCIAL", "SHY"]
    other_pets = db.Column(db.JSON, default=list)  # ["DOG", "CAT", "OTHERS"]

    # Paso 9 - Intereses con perro
    interests = db.Column(db.JSON, default=list)  # Max 10 intereses

    # Paso 10 - Fotos de perfil
    photos = db.Column(db.JSON, default=list)  # [{"url": "...", "type": "USER|DOG"}]

    role = db.Column(Enum(UserRole), default=UserRole.FREE, nullable=False)

    is_public = db.Column(db.Boolean, default=True)
    allow_matching = db.Column(db.Boolean, default=True)
    allow_proximity = db.Column(db.Boolean, default=False)

    last_latitude = db.Column(db.Float)
    last_longitude = db.Column(db.Float)
    last_location_update = db.Column(db.DateTime)

    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    last_login = db.Column(db.DateTime)

    is_active = db.Column(db.Boolean, default=True)
    is_online = db.Column(db.Boolean, default=False)
    onboarded = db.Column(db.Boolean, default=False)
    onboarding_step = db.Column(db.String(30))  # Guardar último paso completado: "ONB_NAME", "ONB_BIRTHDATE", etc.

    # Relaciones
    dog = db.relationship('Dog', backref='owner', uselist=False, cascade='all, delete-orphan')
    visits = db.relationship('Visit', backref='user', lazy='dynamic', cascade='all, delete-orphan')
    
    def to_dict(self, include_private=False):
        data = {
            'id': self.id,
            'name': self.name,
            'nickname': self.nickname,
            'age': self.age,
            'avatar_url': self.avatar_url,
            'role': self.role.value,
            'is_public': self.is_public,
            'is_online': self.is_online,
            'member_since': self.created_at.strftime('%d/%m/%Y') if self.created_at else None,
            # Nuevos campos visibles públicamente
            'zodiac_sign': self.zodiac_sign if self.show_zodiac_sign else None,
            'genders': self.genders if self.show_gender_on_profile else [],
            'orientations': self.orientations if self.show_orientation_on_profile else [],
            'looking_for': self.looking_for,
            'interests': self.interests,
            'photos': self.photos,
        }

        if include_private:
            data.update({
                'email': self.email,
                'birthdate': self.birthdate.strftime('%Y-%m-%d') if self.birthdate else None,
                'show_zodiac_sign': self.show_zodiac_sign,
                'show_gender_on_profile': self.show_gender_on_profile,
                'show_orientation_on_profile': self.show_orientation_on_profile,
                'max_distance_km': self.max_distance_km,
                'walk_frequency': self.walk_frequency,
                'walk_types': self.walk_types,
                'dog_sociability': self.dog_sociability,
                'other_pets': self.other_pets,
                'allow_matching': self.allow_matching,
                'allow_proximity': self.allow_proximity,
                'onboarded': self.onboarded,
                'onboarding_step': self.onboarding_step,
            })

        if self.dog:
            data['dog'] = self.dog.to_dict()

        return data

class UserPreference(db.Model):
    """Preferencias de usuario para matching"""
    __tablename__ = 'user_preferences'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False, unique=True)
    interests = db.Column(db.JSON, default=list)
    preferred_age_min = db.Column(db.Integer, default=18)
    preferred_age_max = db.Column(db.Integer, default=100)
    
    def to_dict(self):
        return {
            'interests': self.interests,
            'preferred_age_min': self.preferred_age_min,
            'preferred_age_max': self.preferred_age_max,
        }

    # Campos adicionales para notificaciones
    fcm_token = db.Column(db.String(500))
    phone_number = db.Column(db.String(50))
    ban_reason = db.Column(db.Text)
    banned_at = db.Column(db.DateTime)
