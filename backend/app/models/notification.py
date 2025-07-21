"""
Modelo de Notificación
"""
from datetime import datetime
from app import db

class Notification(db.Model):
    """Modelo de notificación"""
    __tablename__ = 'notifications'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    
    type = db.Column(db.String(50), nullable=False)  # new_match, new_message, visit_reminder, etc.
    title = db.Column(db.String(200), nullable=False)
    body = db.Column(db.Text, nullable=False)
    data = db.Column(db.JSON, default=dict)
    
    is_read = db.Column(db.Boolean, default=False)
    read_at = db.Column(db.DateTime)
    
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    def to_dict(self):
        return {
            'id': self.id,
            'type': self.type,
            'title': self.title,
            'body': self.body,
            'data': self.data,
            'is_read': self.is_read,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }

class NotificationPreference(db.Model):
    """Preferencias de notificación del usuario"""
    __tablename__ = 'notification_preferences'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False, unique=True)
    
    # Canales
    push_enabled = db.Column(db.Boolean, default=True)
    email_enabled = db.Column(db.Boolean, default=True)
    sms_enabled = db.Column(db.Boolean, default=False)
    
    # Tipos de notificación
    new_match_enabled = db.Column(db.Boolean, default=True)
    new_message_enabled = db.Column(db.Boolean, default=True)
    visit_reminder_enabled = db.Column(db.Boolean, default=True)
    nearby_user_enabled = db.Column(db.Boolean, default=False)
    
    # Horarios
    quiet_hours_start = db.Column(db.Time)
    quiet_hours_end = db.Column(db.Time)
    
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)