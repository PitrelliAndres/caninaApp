"""
Rutas de sistema de matches
"""
from flask import Blueprint, request, jsonify, current_app
from app import db
from app.models import Match, User
from app.utils.auth import login_required
from app.services.match_service import MatchService
from app.services.notification_service import NotificationService
from datetime import datetime

matches_bp = Blueprint('matches', __name__)

@matches_bp.route('/suggestions', methods=['GET'])
@login_required
def get_match_suggestions():
    """Obtener sugerencias de match"""
    try:
        # Verificar que el usuario permite matching
        user = User.query.get(request.current_user_id)
        if not user or not user.allow_matching:
            return jsonify({'error': 'Matching is disabled for your account'}), 403
        
        # Obtener sugerencias
        suggestions = MatchService.get_suggestions(request.current_user_id)
        
        return jsonify({
            'suggestions': suggestions,
            'total': len(suggestions)
        }), 200
        
    except Exception as e:
        current_app.logger.error(f"Get suggestions error: {str(e)}")
        return jsonify({'error': 'Internal server error'}), 500

@matches_bp.route('', methods=['POST'])
@login_required
def create_match():
    """Crear match (like/pass)"""
    try:
        data = request.get_json()
        target_user_id = data.get('target_user_id')
        action = data.get('action')  # 'like' o 'pass'
        
        if not target_user_id or action not in ['like', 'pass']:
            return jsonify({'error': 'Invalid request'}), 400
        
        # Verificar que el usuario objetivo existe y permite matching
        target_user = User.query.get(target_user_id)
        if not target_user or not target_user.allow_matching:
            return jsonify({'error': 'Invalid target user'}), 400
        
        # Si es "pass", solo registrar para no mostrar de nuevo
        if action == 'pass':
            match = Match(
                user_id=request.current_user_id,
                matched_user_id=target_user_id,
                match_type='pass',
                created_at=datetime.utcnow()
            )
            db.session.add(match)
            db.session.commit()
            
            return jsonify({'message': 'Passed'}), 200
        
        # Si es "like", verificar match mutuo
        match, is_mutual = Match.create_match(
            request.current_user_id,
            target_user_id,
            match_type='manual'
        )
        
        # Si es match mutuo, crear conversación y notificar
        if is_mutual:
            from app.models import Conversation
            
            # Crear conversación
            conversation = Conversation(
                user1_id=min(request.current_user_id, target_user_id),
                user2_id=max(request.current_user_id, target_user_id),
                created_at=datetime.utcnow()
            )
            db.session.add(conversation)
            db.session.commit()
            
            # Notificar a ambos usuarios
            NotificationService.notify_new_match(request.current_user_id, target_user_id)
        
        return jsonify({
            'message': 'Like registered',
            'is_mutual': is_mutual,
            'match_id': match.id if is_mutual else None
        }), 201
        
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"Create match error: {str(e)}")
        return jsonify({'error': 'Internal server error'}), 500

@matches_bp.route('/mutual', methods=['GET'])
@login_required
def get_mutual_matches():
    """Obtener matches mutuos"""
    try:
        # Obtener matches mutuos del usuario
        matches = Match.query.filter(
            Match.user_id == request.current_user_id,
            Match.is_mutual == True
        ).order_by(Match.mutual_at.desc()).all()
        
        match_list = []
        for match in matches:
            matched_user = User.query.get(match.matched_user_id)
            if matched_user and matched_user.is_active:
                match_data = {
                    'match_id': match.id,
                    'user': {
                        'id': matched_user.id,
                        'nickname': matched_user.nickname,
                        'avatar_url': matched_user.avatar_url,
                        'dog': matched_user.dog.to_dict() if matched_user.dog else None
                    },
                    'matched_at': match.mutual_at.isoformat() if match.mutual_at else None,
                    'compatibility_score': match.compatibility_score
                }
                match_list.append(match_data)
        
        return jsonify({
            'matches': match_list,
            'total': len(match_list)
        }), 200
        
    except Exception as e:
        current_app.logger.error(f"Get mutual matches error: {str(e)}")
        return jsonify({'error': 'Internal server error'}), 500

@matches_bp.route('/<int:match_id>', methods=['DELETE'])
@login_required
def unmatch(match_id):
    """Deshacer match"""
    try:
        # Buscar el match
        match = Match.query.get(match_id)
        if not match or match.user_id != request.current_user_id:
            return jsonify({'error': 'Match not found'}), 404
        
        # Si era mutuo, también eliminar el match inverso
        if match.is_mutual:
            reverse_match = Match.query.filter_by(
                user_id=match.matched_user_id,
                matched_user_id=request.current_user_id
            ).first()
            
            if reverse_match:
                db.session.delete(reverse_match)
            
            # También eliminar la conversación si existe
            from app.models import Conversation
            conversation = Conversation.query.filter(
                or_(
                    and_(Conversation.user1_id == request.current_user_id,
                         Conversation.user2_id == match.matched_user_id),
                    and_(Conversation.user1_id == match.matched_user_id,
                         Conversation.user2_id == request.current_user_id)
                )
            ).first()
            
            if conversation:
                db.session.delete(conversation)
        
        db.session.delete(match)
        db.session.commit()
        
        return jsonify({'message': 'Unmatched successfully'}), 200
        
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"Unmatch error: {str(e)}")
        return jsonify({'error': 'Internal server error'}), 500
