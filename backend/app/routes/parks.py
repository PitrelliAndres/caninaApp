"""
Rutas de parques
"""
from flask import Blueprint, request, jsonify, current_app
from app import db
from app.models import Park, Visit
from app.utils.auth import login_required
from app.utils.jwt_validator import decode_token
import jwt
from sqlalchemy import func
from datetime import datetime, timedelta

parks_bp = Blueprint('parks', __name__)

@parks_bp.route('', methods=['GET'])
def get_parks():
    """Obtener lista de parques con filtros"""
    try:
        # Parámetros de filtrado
        neighborhood = request.args.get('neighborhood')
        search = request.args.get('search')
        lat = request.args.get('lat', type=float)
        lng = request.args.get('lng', type=float)
        radius = request.args.get('radius', type=float, default=5.0)  # km
        
        query = Park.query.filter_by(is_active=True)
        
        # Filtrar por barrio
        if neighborhood and neighborhood != 'all':
            query = query.filter(Park.neighborhood == neighborhood)
        
        # Buscar por nombre
        if search:
            query = query.filter(Park.name.ilike(f'%{search}%'))
        
        # Filtrar por proximidad
        if lat and lng:
            # Fórmula de Haversine simplificada para distancia
            # En producción usar PostGIS o similar
            query = query.filter(
                func.sqrt(
                    func.pow(Park.latitude - lat, 2) + 
                    func.pow(Park.longitude - lng, 2)
                ) * 111 <= radius  # Aproximación: 1 grado ≈ 111km
            )
        
        parks = query.all()
        
        # Check if user is authenticated for enhanced data
        is_authenticated = False
        user_id = None
        
        auth_header = request.headers.get('Authorization')
        if auth_header and auth_header.startswith('Bearer '):
            try:
                token = auth_header.split(' ')[1]
                payload = decode_token(token, 'access')
                is_authenticated = True
                user_id = payload.get('user_id')
            except:
                # TODO: Log invalid token attempt for security monitoring
                pass
        
        # Build parks data with auth-based limiting
        parks_data = []
        for park in parks:
            park_dict = park.to_dict()
            
            if is_authenticated:
                # Authenticated users get full data including visit stats
                today = datetime.utcnow().date()
                active_visits = Visit.query.filter(
                    Visit.park_id == park.id,
                    Visit.date == today,
                    Visit.status == 'scheduled'
                ).count()
                
                park_dict['active_visits_today'] = active_visits
                
                # Add user-specific data if authenticated
                user_visit_today = Visit.query.filter(
                    Visit.park_id == park.id,
                    Visit.user_id == user_id,
                    Visit.date == today
                ).first()
                
                park_dict['user_has_visit_today'] = user_visit_today is not None
            else:
                # TODO: Public users get limited data for privacy
                # Remove sensitive information
                park_dict.pop('created_at', None)
                park_dict.pop('updated_at', None)
                park_dict['active_visits_today'] = None  # Hide counts for non-auth users
                
            parks_data.append(park_dict)
        
        return jsonify({
            'parks': parks_data,
            'total': len(parks_data)
        }), 200
        
    except Exception as e:
        current_app.logger.error(f"Get parks error: {str(e)}")
        return jsonify({'error': 'Internal server error'}), 500

@parks_bp.route('/neighborhoods', methods=['GET'])
def get_neighborhoods():
    """Obtener lista de barrios disponibles"""
    try:
        neighborhoods = db.session.query(Park.neighborhood).distinct().order_by(Park.neighborhood).all()
        
        return jsonify({
            'neighborhoods': [n[0] for n in neighborhoods]
        }), 200
        
    except Exception as e:
        current_app.logger.error(f"Get neighborhoods error: {str(e)}")
        return jsonify({'error': 'Internal server error'}), 500

@parks_bp.route('/<int:park_id>', methods=['GET'])
def get_park_detail(park_id):
    """Obtener detalle de un parque"""
    try:
        park = Park.query.get(park_id)
        if not park or not park.is_active:
            return jsonify({'error': 'Park not found'}), 404
        
        park_data = park.to_dict(include_stats=True)
        
        # Agregar horarios populares
        popular_times = db.session.query(
            Visit.time,
            func.count(Visit.id).label('count')
        ).filter(
            Visit.park_id == park_id,
            Visit.date >= datetime.utcnow().date() - timedelta(days=30)
        ).group_by(Visit.time).order_by(func.count(Visit.id).desc()).limit(5).all()
        
        park_data['popular_times'] = [
            {'time': t[0].strftime('%H:%M'), 'visits': t[1]} 
            for t in popular_times
        ]
        
        return jsonify(park_data), 200
        
    except Exception as e:
        current_app.logger.error(f"Get park detail error: {str(e)}")
        return jsonify({'error': 'Internal server error'}), 500

@parks_bp.route('/<int:park_id>/visitors', methods=['GET'])
@login_required
def get_park_visitors(park_id):
    """Obtener visitantes actuales/próximos de un parque"""
    try:
        park = Park.query.get(park_id)
        if not park:
            return jsonify({'error': 'Park not found'}), 404
        
        # Solo mostrar si el usuario tiene una visita programada al mismo parque
        user_visit = Visit.query.filter_by(
            user_id=request.current_user_id,
            park_id=park_id,
            status='scheduled'
        ).filter(Visit.date >= datetime.utcnow().date()).first()
        
        if not user_visit:
            return jsonify({'error': 'You must have a scheduled visit to see other visitors'}), 403
        
        # Obtener otros visitantes en horarios similares
        time_range_start = (datetime.combine(user_visit.date, user_visit.time) - timedelta(hours=1)).time()
        time_range_end = (datetime.combine(user_visit.date, user_visit.time) + timedelta(hours=1)).time()
        
        visits = Visit.query.filter(
            Visit.park_id == park_id,
            Visit.date == user_visit.date,
            Visit.time >= time_range_start,
            Visit.time <= time_range_end,
            Visit.status == 'scheduled',
            Visit.user_id != request.current_user_id
        ).join(Visit.user).filter(User.is_public == True).all()
        
        visitors = []
        for visit in visits:
            visitor_data = {
                'user_id': visit.user.id,
                'nickname': visit.user.nickname,
                'time': visit.time.strftime('%H:%M'),
                'dog': visit.user.dog.to_dict() if visit.user.dog else None
            }
            visitors.append(visitor_data)
        
        return jsonify({
            'visitors': visitors,
            'total': len(visitors)
        }), 200
        
    except Exception as e:
        current_app.logger.error(f"Get park visitors error: {str(e)}")
        return jsonify({'error': 'Internal server error'}), 500
