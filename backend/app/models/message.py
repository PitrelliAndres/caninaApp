"""
Modelo de Mensaje entre usuarios con ULID y optimizaciones
"""
from datetime import datetime
from app import db
from app.utils.message_ids import generate_message_id

class Message(db.Model):
    """Modelo de mensaje con soporte E2EE y conversaciones"""
    __tablename__ = 'messages'
    
    # Primary key as ULID string for better performance and ordering
    id = db.Column(db.String(26), primary_key=True, default=lambda: generate_message_id())
    
    # Foreign key to conversation (new schema)
    conversation_id = db.Column(db.Integer, db.ForeignKey('conversations.id', ondelete='CASCADE'), nullable=False, index=True)
    
    # Foreign key to sender
    sender_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False, index=True)
    
    # Compatibility - receiver_id for gradual migration
    receiver_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True, index=True)
    
    # Message content - current text field for transition
    text = db.Column(db.Text(4096), nullable=True)  # Increased limit to 4KB
    
    # E2EE fields for future implementation
    ciphertext = db.Column(db.Text, nullable=True)
    nonce = db.Column(db.String(32), nullable=True)
    tag = db.Column(db.String(32), nullable=True)
    key_version = db.Column(db.Integer, nullable=True)
    algorithm = db.Column(db.String(20), nullable=True)
    metadata_json = db.Column(db.JSON, nullable=True)
    
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
    
    # Client temp ID for idempotency
    client_temp_id = db.Column(db.String(36), unique=True, nullable=True, index=True)
    
    # Database indexes for optimized queries
    __table_args__ = (
        # Primary conversation index (most important)
        db.Index('ix_messages_conversation_created', 'conversation_id', 'created_at'),
        
        # Compatibility indexes for gradual migration
        db.Index('ix_messages_conversation_compat', 'sender_id', 'receiver_id', 'created_at'),
        db.Index('ix_messages_conversation_reverse', 'receiver_id', 'sender_id', 'created_at'),
        
        # Partial index for unread messages (PostgreSQL)
        # db.Index('ix_messages_unread_partial', 'receiver_id', 'created_at', postgresql_where=db.and_(db.text('is_deleted=false'), db.text('is_read=false'))),
        
        # Timeline index for stable ordering
        db.Index('ix_messages_timeline', 'created_at', 'id'),
        
        # Active messages index
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
    def get_conversation_messages(cls, conversation_id=None, user1_id=None, user2_id=None, limit=50, before_id=None):
        """
        Get conversation messages - supports both new conversation_id and legacy user IDs
        """
        if conversation_id:
            # New schema - direct conversation query
            query = cls.query.filter(
                cls.conversation_id == conversation_id,
                cls.is_deleted == False
            )
        else:
            # Legacy schema - user-based query for backwards compatibility
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
    """Modelo de conversación 1:1 entre usuarios con match"""
    __tablename__ = 'conversations'
    
    id = db.Column(db.Integer, primary_key=True)
    user1_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False, index=True)
    user2_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False, index=True)
    
    # Reference to ULID message ID
    last_message_id = db.Column(db.String(26), db.ForeignKey('messages.id'), nullable=True)
    last_message_at = db.Column(db.DateTime, index=True)
    
    # E2EE support
    current_key_version = db.Column(db.Integer, default=1, nullable=False)
    
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Soft delete for conversations
    is_deleted = db.Column(db.Boolean, default=False, nullable=False, index=True)
    deleted_at = db.Column(db.DateTime)
    
    # Database indexes and constraints for 1:1 conversations
    __table_args__ = (
        # Ensure 1:1 uniqueness with expression-based unique constraint
        # PostgreSQL: UNIQUE (LEAST(user1_id,user2_id), GREATEST(user1_id,user2_id))
        # For SQLite/other DBs, use CHECK constraint to ensure user1_id < user2_id
        db.CheckConstraint('user1_id < user2_id', name='check_user_order'),
        db.UniqueConstraint('user1_id', 'user2_id', name='uq_conversation_users'),
        
        # Index for finding user conversations
        db.Index('ix_conversations_user1', 'user1_id', 'last_message_at'),
        db.Index('ix_conversations_user2', 'user2_id', 'last_message_at'),
        
        # Index for active conversations
        db.Index('ix_conversations_active', 'is_deleted', 'last_message_at'),
        
        # Index for ordering by last message time
        db.Index('ix_conversations_last_message', 'last_message_at'),
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
        """Get existing conversation or create new one with proper 1:1 enforcement"""
        # Ensure consistent ordering (smaller ID first) for 1:1 uniqueness
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
                user2_id=user2_id,
                current_key_version=1
            )
            db.session.add(conversation)
        
        return conversation
    
    def get_other_user_id(self, current_user_id):
        """Get the ID of the other user in the conversation"""
        return self.user2_id if self.user1_id == current_user_id else self.user1_id
    
    def has_user(self, user_id):
        """Check if user is part of this conversation"""
        return user_id == self.user1_id or user_id == self.user2_id
    
    @classmethod
    def get_user_conversations(cls, user_id, limit=20):
        """Get all conversations for a user, ordered by last message"""
        return cls.query.filter(
            db.or_(cls.user1_id == user_id, cls.user2_id == user_id),
            cls.is_deleted == False
        ).order_by(cls.last_message_at.desc().nullsfirst()).limit(limit).all()


class MessageRead(db.Model):
    """Watermark de lectura por conversación y usuario"""
    __tablename__ = 'message_reads'
    
    # Composite primary key
    conversation_id = db.Column(db.Integer, db.ForeignKey('conversations.id', ondelete='CASCADE'), primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id', ondelete='CASCADE'), primary_key=True)
    
    # ULID of the last read message
    up_to_message_id = db.Column(db.String(26), nullable=False)
    
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    
    # Index for efficient queries
    __table_args__ = (
        db.Index('ix_message_reads_conv_user', 'conversation_id', 'user_id'),
    )
    
    @classmethod
    def update_read_watermark(cls, conversation_id, user_id, message_id):
        """Update or create read watermark for user in conversation"""
        read_record = cls.query.filter(
            cls.conversation_id == conversation_id,
            cls.user_id == user_id
        ).first()
        
        if read_record:
            read_record.up_to_message_id = message_id
            read_record.updated_at = datetime.utcnow()
        else:
            read_record = cls(
                conversation_id=conversation_id,
                user_id=user_id,
                up_to_message_id=message_id
            )
            db.session.add(read_record)
        
        return read_record
    
    @classmethod
    def get_unread_count(cls, conversation_id, user_id):
        """Get count of unread messages for user in conversation"""
        read_record = cls.query.filter(
            cls.conversation_id == conversation_id,
            cls.user_id == user_id
        ).first()
        
        if not read_record:
            # No read record = all messages are unread
            return Message.query.filter(
                Message.conversation_id == conversation_id,
                Message.sender_id != user_id,  # Don't count own messages
                Message.is_deleted == False
            ).count()
        
        # Count messages after the watermark
        return Message.query.filter(
            Message.conversation_id == conversation_id,
            Message.sender_id != user_id,
            Message.id > read_record.up_to_message_id,  # ULID comparison
            Message.is_deleted == False
        ).count()


class UserBlock(db.Model):
    """Bloqueos entre usuarios para moderación"""
    __tablename__ = 'user_blocks'
    
    # Composite primary key
    blocker_id = db.Column(db.Integer, db.ForeignKey('users.id', ondelete='CASCADE'), primary_key=True)
    blocked_id = db.Column(db.Integer, db.ForeignKey('users.id', ondelete='CASCADE'), primary_key=True)
    
    reason = db.Column(db.String(255), nullable=True)  # Optional reason
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    
    # Ensure user can't block themselves
    __table_args__ = (
        db.CheckConstraint('blocker_id != blocked_id', name='check_no_self_block'),
    )
    
    @classmethod
    def is_blocked(cls, user_id, other_user_id):
        """Check if users have blocked each other"""
        return cls.query.filter(
            db.or_(
                db.and_(cls.blocker_id == user_id, cls.blocked_id == other_user_id),
                db.and_(cls.blocker_id == other_user_id, cls.blocked_id == user_id)
            )
        ).first() is not None
    
    @classmethod
    def create_block(cls, blocker_id, blocked_id, reason=None):
        """Create a block relationship"""
        if blocker_id == blocked_id:
            raise ValueError("User cannot block themselves")
        
        existing = cls.query.filter(
            cls.blocker_id == blocker_id,
            cls.blocked_id == blocked_id
        ).first()
        
        if existing:
            return existing, False
        
        block = cls(
            blocker_id=blocker_id,
            blocked_id=blocked_id,
            reason=reason
        )
        db.session.add(block)
        return block, True
