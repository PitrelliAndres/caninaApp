"""
Modelo de Perro
"""
from datetime import datetime
from app import db

class Dog(db.Model):
    """Modelo de perro/mascota"""
    __tablename__ = 'dogs'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False, unique=True)
    name = db.Column(db.String(100), nullable=False)
    age = db.Column(db.Integer)
    breed = db.Column(db.String(100))
    photo_url = db.Column(db.String(500))
    
    size = db.Column(db.String(50))
    temperament = db.Column(db.String(200))
    is_neutered = db.Column(db.Boolean, default=False)
    is_vaccinated = db.Column(db.Boolean, default=True)
    
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'age': self.age,
            'breed': self.breed,
            'photo_url': self.photo_url,
            'size': self.size,
            'is_neutered': self.is_neutered,
            'is_vaccinated': self.is_vaccinated
        }
