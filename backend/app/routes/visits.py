"""
Rutas de visitas a parques
"""
from flask import Blueprint, request, jsonify, current_app
from app import db
from app.models import Visit, Park, User
from app.utils.auth import login_required
from app.utils.validators import validate_time_slot
from datetime import datetime, date, time
from sqlalchemy import and_, or_

visits_bp = Blueprint('visits', __name__)

@visits_bp.route('', methods=['GET'])
@login_required
def get_my_visits():
    """Obtener visitas del usuario"""
    try:
        visit_type = request.args.get('type', 'all')
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 10, type=int)
        
        query = Visit.query.filter_by(user_id=request.current_user_id)
        
        today = date.today()
        
        if visit_type == 'upcoming':
            query = query.filter(Visit.date >= today)
        elif visit_type == 'past':
            query = query.filter(Visit.date < today)
        
        # Ordenar: próximas por fecha ascendente, pasadas por fecha descendente
        if visit_type == 'upcoming':
            query = query.order_by(Visit.date.asc(), Visit.time.asc())
        else:
            query = query.order_by(Visit.date.desc(), Visit.time.desc())
        
        # Paginación
        paginated = query.paginate(page=page, per_page=per_page, error_out=False)
        
        visits = [v.to_dict() for v in paginated.items]
        
        return jsonify({
            'visits': visits,
            'total': paginated.total,
            'pages': paginated.pages,
            'current_page': page
        }), 200
        
    except Exception as e:
        current_app.logger.error(f"Get visits error: {str(e)}")
        return jsonify({'error': 'Internal server error'}), 500

@visits_bp.route('', methods=['POST'])
@login_required
def create_visit():
    """Registrar nueva visita"""
    try:
        data = request.get_json()
        
        # Validaciones
        park_id = data.get('park_id')
        visit_date = data.get('date')
        visit_time = data.get('time')
        duration = data.get('duration', '60')
        notes = data.get('notes', '')
        
        if not all([park_id, visit_date, visit_time]):
            return jsonify({'error': 'Park, date and time are required'}), 400
        
        # Validar parque
        park = Park.query.get(park_id)
        if not park or not park.is_active:
            return jsonify({'error': 'Invalid park'}), 400
        
        # Validar fecha (no en el pasado)
        try:
            visit_date_obj = datetime.strptime(visit_date, '%Y-%m-%d').date()
            if visit_date_obj < date.today():
                return jsonify({'error': 'Cannot schedule visits in the past'}), 400
        except ValueError:
            return jsonify({'error': 'Invalid date format'}), 400
        
        # Validar hora (bloques de 10 minutos)
        if not validate_time_slot(visit_time):
            return jsonify({'error': 'Invalid time format. Use HH:MM in 10-minute blocks'}), 400
        
        visit_time_obj = datetime.strptime(visit_time, '%H:%M').time()
        
        # Verificar conflictos
        if Visit.has_conflict(request.current_user_id, visit_date_obj, visit_time_obj):
            return jsonify({'error': 'You already have a visit scheduled at this time'}), 400
        
        # Crear visita
        visit = Visit(
            user_id=request.current_user_id,
            park_id=park_id,
            date=visit_date_obj,
            time=visit_time_obj,
            duration=duration,
            notes=notes[:500],  # Limitar longitud
            status='scheduled',
            created_at=datetime.utcnow()
        )
        
        db.session.add(visit)
        db.session.commit()
        
        # Notificar al sistema de matches
        from app.services.notification_service import NotificationService
        NotificationService.notify_upcoming_visit(request.current_user_id, visit)
        
        return jsonify({
            'message': 'Visit registered successfully',
            'visit': visit.to_dict()
        }), 201
        
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"Create visit error: {str(e)}")
        return jsonify({'error': 'Internal server error'}), 500

@visits_bp.route('/<int:visit_id>', methods=['DELETE'])
@login_required
def cancel_visit(visit_id):
    """Cancelar visita"""
    try:
        visit = Visit.query.get(visit_id)
        
        if not visit:
            return jsonify({'error': 'Visit not found'}), 404
        
        if visit.user_id != request.current_user_id:
            return jsonify({'error': 'Unauthorized'}), 403
        
        # Solo se pueden cancelar visitas futuras
        if visit.date < date.today():
            return jsonify({'error': 'Cannot cancel past visits'}), 400
        
        # Cambiar estado en lugar de eliminar (para mantener historial)
        visit.status = 'cancelled'
        db.session.commit()
        
        return jsonify({'message': 'Visit cancelled successfully'}), 200
        
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"Cancel visit error: {str(e)}")
        return jsonify({'error': 'Internal server error'}), 500

@visits_bp.route('/<int:visit_id>/checkin', methods=['POST'])
@login_required
def checkin_visit(visit_id):
    """Hacer check-in en una visita"""
    try:
        visit = Visit.query.get(visit_id)
        
        if not visit:
            return jsonify({'error': 'Visit not found'}), 404
        
        if visit.user_id != request.current_user_id:
            return jsonify({'error': 'Unauthorized'}), 403
        
        # Verificar que es el día y hora correctos (con margen de 30 min)
        now = datetime.utcnow()
        visit_datetime = datetime.combine(visit.date, visit.time)
        time_diff = abs((now - visit_datetime).total_seconds() / 60)
        
        if time_diff > 30:
            return jsonify({'error': 'Can only check in within 30 minutes of scheduled time'}), 400
        
        visit.checked_in_at = now
        visit.status = 'active'
        
        # Actualizar ubicación del usuario si se proporciona
        data = request.get_json()
        if data.get('latitude') and data.get('longitude'):
            user = User.query.get(request.current_user_id)
            user.last_latitude = data['latitude']
            user.last_longitude = data['longitude']
            user.last_location_update = now
        
        db.session.commit()
        
        return jsonify({'message': 'Checked in successfully'}), 200
        
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"Checkin error: {str(e)}")
        return jsonify({'error': 'Internal server error'}), 500

@visits_bp.route('/<int:visit_id>/checkout', methods=['POST'])
@login_required
def checkout_visit(visit_id):
    """Hacer check-out de una visita"""
    try:
        visit = Visit.query.get(visit_id)
        
        if not visit:
            return jsonify({'error': 'Visit not found'}), 404
        
        if visit.user_id != request.current_user_id:
            return jsonify({'error': 'Unauthorized'}), 403
        
        if visit.status != 'active':
            return jsonify({'error': 'Must check in first'}), 400
        
        visit.checked_out_at = datetime.utcnow()
        visit.status = 'completed'
        db.session.commit()
        
        return jsonify({'message': 'Checked out successfully'}), 200
        
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"Checkout error: {str(e)}")
        return jsonify({'error': 'Internal server error'}), 500
