"""
Modelo de Mensaje entre usuarios con ULID y optimizaciones
"""
from datetime import datetime
from app import db
from app.utils.message_ids import generate_message_id

class Message(db.Model):
    """Modelo de mensaje en el chat"""
    __tablename__ = 'messages'
    
    # Primary key as ULID string for better performance and ordering
    # TODO: PRODUCTION - Ensure ULID is properly configured
    id = db.Column(db.String(26), primary_key=True, default=lambda: generate_message_id())
    
    # Foreign keys with indexes for performance
    sender_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False, index=True)
    receiver_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False, index=True)
    
    # Message content with length limit
    text = db.Column(db.Text(1000), nullable=False)  # Limit to 1000 chars
    
    # Message metadata
    message_type = db.Column(db.String(20), default='text', nullable=False)
    
    # Read status
    is_read = db.Column(db.Boolean, default=False, nullable=False, index=True)
    read_at = db.Column(db.DateTime)
    
    # Timestamps with indexes for ordering
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False, index=True)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Soft delete for data retention
    is_deleted = db.Column(db.Boolean, default=False, nullable=False, index=True)
    deleted_at = db.Column(db.DateTime)
    
    # Database indexes for common queries
    __table_args__ = (
        # Composite index for conversation queries (most common)
        db.Index('ix_messages_conversation', 'sender_id', 'receiver_id', 'created_at'),
        db.Index('ix_messages_conversation_reverse', 'receiver_id', 'sender_id', 'created_at'),
        
        # Index for unread messages
        db.Index('ix_messages_unread', 'receiver_id', 'is_read', 'created_at'),
        
        # Index for message ordering (ULID should handle this, but backup)
        db.Index('ix_messages_timeline', 'created_at', 'id'),
        
        # Index for soft delete queries
        db.Index('ix_messages_active', 'is_deleted', 'created_at'),
    )
    
    def to_dict(self):
        """Convert message to dictionary with all relevant fields"""
        return {
            'id': self.id,
            'sender_id': self.sender_id,
            'receiver_id': self.receiver_id,
            'text': self.text,
            'message_type': self.message_type,
            'is_read': self.is_read,
            'read_at': self.read_at.isoformat() if self.read_at else None,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None,
            'time': self.created_at.strftime('%H:%M') if self.created_at else None,
            'is_deleted': self.is_deleted
        }
    
    def to_dict_minimal(self):
        """Minimal dictionary for performance-critical operations"""
        return {
            'id': self.id,
            'sender_id': self.sender_id,
            'text': self.text,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'time': self.created_at.strftime('%H:%M') if self.created_at else None,
            'is_read': self.is_read
        }
    
    def mark_as_read(self):
        """Mark message as read"""
        if not self.is_read:
            self.is_read = True
            self.read_at = datetime.utcnow()
            return True
        return False
    
    def soft_delete(self):
        """Soft delete message (for data retention)"""
        self.is_deleted = True
        self.deleted_at = datetime.utcnow()
    
    @classmethod
    def get_conversation_messages(cls, user1_id, user2_id, limit=50, before_id=None):
        """
        Optimized query for conversation messages
        Uses ULID ordering which is more efficient than timestamp
        """
        query = cls.query.filter(
            db.or_(
                db.and_(cls.sender_id == user1_id, cls.receiver_id == user2_id),
                db.and_(cls.sender_id == user2_id, cls.receiver_id == user1_id)
            ),
            cls.is_deleted == False
        )
        
        if before_id:
            query = query.filter(cls.id < before_id)
        
        return query.order_by(cls.id.desc()).limit(limit).all()
    
    @classmethod
    def get_unread_count(cls, receiver_id, sender_id=None):
        """Get count of unread messages for a user"""
        query = cls.query.filter(
            cls.receiver_id == receiver_id,
            cls.is_read == False,
            cls.is_deleted == False
        )
        
        if sender_id:
            query = query.filter(cls.sender_id == sender_id)
        
        return query.count()
    
    @classmethod
    def mark_conversation_as_read(cls, user_id, other_user_id):
        """Mark all messages in a conversation as read"""
        updated_count = cls.query.filter(
            cls.sender_id == other_user_id,
            cls.receiver_id == user_id,
            cls.is_read == False,
            cls.is_deleted == False
        ).update({
            'is_read': True,
            'read_at': datetime.utcnow()
        }, synchronize_session=False)
        
        return updated_count

class Conversation(db.Model):
    """Modelo auxiliar para gestionar conversaciones"""
    __tablename__ = 'conversations'
    
    id = db.Column(db.Integer, primary_key=True)
    user1_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False, index=True)
    user2_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False, index=True)
    
    # Reference to ULID message ID
    last_message_id = db.Column(db.String(26), db.ForeignKey('messages.id'))
    last_message_at = db.Column(db.DateTime, index=True)
    
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Soft delete for conversations
    is_deleted = db.Column(db.Boolean, default=False, nullable=False, index=True)
    deleted_at = db.Column(db.DateTime)
    
    # Database indexes for efficient queries
    __table_args__ = (
        # Unique constraint for conversation pairs
        db.UniqueConstraint('user1_id', 'user2_id', name='uq_conversation_users'),
        
        # Index for finding user conversations
        db.Index('ix_conversations_user1', 'user1_id', 'last_message_at'),
        db.Index('ix_conversations_user2', 'user2_id', 'last_message_at'),
        
        # Index for active conversations
        db.Index('ix_conversations_active', 'is_deleted', 'last_message_at'),
    )
    
    def to_dict(self):
        """Convert conversation to dictionary"""
        return {
            'id': self.id,
            'user1_id': self.user1_id,
            'user2_id': self.user2_id,
            'last_message_id': self.last_message_id,
            'last_message_at': self.last_message_at.isoformat() if self.last_message_at else None,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None,
            'is_deleted': self.is_deleted
        }
    
    def update_last_message(self, message):
        """Update last message info"""
        self.last_message_id = message.id
        self.last_message_at = message.created_at
        self.updated_at = datetime.utcnow()
    
    def soft_delete(self):
        """Soft delete conversation"""
        self.is_deleted = True
        self.deleted_at = datetime.utcnow()
    
    @classmethod
    def get_or_create_conversation(cls, user1_id, user2_id):
        """Get existing conversation or create new one"""
        # Ensure consistent ordering (smaller ID first)
        if user1_id > user2_id:
            user1_id, user2_id = user2_id, user1_id
        
        conversation = cls.query.filter(
            cls.user1_id == user1_id,
            cls.user2_id == user2_id,
            cls.is_deleted == False
        ).first()
        
        if not conversation:
            conversation = cls(
                user1_id=user1_id,
                user2_id=user2_id
            )
            db.session.add(conversation)
        
        return conversation
    
    @classmethod
    def get_user_conversations(cls, user_id, limit=20):
        """Get all conversations for a user, ordered by last message"""
        return cls.query.filter(
            db.or_(cls.user1_id == user_id, cls.user2_id == user_id),
            cls.is_deleted == False
        ).order_by(cls.last_message_at.desc().nullsfirst()).limit(limit).all()
