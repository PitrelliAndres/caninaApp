# CLAUDE.md (master)

Guía **maestra** para Claude Code. Mantiene enfoque **security‑first**, **performance‑minded** y **DX clara**. Si una práctica PROD bloquea DEV, aplica la solución funcional y deja `// TODO: harden for production`.

**MUST‑READ (orden sugerido):**
- `docs/AUTHENTICATION_IMPLEMENTATION.md`
- `docs/DM_MESSAGING.md`

---

## Guardarraíles para Claude (antes de editar)
- **No** eliminar validaciones de seguridad ni *feature flags* sin actualizar docs.
- **No** loguear PII ni texto en claro de mensajes (ver `docs/DM_MESSAGING.md`).
- **Siempre** mantener i18n (sin literales) y **dark mode**.
- **Cualquier** atajo DEV debe quedar marcado con `// TODO: harden for production`.
- Antes de tocar mensajería, **leer** `docs/DM_MESSAGING.md` y respetar contratos WS/HTTP.


## 1) Project Overview
**ParkDog** conecta dueños de perros mediante visitas a parques y matching.
- **Frontend**: Next.js 15.x (App Router) · Redux · shadcn/ui · Tailwind
- **Backend**: Flask 3.x · PostgreSQL · SQLAlchemy · Socket.IO
- **Mobile**: React Native 0.81.5 (Pure RN CLI, NO Expo) - Proyecto: `mobile/`
- **Infra DEV**: Docker Compose (DB/Redis)

Pilares: mínima superficie de ataque, baja latencia, i18n (es/en), **dark mode** intacto.

---

## 2) Arquitectura (breve)
**Backend** `app/`
- `models/` User, Dog, Park, Visit, Match, Conversation, Message, MessageRead, UserBlock
- `routes/` REST por dominio (auth, users, parks, visits, matches, messages)
- `realtime/` Socket.IO (auth, dm, presence)
- `services/` match_service, dm_service, notification_service
- `utils/` auth, validators, crypto, upload

**Frontend** `frontend/`
- `app/` Rutas (RSC prioritario)
- `components/` UI (shadcn)
- `lib/redux/` store & slices
- `lib/api/` REST/WS client (acks, retries)
- `lib/i18n/` es/en
- `hooks/` useAuth, useProtectedActions, usePublicData, useRealtime

**Mobile** `mobile/` - React Native 0.81.5 (Pure RN CLI)
- `src/navigation`, `src/screens`, `src/components`, `src/store`, `src/services`

---

## 3) Comandos DEV
```bash
# Backend / Frontend (usar Docker - ver sección Development Environment)
docker-compose up -d

# Mobile (React Native CLI)
cd mobile && npm start -- --reset-cache  # Metro en http://localhost:8081
```
```bash
# Docker (DEV convenience)
docker-compose up --build
# seed opcional
# Datos iniciales removidos - usar API para crear datos de prueba
# down
docker-compose down
```

---

## 4) Seguridad (DEV vs PROD)
- **Auth**: JWT **corto** para WS (5–15 min, `aud=realtime`); refresh sólo por HTTPS. Validar `iss/aud/exp/nbf`, rotación `kid/JWKS`.
- **Transporte**: WSS en PROD; CORS estricto; pingInterval/pingTimeout afinados.
- **Límites**: rate‑limit por IP/usuario; 2–4 KB por mensaje.
- **Datos**: índices, FKs, ULID/UUID; retención; PII enmascarada en logs.
- **Redis**: TLS + AUTH/ACL; adapter oficial Socket.IO.
- **Adjuntos**: pre‑signed URL, antivirus, strip EXIF, whitelist MIME/tamaño.
- **Secretos**: Vault/KMS. PoLP en IAM.
- **Observabilidad**: logs JSON, métricas (conexiones, acks, latencia, reconexiones, errores), alertas.

---

## 5) Next.js (buenas prácticas)
- Priorizar **Server Components**. Data‑fetching colocalizado y cache válido (`revalidate`).
- Suspense/streaming en rutas pesadas. Route Handlers cuando aplique.
- Optimizar imágenes (Next Image) y dividir bundles (dynamic import).
- **Dark mode**: tokens/variables; verificar contraste (WCAG AA+).
- **i18n**: sin literales; crear claves faltantes con `// TODO: translate`.

---

## 6) Flask (buenas prácticas)
- Validar **entradas** en todas las rutas (schemas); **sanear salidas**.
- Manejo centralizado de errores (mensajes seguros + `traceId`).
- SQLAlchemy con pool; evitar N+1 (eager loading si aplica).
- Indizar columnas consultadas con frecuencia y claves compuestas.
- Socket.IO: autenticar en `connect`; rechazar si no está autenticado.
- Handlers cortos; trabajo pesado en servicios/colas.
- Logging request/response con campos sensibles redactados.

---

## 7) API (HTTP) & Rutas clave
Prefijo `/api/v1`. Paginación por defecto: 20 (cursor/links).
Errores: `{ error: { code, message, details?, traceId } }`.

**Auth**
- `POST /api/v1/auth/google` login
- `GET  /api/v1/auth/me` usuario actual
- `POST /api/v1/auth/refresh` refresh

**Core**
- `GET /api/v1/parks`, `GET /api/v1/parks/:id`
- `POST /api/v1/visits`
- `POST /api/v1/matches/:targetId/like`, `POST /api/v1/matches/:targetId/unlike`
- `GET /api/v1/matches?mutual=true`

**Messaging (fallback HTTP a WS)**
- `POST /api/v1/messages`
- `GET  /api/v1/messages?conversationId=...&after=cursor&limit=n`
- `POST /api/v1/messages/read`

---

## 8) ENV (DEV→PROD)
```env
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
DATABASE_URL=postgresql://...
REDIS_URL=redis://localhost:6379/0

JWT_SECRET_KEY=dev-secret         # TODO prod: KMS/JWKS
JWT_ACCESS_TTL_MIN=120            # DEV; PROD: 10–15
WS_JWT_TTL_MIN=10
WS_AUDIENCE=realtime

FRONTEND_URL=http://localhost:3000
BACKEND_URL=http://localhost:5000
SOCKET_PATH=/socket.io
PING_INTERVAL_MS=20000
PING_TIMEOUT_MS=30000
DM_TEXT_MAX_BYTES=4096
DM_RATE_PER_MINUTE=120

CORS_ORIGINS=http://localhost:3000
E2EE_MODE=strict                  # o 'server' (dummy DEV)
E2EE_AEAD=aes-gcm                 # o xchacha20-poly1305
ALLOW_JOIN_ANY_ROOM=false
```

---

## Checklist de PR

1. **Seguridad**: auth en cada entrada; sin secretos; errores seguros.
2. **Performance**: uso de RSC/caching (web); queries indexadas; O(n) en hot paths.
3. **Dark mode**: verificado en claro/oscuro; sin colores literales.
4. **i18n**: sin strings hardcodeados; claves en es/en (añadir `// TODO: translate` si falta).
5. **Comentarios**: breves y claros; reescribir los vagos.
6. **DEV→PROD**: atajos marcados con `// TODO: harden for production`.
7. **Observabilidad**: logs/metrics clave; PII enmascarada.
8. **WS**: tokens cortos (aud=realtime) y rate-limits en eventos.
9. **DM/E2EE**: si E2EE_MODE=strict, no persistas ni loguees texto en claro; respeta key_version y contratos de docs/DM_MESSAGING.md.

---

## Tareas para Claude

* Mantener la **política de comentarios** y los **guardarraíles de seguridad**.
* Proponer fixes si detecta patrones inseguros (marcar `// TODO: harden for production` cuando no sea inmediato).
* Preservar **dark mode** e **i18n** en todo cambio UI.
* Favorecer decisiones **performantes** (RSC, caché, índices, pooling).
* Para mensajería: garantizar **idempotencia**, **acks**, **rate‑limits** y **autorización por membresía** en cada evento.
* Si hay ambigüedad, **proponer un plan** y luego mostrar diffs por archivo.


## Development Environment Rules for Claude

Siempre usar puerto comunes en front, back y mobile, si el cuerpo esta ocupado matarlo, no usar nuevos puertos
### Docker First Policy
- ALWAYS use Docker containers instead of running services directly
- NEVER run `pnpm dev`, `python run.py`, or similar commands directly
- ALWAYS use `docker-compose up` for development
- Use the provided scripts: `build-deploy.bat/sh` and `mobile-build.bat/sh`

### Development Commands for Claude
- To start full stack: `docker-compose up -d`
- To rebuild and start: `docker-compose build --no-cache && docker-compose up -d`
- To stop services: `docker-compose down`
- To view logs: `docker-compose logs -f [service_name]`
- To access containers: `docker-compose exec [service_name] bash`

### Mobile Development

#### Metro Bundler
**Levantar Metro:**
```bash
# Desde la raíz del proyecto
cd mobile && npm start -- --reset-cache
```

**Matar Metro específicamente (SIN matar sesión de Claude):**
```bash
# 1. Encontrar el PID del puerto 8081
netstat -ano | findstr :8081

# 2. Matar SOLO ese proceso específico (no todos los node)
powershell "Stop-Process -Id <PID_ESPECÍFICO> -Force"

# ⚠️ PROHIBIDO: powershell "Get-Process -Name node | Stop-Process -Force"
# (Esto mata TODOS los procesos Node, incluyendo Claude Code)
```

**Reinstalar dependencias si Metro falla:**
```bash
cd mobile
npm cache clean --force
powershell "if (Test-Path node_modules) { Remove-Item -Recurse -Force node_modules }"
npm install
npm start -- --reset-cache
```

### Service URLs (Docker)
- Frontend: http://localhost:3000
- Backend: http://localhost:5000
- Database: localhost:5432 (postgres/password)

### Mobile Deployment Rules (React Native CLI)
- NO usar Expo ni EAS (React Native puro)
- Builds locales: `cd mobile && npx react-native run-android`
- Para producción: usar Gradle directamente en `mobile/android/`

### Mobile Development Workflow
- **Development Mode**: `cd mobile && npm start -- --reset-cache`
- **Install on Android**: `cd mobile && npx react-native run-android`
- **Install on iOS**: `cd mobile && npx react-native run-ios` (requires Xcode and Mac)
- **Build APK**: Ver scripts en `mobile/android/`
- **Production Builds**: Sin Expo - builds nativos de React Native CLI

### Port Management
- Always use standard ports: Frontend (3000), Backend (5000), Mobile (8081/8082)
- If port is occupied, kill the process first, don't use new ports
- Use these commands to free ports:

#### Kill Process Commands:
```bash
# Find process using port
netstat -ano | findstr :3000

# Kill process by PID (Windows)
powershell "Stop-Process -Id <PID> -Force"

# Kill specific Next.js instances
powershell "Get-Process -Name node | Where-Object {$_.MainWindowTitle -like '*Next.js*'} | Stop-Process -Force"
powershell "Get-Process -Name node | Stop-Process -Force"  # Kill all node processes if needed
```
```