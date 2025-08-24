**Mensajería 1:1 post‑match (DM)** — Unifica **match/DM**, **offline delivery** y **esquema de datos**.

## 1) Objetivo
- Crear/reusar conversación 1:1 en `match:created`.
- Mensajería web/mobile contra Flask + Socket.IO.
- Entrega **durable**: realtime si online; store‑and‑forward si offline.

## 2) Reglas de negocio
- Requiere **match mutuo activo**; sin match → `403` en `dm:join`/`dm:send`.
- **Una conversación por par** (A,B) (idempotente).
- Unmatch → sólo lectura (histórico visible, no enviar).
- Report/Block → bloquear envíos; auditar.
- Adjuntos: subir **cifrados en cliente** (E2EE) con pre‑signed URL; guardar sólo metadatos cifrados + URL.

## 3) Flujos (alto nivel)
1) `match:created` → `match_service` crea/reusa conversación (1:1) y emite `{ conversationId }` a A y B.
2) `dm:join` → valida JWT+membresía+estado; retorna historial inicial + cursor; en E2EE strict, `wrappedKeys`.
3) `dm:send({tempId, conversationId, ciphertext|text, keyVersion, meta})` → persistir → `dm:new` → `dm:ack`.
4) `dm:read({conversationId, upToMessageId})` → watermark + `dm:read-receipt`.

## 4) Contratos WS
**Handshake**: `auth: { token }` (JWT corto, `aud=realtime`).

**Eventos**
- `match:created { conversationId }`
- `dm:join { conversationId }` → `dm:joined { messages[], cursor, keyVersion, wrappedKeys? }`
- `dm:send { tempId, conversationId, ciphertext|text, keyVersion, meta? }` → `dm:ack { tempId, serverId, ts }`
- `dm:new { message }`
- `dm:typing { conversationId, isTyping }` (TTL ~3s)
- `dm:read { conversationId, upToMessageId }` → `dm:read-receipt { userId, upToMessageId }`
- `error { code, message }`

**Fallback HTTP**
- `POST /api/v1/messages`
- `GET  /api/v1/messages?conversationId=...&after=cursor&limit=n`
- `POST /api/v1/messages/read`

## 5) Modelo de datos (tablas y relaciones)
```
users (1) ──< matches >── (1) users
            │
            └──< conversations (1:1 por par)
                  └──< messages (n)
                  └──< message_reads (watermark)

users (1) ──< user_blocks >── (1) users
```

### `matches`
- **Columnas**: `id` PK, `user_id` FK, `matched_user_id` FK, `match_type` VARCHAR(20), `is_mutual` BOOL, `compatibility_score` INT, `context_data` JSONB, `created_at` TIMESTAMPTZ DEFAULT now(), `mutual_at` TIMESTAMPTZ.
- **Restricciones**: `UNIQUE (user_id, matched_user_id)`, `CHECK (user_id <> matched_user_id)`.
- **Índices (PG)**:
```sql
CREATE INDEX IF NOT EXISTS idx_matches_my_mutual  ON matches (user_id, created_at) WHERE is_mutual = true;
CREATE INDEX IF NOT EXISTS idx_matches_my_pending ON matches (user_id, created_at) WHERE is_mutual = false;
```

### `conversations`
- **Columnas**: `id` PK, `user1_id` FK, `user2_id` FK, `last_message_id` VARCHAR(26) (ULID, FK diferida), `last_message_at` TIMESTAMPTZ, `created_at` TIMESTAMPTZ DEFAULT now(), `is_deleted` BOOL DEFAULT false, `deleted_at` TIMESTAMPTZ, `updated_at` TIMESTAMPTZ.
- **Unicidad 1:1** (elige una):
```sql
-- Preferida en Postgres
CREATE UNIQUE INDEX IF NOT EXISTS uq_conversations_pair
ON conversations (LEAST(user1_id, user2_id), GREATEST(user1_id, user2_id));
-- Alternativa genérica: CHECK (user1_id < user2_id) + UNIQUE(user1_id, user2_id)
```
- **Índices**:
```sql
CREATE INDEX IF NOT EXISTS ix_conversations_last_message_at ON conversations (last_message_at);
CREATE INDEX IF NOT EXISTS ix_conversations_user1          ON conversations (user1_id, last_message_at);
CREATE INDEX IF NOT EXISTS ix_conversations_user2          ON conversations (user2_id, last_message_at);
CREATE INDEX IF NOT EXISTS ix_conversations_active         ON conversations (is_deleted, last_message_at);
```

### `messages`
- **Columnas**: `id` VARCHAR(26) ULID PK, `conversation_id` FK → conversations ON DELETE CASCADE, `sender_id` FK → users, `receiver_id` INT (opcional), `message_type` VARCHAR(20) DEFAULT 'text' NOT NULL, `text` TEXT (transición), `ciphertext` TEXT, `nonce` VARCHAR(32), `tag` VARCHAR(32), `key_version` INT, `algorithm` VARCHAR(20), `metadata_json` JSONB, `is_read` BOOL DEFAULT false NOT NULL, `read_at` TIMESTAMPTZ, `created_at` TIMESTAMPTZ DEFAULT now() NOT NULL, `is_deleted` BOOL DEFAULT false, `deleted_at` TIMESTAMPTZ, `updated_at` TIMESTAMPTZ.
- **Índices**:
```sql
CREATE INDEX IF NOT EXISTS ix_messages_conversation_id_created_at
ON messages (conversation_id, created_at);

CREATE INDEX IF NOT EXISTS idx_messages_unread_partial
ON messages (receiver_id, created_at)
WHERE is_deleted = false AND is_read = false;

CREATE INDEX IF NOT EXISTS ix_messages_timeline ON messages (created_at, id);
```

### `message_reads` (watermark)
- **Columnas**: `conversation_id` FK, `user_id` FK, `up_to_message_id` VARCHAR(26), `updated_at` TIMESTAMPTZ DEFAULT now() NOT NULL.
- **PK compuesta**: `(conversation_id, user_id)`.
- **Índice**:
```sql
CREATE INDEX IF NOT EXISTS ix_message_reads_conv_user
ON message_reads (conversation_id, user_id);
```

### `user_blocks`
- **PK compuesta**: `(blocker_id, blocked_id)`; `created_at` TIMESTAMPTZ DEFAULT now().
- **Uso**: bloquear `dm:join`/`dm:send` si existe relación.

## 6) Offline delivery (store‑and‑forward)
- **Enviar**: `dm:send` (WS) o `POST /messages` (HTTP). Persistir → `dm:ack`.
- **Online** receptor: `dm:new` inmediato.
- **Offline** receptor: queda no leído + **push** mínima (sin contenido en claro con E2EE strict).
- **Re‑sync**: `dm:join` retorna historial + cursor o `GET /messages?after=cursor`.

### Cursores y orden
- Orden estable: `ORDER BY created_at, id`.
- Cursor: serializar `(created_at, id)` o ULID.
- Evitar `OFFSET` en timelines grandes.

### Push notifications
- Cuerpo mínimo (“Nuevo mensaje”); `collapse_key=conversationId`.
- Quiet hours por preferencias.
- Deep‑link a conversación y sync por cursor.

## 7) Seguridad & Autorización
- JWT corto para WS (`aud=realtime`), refresh por HTTPS, revocación por `sid/jti`.
- WSS obligatorio; CORS estricto.
- Validar membresía + match activo en **cada** `dm:join`/`dm:send`.
- Sanitizar `meta` y nombres de archivo; logs sin PII ni texto plano.
- Límites por tamaño (2–4 KB) y rate (usuario/IP); backpressure si no hay ack.

## 8) E2EE (modos operativos)
- `E2EE_MODE=strict` (recomendado): el servidor **no** conoce `Kc`.
- `E2EE_MODE=server` (dummy para DEV) → `// TODO: migrar a strict`.
- Rotación de `Kc` por política (miembros cambian / cada N días). `key_version` en mensajes.
- Adjuntos cifrados cliente con `Kc` y pre‑signed URL.

## 9) Escalado & Mobile
- Adapter Redis para Socket.IO; presence con TTL en Redis.
- Balanceador **sin sticky** si hay adapter.
- Sockets en background (mobile): confiar en push para “despertar” y sincronizar backlog.
- Almacenar claves privadas E2EE en Keychain/Keystore.

## 10) Métricas & Testing
**Métricas**: conexiones activas, dm:send/s, latencia p50/p95/p99, reconexiones, drops, errores authZ.

**Testing**
- Auth: expirado/aud incorrecto/sid revocado.
- AuthZ: sin match/unmatch/bloqueado.
- Idempotencia: doble `tempId`/`client_msg_id` no duplica.
- Límites: > tamaño → 413; exceso → 429.
- Reconexión + re‑sync por cursor (sin huecos/duplicados).
- E2EE: cifrado/descifrado correcto + `key_version`.
- Adjuntos: MIME permitido; URL expirada rechazada.

## 11) ENV sugerido (DM)
```env
WS_JWT_TTL_MIN=10
WS_AUDIENCE=realtime
DM_TEXT_MAX_BYTES=4096
DM_RATE_PER_MINUTE=120
E2EE_MODE=strict
E2EE_AEAD=aes-gcm
PUSH_COLLAPSE_BY=conversation
PUSH_MINIMAL_BODY=true
```