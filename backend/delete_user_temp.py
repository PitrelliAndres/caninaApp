#!/usr/bin/env python3
"""
Script temporal para borrar usuario y todas sus relaciones
"""
import sys
import os
sys.path.insert(0, os.path.dirname(__file__))

from app import create_app, db
from app.models import User, Match, Conversation, Message, MessageRead, Visit, UserPreference

app = create_app()

with app.app_context():
    user = User.query.filter_by(email='andiyp9@gmail.com').first()
    if user:
        user_id = user.id
        print(f"Eliminando usuario {user.email} (ID: {user_id})...")

        # Borrar matches donde el usuario es el que hizo match
        Match.query.filter_by(user_id=user_id).delete()
        print("  - Matches como usuario eliminados")

        # Borrar matches donde el usuario es el matched
        Match.query.filter_by(matched_user_id=user_id).delete()
        print("  - Matches como matched_user eliminados")

        # Borrar mensajes leídos
        MessageRead.query.filter_by(user_id=user_id).delete()
        print("  - Registros de mensajes leídos eliminados")

        # Actualizar last_message_id a NULL en conversaciones
        conversations = Conversation.query.filter(
            (Conversation.user1_id == user_id) | (Conversation.user2_id == user_id)
        ).all()
        for conv in conversations:
            conv.last_message_id = None
        db.session.flush()
        print("  - Referencias a últimos mensajes eliminadas")

        # Borrar todos los mensajes (enviados y recibidos)
        Message.query.filter(
            (Message.sender_id == user_id) | (Message.receiver_id == user_id)
        ).delete(synchronize_session='fetch')
        print("  - Mensajes eliminados")

        # Borrar conversaciones donde participa
        Conversation.query.filter(
            (Conversation.user1_id == user_id) | (Conversation.user2_id == user_id)
        ).delete(synchronize_session='fetch')
        print("  - Conversaciones eliminadas")

        # Borrar visitas
        Visit.query.filter_by(user_id=user_id).delete()
        print("  - Visitas eliminadas")

        # Borrar preferencias de usuario
        UserPreference.query.filter_by(user_id=user_id).delete()
        print("  - Preferencias de usuario eliminadas")

        # Finalmente borrar el usuario (esto también borrará el dog por CASCADE)
        db.session.delete(user)
        db.session.commit()

        print(f"✅ Usuario {user.email} y todas sus relaciones eliminados exitosamente")
    else:
        print("❌ Usuario no encontrado")
