"""
Modelo de Match entre usuarios
"""
from datetime import datetime
from sqlalchemy import or_, and_
from app import db

class Match(db.Model):
    """Modelo de match/like entre usuarios"""
    __tablename__ = 'matches'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    matched_user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    
    match_type = db.Column(db.String(20), default='manual')
    is_mutual = db.Column(db.Boolean, default=False)
    compatibility_score = db.Column(db.Integer)
    
    context_data = db.Column(db.JSON)
    
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    mutual_at = db.Column(db.DateTime)
    
    __table_args__ = (
        db.Index('idx_user_matches', 'user_id', 'matched_user_id'),
        db.UniqueConstraint('user_id', 'matched_user_id', name='_user_match_uc'),
    )
    
    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'matched_user_id': self.matched_user_id,
            'match_type': self.match_type,
            'is_mutual': self.is_mutual,
            'compatibility_score': self.compatibility_score,
        }
    
    @classmethod
    def create_match(cls, user_id, matched_user_id, match_type='manual', context_data=None):
        existing = cls.query.filter_by(
            user_id=user_id,
            matched_user_id=matched_user_id
        ).first()
        
        if existing:
            return existing, False
        
        match = cls(
            user_id=user_id,
            matched_user_id=matched_user_id,
            match_type=match_type,
            context_data=context_data
        )
        
        reverse_match = cls.query.filter_by(
            user_id=matched_user_id,
            matched_user_id=user_id
        ).first()
        
        if reverse_match:
            match.is_mutual = True
            match.mutual_at = datetime.utcnow()
            reverse_match.is_mutual = True
            reverse_match.mutual_at = datetime.utcnow()
        
        db.session.add(match)
        db.session.commit()
        
        return match, match.is_mutual
