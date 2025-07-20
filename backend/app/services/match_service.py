"""
Servicio de matching entre usuarios
"""
from datetime import datetime, timedelta
from sqlalchemy import and_, or_, func
from app import db
from app.models import User, Visit, Match, UserPreference
from flask import current_app
import math

class MatchService:
    @staticmethod
    def calculate_compatibility(user1_id, user2_id):
        """Calcular compatibilidad entre dos usuarios"""
        try:
            user1 = User.query.get(user1_id)
            user2 = User.query.get(user2_id)
            
            if not user1 or not user2:
                return 0
            
            scores = {}
            weights = current_app.config['MATCH_WEIGHTS']
            
            # 1. Superposición de horarios
            scores['schedule_overlap'] = MatchService._calculate_schedule_overlap(user1_id, user2_id)
            
            # 2. Intereses compartidos
            scores['interests'] = MatchService._calculate_shared_interests(user1_id, user2_id)
            
            # 3. Proximidad de parques visitados
            scores['park_proximity'] = MatchService._calculate_park_proximity(user1_id, user2_id)
            
            # 4. Compatibilidad de edad
            scores['age_compatibility'] = MatchService._calculate_age_compatibility(user1, user2)
            
            # 5. Compatibilidad de razas
            scores['breed_compatibility'] = MatchService._calculate_breed_compatibility(user1, user2)
            
            # Calcular score total ponderado
            total_score = sum(scores[key] * weights[key] for key in scores)
            
            return min(int(total_score * 100), 100)
            
        except Exception as e:
            current_app.logger.error(f"Error calculating compatibility: {str(e)}")
            return 0
    
    @staticmethod
    def _calculate_schedule_overlap(user1_id, user2_id):
        """Calcular superposición de horarios de visitas"""
        # Obtener visitas futuras de ambos usuarios
        now = datetime.utcnow()
        future_date = now + timedelta(days=30)
        
        visits1 = Visit.query.filter(
            Visit.user_id == user1_id,
            Visit.date >= now.date(),
            Visit.date <= future_date.date()
        ).all()
        
        visits2 = Visit.query.filter(
            Visit.user_id == user2_id,
            Visit.date >= now.date(),
            Visit.date <= future_date.date()
        ).all()
        
        if not visits1 or not visits2:
            return 0.5  # Score neutral si no hay datos
        
        overlap_count = 0
        for v1 in visits1:
            for v2 in visits2:
                # Mismo parque, mismo día, horario cercano
                if v1.park_id == v2.park_id and v1.date == v2.date:
                    time_diff = abs((v1.time.hour * 60 + v1.time.minute) - 
                                  (v2.time.hour * 60 + v2.time.minute))
                    if time_diff <= 60:  # Dentro de 1 hora
                        overlap_count += 1
        
        # Normalizar score
        max_overlaps = min(len(visits1), len(visits2))
        return min(overlap_count / max(max_overlaps, 1), 1.0)
    
    @staticmethod
    def _calculate_shared_interests(user1_id, user2_id):
        """Calcular intereses compartidos"""
        pref1 = UserPreference.query.filter_by(user_id=user1_id).first()
        pref2 = UserPreference.query.filter_by(user_id=user2_id).first()
        
        if not pref1 or not pref2:
            return 0.5
        
        interests1 = set(pref1.interests or [])
        interests2 = set(pref2.interests or [])
        
        if not interests1 or not interests2:
            return 0.5
        
        shared = len(interests1.intersection(interests2))
        total = len(interests1.union(interests2))
        
        return shared / total if total > 0 else 0
    
    @staticmethod
    def _calculate_park_proximity(user1_id, user2_id):
        """Calcular proximidad de parques visitados"""
        # Obtener parques únicos visitados por cada usuario
        parks1 = db.session.query(Visit.park_id).filter_by(user_id=user1_id).distinct().all()
        parks2 = db.session.query(Visit.park_id).filter_by(user_id=user2_id).distinct().all()
        
        parks1_set = {p[0] for p in parks1}
        parks2_set = {p[0] for p in parks2}
        
        if not parks1_set or not parks2_set:
            return 0.5
        
        # Parques compartidos
        shared_parks = len(parks1_set.intersection(parks2_set))
        total_parks = len(parks1_set.union(parks2_set))
        
        return shared_parks / total_parks if total_parks > 0 else 0
    
    @staticmethod
    def _calculate_age_compatibility(user1, user2):
        """Calcular compatibilidad de edad"""
        if not user1.age or not user2.age:
            return 0.5
        
        age_diff = abs(user1.age - user2.age)
        
        # Preferencia: menor diferencia es mejor
        if age_diff <= 5:
            return 1.0
        elif age_diff <= 10:
            return 0.8
        elif age_diff <= 15:
            return 0.6
        elif age_diff <= 20:
            return 0.4
        else:
            return 0.2
    
    @staticmethod
    def _calculate_breed_compatibility(user1, user2):
        """Calcular compatibilidad de razas de perros"""
        if not user1.dog or not user2.dog:
            return 0.5
        
        # Por ahora, score simple basado en tamaño similar
        # En el futuro se podría usar una matriz de compatibilidad real
        return 0.7  # Score neutral-positivo
    
    @staticmethod
    def get_suggestions(user_id, limit=10):
        """Obtener sugerencias de match para un usuario"""
        user = User.query.get(user_id)
        if not user or not user.allow_matching:
            return []
        
        # Usuarios candidatos: activos, con matching habilitado, no ya matcheados
        existing_matches = db.session.query(Match.matched_user_id).filter_by(
            user_id=user_id
        ).subquery()
        
        candidates = User.query.filter(
            User.id != user_id,
            User.is_active == True,
            User.allow_matching == True,
            ~User.id.in_(existing_matches)
        ).all()
        
        # Calcular compatibilidad para cada candidato
        suggestions = []
        for candidate in candidates:
            score = MatchService.calculate_compatibility(user_id, candidate.id)
            
            if score >= 50:  # Umbral mínimo de compatibilidad
                # Obtener intereses compartidos
                pref1 = UserPreference.query.filter_by(user_id=user_id).first()
                pref2 = UserPreference.query.filter_by(user_id=candidate.id).first()
                
                shared_interests = []
                if pref1 and pref2:
                    interests1 = set(pref1.interests or [])
                    interests2 = set(pref2.interests or [])
                    shared_interests = list(interests1.intersection(interests2))
                
                # Obtener último parque visitado
                last_visit = Visit.query.filter_by(
                    user_id=candidate.id
                ).order_by(Visit.date.desc()).first()
                
                suggestions.append({
                    'user_id': candidate.id,
                    'nickname': candidate.nickname,
                    'dog': candidate.dog.to_dict() if candidate.dog else None,
                    'park_name': last_visit.park.name if last_visit else None,
                    'compatibility': score,
                    'shared_interests': shared_interests
                })
        
        # Ordenar por compatibilidad descendente
        suggestions.sort(key=lambda x: x['compatibility'], reverse=True)
        
        return suggestions[:limit]
