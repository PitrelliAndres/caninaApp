"""
Modelo de Visita a Parque
"""
from datetime import datetime
from sqlalchemy import UniqueConstraint
from app import db

class Visit(db.Model):
    """Modelo de visita a un parque"""
    __tablename__ = 'visits'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    park_id = db.Column(db.Integer, db.ForeignKey('parks.id'), nullable=False)
    
    date = db.Column(db.Date, nullable=False, index=True)
    time = db.Column(db.Time, nullable=False)
    duration = db.Column(db.String(50))
    notes = db.Column(db.Text)
    
    status = db.Column(db.String(20), default='scheduled')
    
    checked_in_at = db.Column(db.DateTime)
    checked_out_at = db.Column(db.DateTime)
    
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    __table_args__ = (
        UniqueConstraint('user_id', 'date', 'time', name='_user_datetime_uc'),
    )
    
    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'park_id': self.park_id,
            'park_name': self.park.name if self.park else None,
            'date': self.date.isoformat() if self.date else None,
            'time': self.time.strftime('%H:%M') if self.time else None,
            'duration': self.duration,
            'notes': self.notes,
            'status': self.status,
        }
    
    @staticmethod
    def has_conflict(user_id, date, time):
        return Visit.query.filter_by(
            user_id=user_id,
            date=date,
            time=time,
            status='scheduled'
        ).first() is not None
