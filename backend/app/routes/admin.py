"""
Rutas de administración con panel completo
"""
from flask import Blueprint, request, jsonify
from app import db
from app.models import User, Park, Visit, Match, UserRole
from app.utils.auth import admin_required
from sqlalchemy import func, desc
from datetime import datetime, timedelta

admin_bp = Blueprint('admin', __name__)

@admin_bp.route('/dashboard', methods=['GET'])
@admin_required
def get_dashboard_stats():
    """Obtener estadísticas del dashboard"""
    try:
        # Estadísticas generales
        total_users = User.query.count()
        active_users = User.query.filter_by(is_active=True).count()
        new_users_today = User.query.filter(
            func.date(User.created_at) == datetime.utcnow().date()
        ).count()
        
        # Estadísticas de visitas
        total_visits = Visit.query.count()
        visits_today = Visit.query.filter(
            Visit.date == datetime.utcnow().date()
        ).count()
        
        # Estadísticas de matches
        total_matches = Match.query.count()
        mutual_matches = Match.query.filter_by(is_mutual=True).count()
        matches_today = Match.query.filter(
            func.date(Match.created_at) == datetime.utcnow().date()
        ).count()
        
        # Parques más populares
        popular_parks = db.session.query(
            Park.name,
            func.count(Visit.id).label('visit_count')
        ).join(Visit).group_by(Park.id).order_by(
            desc('visit_count')
        ).limit(5).all()
        
        # Distribución de usuarios por rol
        role_distribution = db.session.query(
            User.role,
            func.count(User.id)
        ).group_by(User.role).all()
        
        return jsonify({
            'stats': {
                'users': {
                    'total': total_users,
                    'active': active_users,
                    'new_today': new_users_today
                },
                'visits': {
                    'total': total_visits,
                    'today': visits_today
                },
                'matches': {
                    'total': total_matches,
                    'mutual': mutual_matches,
                    'today': matches_today
                },
                'popular_parks': [
                    {'name': park[0], 'visits': park[1]} 
                    for park in popular_parks
                ],
                'role_distribution': {
                    role.value: count 
                    for role, count in role_distribution
                }
            }
        }), 200
        
    except Exception as e:
        current_app.logger.error(f"Dashboard stats error: {str(e)}")
        return jsonify({'error': 'Internal server error'}), 500

@admin_bp.route('/users', methods=['GET'])
@admin_required
def list_users():
    """Listar usuarios con filtros avanzados"""
    try:
        # Parámetros de búsqueda
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 20, type=int)
        search = request.args.get('search', '')
        role_filter = request.args.get('role')
        status_filter = request.args.get('status')
        sort_by = request.args.get('sort_by', 'created_at')
        sort_order = request.args.get('sort_order', 'desc')
        
        # Query base
        query = User.query
        
        # Aplicar filtros
        if search:
            query = query.filter(
                db.or_(
                    User.name.ilike(f'%{search}%'),
                    User.email.ilike(f'%{search}%'),
                    User.nickname.ilike(f'%{search}%')
                )
            )
        
        if role_filter:
            query = query.filter(User.role == UserRole(role_filter))
        
        if status_filter == 'active':
            query = query.filter(User.is_active == True)
        elif status_filter == 'inactive':
            query = query.filter(User.is_active == False)
        
        # Ordenamiento
        order_column = getattr(User, sort_by, User.created_at)
        if sort_order == 'desc':
            query = query.order_by(desc(order_column))
        else:
            query = query.order_by(order_column)
        
        # Paginación
        paginated = query.paginate(
            page=page, 
            per_page=per_page, 
            error_out=False
        )
        
        # Formatear respuesta
        users = []
        for user in paginated.items:
            user_data = {
                'id': user.id,
                'email': user.email,
                'name': user.name,
                'nickname': user.nickname,
                'age': user.age,
                'role': user.role.value,
                'is_active': user.is_active,
                'is_online': user.is_online,
                'created_at': user.created_at.isoformat() if user.created_at else None,
                'last_login': user.last_login.isoformat() if user.last_login else None,
                'visit_count': user.visits.count(),
                'match_count': Match.query.filter_by(user_id=user.id).count()
            }
            users.append(user_data)
        
        return jsonify({
            'users': users,
            'pagination': {
                'total': paginated.total,
                'pages': paginated.pages,
                'current_page': page,
                'per_page': per_page,
                'has_next': paginated.has_next,
                'has_prev': paginated.has_prev
            }
        }), 200
        
    except Exception as e:
        current_app.logger.error(f"List users error: {str(e)}")
        return jsonify({'error': 'Internal server error'}), 500

@admin_bp.route('/users/<int:user_id>/ban', methods=['POST'])
@admin_required
def ban_user(user_id):
    """Banear/desbanear usuario"""
    try:
        user = User.query.get(user_id)
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        # No permitir banear admins
        if user.role == UserRole.ADMIN:
            return jsonify({'error': 'Cannot ban admin users'}), 403
        
        data = request.get_json()
        action = data.get('action', 'ban')
        reason = data.get('reason', '')
        
        if action == 'ban':
            user.is_active = False
            user.ban_reason = reason
            user.banned_at = datetime.utcnow()
            message = f'User {user.email} has been banned'
        else:
            user.is_active = True
            user.ban_reason = None
            user.banned_at = None
            message = f'User {user.email} has been unbanned'
        
        db.session.commit()
        
        # Log action
        current_app.logger.info(f"Admin action: {message} by admin {request.current_user.email}")
        
        return jsonify({
            'message': message,
            'user': {
                'id': user.id,
                'email': user.email,
                'is_active': user.is_active
            }
        }), 200
        
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"Ban user error: {str(e)}")
        return jsonify({'error': 'Internal server error'}), 500

@admin_bp.route('/parks', methods=['POST'])
@admin_required
def create_park():
    """Crear nuevo parque"""
    try:
        data = request.get_json()
        
        # Validaciones
        required_fields = ['name', 'neighborhood', 'latitude', 'longitude']
        for field in required_fields:
            if field not in data:
                return jsonify({'error': f'{field} is required'}), 400
        
        # Crear parque
        park = Park(
            name=data['name'],
            neighborhood=data['neighborhood'],
            description=data.get('description', ''),
            address=data.get('address', ''),
            latitude=data['latitude'],
            longitude=data['longitude'],
            has_dog_area=data.get('has_dog_area', False),
            is_fenced=data.get('is_fenced', False),
            has_water=data.get('has_water', False),
            size_sqm=data.get('size_sqm'),
            photo_url=data.get('photo_url'),
            opening_hours=data.get('opening_hours', {}),
            is_active=True,
            created_at=datetime.utcnow()
        )
        
        db.session.add(park)
        db.session.commit()
        
        return jsonify({
            'message': 'Park created successfully',
            'park': park.to_dict()
        }), 201
        
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"Create park error: {str(e)}")
        return jsonify({'error': 'Internal server error'}), 500

@admin_bp.route('/parks/<int:park_id>', methods=['PUT'])
@admin_required
def update_park(park_id):
    """Actualizar parque"""
    try:
        park = Park.query.get(park_id)
        if not park:
            return jsonify({'error': 'Park not found'}), 404
        
        data = request.get_json()
        
        # Actualizar campos permitidos
        updateable_fields = [
            'name', 'neighborhood', 'description', 'address',
            'latitude', 'longitude', 'has_dog_area', 'is_fenced',
            'has_water', 'size_sqm', 'photo_url', 'opening_hours', 'is_active'
        ]
        
        for field in updateable_fields:
            if field in data:
                setattr(park, field, data[field])
        
        park.updated_at = datetime.utcnow()
        db.session.commit()
        
        return jsonify({
            'message': 'Park updated successfully',
            'park': park.to_dict()
        }), 200
        
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"Update park error: {str(e)}")
        return jsonify({'error': 'Internal server error'}), 500

@admin_bp.route('/reports', methods=['GET'])
@admin_required
def get_reports():
    """Obtener reportes del sistema"""
    try:
        report_type = request.args.get('type', 'daily')
        date_from = request.args.get('from')
        date_to = request.args.get('to')
        
        # Parsear fechas
        if date_from:
            date_from = datetime.strptime(date_from, '%Y-%m-%d')
        else:
            date_from = datetime.utcnow() - timedelta(days=7)
        
        if date_to:
            date_to = datetime.strptime(date_to, '%Y-%m-%d')
        else:
            date_to = datetime.utcnow()
        
        reports = {}
        
        # Reporte de usuarios nuevos
        new_users = db.session.query(
            func.date(User.created_at).label('date'),
            func.count(User.id).label('count')
        ).filter(
            User.created_at >= date_from,
            User.created_at <= date_to
        ).group_by(func.date(User.created_at)).all()
        
        reports['new_users'] = [
            {'date': str(item[0]), 'count': item[1]} 
            for item in new_users
        ]
        
        # Reporte de visitas
        visits = db.session.query(
            func.date(Visit.date).label('date'),
            func.count(Visit.id).label('count')
        ).filter(
            Visit.date >= date_from.date(),
            Visit.date <= date_to.date()
        ).group_by(func.date(Visit.date)).all()
        
        reports['visits'] = [
            {'date': str(item[0]), 'count': item[1]} 
            for item in visits
        ]
        
        # Reporte de matches
        matches = db.session.query(
            func.date(Match.created_at).label('date'),
            func.count(Match.id).label('total'),
            func.sum(func.cast(Match.is_mutual, db.Integer)).label('mutual')
        ).filter(
            Match.created_at >= date_from,
            Match.created_at <= date_to
        ).group_by(func.date(Match.created_at)).all()
        
        reports['matches'] = [
            {
                'date': str(item[0]), 
                'total': item[1],
                'mutual': item[2] or 0
            } 
            for item in matches
        ]
        
        return jsonify({
            'reports': reports,
            'period': {
                'from': date_from.isoformat(),
                'to': date_to.isoformat()
            }
        }), 200
        
    except Exception as e:
        current_app.logger.error(f"Get reports error: {str(e)}")
        return jsonify({'error': 'Internal server error'}), 500