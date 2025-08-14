"""
Script para poblar la base de datos con mensajes y conversaciones de prueba
"""
import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from datetime import datetime, timedelta
from app import create_app, db
from app.models import User, Message, Conversation, Match
from app.utils.message_ids import generate_message_id
import random

app = create_app()

def create_test_users():
    """Crear usuarios de prueba si no existen"""
    users = []
    
    # Usuario 1 - María
    user1 = User.query.filter_by(email='maria.gonzalez@example.com').first()
    if not user1:
        user1 = User(
            google_id='google-maria-123',
            email='maria.gonzalez@example.com',
            name='María González',
            nickname='María',
            age=28,
            avatar_url='https://i.pravatar.cc/150?img=1',
            is_active=True,
            is_online=True
        )
        db.session.add(user1)
        users.append(user1)
    else:
        users.append(user1)
    
    # Usuario 2 - Carlos
    user2 = User.query.filter_by(email='carlos.martinez@example.com').first()
    if not user2:
        user2 = User(
            google_id='google-carlos-456',
            email='carlos.martinez@example.com',
            name='Carlos Martínez',
            nickname='Carlos',
            age=32,
            avatar_url='https://i.pravatar.cc/150?img=3',
            is_active=True,
            is_online=False
        )
        db.session.add(user2)
        users.append(user2)
    else:
        users.append(user2)
    
    # Usuario 3 - Ana
    user3 = User.query.filter_by(email='ana.lopez@example.com').first()
    if not user3:
        user3 = User(
            google_id='google-ana-789',
            email='ana.lopez@example.com',
            name='Ana López',
            nickname='Ana',
            age=26,
            avatar_url='https://i.pravatar.cc/150?img=5',
            is_active=True,
            is_online=True
        )
        db.session.add(user3)
        users.append(user3)
    else:
        users.append(user3)
    
    db.session.commit()
    return users

def create_matches(users):
    """Crear matches mutuos entre usuarios"""
    # Match entre usuario 1 y 2
    match1 = Match.query.filter_by(
        user_id=users[0].id,
        matched_user_id=users[1].id
    ).first()
    
    if not match1:
        match1 = Match(
            user_id=users[0].id,
            matched_user_id=users[1].id,
            is_mutual=True
        )
        db.session.add(match1)
        
        match2 = Match(
            user_id=users[1].id,
            matched_user_id=users[0].id,
            is_mutual=True
        )
        db.session.add(match2)
    
    # Match entre usuario 1 y 3
    match3 = Match.query.filter_by(
        user_id=users[0].id,
        matched_user_id=users[2].id
    ).first()
    
    if not match3:
        match3 = Match(
            user_id=users[0].id,
            matched_user_id=users[2].id,
            is_mutual=True
        )
        db.session.add(match3)
        
        match4 = Match(
            user_id=users[2].id,
            matched_user_id=users[0].id,
            is_mutual=True
        )
        db.session.add(match4)
    
    db.session.commit()

def create_conversations_and_messages(users):
    """Crear conversaciones y mensajes de prueba"""
    
    # Conversación 1: María (users[0]) y Carlos (users[1])
    conv1 = Conversation.get_or_create_conversation(users[0].id, users[1].id)
    
    # Mensajes para conversación 1
    messages_conv1 = [
        {
            'sender': users[0].id,
            'receiver': users[1].id,
            'text': '¡Hola Carlos! Vi que también tienes un Golden Retriever 🐕',
            'minutes_ago': 120
        },
        {
            'sender': users[1].id,
            'receiver': users[0].id,
            'text': '¡Hola María! Sí, se llama Max. ¿Cómo se llama el tuyo?',
            'minutes_ago': 115
        },
        {
            'sender': users[0].id,
            'receiver': users[1].id,
            'text': 'La mía se llama Luna. Tiene 3 años y es súper juguetona',
            'minutes_ago': 110
        },
        {
            'sender': users[1].id,
            'receiver': users[0].id,
            'text': '¡Qué coincidencia! Max también tiene 3 años. ¿Sueles ir al Parque Centenario?',
            'minutes_ago': 105
        },
        {
            'sender': users[0].id,
            'receiver': users[1].id,
            'text': 'Sí! Voy casi todos los días por la tarde, alrededor de las 5pm',
            'minutes_ago': 100
        },
        {
            'sender': users[1].id,
            'receiver': users[0].id,
            'text': 'Genial, yo también voy seguido. ¿Te parece si nos encontramos mañana?',
            'minutes_ago': 95
        },
        {
            'sender': users[0].id,
            'receiver': users[1].id,
            'text': '¡Me encantaría! Luna necesita socializar más con otros perros',
            'minutes_ago': 90
        },
        {
            'sender': users[1].id,
            'receiver': users[0].id,
            'text': 'Perfecto, nos vemos mañana a las 5pm en la zona de perros grandes',
            'minutes_ago': 85
        },
        {
            'sender': users[0].id,
            'receiver': users[1].id,
            'text': 'Dale! Llevo algunas pelotas y juguetes para que jueguen',
            'minutes_ago': 80
        },
        {
            'sender': users[1].id,
            'receiver': users[0].id,
            'text': 'Excelente! Max va a estar feliz. Hasta mañana entonces 👋',
            'minutes_ago': 75
        }
    ]
    
    # Conversación 2: María (users[0]) y Ana (users[2])
    conv2 = Conversation.get_or_create_conversation(users[0].id, users[2].id)
    
    # Mensajes para conversación 2
    messages_conv2 = [
        {
            'sender': users[2].id,
            'receiver': users[0].id,
            'text': 'Hola María! Vi tu perfil y me encantó Luna 😍',
            'minutes_ago': 60
        },
        {
            'sender': users[0].id,
            'receiver': users[2].id,
            'text': '¡Hola Ana! Gracias! Vi que tienes un Beagle, son hermosos',
            'minutes_ago': 55
        },
        {
            'sender': users[2].id,
            'receiver': users[0].id,
            'text': 'Sí, se llama Toby. Es muy energético pero súper cariñoso',
            'minutes_ago': 50
        },
        {
            'sender': users[0].id,
            'receiver': users[2].id,
            'text': '¿Hace cuánto lo tienes? Luna llegó a casa hace 2 años',
            'minutes_ago': 45
        },
        {
            'sender': users[2].id,
            'receiver': users[0].id,
            'text': 'Toby tiene 4 años, lo adopté cuando era cachorro',
            'minutes_ago': 40
        },
        {
            'sender': users[0].id,
            'receiver': users[2].id,
            'text': '¡Qué lindo! ¿A qué parque sueles llevarlo?',
            'minutes_ago': 35
        },
        {
            'sender': users[2].id,
            'receiver': users[0].id,
            'text': 'Generalmente voy al Parque Rivadavia, está cerca de casa',
            'minutes_ago': 30
        },
        {
            'sender': users[0].id,
            'receiver': users[2].id,
            'text': 'Ah, yo a veces voy ahí también! Es muy lindo',
            'minutes_ago': 25
        },
        {
            'sender': users[2].id,
            'receiver': users[0].id,
            'text': '¿Te gustaría que organicemos una juntada de perros el fin de semana?',
            'minutes_ago': 20
        },
        {
            'sender': users[0].id,
            'receiver': users[2].id,
            'text': 'Me encanta la idea! Podríamos hacer un grupo con más dueños',
            'minutes_ago': 15
        },
        {
            'sender': users[2].id,
            'receiver': users[0].id,
            'text': 'Siii! Conozco a otros dueños que seguro se suman',
            'minutes_ago': 10
        },
        {
            'sender': users[0].id,
            'receiver': users[2].id,
            'text': 'Genial! Armemos un grupo de WhatsApp para coordinar',
            'minutes_ago': 5
        },
        {
            'sender': users[2].id,
            'receiver': users[0].id,
            'text': 'Dale! Te paso mi número: +54 11 1234-5678',
            'minutes_ago': 2,
            'is_read': False  # Mensaje no leído
        }
    ]
    
    # Crear mensajes para conversación 1
    last_message_conv1 = None
    for msg_data in messages_conv1:
        # Check if message already exists
        existing = Message.query.filter_by(
            sender_id=msg_data['sender'],
            receiver_id=msg_data['receiver'],
            text=msg_data['text']
        ).first()
        
        if not existing:
            msg = Message(
                id=generate_message_id(),
                sender_id=msg_data['sender'],
                receiver_id=msg_data['receiver'],
                text=msg_data['text'],
                created_at=datetime.utcnow() - timedelta(minutes=msg_data['minutes_ago']),
                is_read=msg_data.get('is_read', True)
            )
            db.session.add(msg)
            last_message_conv1 = msg
    
    if last_message_conv1:
        conv1.update_last_message(last_message_conv1)
    
    # Crear mensajes para conversación 2
    last_message_conv2 = None
    for msg_data in messages_conv2:
        # Check if message already exists
        existing = Message.query.filter_by(
            sender_id=msg_data['sender'],
            receiver_id=msg_data['receiver'],
            text=msg_data['text']
        ).first()
        
        if not existing:
            msg = Message(
                id=generate_message_id(),
                sender_id=msg_data['sender'],
                receiver_id=msg_data['receiver'],
                text=msg_data['text'],
                created_at=datetime.utcnow() - timedelta(minutes=msg_data['minutes_ago']),
                is_read=msg_data.get('is_read', True)
            )
            db.session.add(msg)
            last_message_conv2 = msg
    
    if last_message_conv2:
        conv2.update_last_message(last_message_conv2)
    
    db.session.commit()
    
    return [conv1, conv2]

def main():
    """Función principal para ejecutar el seed"""
    with app.app_context():
        print("🌱 Iniciando seed de mensajes y conversaciones...")
        
        # Crear usuarios
        print("👤 Creando usuarios de prueba...")
        users = create_test_users()
        print(f"✅ {len(users)} usuarios creados/encontrados")
        
        # Crear matches
        print("🤝 Creando matches entre usuarios...")
        create_matches(users)
        print("✅ Matches creados")
        
        # Crear conversaciones y mensajes
        print("💬 Creando conversaciones y mensajes...")
        conversations = create_conversations_and_messages(users)
        print(f"✅ {len(conversations)} conversaciones creadas con mensajes")
        
        # Mostrar resumen
        print("\n📊 Resumen:")
        print(f"  - Usuarios: {User.query.count()}")
        print(f"  - Conversaciones: {Conversation.query.count()}")
        print(f"  - Mensajes: {Message.query.count()}")
        print(f"  - Matches: {Match.query.count()}")
        
        print("\n✨ Seed completado exitosamente!")
        print("\n🔑 Usuarios de prueba creados:")
        for user in users:
            print(f"  - {user.email} (ID: {user.id})")

if __name__ == '__main__':
    main()