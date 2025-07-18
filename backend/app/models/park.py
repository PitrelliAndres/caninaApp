"""
Modelo de Parque
"""
from datetime import datetime
from app import db

class Park(db.Model):
    """Modelo de parque"""
    __tablename__ = 'parks'
    
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(200), nullable=False)
    neighborhood = db.Column(db.String(100), nullable=False, index=True)
    description = db.Column(db.Text)
    
    address = db.Column(db.String(300))
    latitude = db.Column(db.Float, nullable=False)
    longitude = db.Column(db.Float, nullable=False)
    
    has_dog_area = db.Column(db.Boolean, default=False)
    is_fenced = db.Column(db.Boolean, default=False)
    has_water = db.Column(db.Boolean, default=False)
    size_sqm = db.Column(db.Float)
    
    photo_url = db.Column(db.String(500))
    photos = db.Column(db.JSON, default=list)
    opening_hours = db.Column(db.JSON)
    
    is_active = db.Column(db.Boolean, default=True)
    
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    visits = db.relationship('Visit', backref='park', lazy='dynamic')
    
    def to_dict(self, include_stats=False):
        data = {
            'id': self.id,
            'name': self.name,
            'neighborhood': self.neighborhood,
            'description': self.description,
            'address': self.address,
            'latitude': self.latitude,
            'longitude': self.longitude,
            'has_dog_area': self.has_dog_area,
            'is_fenced': self.is_fenced,
            'has_water': self.has_water,
            'size_sqm': self.size_sqm,
            'photo_url': self.photo_url,
            'is_active': self.is_active
        }
        
        if include_stats:
            data['total_visits'] = self.visits.count()
        
        return data
