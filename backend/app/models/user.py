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
            'member_since': self.created_at.strftime('%d/%m/%Y') if self.created_at else None
        }
        
        if include_private:
            data.update({
                'email': self.email,
                'allow_matching': self.allow_matching,
                'allow_proximity': self.allow_proximity,
                'onboarded': self.onboarded,
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
