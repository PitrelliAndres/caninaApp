"""
Script para crear chats y mensajes dummy usando usuarios existentes
"""
import sys
import os
import random
from datetime import datetime, timedelta

# Agregar el directorio backend al path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app import create_app, db
from app.models import User, Message, Conversation
from app.utils.message_ids import generate_message_id

# Mensajes de ejemplo para generar contenido realista
SAMPLE_MESSAGES = [
    # Saludos iniciales
    "¡Hola! Vi que también tienes un perro. ¿Te gustaría que se conozcan?",
    "Hola, me pareció que tenemos perros de raza similar",
    "¡Hola! ¿Qué tal? Vi tu perfil y creo que nuestros perros se llevarían bien",
    
    # Conversaciones sobre parques
    "¿Conoces el parque que está cerca de Palermo?",
    "Sí, voy seguido allí. ¿A qué hora sueles ir?",
    "Normalmente voy por las mañanas, como a las 9",
    "Perfecto, yo también prefiero las mañanas",
    
    # Sobre los perros
    "¿Qué edad tiene tu perro?",
    "Tiene 3 años, es muy juguetón",
    "¡Qué lindo! El mío tiene 2 años",
    "¿Cómo se lleva con otros perros?",
    "Muy bien, le encanta jugar",
    
    # Organizando encuentros
    "¿Te parece si nos encontramos este fin de semana?",
    "Me parece genial, ¿dónde te queda mejor?",
    "¿Qué tal en el parque de Belgrano?",
    "Perfecto, ¿a las 10 de la mañana está bien?",
    "Excelente, nos vemos ahí",
    
    # Mensajes casuales
    "¿Cómo está tu perro hoy?",
    "Muy bien, gracias por preguntar",
    "¿Fuiste al parque ayer?",
    "Sí, estuvo genial",
    "Mi perro se divirtió mucho",
    "¡Qué bueno!",
    
    # Mensajes más largos
    "Ayer fuimos al veterinario y todo salió perfecto. El doctor dijo que está muy saludable",
    "Me alegra escuchar eso. Es importante mantener al día las vacunas",
    "¿Tu perro ya está castrado? Estoy pensando en hacerlo",
    "Sí, lo hice cuando tenía 6 meses. Fue una buena decisión",
    
    # Reacciones y confirmaciones
    "Genial!",
    "Perfecto",
    "Ok",
    "Dale",
    "Barbaro",
    "Excelente",
]

def create_app_context():
    """Crear contexto de aplicación"""
    app = create_app()
    return app.app_context()

def get_existing_users():
    """Obtener usuarios existentes de la base de datos"""
    users = User.query.filter(User.is_active == True).all()
    print(f"Encontrados {len(users)} usuarios activos")
    
    for user in users:
        print(f"- Usuario {user.id}: {user.nickname or user.name} ({user.email})")
    
    return users

def create_conversations_between_users(users):
    """Crear conversaciones entre pares de usuarios"""
    conversations_created = []
    
    # Crear conversaciones entre diferentes pares de usuarios
    for i in range(len(users)):
        for j in range(i + 1, min(i + 4, len(users))):  # Máximo 3 conversaciones por usuario
            user1 = users[i]
            user2 = users[j]
            
            # Verificar si ya existe una conversación
            existing = Conversation.query.filter(
                db.or_(
                    db.and_(Conversation.user1_id == user1.id, Conversation.user2_id == user2.id),
                    db.and_(Conversation.user1_id == user2.id, Conversation.user2_id == user1.id)
                ),
                Conversation.is_deleted == False
            ).first()
            
            if not existing:
                # Crear nueva conversación
                conversation = Conversation(
                    user1_id=min(user1.id, user2.id),  # Menor ID primero
                    user2_id=max(user1.id, user2.id),
                    created_at=datetime.utcnow(),
                    updated_at=datetime.utcnow(),
                    is_deleted=False
                )
                
                db.session.add(conversation)
                conversations_created.append((conversation, user1, user2))
                print(f"Creando conversación entre {user1.nickname or user1.name} y {user2.nickname or user2.name}")
    
    db.session.commit()
    return conversations_created

def generate_messages_for_conversation(conversation, user1, user2, num_messages=None):
    """Generar mensajes para una conversación específica"""
    if num_messages is None:
        num_messages = random.randint(5, 20)  # Entre 5 y 20 mensajes
    
    messages_created = []
    
    # Tiempo base: hace 1-7 días
    base_time = datetime.utcnow() - timedelta(days=random.randint(1, 7))
    
    for i in range(num_messages):
        # Alternar entre usuarios
        sender = user1 if i % 2 == 0 else user2
        receiver = user2 if i % 2 == 0 else user1
        
        # Seleccionar mensaje aleatorio
        message_text = random.choice(SAMPLE_MESSAGES)
        
        # Tiempo progresivo (cada mensaje un poco después)
        message_time = base_time + timedelta(
            hours=random.randint(0, 2),
            minutes=random.randint(0, 59)
        )
        base_time = message_time
        
        # Generar ID ULID
        message_id = generate_message_id()
        
        # Crear mensaje
        message = Message(
            id=message_id,
            sender_id=sender.id,
            receiver_id=receiver.id,
            text=message_text,
            message_type='text',
            is_read=random.choice([True, False]),  # Estado de lectura aleatorio
            created_at=message_time,
            updated_at=message_time,
            is_deleted=False
        )
        
        if message.is_read:
            message.read_at = message_time + timedelta(minutes=random.randint(1, 30))
        
        db.session.add(message)
        messages_created.append(message)
    
    # Commit mensajes primero
    db.session.commit()
    
    # Actualizar la conversación con el último mensaje
    if messages_created:
        last_message = messages_created[-1]
        conversation.last_message_id = last_message.id
        conversation.last_message_at = last_message.created_at
        conversation.updated_at = datetime.utcnow()
        db.session.commit()
    
    return messages_created

def test_queries():
    """Probar que las queries funcionan correctamente"""
    print("\n=== PROBANDO QUERIES ===")
    
    # 1. Contar conversaciones
    conversations_count = Conversation.query.filter(Conversation.is_deleted == False).count()
    print(f"Total de conversaciones activas: {conversations_count}")
    
    # 2. Contar mensajes
    messages_count = Message.query.filter(Message.is_deleted == False).count()
    print(f"Total de mensajes activos: {messages_count}")
    
    # 3. Probar query de conversaciones de usuario (simulando API)
    users = User.query.limit(2).all()
    if users:
        user = users[0]
        user_conversations = Conversation.query.filter(
            db.or_(Conversation.user1_id == user.id, Conversation.user2_id == user.id),
            Conversation.is_deleted == False
        ).order_by(Conversation.last_message_at.desc().nullsfirst()).all()
        
        print(f"\nConversaciones del usuario {user.nickname or user.name}:")
        for conv in user_conversations:
            other_user_id = conv.user2_id if conv.user1_id == user.id else conv.user1_id
            other_user = User.query.get(other_user_id)
            last_msg = Message.query.get(conv.last_message_id) if conv.last_message_id else None
            
            print(f"  - Con {other_user.nickname or other_user.name}")
            if last_msg:
                print(f"    Último mensaje: {last_msg.text[:50]}...")
                print(f"    Fecha: {last_msg.created_at}")
    
    # 4. Probar query de mensajes de conversación
    if users and len(users) >= 2:
        user1, user2 = users[0], users[1]
        messages = Message.get_conversation_messages(user1.id, user2.id, limit=10)
        
        print(f"\nMensajes entre {user1.nickname or user1.name} y {user2.nickname or user2.name}:")
        for msg in messages[-5:]:  # Últimos 5 mensajes
            sender = User.query.get(msg.sender_id)
            print(f"  {sender.nickname or sender.name}: {msg.text}")
            print(f"    ID: {msg.id} | Creado: {msg.created_at}")

def main():
    """Función principal"""
    print("=== SCRIPT DE CREACIÓN DE CHATS DUMMY ===\n")
    
    with create_app_context():
        try:
            # 1. Obtener usuarios existentes
            print("1. Obteniendo usuarios existentes...")
            users = get_existing_users()
            
            if len(users) < 2:
                print("Se necesitan al menos 2 usuarios para crear conversaciones")
                return
            
            # 2. Crear conversaciones
            print("\n2. Creando conversaciones...")
            conversations = create_conversations_between_users(users)
            
            if not conversations:
                print("No se crearon nuevas conversaciones (ya existen)")
                # Obtener conversaciones existentes para generar mensajes
                existing_conversations = Conversation.query.filter(Conversation.is_deleted == False).all()
                conversations = []
                for conv in existing_conversations:
                    user1 = User.query.get(conv.user1_id)
                    user2 = User.query.get(conv.user2_id)
                    conversations.append((conv, user1, user2))
            
            # 3. Generar mensajes para cada conversación
            print("\n3. Generando mensajes...")
            total_messages = 0
            
            for conversation, user1, user2 in conversations:
                print(f"  Generando mensajes entre {user1.nickname or user1.name} y {user2.nickname or user2.name}")
                messages = generate_messages_for_conversation(conversation, user1, user2)
                total_messages += len(messages)
            
            # 4. Commit final ya hecho en cada función
            print(f"\nCreados {total_messages} mensajes en {len(conversations)} conversaciones")
            
            # 5. Probar queries
            test_queries()
            
            print(f"\nScript completado exitosamente!")
            print(f"Ahora puedes probar el chat en: http://localhost:3002/chats")
            
        except Exception as e:
            print(f"Error durante la ejecucion: {e}")
            db.session.rollback()
            raise

if __name__ == "__main__":
    main()