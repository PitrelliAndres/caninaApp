"""
Servicio de notificaciones (para futuras implementaciones)
"""
from app import db
from app.models import User

class NotificationService:
    @staticmethod
    def notify_new_match(user1_id, user2_id):
        """Notificar nuevo match mutuo"""
        # TODO: Implementar notificaciones push/email
        pass
    
    @staticmethod
    def notify_new_message(sender_id, receiver_id, message):
        """Notificar nuevo mensaje"""
        # TODO: Implementar notificaciones push/email
        pass
    
    @staticmethod
    def notify_upcoming_visit(user_id, visit):
        """Recordatorio de visita próxima"""
        # TODO: Implementar notificaciones push/email
        pass
