"""
Script para verificar usuarios existentes y crear mensajes de prueba
"""
import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from datetime import datetime, timedelta
from app import create_app, db
from app.models import User, Message, Conversation, Match
from app.utils.message_ids import generate_message_id

app = create_app()

def check_existing_users():
    """Verificar qué usuarios existen en la base de datos"""
    with app.app_context():
        print("=" * 60)
        print("USUARIOS EXISTENTES EN LA BASE DE DATOS")
        print("=" * 60)
        
        users = User.query.all()
        
        if not users:
            print("[X] No hay usuarios en la base de datos")
            print("\nPor favor, crea usuarios primero usando el onboarding o registro")
            return []
        
        print(f"\n[OK] Se encontraron {len(users)} usuarios:\n")
        
        for i, user in enumerate(users, 1):
            print(f"{i}. {user.name or 'Sin nombre'}")
            print(f"   Email: {user.email}")
            print(f"   ID: {user.id}")
            print(f"   Nickname: {user.nickname or 'Sin nickname'}")
            print(f"   Google ID: {user.google_id}")
            print(f"   Creado: {user.created_at}")
            print(f"   Activo: {'Si' if user.is_active else 'No'}")
            print("-" * 40)
        
        return users

def create_dummy_users_for_chat(main_user):
    """Crear usuarios dummy para chatear con el usuario principal"""
    dummy_users = []
    
    # Usuario dummy 1 - Carlos
    carlos = User.query.filter_by(email='carlos.dummy@parkdog.com').first()
    if not carlos:
        carlos = User(
            google_id='dummy-carlos-123',
            email='carlos.dummy@parkdog.com',
            name='Carlos Rodríguez',
            nickname='Carlos',
            age=32,
            avatar_url='https://i.pravatar.cc/150?img=3',
            is_active=True,
            is_online=True
        )
        db.session.add(carlos)
        dummy_users.append(carlos)
        print(f"[OK] Usuario dummy creado: Carlos (ID sera asignado)")
    else:
        dummy_users.append(carlos)
        print(f"[OK] Usuario dummy existente: Carlos (ID: {carlos.id})")
    
    # Usuario dummy 2 - Ana
    ana = User.query.filter_by(email='ana.dummy@parkdog.com').first()
    if not ana:
        ana = User(
            google_id='dummy-ana-456',
            email='ana.dummy@parkdog.com',
            name='Ana Martínez',
            nickname='Ana',
            age=28,
            avatar_url='https://i.pravatar.cc/150?img=5',
            is_active=True,
            is_online=False
        )
        db.session.add(ana)
        dummy_users.append(ana)
        print(f"[OK] Usuario dummy creado: Ana (ID sera asignado)")
    else:
        dummy_users.append(ana)
        print(f"[OK] Usuario dummy existente: Ana (ID: {ana.id})")
    
    db.session.commit()
    return dummy_users

def create_matches_and_conversations(main_user, dummy_users):
    """Crear matches y conversaciones entre el usuario principal y los dummy"""
    
    for dummy_user in dummy_users:
        # Crear match mutuo
        match1 = Match.query.filter_by(
            user_id=main_user.id,
            matched_user_id=dummy_user.id
        ).first()
        
        if not match1:
            match1 = Match(
                user_id=main_user.id,
                matched_user_id=dummy_user.id,
                is_mutual=True
            )
            db.session.add(match1)
            
            match2 = Match(
                user_id=dummy_user.id,
                matched_user_id=main_user.id,
                is_mutual=True
            )
            db.session.add(match2)
            print(f"[OK] Match creado entre {main_user.nickname} y {dummy_user.nickname}")
    
    db.session.commit()

def create_chat_messages(main_user, dummy_users):
    """Crear mensajes de chat entre el usuario principal y los usuarios dummy"""
    
    conversations_created = []
    
    # Conversación 1: Usuario principal con Carlos
    if len(dummy_users) > 0:
        carlos = dummy_users[0]
        conv1 = Conversation.get_or_create_conversation(main_user.id, carlos.id)
        
        messages_conv1 = [
            {
                'sender': carlos.id,
                'receiver': main_user.id,
                'text': f'Hola {main_user.nickname or "amigo"}! Vi que tambien tienes perro',
                'minutes_ago': 120
            },
            {
                'sender': main_user.id,
                'receiver': carlos.id,
                'text': 'Hola Carlos! Si, tengo un Golden Retriever',
                'minutes_ago': 115
            },
            {
                'sender': carlos.id,
                'receiver': main_user.id,
                'text': 'Genial! Yo tengo un Labrador. Como se llama el tuyo?',
                'minutes_ago': 110
            },
            {
                'sender': main_user.id,
                'receiver': carlos.id,
                'text': 'Se llama Max, tiene 3 anos. Y el tuyo?',
                'minutes_ago': 105
            },
            {
                'sender': carlos.id,
                'receiver': main_user.id,
                'text': 'El mio se llama Rocky, tiene 4 anos. Sueles ir al Parque Centenario?',
                'minutes_ago': 100
            },
            {
                'sender': main_user.id,
                'receiver': carlos.id,
                'text': 'Si, voy seguido por las tardes. Tu tambien?',
                'minutes_ago': 95
            },
            {
                'sender': carlos.id,
                'receiver': main_user.id,
                'text': 'Si! Generalmente voy despues de las 5pm. Te parece si nos encontramos un dia?',
                'minutes_ago': 90
            },
            {
                'sender': main_user.id,
                'receiver': carlos.id,
                'text': 'Me parece genial! Que tal manana a las 5:30pm?',
                'minutes_ago': 85
            },
            {
                'sender': carlos.id,
                'receiver': main_user.id,
                'text': 'Perfecto! Nos vemos en la zona de perros grandes',
                'minutes_ago': 80
            },
            {
                'sender': main_user.id,
                'receiver': carlos.id,
                'text': 'Dale! Llevo algunas pelotas para que jueguen',
                'minutes_ago': 75
            },
            {
                'sender': carlos.id,
                'receiver': main_user.id,
                'text': 'Excelente! Rocky va a estar feliz. Hasta manana!',
                'minutes_ago': 70,
                'is_read': False  # Último mensaje no leído
            }
        ]
        
        # Crear mensajes
        last_message = None
        for msg_data in messages_conv1:
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
                last_message = msg
        
        if last_message:
            conv1.update_last_message(last_message)
        conversations_created.append(conv1)
        print(f"[OK] Conversacion creada: {main_user.nickname} con Carlos")
    
    # Conversación 2: Usuario principal con Ana
    if len(dummy_users) > 1:
        ana = dummy_users[1]
        conv2 = Conversation.get_or_create_conversation(main_user.id, ana.id)
        
        messages_conv2 = [
            {
                'sender': ana.id,
                'receiver': main_user.id,
                'text': f'Hola {main_user.nickname or "vecino"}! Vi tu perfil, que lindo perro tienes',
                'minutes_ago': 60
            },
            {
                'sender': main_user.id,
                'receiver': ana.id,
                'text': 'Hola Ana! Gracias! Vi que tienes un Beagle, son hermosos',
                'minutes_ago': 55
            },
            {
                'sender': ana.id,
                'receiver': main_user.id,
                'text': 'Si, se llama Toby. Es muy energetico pero super carinoso',
                'minutes_ago': 50
            },
            {
                'sender': main_user.id,
                'receiver': ana.id,
                'text': 'Hace cuanto lo tienes?',
                'minutes_ago': 45
            },
            {
                'sender': ana.id,
                'receiver': main_user.id,
                'text': 'Lo adopte hace 2 anos cuando era cachorro. Y tu?',
                'minutes_ago': 40
            },
            {
                'sender': main_user.id,
                'receiver': ana.id,
                'text': 'El mio tiene 3 anos, lo tengo desde cachorro tambien',
                'minutes_ago': 35
            },
            {
                'sender': ana.id,
                'receiver': main_user.id,
                'text': 'A que parque sueles llevarlo?',
                'minutes_ago': 30
            },
            {
                'sender': main_user.id,
                'receiver': ana.id,
                'text': 'Generalmente voy al Parque Centenario o al Rivadavia',
                'minutes_ago': 25
            },
            {
                'sender': ana.id,
                'receiver': main_user.id,
                'text': 'Yo tambien voy al Rivadavia! Esta cerca de casa',
                'minutes_ago': 20
            },
            {
                'sender': main_user.id,
                'receiver': ana.id,
                'text': 'Que bueno! Podriamos encontrarnos algun dia',
                'minutes_ago': 15
            },
            {
                'sender': ana.id,
                'receiver': main_user.id,
                'text': 'Me encantaria! Podemos organizar una juntada de perros',
                'minutes_ago': 10
            },
            {
                'sender': main_user.id,
                'receiver': ana.id,
                'text': 'Buena idea! Conozco otros dueños que podrían sumarse',
                'minutes_ago': 5
            },
            {
                'sender': ana.id,
                'receiver': main_user.id,
                'text': 'Genial! Armemos un grupo para coordinar. Te paso mi WhatsApp?',
                'minutes_ago': 2,
                'is_read': False  # Último mensaje no leído
            }
        ]
        
        # Crear mensajes
        last_message = None
        for msg_data in messages_conv2:
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
                last_message = msg
        
        if last_message:
            conv2.update_last_message(last_message)
        conversations_created.append(conv2)
        print(f"[OK] Conversacion creada: {main_user.nickname} con Ana")
    
    db.session.commit()
    return conversations_created

def main():
    """Función principal"""
    with app.app_context():
        print("\n" + "=" * 60)
        print("SCRIPT DE VERIFICACION Y SEED DE MENSAJES")
        print("=" * 60)
        
        # Verificar usuarios existentes
        users = check_existing_users()
        
        if not users:
            print("\n[!] No se pueden crear mensajes sin usuarios")
            print("Por favor, registra al menos un usuario primero")
            return
        
        print("\n" + "=" * 60)
        print("SELECCION DE USUARIO")
        print("=" * 60)
        
        # Si hay un solo usuario, usarlo automáticamente
        if len(users) == 1:
            main_user = users[0]
            print(f"\n[OK] Usando el unico usuario disponible: {main_user.email}")
        else:
            # Si hay múltiples usuarios, usar el primero por defecto
            main_user = users[0]
            print(f"\n[OK] Usando el primer usuario: {main_user.email}")
            print(f"   (Para cambiar, modifica el script)")
        
        print("\n" + "=" * 60)
        print("CREANDO USUARIOS DUMMY PARA CHAT")
        print("=" * 60)
        
        # Crear usuarios dummy
        dummy_users = create_dummy_users_for_chat(main_user)
        
        print("\n" + "=" * 60)
        print("CREANDO MATCHES")
        print("=" * 60)
        
        # Crear matches
        create_matches_and_conversations(main_user, dummy_users)
        
        print("\n" + "=" * 60)
        print("CREANDO MENSAJES DE CHAT")
        print("=" * 60)
        
        # Crear mensajes
        conversations = create_chat_messages(main_user, dummy_users)
        
        print("\n" + "=" * 60)
        print("RESUMEN FINAL")
        print("=" * 60)
        
        print(f"\n[OK] Proceso completado exitosamente!")
        print(f"\nEstadisticas:")
        print(f"  - Total usuarios: {User.query.count()}")
        print(f"  - Total conversaciones: {Conversation.query.count()}")
        print(f"  - Total mensajes: {Message.query.count()}")
        print(f"  - Total matches: {Match.query.count()}")
        
        print(f"\nUsuario principal:")
        print(f"  - Email: {main_user.email}")
        print(f"  - ID: {main_user.id}")
        print(f"  - Nickname: {main_user.nickname}")
        
        print(f"\nChats creados para {main_user.email}:")
        for i, dummy in enumerate(dummy_users, 1):
            unread = Message.query.filter_by(
                receiver_id=main_user.id,
                sender_id=dummy.id,
                is_read=False
            ).count()
            print(f"  {i}. Chat con {dummy.nickname} - {unread} mensajes sin leer")
        
        print("\n" + "=" * 60)
        print("Ahora puedes loguearte con tu cuenta de Google")
        print(f"   y ver los chats asociados a {main_user.email}!")
        print("=" * 60 + "\n")

if __name__ == '__main__':
    main()