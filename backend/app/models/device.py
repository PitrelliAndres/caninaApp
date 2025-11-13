"""
Device Token Model
Stores FCM/APNS tokens for push notifications
"""

from datetime import datetime
from app import db
from app.utils.ulid import generate_ulid


class DeviceToken(db.Model):
    """Device tokens for push notifications (FCM/APNS)"""

    __tablename__ = 'device_tokens'

    id = db.Column(db.String(26), primary_key=True, default=generate_ulid)
    user_id = db.Column(db.String(26), db.ForeignKey('users.id', ondelete='CASCADE'), nullable=False, index=True)

    # Token data
    token = db.Column(db.String(255), unique=True, nullable=False, index=True)
    platform = db.Column(db.Enum('ios', 'android', 'web', name='device_platform'), nullable=False)

    # Device metadata
    device_id = db.Column(db.String(100))  # Optional device identifier
    app_version = db.Column(db.String(20))
    os_version = db.Column(db.String(20))
    device_model = db.Column(db.String(50))

    # Status
    is_active = db.Column(db.Boolean, default=True, nullable=False, index=True)
    last_used_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Audit
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    user = db.Relationship('User', backref=db.backref('device_tokens', lazy='dynamic', cascade='all, delete-orphan'))

    # Indexes
    __table_args__ = (
        db.Index('ix_device_tokens_user_active', 'user_id', 'is_active'),
        db.Index('ix_device_tokens_user_platform', 'user_id', 'platform'),
    )

    def __repr__(self):
        return f'<DeviceToken {self.id} user={self.user_id} platform={self.platform}>'

    def to_dict(self):
        """Serialize to dictionary"""
        return {
            'id': self.id,
            'user_id': self.user_id,
            'platform': self.platform,
            'device_id': self.device_id,
            'app_version': self.app_version,
            'os_version': self.os_version,
            'device_model': self.device_model,
            'is_active': self.is_active,
            'last_used_at': self.last_used_at.isoformat() if self.last_used_at else None,
            'created_at': self.created_at.isoformat() if self.created_at else None,
        }

    @staticmethod
    def register_token(user_id, token, platform, device_info=None):
        """
        Register or update a device token
        Returns: (device_token, is_new)
        """
        # Check if token already exists
        existing = DeviceToken.query.filter_by(token=token).first()

        if existing:
            # Update existing token
            existing.user_id = user_id  # In case user changed
            existing.is_active = True
            existing.last_used_at = datetime.utcnow()

            # Update device info if provided
            if device_info:
                existing.app_version = device_info.get('app_version')
                existing.os_version = device_info.get('os_version')
                existing.device_model = device_info.get('device_model')
                existing.device_id = device_info.get('device_id')

            db.session.commit()
            return existing, False

        # Create new token
        device_token = DeviceToken(
            user_id=user_id,
            token=token,
            platform=platform,
            app_version=device_info.get('app_version') if device_info else None,
            os_version=device_info.get('os_version') if device_info else None,
            device_model=device_info.get('device_model') if device_info else None,
            device_id=device_info.get('device_id') if device_info else None,
        )

        db.session.add(device_token)
        db.session.commit()

        return device_token, True

    @staticmethod
    def deactivate_token(token):
        """Deactivate a device token (e.g., on logout or invalid token)"""
        device = DeviceToken.query.filter_by(token=token).first()
        if device:
            device.is_active = False
            db.session.commit()
            return True
        return False

    @staticmethod
    def get_active_tokens(user_id, platform=None):
        """Get all active tokens for a user"""
        query = DeviceToken.query.filter_by(
            user_id=user_id,
            is_active=True
        )

        if platform:
            query = query.filter_by(platform=platform)

        return query.all()

    @staticmethod
    def cleanup_old_tokens(days=90):
        """Deactivate tokens not used in X days"""
        from datetime import timedelta
        cutoff = datetime.utcnow() - timedelta(days=days)

        count = DeviceToken.query.filter(
            DeviceToken.last_used_at < cutoff,
            DeviceToken.is_active == True
        ).update({'is_active': False})

        db.session.commit()
        return count
