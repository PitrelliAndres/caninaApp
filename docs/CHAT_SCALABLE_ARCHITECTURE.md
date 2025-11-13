# Arquitectura Escalable para Chat en Tiempo Real

## 🎯 Objetivo
Refactorizar el sistema de mensajería para soportar:
- **Fase 1 (0-10K usuarios)**: Optimización y features críticas
- **Fase 2 (10K-100K usuarios)**: Escalabilidad horizontal
- **Fase 3 (100K+ usuarios)**: Arquitectura distribuida con sharding

---

## 📐 Principios de Diseño

### 1. Offline-First Mobile
El móvil debe funcionar sin conexión constante:
- Persistencia local de todos los mensajes
- Queue de mensajes pendientes persisten
- Sincronización inteligente al reconectar
- UX fluida sin esperar al servidor

### 2. At-Least-Once Delivery
Garantías de entrega:
- Idempotencia via `client_temp_id` (ya existe)
- Acks para confirmar recepción
- Retry automático con exponential backoff
- Dead Letter Queue para mensajes fallidos

### 3. Horizontal Scalability
Arquitectura sin estado:
- Redis para shared state (presence, rooms)
- Message queue para procesamiento async
- Load balancer con sticky sessions opcionales
- Database read replicas

### 4. Observability
Visibilidad completa del sistema:
- Métricas: latencia, throughput, errores, conexiones
- Logs estructurados con trace_id
- Alertas proactivas
- Health checks

---

## 🏗️ Arquitectura Propuesta

```
┌─────────────────────────────────────────────────────────────┐
│                        MOBILE APP                            │
│  ┌────────────┐  ┌─────────────┐  ┌────────────────────┐  │
│  │  SQLite    │  │ Message     │  │  UI (React Native) │  │
│  │  Local DB  │◄─┤ Sync Engine │◄─┤  Optimistic UI     │  │
│  └────────────┘  └─────────────┘  └────────────────────┘  │
│         │              │                     │               │
└─────────┼──────────────┼─────────────────────┼──────────────┘
          │ (Background) │ (WebSocket)         │ (HTTP)
          │              │                     │
┌─────────▼──────────────▼─────────────────────▼──────────────┐
│                    LOAD BALANCER (nginx)                      │
└──────────────────┬────────────────────────────────────────────┘
                   │
        ┌──────────┴──────────┐
        │                     │
   ┌────▼────┐          ┌────▼────┐
   │ Flask 1 │          │ Flask N │  (Horizontal Scaling)
   │ Socket  │          │ Socket  │
   └────┬────┘          └────┬────┘
        │                    │
        └──────────┬──────────┘
                   │
    ┌──────────────┼──────────────┐
    │              │              │
┌───▼───┐    ┌────▼─────┐   ┌───▼────┐
│ Redis │    │PostgreSQL│   │Message │
│Adapter│    │  Master  │   │ Queue  │
│+Cache │    │   +      │   │(Redis  │
│       │    │ Replicas │   │Streams)│
└───────┘    └──────────┘   └────────┘
```

---

## 📋 FASE 1: Features Críticas (Semana 1-2)
**Objetivo**: App lista para producción con usuarios reales

### 1.1 Persistencia Local (Mobile) 🔴 CRÍTICO
**Problema**: Todo en memoria, se pierde al reiniciar app.

**Solución**: SQLite + react-native-sqlite-storage

**Implementación**:
```javascript
// Schema SQLite
CREATE TABLE messages (
  id TEXT PRIMARY KEY,              -- Server ULID
  temp_id TEXT UNIQUE,              -- Client temp ID
  conversation_id TEXT NOT NULL,
  sender_id TEXT NOT NULL,
  content TEXT NOT NULL,
  created_at INTEGER NOT NULL,      -- Unix timestamp
  status TEXT NOT NULL,             -- 'pending', 'sent', 'delivered', 'read', 'failed'
  retry_count INTEGER DEFAULT 0,
  error TEXT,
  -- E2EE fields
  ciphertext TEXT,
  nonce TEXT,
  tag TEXT,
  key_version TEXT,
  FOREIGN KEY(conversation_id) REFERENCES conversations(id)
);

CREATE INDEX idx_messages_conversation ON messages(conversation_id, created_at DESC);
CREATE INDEX idx_messages_status ON messages(status) WHERE status IN ('pending', 'failed');

CREATE TABLE conversations (
  id TEXT PRIMARY KEY,
  user1_id TEXT NOT NULL,
  user2_id TEXT NOT NULL,
  last_message_id TEXT,
  last_message_at INTEGER,
  last_read_message_id TEXT,        -- Watermark local
  unread_count INTEGER DEFAULT 0,
  synced_at INTEGER,                -- Last sync timestamp
  UNIQUE(user1_id, user2_id)
);

CREATE INDEX idx_conversations_last_message ON conversations(last_message_at DESC);

CREATE TABLE sync_state (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at INTEGER NOT NULL
);
```

**Sincronización**:
```javascript
// Estrategia de sync
class MessageSyncEngine {
  // Al conectar WebSocket
  async onConnect() {
    const lastSync = await db.getSyncState('last_message_sync');
    const pending = await db.getPendingMessages();

    // 1. Enviar mensajes pendientes
    for (const msg of pending) {
      await this.retryMessage(msg);
    }

    // 2. Fetch mensajes nuevos del servidor (delta sync)
    const newMessages = await api.getMessagesSince(lastSync);
    await db.bulkInsertMessages(newMessages);

    // 3. Actualizar watermarks
    await this.syncReadReceipts();
  }

  // Al recibir mensaje por WebSocket
  async onNewMessage(msg) {
    await db.insertMessage(msg);
    await db.updateConversation(msg.conversation_id, {
      last_message_id: msg.id,
      last_message_at: msg.created_at,
      unread_count: db.raw('unread_count + 1')
    });
  }

  // Al enviar mensaje
  async sendMessage(content, conversationId) {
    const tempId = generateULID();

    // 1. Guardar en DB con status 'pending'
    await db.insertMessage({
      temp_id: tempId,
      conversation_id: conversationId,
      content,
      status: 'pending',
      created_at: Date.now()
    });

    // 2. Actualizar UI (optimistic)
    dispatch(addMessageOptimistic({ temp_id: tempId, ... }));

    // 3. Enviar por WebSocket
    try {
      const serverMsg = await socket.emit('dm:send', { temp_id: tempId, ... });
      await db.updateMessage(tempId, {
        id: serverMsg.id,
        status: 'sent'
      });
      dispatch(replaceMessage({ temp_id: tempId, server_id: serverMsg.id }));
    } catch (err) {
      await db.updateMessage(tempId, {
        status: 'failed',
        error: err.message
      });
      dispatch(updateMessageStatus({ temp_id: tempId, status: 'failed' }));
    }
  }
}
```

**Archivos a crear**:
- `mobile/src/database/sqliteService.js` - Wrapper sobre SQLite
- `mobile/src/database/schema.sql` - Schema DDL
- `mobile/src/database/migrations.js` - Versionado de DB
- `mobile/src/services/MessageSyncEngine.js` - Lógica de sync
- Refactor: `chatSlice.js` para leer/escribir de SQLite

**Beneficios**:
- ✅ Mensajes persisten entre reinicios
- ✅ Funciona offline
- ✅ Retry automático de mensajes fallidos
- ✅ Reducción de data usage (no re-fetch)

---

### 1.2 Push Notifications (Mobile + Backend) 🔴 CRÍTICO
**Problema**: Usuarios no reciben mensajes cuando app está en background.

**Solución**: Firebase Cloud Messaging (FCM)

**Backend**:
```python
# backend/app/models/device.py
class DeviceToken(db.Model):
    __tablename__ = 'device_tokens'

    id = db.Column(db.String(26), primary_key=True, default=generate_ulid)
    user_id = db.Column(db.String(26), db.ForeignKey('users.id'), nullable=False)
    token = db.Column(db.String(255), unique=True, nullable=False)
    platform = db.Column(db.Enum('ios', 'android', 'web'), nullable=False)
    app_version = db.Column(db.String(20))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    last_used_at = db.Column(db.DateTime, default=datetime.utcnow)
    is_active = db.Column(db.Boolean, default=True)

    __table_args__ = (
        db.Index('ix_device_tokens_user_active', 'user_id', 'is_active'),
    )

# backend/app/services/notification_service.py
from firebase_admin import messaging
import firebase_admin
from firebase_admin import credentials

class NotificationService:
    def __init__(self):
        if not firebase_admin._apps:
            cred = credentials.Certificate(app.config['FIREBASE_CREDENTIALS_PATH'])
            firebase_admin.initialize_app(cred)

    async def send_message_notification(self, user_id: str, message: Message):
        """Send push notification for new message"""
        # Get user's device tokens
        tokens = DeviceToken.query.filter_by(
            user_id=user_id,
            is_active=True
        ).all()

        if not tokens:
            return

        # Check if user is online (don't spam if they're connected)
        online = await redis_client.get(f'user:online:{user_id}')
        if online:
            return

        # Get sender info
        sender = User.query.get(message.sender_id)

        # Build notification
        notification = messaging.Notification(
            title=sender.name,
            body=self._truncate_message(message.content, 100),
            image=sender.avatar_url
        )

        data = {
            'type': 'new_message',
            'conversation_id': message.conversation_id,
            'message_id': message.id,
            'sender_id': message.sender_id,
            'deep_link': f'parkdog://chat/{message.conversation_id}'
        }

        # Send to all devices
        fcm_tokens = [t.token for t in tokens]

        multi_message = messaging.MulticastMessage(
            tokens=fcm_tokens,
            notification=notification,
            data=data,
            android=messaging.AndroidConfig(
                priority='high',
                notification=messaging.AndroidNotification(
                    channel_id='messages',
                    sound='default',
                    priority='high'
                )
            ),
            apns=messaging.APNSConfig(
                payload=messaging.APNSPayload(
                    aps=messaging.Aps(
                        sound='default',
                        badge=await self._get_unread_count(user_id)
                    )
                )
            )
        )

        try:
            response = messaging.send_multicast(multi_message)

            # Handle failed tokens
            if response.failure_count > 0:
                await self._handle_failed_tokens(tokens, response)

        except Exception as e:
            logger.error(f"FCM send failed: {e}", extra={'user_id': user_id})

    async def _get_unread_count(self, user_id: str) -> int:
        """Get total unread message count for badge"""
        result = db.session.query(
            func.sum(MessageRead.unread_count)
        ).join(Conversation).filter(
            or_(
                Conversation.user1_id == user_id,
                Conversation.user2_id == user_id
            )
        ).scalar()

        return result or 0

    async def _handle_failed_tokens(self, tokens, response):
        """Deactivate invalid tokens"""
        for idx, result in enumerate(response.responses):
            if not result.success:
                error_code = result.exception.code if result.exception else None
                if error_code in ['invalid-registration-token', 'registration-token-not-registered']:
                    token = tokens[idx]
                    token.is_active = False
                    db.session.add(token)

        db.session.commit()

# Integrar en realtime/dm.py
@socketio.on('dm:send')
@require_auth
@rate_limit('dm:send', max_requests=30, window_seconds=60)
async def handle_dm_send(data):
    # ... existing validation ...

    # Save message
    message = Message(...)
    db.session.add(message)
    db.session.commit()

    # Send WebSocket to online users
    socketio.emit('dm:new', message.to_dict(), room=conv_room)

    # Send push notification to offline users
    receiver_online = await redis_client.get(f'user:online:{receiver_id}')
    if not receiver_online:
        await notification_service.send_message_notification(receiver_id, message)

    # ... rest of handler ...
```

**Mobile**:
```javascript
// mobile/src/services/pushNotifications.js
import messaging from '@react-native-firebase/messaging';
import notifee, { AndroidImportance } from '@notifee/react-native';
import { navigate } from './navigationService';

class PushNotificationService {
  async initialize() {
    // Request permissions
    const authStatus = await messaging().requestPermission();
    const enabled =
      authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
      authStatus === messaging.AuthorizationStatus.PROVISIONAL;

    if (!enabled) {
      console.warn('Push notifications not authorized');
      return;
    }

    // Get FCM token
    const token = await messaging().getToken();
    await this.registerToken(token);

    // Create notification channel (Android)
    await notifee.createChannel({
      id: 'messages',
      name: 'Messages',
      importance: AndroidImportance.HIGH,
      sound: 'default',
    });

    // Listen for token refresh
    messaging().onTokenRefresh(async (newToken) => {
      await this.registerToken(newToken);
    });

    // Handle foreground messages
    messaging().onMessage(async (remoteMessage) => {
      await this.displayNotification(remoteMessage);
    });

    // Handle background/quit messages
    messaging().setBackgroundMessageHandler(async (remoteMessage) => {
      console.log('Background message:', remoteMessage);
    });

    // Handle notification taps
    notifee.onBackgroundEvent(async ({ type, detail }) => {
      if (type === notifee.EventType.PRESS) {
        const conversationId = detail.notification.data.conversation_id;
        navigate('DMChat', { conversationId });
      }
    });
  }

  async registerToken(token) {
    try {
      await api.post('/devices/register', {
        token,
        platform: Platform.OS,
        app_version: DeviceInfo.getVersion(),
      });
    } catch (err) {
      console.error('Failed to register FCM token:', err);
    }
  }

  async displayNotification(remoteMessage) {
    const { title, body, imageUrl } = remoteMessage.notification;
    const { conversation_id, sender_id } = remoteMessage.data;

    await notifee.displayNotification({
      title,
      body,
      android: {
        channelId: 'messages',
        smallIcon: 'ic_notification',
        largeIcon: imageUrl,
        pressAction: {
          id: 'default',
          launchActivity: 'default',
        },
      },
      ios: {
        foregroundPresentationOptions: {
          alert: true,
          badge: true,
          sound: true,
        },
      },
      data: {
        conversation_id,
        sender_id,
      },
    });
  }

  async updateBadgeCount(count) {
    if (Platform.OS === 'ios') {
      await notifee.setBadgeCount(count);
    }
  }
}

export default new PushNotificationService();

// mobile/App.js
import pushNotifications from './services/pushNotifications';

useEffect(() => {
  pushNotifications.initialize();
}, []);
```

**Archivos a crear/modificar**:
Backend:
- `backend/app/models/device.py`
- `backend/app/services/notification_service.py` (reemplazar stub)
- `backend/app/routes/devices.py` - Endpoints para registrar tokens
- Modificar: `backend/app/realtime/dm.py` - Enviar notifications

Mobile:
- `mobile/src/services/pushNotifications.js`
- `mobile/src/services/navigationService.js` - Deep linking
- Modificar: `mobile/App.js` - Initialize notifications
- Modificar: `mobile/app.json` - FCM config

**Dependencias**:
```bash
# Backend
pip install firebase-admin

# Mobile
npm install @react-native-firebase/app @react-native-firebase/messaging @notifee/react-native
```

---

### 1.3 Message Queue (Backend) 🟡 IMPORTANTE
**Problema**: Procesamiento síncrono bloquea response. Sin queue, no hay retry centralizado.

**Solución**: Redis Streams + Bull (ya tienes Redis)

**Implementación**:
```python
# backend/app/queue/queue_service.py
from redis import Redis
from rq import Queue
import json

class QueueService:
    def __init__(self, redis_client):
        self.redis = redis_client
        self.queue = Queue('messages', connection=redis_client)

    def enqueue_message_delivery(self, message_id: str, receiver_id: str):
        """Queue message for async delivery"""
        job = self.queue.enqueue(
            'app.workers.message_worker.deliver_message',
            message_id=message_id,
            receiver_id=receiver_id,
            job_timeout='30s',
            retry=Retry(max=3, interval=[10, 30, 60])  # Exponential backoff
        )
        return job.id

    def enqueue_notification(self, user_id: str, notification_data: dict):
        """Queue push notification"""
        self.queue.enqueue(
            'app.workers.notification_worker.send_push',
            user_id=user_id,
            data=notification_data,
            job_timeout='15s'
        )

# backend/app/workers/message_worker.py
from app import create_app, socketio
from app.models import Message, User
from app.services.notification_service import notification_service

app = create_app()

def deliver_message(message_id: str, receiver_id: str):
    """Worker to deliver message (WebSocket + Push)"""
    with app.app_context():
        message = Message.query.get(message_id)
        if not message:
            return

        # Try WebSocket delivery
        socketio.emit(
            'dm:new',
            message.to_dict(),
            room=f'user:{receiver_id}',
            namespace='/'
        )

        # If user offline, send push
        online = redis_client.get(f'user:online:{receiver_id}')
        if not online:
            notification_service.send_message_notification(receiver_id, message)

# backend/app/realtime/dm.py (modificar)
@socketio.on('dm:send')
@require_auth
async def handle_dm_send(data):
    # ... validation ...

    # Save message
    message = Message(...)
    db.session.add(message)
    db.session.commit()

    # Acknowledge immediately
    emit('dm:ack', {
        'temp_id': temp_id,
        'message': message.to_dict()
    })

    # Queue async delivery (non-blocking)
    queue_service.enqueue_message_delivery(message.id, receiver_id)

    return  # Response sent quickly
```

**Worker Daemon**:
```python
# backend/worker.py
from redis import Redis
from rq import Worker
from app import create_app

app = create_app()
redis_conn = Redis.from_url(app.config['REDIS_URL'])

if __name__ == '__main__':
    with app.app_context():
        worker = Worker(['messages', 'notifications'], connection=redis_conn)
        worker.work()
```

**Supervisord Config** (para production):
```ini
# backend/supervisord.conf
[program:rq_worker]
command=python worker.py
directory=/app/backend
autostart=true
autorestart=true
numprocs=4
process_name=%(program_name)s_%(process_num)02d
stdout_logfile=/var/log/rq_worker.log
```

**Beneficios**:
- ✅ Responses más rápidas (no esperan delivery)
- ✅ Retry automático si falla delivery
- ✅ Escalable (añadir más workers)
- ✅ Visibility en jobs (dashboard RQ)

---

### 1.4 Pagination en /conversations (Backend) 🟡
**Problema**: Carga todas las conversations sin límite.

**Fix**:
```python
# backend/app/routes/messages.py
@bp.route('/conversations', methods=['GET'])
@jwt_required()
@rate_limit_api
def get_conversations():
    current_user_id = get_jwt_identity()

    # Pagination params
    limit = min(int(request.args.get('limit', 20)), 100)
    cursor = request.args.get('cursor')  # last_message_at timestamp

    query = Conversation.query.filter(
        or_(
            Conversation.user1_id == current_user_id,
            Conversation.user2_id == current_user_id
        ),
        Conversation.is_deleted == False
    )

    if cursor:
        query = query.filter(Conversation.last_message_at < cursor)

    conversations = query.order_by(
        Conversation.last_message_at.desc()
    ).limit(limit + 1).all()  # +1 to check if more

    has_more = len(conversations) > limit
    if has_more:
        conversations = conversations[:limit]

    next_cursor = conversations[-1].last_message_at if conversations and has_more else None

    # ... rest of serialization ...

    return jsonify({
        'conversations': result,
        'pagination': {
            'has_more': has_more,
            'next_cursor': next_cursor.isoformat() if next_cursor else None,
            'limit': limit
        }
    })
```

---

### 1.5 Refactor Código Duplicado (Mobile) 🟡
**Problema**: `ChatScreen.js` (legacy) y `DMChatScreen.js` (nuevo) coexisten.

**Acción**:
- Eliminar `ChatScreen.js` completamente
- Consolidar en `DMChatScreen.js`
- Actualizar navegación

---

## 📋 FASE 2: Optimización & Observability (Semana 3-4)
**Objetivo**: Monitoreo y optimizaciones de performance

### 2.1 Metrics & Monitoring 📊
**Stack propuesto**: Prometheus + Grafana

**Backend**:
```python
# backend/app/metrics.py
from prometheus_client import Counter, Histogram, Gauge, generate_latest
from flask import Response

# Metrics
messages_sent_total = Counter(
    'messages_sent_total',
    'Total messages sent',
    ['status']  # sent, failed
)

message_delivery_latency = Histogram(
    'message_delivery_latency_seconds',
    'Message delivery latency',
    buckets=[0.01, 0.05, 0.1, 0.5, 1, 2, 5]
)

active_websocket_connections = Gauge(
    'active_websocket_connections',
    'Number of active WebSocket connections'
)

# Endpoint para Prometheus scraping
@app.route('/metrics')
def metrics():
    return Response(generate_latest(), mimetype='text/plain')

# Instrumentar código
@socketio.on('dm:send')
async def handle_dm_send(data):
    start = time.time()

    try:
        # ... existing logic ...
        messages_sent_total.labels(status='sent').inc()
    except Exception as e:
        messages_sent_total.labels(status='failed').inc()
        raise
    finally:
        message_delivery_latency.observe(time.time() - start)
```

**Dashboards Grafana**:
- Messages per second (throughput)
- P50/P95/P99 latency
- Error rate
- Active connections
- Queue depth
- Database query time

### 2.2 Structured Logging 📝
```python
# backend/app/__init__.py
import structlog

structlog.configure(
    processors=[
        structlog.stdlib.add_log_level,
        structlog.stdlib.add_logger_name,
        structlog.processors.TimeStamper(fmt="iso"),
        structlog.processors.StackInfoRenderer(),
        structlog.processors.format_exc_info,
        structlog.processors.JSONRenderer()
    ],
    wrapper_class=structlog.stdlib.BoundLogger,
    context_class=dict,
    logger_factory=structlog.stdlib.LoggerFactory(),
)

logger = structlog.get_logger()

# En handlers
@socketio.on('dm:send')
async def handle_dm_send(data):
    log = logger.bind(
        user_id=current_user_id,
        conversation_id=conversation_id,
        message_id=message.id,
        trace_id=request.headers.get('X-Trace-Id')
    )

    log.info("message_sent",
             temp_id=temp_id,
             receiver_id=receiver_id,
             size_bytes=len(content))
```

### 2.3 Database Optimization 🗄️
```sql
-- Añadir índices faltantes
CREATE INDEX CONCURRENTLY ix_messages_unread
ON messages(conversation_id, created_at DESC)
WHERE is_read = false;

-- Índice parcial para mensajes pendientes (mobile sync)
CREATE INDEX CONCURRENTLY ix_messages_recent
ON messages(created_at DESC)
WHERE created_at > NOW() - INTERVAL '7 days';

-- Índice para user blocks (checking bloqueados)
CREATE INDEX CONCURRENTLY ix_user_blocks_blocked
ON user_blocks(blocked_id);

-- Query optimization: usar EXPLAIN ANALYZE
EXPLAIN ANALYZE
SELECT m.* FROM messages m
WHERE m.conversation_id = 'conv_123'
AND m.created_at < '2024-01-01'
ORDER BY m.created_at DESC
LIMIT 50;
```

### 2.4 Redis Caching Layer 🚀
```python
# backend/app/utils/cache.py
from functools import wraps
import pickle

def cache_result(key_prefix: str, ttl: int = 300):
    """Decorator to cache function results in Redis"""
    def decorator(func):
        @wraps(func)
        async def wrapper(*args, **kwargs):
            # Build cache key
            cache_key = f"{key_prefix}:{func.__name__}:{args}:{kwargs}"

            # Try cache
            cached = await redis_client.get(cache_key)
            if cached:
                return pickle.loads(cached)

            # Execute function
            result = await func(*args, **kwargs)

            # Store in cache
            await redis_client.setex(
                cache_key,
                ttl,
                pickle.dumps(result)
            )

            return result
        return wrapper
    return decorator

# Uso
@cache_result('conversations', ttl=60)
def get_user_conversations(user_id):
    # Expensive query
    pass
```

### 2.5 Connection Pooling 🔌
```python
# backend/config.py
SQLALCHEMY_ENGINE_OPTIONS = {
    'pool_size': 20,           # Connections pool
    'max_overflow': 10,        # Extra connections si se llena pool
    'pool_timeout': 30,        # Timeout esperando connection
    'pool_recycle': 3600,      # Recycle connections cada 1h
    'pool_pre_ping': True,     # Test connections antes de usar
}

# Redis connection pool
REDIS_POOL_OPTIONS = {
    'max_connections': 50,
    'socket_keepalive': True,
    'socket_keepalive_options': {
        socket.TCP_KEEPIDLE: 60,
        socket.TCP_KEEPINTVL: 10,
        socket.TCP_KEEPCNT: 3
    }
}
```

---

## 📋 FASE 3: Escalabilidad Avanzada (Semana 5+)
**Objetivo**: Preparar para 100K+ usuarios

### 3.1 Database Replication 🗄️🗄️
```yaml
# docker-compose.yml
services:
  postgres-master:
    image: postgres:15
    environment:
      POSTGRES_USER: parkdog
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    command: postgres -c wal_level=replica -c max_wal_senders=3
    volumes:
      - pgdata-master:/var/lib/postgresql/data

  postgres-replica:
    image: postgres:15
    environment:
      PGUSER: replicator
      PGPASSWORD: ${REPLICATION_PASSWORD}
    command: |
      bash -c "
        until pg_basebackup --pgdata=/var/lib/postgresql/data -R --slot=replication_slot --host=postgres-master --port=5432
        do
          echo 'Waiting for primary to connect...'
          sleep 1s
        done
        echo 'Backup done, starting replica...'
        postgres
      "
    depends_on:
      - postgres-master
```

**SQLAlchemy Read/Write Splitting**:
```python
# backend/app/db.py
from flask_sqlalchemy import SQLAlchemy
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

class RoutingSession(Session):
    def get_bind(self, mapper=None, clause=None):
        # Writes go to master
        if self._flushing:
            return engines['master']
        # Reads go to replica
        return engines['replica']

engines = {
    'master': create_engine(MASTER_DATABASE_URL),
    'replica': create_engine(REPLICA_DATABASE_URL)
}

db = SQLAlchemy(session_options={'class_': RoutingSession})
```

### 3.2 Sharding Strategy (Future) 🔀
**Shard by conversation_id** (consistent hashing)

```python
# Concepto (no implementar ahora)
def get_shard_for_conversation(conversation_id: str) -> str:
    """Route conversation to specific database shard"""
    shard_count = 4
    hash_value = int(conversation_id[:8], 16)  # Use ULID prefix
    shard_num = hash_value % shard_count
    return f"shard_{shard_num}"

# Mantener mapping en Redis
# conversation:conv_123:shard -> "shard_2"
```

### 3.3 CDN para Attachments 📎
```python
# backend/app/utils/upload.py
import boto3
from botocore.config import Config

s3_client = boto3.client(
    's3',
    config=Config(signature_version='s3v4'),
    region_name='us-east-1'
)

def generate_upload_presigned_url(filename: str, content_type: str):
    """Generate pre-signed URL for direct upload to S3"""
    key = f"attachments/{current_user_id}/{generate_ulid()}/{filename}"

    url = s3_client.generate_presigned_url(
        'put_object',
        Params={
            'Bucket': 'parkdog-attachments',
            'Key': key,
            'ContentType': content_type,
            'ServerSideEncryption': 'AES256'
        },
        ExpiresIn=300  # 5 minutes
    )

    return {
        'upload_url': url,
        'download_url': f"https://cdn.parkdog.com/{key}"
    }
```

### 3.4 Rate Limiting Avanzado ⚡
```python
# backend/app/utils/rate_limiter.py
from datetime import datetime, timedelta

class SlidingWindowRateLimiter:
    """Más preciso que fixed window"""

    def __init__(self, redis, key_prefix, max_requests, window_seconds):
        self.redis = redis
        self.key_prefix = key_prefix
        self.max_requests = max_requests
        self.window_seconds = window_seconds

    async def is_allowed(self, identifier: str) -> bool:
        key = f"{self.key_prefix}:{identifier}"
        now = datetime.utcnow().timestamp()
        window_start = now - self.window_seconds

        # Remove old entries
        await self.redis.zremrangebyscore(key, 0, window_start)

        # Count requests in window
        count = await self.redis.zcard(key)

        if count < self.max_requests:
            # Add current request
            await self.redis.zadd(key, {str(now): now})
            await self.redis.expire(key, self.window_seconds)
            return True

        return False
```

---

## 🛠️ Stack Tecnológico Recomendado

### Backend
- **Message Queue**: Redis Streams + RQ (ya tienes Redis) o Bull
- **Caching**: Redis (multi-purpose: cache, queue, adapter)
- **Metrics**: Prometheus + Grafana
- **Logging**: structlog (JSON logs)
- **Tracing**: Jaeger (opcional, fase 3)
- **Push**: Firebase Admin SDK

### Mobile
- **Local DB**: react-native-sqlite-storage (simple) o WatermelonDB (reactive)
- **Push**: @react-native-firebase/messaging + @notifee/react-native
- **Background Sync**: react-native-background-actions (iOS)
- **Network**: @react-native-community/netinfo (ya lo tienes)

### Infra (Production)
- **Load Balancer**: nginx o AWS ALB
- **DB**: PostgreSQL 15 con streaming replication
- **Redis**: Redis Cluster o AWS ElastiCache
- **Storage**: S3 + CloudFront CDN
- **Monitoring**: Grafana Cloud o self-hosted

---

## 📊 Métricas de Éxito

### Performance
- **Message Latency**: P95 < 200ms (WebSocket delivery)
- **API Response Time**: P95 < 500ms
- **DB Query Time**: P95 < 50ms
- **Push Delivery**: < 5 segundos

### Reliability
- **Message Delivery**: 99.9% success rate
- **Uptime**: 99.9% (43 min downtime/mes)
- **Data Loss**: 0% (at-least-once delivery)

### Scalability
- **Concurrent Users**: 10K (Fase 1) → 100K (Fase 3)
- **Messages/sec**: 1K (Fase 1) → 10K (Fase 3)
- **DB Connections**: < 80% pool utilization
- **Memory Usage**: < 70% per instance

---

## 🚀 Plan de Migración

### Rollout Strategy
1. **Deploy Backend Changes** (backward compatible)
   - Añadir notification service
   - Añadir queue workers
   - Añadir metrics endpoints
   - NO romper API existente

2. **Release Mobile Update** (v2.0)
   - SQLite persistence
   - Push notifications
   - Force update para usuarios antiguos

3. **Monitor & Iterate**
   - Observar métricas 48h
   - Fix bugs críticos
   - Optimize basado en data real

### Feature Flags
```python
# backend/config.py
FEATURE_FLAGS = {
    'USE_MESSAGE_QUEUE': os.getenv('USE_MESSAGE_QUEUE', 'false') == 'true',
    'ENABLE_PUSH_NOTIFICATIONS': os.getenv('ENABLE_PUSH', 'true') == 'true',
    'USE_REDIS_CACHE': os.getenv('USE_CACHE', 'true') == 'true',
}
```

---

## 📝 Checklist de Implementación

### Fase 1 (Crítico)
- [ ] Implementar SQLite en mobile
- [ ] Implementar MessageSyncEngine
- [ ] Refactorizar chatSlice para usar SQLite
- [ ] Implementar FCM en backend (notification_service)
- [ ] Implementar FCM en mobile (pushNotifications)
- [ ] Añadir endpoints /devices/register
- [ ] Implementar message queue (RQ)
- [ ] Añadir pagination a /conversations
- [ ] Eliminar ChatScreen.js legacy
- [ ] Testing end-to-end

### Fase 2 (Optimización)
- [ ] Añadir Prometheus metrics
- [ ] Configurar Grafana dashboards
- [ ] Implementar structured logging
- [ ] Añadir índices DB faltantes
- [ ] Implementar Redis caching layer
- [ ] Configurar connection pooling
- [ ] Load testing (Apache JMeter / k6)

### Fase 3 (Escalabilidad)
- [ ] Configurar DB replication
- [ ] Implementar read/write splitting
- [ ] CDN para attachments (S3 + CloudFront)
- [ ] Sliding window rate limiter
- [ ] Distributed tracing (Jaeger)
- [ ] Evaluar sharding strategy

---

## 🔐 Consideraciones de Seguridad

### E2EE (Fase Futura)
**Nota**: Actualmente los campos E2EE existen pero no están implementados.

**Opción 1: Signal Protocol**
- Double Ratchet Algorithm
- Forward/backward secrecy
- Libsignal-protocol-javascript (mobile)

**Opción 2: Simplificado (MVP)**
- ECDH key exchange
- AES-GCM encryption client-side
- Server solo almacena ciphertext

**Cambios Necesarios**:
```javascript
// Mobile: Antes de enviar
const { ciphertext, nonce, tag } = await encryptMessage(
  plaintext,
  conversationKey
);

socket.emit('dm:send', {
  ciphertext,
  nonce,
  tag,
  key_version: currentKeyVersion,
  algorithm: 'aes-gcm'
});

// Al recibir
const plaintext = await decryptMessage(
  msg.ciphertext,
  msg.nonce,
  msg.tag,
  conversationKey
);
```

**Backend**:
- No loguear `content` (ya no existe en plaintext)
- Rate limiting basado en metadata
- Servidor ciego al contenido

---

## 📚 Referencias

- [Socket.IO Best Practices](https://socket.io/docs/v4/performance-tuning/)
- [Redis Streams for Message Queues](https://redis.io/docs/data-types/streams/)
- [PostgreSQL Replication](https://www.postgresql.org/docs/current/high-availability.html)
- [Firebase Cloud Messaging](https://firebase.google.com/docs/cloud-messaging)
- [SQLite Performance Tips](https://www.sqlite.org/optimization.html)
- [Prometheus Best Practices](https://prometheus.io/docs/practices/naming/)

---

## 🎯 Próximos Pasos

1. **Review este documento** con el equipo
2. **Priorizar** features (mi sugerencia: Fase 1 completa primero)
3. **Estimar** tiempo y recursos
4. **Crear tickets** en GitHub/Jira
5. **Comenzar** con SQLite + Push (son bloqueantes para producción)

¿Te parece bien este enfoque? ¿Quieres que empiece a implementar alguna fase específica?
