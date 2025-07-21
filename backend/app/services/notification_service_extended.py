"""
Servicio de notificaciones extendido con soporte para push, email y SMS
"""
from flask import current_app
from datetime import datetime, timedelta
import requests
from app import db
from app.models import User, Notification, NotificationPreference

class NotificationService:
    """Servicio mejorado de notificaciones"""
    
    @staticmethod
    def send_notification(user_id, notification_type, data, channels=None):
        """
        Enviar notificación por múltiples canales
        
        Args:
            user_id: ID del usuario
            notification_type: Tipo de notificación
            data: Datos de la notificación
            channels: Lista de canales ['push', 'email', 'sms'] o None para usar preferencias
        """
        user = User.query.get(user_id)
        if not user:
            return False
        
        # Obtener preferencias si no se especifican canales
        if channels is None:
            prefs = NotificationPreference.query.filter_by(user_id=user_id).first()
            if not prefs:
                channels = ['push']  # Default
            else:
                channels = []
                if prefs.push_enabled:
                    channels.append('push')
                if prefs.email_enabled:
                    channels.append('email')
                if prefs.sms_enabled:
                    channels.append('sms')
        
        # Guardar notificación en DB
        notification = Notification(
            user_id=user_id,
            type=notification_type,
            title=data.get('title'),
            body=data.get('body'),
            data=data.get('extra_data', {}),
            created_at=datetime.utcnow()
        )
        db.session.add(notification)
        db.session.commit()
        
        # Enviar por cada canal
        results = {}
        for channel in channels:
            if channel == 'push':
                results['push'] = NotificationService._send_push(user, notification)
            elif channel == 'email':
                results['email'] = NotificationService._send_email(user, notification)
            elif channel == 'sms':
                results['sms'] = NotificationService._send_sms(user, notification)
        
        return results
    
    @staticmethod
    def _send_push(user, notification):
        """Enviar notificación push via FCM"""
        if not user.fcm_token:
            return False
        
        try:
            # Aquí iría la integración con FCM
            current_app.logger.info(f"Push notification sent to user {user.id}")
            return True
        except Exception as e:
            current_app.logger.error(f"Push notification error: {str(e)}")
            return False
    
    @staticmethod
    def _send_email(user, notification):
        """Enviar notificación por email"""
        try:
            # Aquí iría la integración con servicio de email
            current_app.logger.info(f"Email notification sent to {user.email}")
            return True
        except Exception as e:
            current_app.logger.error(f"Email notification error: {str(e)}")
            return False
    
    @staticmethod
    def _send_sms(user, notification):
        """Enviar notificación por SMS"""
        if not user.phone_number:
            return False
        
        try:
            # Aquí iría la integración con servicio SMS
            current_app.logger.info(f"SMS notification sent to {user.phone_number}")
            return True
        except Exception as e:
            current_app.logger.error(f"SMS notification error: {str(e)}")
            return False
    
    @staticmethod
    def notify_new_match(user1_id, user2_id):
        """Notificar nuevo match mutuo"""
        user1 = User.query.get(user1_id)
        user2 = User.query.get(user2_id)
        
        if not user1 or not user2:
            return
        
        # Notificar a usuario 1
        NotificationService.send_notification(
            user1_id,
            'new_match',
            {
                'title': '¡Nuevo match! 🎉',
                'body': f'¡Tienes un match con {user2.nickname}! Ya pueden chatear.',
                'extra_data': {
                    'matched_user_id': user2_id,
                    'matched_user_name': user2.nickname,
                    'matched_user_avatar': user2.avatar_url
                }
            }
        )
        
        # Notificar a usuario 2
        NotificationService.send_notification(
            user2_id,
            'new_match',
            {
                'title': '¡Nuevo match! 🎉',
                'body': f'¡Tienes un match con {user1.nickname}! Ya pueden chatear.',
                'extra_data': {
                    'matched_user_id': user1_id,
                    'matched_user_name': user1.nickname,
                    'matched_user_avatar': user1.avatar_url
                }
            }
        )
    
    @staticmethod
    def notify_new_message(sender_id, receiver_id, message):
        """Notificar nuevo mensaje"""
        sender = User.query.get(sender_id)
        receiver = User.query.get(receiver_id)
        
        if not sender or not receiver:
            return
        
        # Solo notificar si el receptor no está online
        if not receiver.is_online:
            NotificationService.send_notification(
                receiver_id,
                'new_message',
                {
                    'title': f'{sender.nickname}',
                    'body': message.text[:100] + ('...' if len(message.text) > 100 else ''),
                    'extra_data': {
                        'sender_id': sender_id,
                        'sender_name': sender.nickname,
                        'sender_avatar': sender.avatar_url,
                        'message_id': message.id
                    }
                }
            )
    
    @staticmethod
    def notify_upcoming_visit(user_id, visit):
        """Recordatorio de visita próxima"""
        user = User.query.get(user_id)
        if not user:
            return
        
        NotificationService.send_notification(
            user_id,
            'visit_reminder',
            {
                'title': '🐕 Recordatorio de visita',
                'body': f'Tienes una visita programada a {visit.park.name} hoy a las {visit.time.strftime("%H:%M")}',
                'extra_data': {
                    'visit_id': visit.id,
                    'park_id': visit.park_id,
                    'park_name': visit.park.name,
                    'visit_time': visit.time.isoformat()
                }
            }
        )
    
    @staticmethod
    def schedule_visit_reminders():
        """Programar recordatorios de visitas (ejecutar cada hora)"""
        # Buscar visitas en las próximas 2 horas
        now = datetime.utcnow()
        two_hours_later = now + timedelta(hours=2)
        
        upcoming_visits = Visit.query.filter(
            Visit.date == now.date(),
            Visit.time >= now.time(),
            Visit.time <= two_hours_later.time(),
            Visit.status == 'scheduled',
            Visit.reminder_sent == False
        ).all()
        
        for visit in upcoming_visits:
            NotificationService.notify_upcoming_visit(visit.user_id, visit)
            visit.reminder_sent = True
        
        db.session.commit()
