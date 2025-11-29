# ParkDog - Buenas Prácticas de Desarrollo

**Fecha:** 2025-11-08
**Versión:** 1.0
**Proyecto:** ParkDog (Full-stack React Native + Next.js + Flask)

---

## 📋 Tabla de Contenidos

1. [Principios Fundamentales](#principios-fundamentales)
2. [Frontend - React Native (Mobile)](#frontend---react-native-mobile)
3. [Frontend - Next.js (Web)](#frontend---nextjs-web)
4. [Backend - Flask](#backend---flask)
5. [Internacionalización (i18n)](#internacionalización-i18n)
6. [Manejo de Errores](#manejo-de-errores)
7. [Seguridad](#seguridad)
8. [WebSockets y Tiempo Real](#websockets-y-tiempo-real)
9. [Testing y Quality Assurance](#testing-y-quality-assurance)
10. [Git y Versionado](#git-y-versionado)

---

## 1. Principios Fundamentales

### Security First
- **NUNCA** commitear credenciales, API keys, o secretos
- **NUNCA** loguear PII (Personally Identifiable Information) ni texto en claro de mensajes
- **SIEMPRE** validar inputs en frontend Y backend
- **SIEMPRE** sanitizar outputs antes de mostrar al usuario

### Performance Minded
- Priorizar Server Components en Next.js cuando sea posible
- Usar queries indexadas en base de datos
- Evitar N+1 queries en SQLAlchemy
- Optimizar hot paths (código que se ejecuta frecuentemente)

### DX Clara (Developer Experience)
- Código auto-documentado con nombres descriptivos
- Comentarios breves y claros solo cuando sea necesario
- Reescribir comentarios vagos
- Mantener consistencia en estructura de carpetas

### Atajos de Desarrollo
- Marcar atajos temporales con `// TODO: harden for production`
- Documentar decisiones técnicas en PRs
- Actualizar documentación cuando se cambian features

---

## 2. Frontend - React Native (Mobile)

### Estructura de Proyecto

**Directorio:** `mobile/` (React Native puro 0.81.5 - NO Expo)

```
mobile/
├── src/
│   ├── screens/           # Pantallas de la app
│   ├── components/        # Componentes reutilizables
│   ├── navigation/        # Navegadores (Stack, Tab, etc.)
│   ├── services/          # API clients, storage, media
│   │   ├── api/          # Servicios de API REST
│   │   ├── storage/      # secureStorage (Keychain)
│   │   └── media/        # imageService
│   ├── store/            # Redux (slices)
│   ├── hooks/            # Custom hooks
│   ├── utils/            # Utilidades (apiErrorHandler, logger)
│   └── i18n/             # Traducciones (es/en)
├── android/              # Código nativo Android
└── .env                  # Variables de entorno
```

### Dependencias Nativas

✅ **USAR** (React Native puro):
- `react-native-keychain` para secure storage
- `react-native-image-picker` para imágenes
- `react-native-vector-icons` para iconos
- `@react-native-community/geolocation` para ubicación
- `react-native-localize` para i18n

❌ **NO USAR** (Expo):
- `expo-secure-store`
- `expo-image-picker`
- `@expo/vector-icons`
- `expo-location`
- Ninguna dependencia de Expo

### Servicios Centralizados

#### secureStorage.js
```javascript
// Wrapper de react-native-keychain
import { secureStorage } from './services/storage/secureStorage'

await secureStorage.setItemAsync('key', 'value')
const value = await secureStorage.getItemAsync('key')
await secureStorage.deleteItemAsync('key')
```

#### imageService.js
```javascript
// Wrapper de react-native-image-picker
import { imageService } from './services/media/imageService'

const result = await imageService.pickImageAsync(options)
const result = await imageService.takePhotoAsync(options)
```

### API Error Handling

**SIEMPRE** usar el wrapper `handleApiCall` en lugar de llamadas directas:

```javascript
// ❌ MAL
export const getParks = async () => {
  return apiClient.get('/parks')
}

// ✅ BIEN
import { handleFetch } from '../../utils/apiErrorHandler'
import i18n from '../../i18n'

export const getParks = async (params = {}) => {
  return handleFetch(
    () => apiClient.get('/parks', params),
    'parques' // resourceName (para logging)
  )
}
```

#### Wrappers disponibles:

```javascript
// Operaciones CRUD
handleFetch()    // GET - sin toast de éxito
handleCreate()   // POST - con toast de éxito
handleUpdate()   // PUT/PATCH - con toast de éxito
handleDelete()   // DELETE - con toast de éxito

// Genérico (máxima configuración)
handleApiCall(apiCall, {
  errorTitle: i18n.t('api.auth.loginError'),
  errorMessage: 'Custom error message',
  successTitle: i18n.t('common.success'),
  successMessage: i18n.t('api.auth.loginSuccess'),
  showSuccessToast: true,
  showErrorToast: true,
  onError: (error, errorType) => {},
  onSuccess: (result) => {}
})
```

### Logging

**SIEMPRE** incluir logs detallados en:
- Requests API (método, endpoint, headers, body)
- Responses API (status, data)
- Errores (mensaje, status, data, stack)

```javascript
console.log(`[API] POST /auth/google`, { headers, body })
console.log(`[API] 200 /auth/google`, data)
console.error(`[API] Error on /auth/google:`, { message, status, data })
```

### Toast Notifications

**Tipos de error automáticos:**
- Network error → "No se pudo conectar al servidor"
- Timeout → "La solicitud tardó demasiado"
- 401 → "Tu sesión ha expirado"
- 403 → "No tienes permisos"
- 404 → "El recurso no existe"
- 500 → "Error del servidor"

Los mensajes del backend (`error.data.message`) se usan automáticamente si existen.

---

## 3. Frontend - Next.js (Web)

### Estructura Recomendada

```
frontend/
├── app/               # App Router (Next.js 15)
│   ├── (auth)/       # Rutas de autenticación
│   ├── (dashboard)/  # Rutas protegidas
│   └── api/          # Route Handlers
├── components/        # Componentes UI
│   ├── ui/           # shadcn/ui components
│   └── features/     # Componentes por feature
├── lib/
│   ├── redux/        # Store y slices
│   ├── api/          # REST/WS clients
│   └── i18n/         # Traducciones
└── hooks/            # Custom hooks
```

### Server Components vs Client Components

✅ **Priorizar Server Components** para:
- Data fetching
- Renderizado inicial
- SEO-friendly pages
- Reducir bundle size

```javascript
// ✅ BIEN - Server Component
export default async function ParksPage() {
  const parks = await fetchParks() // Server-side
  return <ParksList parks={parks} />
}
```

❌ **Client Components** solo cuando sea necesario:
- Interactividad (useState, useEffect)
- Event handlers
- Browser APIs
- Context providers

```javascript
// Client Component cuando sea necesario
'use client'

export function InteractiveMap() {
  const [selected, setSelected] = useState(null)
  return <Map onSelect={setSelected} />
}
```

### Data Fetching

```javascript
// Fetch con revalidación
export async function getParks() {
  const res = await fetch('https://api.parkdog.com/parks', {
    next: { revalidate: 3600 } // Revalidar cada hora
  })
  return res.json()
}

// Fetch con cache tag
export async function getPark(id) {
  const res = await fetch(`https://api.parkdog.com/parks/${id}`, {
    next: { tags: [`park-${id}`] }
  })
  return res.json()
}
```

### Dark Mode

✅ **SIEMPRE** verificar contraste (WCAG AA+)
✅ **USAR** tokens/variables CSS en lugar de colores literales
✅ **PROBAR** en ambos modos antes de commit

```css
/* ✅ BIEN */
.button {
  background-color: var(--primary);
  color: var(--text-primary);
}

/* ❌ MAL */
.button {
  background-color: #2563eb;
  color: #ffffff;
}
```

---

## 4. Backend - Flask

### Estructura Recomendada

```
backend/
├── app/
│   ├── models/           # SQLAlchemy models
│   ├── routes/           # Blueprints por dominio
│   ├── services/         # Lógica de negocio
│   ├── realtime/         # Socket.IO handlers
│   └── utils/            # Auth, validators, crypto
├── migrations/           # Alembic migrations
└── config.py            # Configuración
```

### Validación de Inputs

✅ **SIEMPRE** validar en TODAS las rutas:

```python
# ❌ MAL
@app.route('/users/<int:user_id>', methods=['PUT'])
def update_user(user_id):
    data = request.json
    user.name = data['name']  # Sin validación!
    db.session.commit()

# ✅ BIEN
@app.route('/users/<int:user_id>', methods=['PUT'])
def update_user(user_id):
    data = request.json

    # Validar schema
    if not validate_user_schema(data):
        return {'error': 'Invalid data'}, 400

    # Sanitizar
    name = sanitize_string(data.get('name', ''))

    user.name = name
    db.session.commit()
```

### Manejo de Errores

```python
# Centralizado con traceId
@app.errorhandler(Exception)
def handle_error(error):
    trace_id = uuid.uuid4()

    logger.error(f'[{trace_id}] {str(error)}', exc_info=True)

    return {
        'error': {
            'code': 'INTERNAL_ERROR',
            'message': 'An error occurred',
            'traceId': str(trace_id)
        }
    }, 500
```

### SQLAlchemy Optimizations

```python
# ❌ MAL - N+1 query
users = User.query.all()
for user in users:
    print(user.dogs)  # Query por cada usuario!

# ✅ BIEN - Eager loading
users = User.query.options(
    joinedload(User.dogs)
).all()
```

### Indexación

✅ **SIEMPRE** indexar:
- Foreign keys
- Columnas en WHERE clauses
- Columnas en ORDER BY
- Claves compuestas frecuentes

```python
class Visit(db.Model):
    __tablename__ = 'visits'

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), index=True)
    park_id = db.Column(db.Integer, db.ForeignKey('parks.id'), index=True)
    created_at = db.Column(db.DateTime, index=True)

    # Índice compuesto para queries frecuentes
    __table_args__ = (
        db.Index('idx_user_park', 'user_id', 'park_id'),
    )
```

---

## 5. Internacionalización (i18n)

### Regla de Oro

❌ **NUNCA** usar strings hardcodeados
✅ **SIEMPRE** usar claves de traducción

```javascript
// ❌ MAL
<Text>Bienvenido a ParkDog</Text>
Toast.show({ text1: 'Error', text2: 'No se pudo cargar' })

// ✅ BIEN
import { useTranslation } from 'react-i18next'

const { t } = useTranslation()
<Text>{t('auth.loginTitle')}</Text>
Toast.show({
  text1: t('common.error'),
  text2: t('errors.loadingError')
})
```

### Estructura de Keys

```json
{
  "common": { "error": "Error", "success": "Success" },
  "auth": {
    "loginTitle": "Welcome",
    "loginError": "Login failed"
  },
  "api": {
    "auth": {
      "loginError": "Authentication error",
      "logoutSuccess": "Signed out successfully"
    },
    "parks": {
      "getParksError": "Error loading parks",
      "favoriteSuccess": "Park added to favorites"
    }
  },
  "errors": {
    "api": {
      "networkError": "Connection Error",
      "networkErrorMsg": "Could not connect to server"
    }
  }
}
```

### Agregar Nuevas Traducciones

1. Agregar keys en `es.json`
2. Agregar keys en `en.json`
3. Usar en código con `i18n.t('key')`
4. Marcar como `// TODO: translate` si falta traducción

---

## 6. Manejo de Errores

### Tipos de Error Predefinidos

```javascript
export const ERROR_TYPES = {
  NETWORK: 'network',        // Error de conexión
  TIMEOUT: 'timeout',        // Timeout
  UNAUTHORIZED: 'unauthorized', // 401
  FORBIDDEN: 'forbidden',    // 403
  NOT_FOUND: 'not_found',    // 404
  SERVER_ERROR: 'server_error', // 5xx
  VALIDATION: 'validation',  // 400, 422
  UNKNOWN: 'unknown'         // Otros
}
```

### Detección Automática

El sistema detecta automáticamente el tipo de error basándose en:
- Palabras clave en mensaje ("network", "timeout", "connection")
- Código HTTP (401, 403, 404, 500, etc.)
- Datos del backend (`error.data.message`)

### Logging de Errores

```javascript
console.error('[ApiErrorHandler] Error:', {
  type: errorType,
  message: error.message,
  status: error.status,
  data: error.data,
  stack: error.stack
})
```

---

## 7. Seguridad

### Tokens JWT

✅ **Buenas prácticas:**
- TTL cortos (5-15 min para WebSocket, 2h para REST)
- `aud=realtime` para tokens WS
- Validar `iss/aud/exp/nbf`
- Rotación con `kid/JWKS`
- Refresh solo por HTTPS

```python
# Backend - Generar token
token = jwt.encode({
    'user_id': user.id,
    'aud': 'realtime',
    'iss': 'parkdog-api',
    'exp': datetime.utcnow() + timedelta(minutes=10),
    'nbf': datetime.utcnow()
}, SECRET_KEY)
```

### Secrets Management

❌ **NUNCA** en código:
```javascript
const API_KEY = "sk_live_abc123..."  // ¡NO!
```

✅ **SIEMPRE** en variables de entorno:
```javascript
const API_KEY = process.env.API_KEY
```

### Rate Limiting

```python
# Backend
@limiter.limit("100 per minute")
@app.route('/api/messages', methods=['POST'])
def send_message():
    # ...
```

### PII en Logs

❌ **NUNCA** loguear:
- Contraseñas
- Tokens completos
- Emails completos
- Contenido de mensajes
- Datos personales

✅ **ENMASCARAR** datos sensibles:
```python
# ❌ MAL
logger.info(f'User {user.email} logged in')

# ✅ BIEN
logger.info(f'User {mask_email(user.email)} logged in')
# Output: "User jo***@example.com logged in"
```

---

## 8. WebSockets y Tiempo Real

### Arquitectura Híbrida (Best of Both Worlds)

🔌 **WebSocket** para:
- Mensajes instantáneos (`dm:send`, `dm:new`)
- Typing indicators (`dm:typing`)
- Read receipts (`dm:read`)
- Presence (online/offline)
- Latencia <50ms

🌐 **HTTP REST** para:
- Historial de mensajes (paginado)
- Carga inicial de conversaciones
- Fallback cuando WebSocket falla
- Operaciones que requieren cache/CDN

### Fallback Automático

```javascript
// El sistema detecta fallas automáticamente
if (httpFallbackMode || !socket?.connected) {
  console.log('🔄 FALLBACK: Using HTTP')
  return this._sendMessageHTTPFallback(conversationId, text)
}
```

### Configuración Mobile-First

```javascript
socket = io(apiClient.wsURL, {
  transports: ['websocket'],        // Skip polling
  timeout: 8000,                    // Más corto para mobile
  reconnectionAttempts: 5,          // Límite para batería
  reconnectionDelay: 1000,          // Retry rápido
  reconnectionDelayMax: 5000,       // Máximo delay
})
```

### Security en WebSocket

✅ **Autenticar** en `connect`:
```javascript
socket.on('connect', () => {
  socket.emit('authenticate', { token: realtimeToken })
})
```

✅ **Rate limit** eventos:
```python
# Backend
@socketio.on('dm:send')
@rate_limit(120, 'per_minute')  # 120 mensajes/min
def handle_dm_send(data):
    # ...
```

---

## 9. Testing y Quality Assurance

### Pre-Commit Checklist

- [ ] **Seguridad**: Auth en cada entrada, sin secretos, errores seguros
- [ ] **Performance**: RSC/caching (web), queries indexadas, hot paths optimizados
- [ ] **Dark mode**: Verificado en ambos modos, sin colores literales
- [ ] **i18n**: Sin strings hardcodeados, claves en es/en
- [ ] **Comentarios**: Breves y claros, reescritos si son vagos
- [ ] **DEV→PROD**: Atajos marcados con `// TODO: harden for production`
- [ ] **Logging**: Logs/metrics clave, PII enmascarada
- [ ] **WebSocket**: Tokens cortos, rate-limits en eventos
- [ ] **Tests**: Unitarios y de integración actualizados

### Testing Priorities

1. **Crítico** (DEBE testearse):
   - Autenticación y autorización
   - Transacciones de pago
   - Lógica de matching
   - WebSocket connections

2. **Importante** (DEBERÍA testearse):
   - CRUD operations
   - Validaciones de formularios
   - Error handling
   - i18n

3. **Nice-to-have**:
   - UI components
   - Styling
   - Animaciones

---

## 10. Git y Versionado

### Commits

✅ **Buenas prácticas:**
- Mensajes concisos (1-2 oraciones)
- Foco en el "por qué", no el "qué"
- Seguir estilo del repositorio (ver `git log`)

```bash
# ✅ BIEN
git commit -m "Fix Google Sign-In token access path

La API de @react-native-google-signin devuelve el token
directamente en userInfo.idToken, no en userInfo.data.idToken

🤖 Generated with Claude Code
Co-Authored-By: Claude <noreply@anthropic.com>"

# ❌ MAL
git commit -m "fixed bug"
```

### NO Commitear

❌ **NUNCA** commitear:
- `.env` files
- `credentials.json`
- API keys
- Passwords
- Tokens
- `node_modules/`
- Build artifacts (`dist/`, `build/`)

### Branches

```
main          # Producción estable
develop       # Desarrollo activo
feature/*     # Nuevas features
fix/*         # Bug fixes
hotfix/*      # Fixes urgentes para producción
```

---

## 📚 Documentos Relacionados

- **CLAUDE.md**: Guía maestra para Claude Code
- **docs/AUTHENTICATION_IMPLEMENTATION.md**: Sistema de autenticación
- **docs/DM_MESSAGING.md**: Messaging y E2EE
- **docs/HYBRID_ARCHITECTURE.md**: WebSocket + HTTP arquitectura

---

## 🔄 Actualizaciones

Este documento debe actualizarse cuando:
- Se agreguen nuevas convenciones
- Se identifiquen anti-patterns comunes
- Se actualicen dependencias mayores
- Se cambien arquitecturas fundamentales

**Última actualización:** 2025-11-08
**Próxima revisión:** 2025-12-08

---

**¿Preguntas?** Consulta CLAUDE.md o pregunta en el equipo.
