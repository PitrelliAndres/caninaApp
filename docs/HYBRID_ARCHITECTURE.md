# 🏗️ ARQUITECTURA HÍBRIDA - Reglas y Especificaciones

## 📋 PRINCIPIOS FUNDAMENTALES

### **🔌 WebSocket + 🌐 HTTP REST = Mejor de ambos mundos**

Esta arquitectura combina:
- **WebSocket**: Para comunicación tiempo real (<50ms latencia)
- **HTTP REST**: Para operaciones CRUD confiables y cache
- **Fallback inteligente**: Cambio automático sin interrumpir UX

---

## 🎯 CASOS DE USO POR PROTOCOLO

### **🔌 WebSocket - Tiempo Real**
**Optimizado para**: Baja latencia, interacciones inmediatas, UX fluida
**Cuando usar**:
- Envío de mensajes instantáneos (`dm:send`)
- Recepción inmediata de mensajes (`dm:new`)
- Typing indicators (`dm:typing`)
- Read receipts (`dm:read`)
- Presence online/offline
- Notificaciones push en tiempo real

**Beneficios**:
- ⚡ Latencia ultra-baja (<50ms)
- 🔄 Comunicación bidireccional
- 📱 Optimizado para mobile networks
- 🔋 Configuración battery-conscious

### **🌐 HTTP REST - CRUD**
**Optimizado para**: Operaciones pesadas, historial, cache, paginación
**Cuando usar**:
- Historial de mensajes (paginado)
- Carga inicial de conversaciones
- Operaciones que requieren cache/CDN
- Fallback cuando WebSocket falla
- Operaciones transaccionales críticas

**Beneficios**:
- 🛡️ Probado y confiable
- 🗄️ Cache-friendly (CDN, browser)
- 📄 Paginación eficiente
- 🔧 Debugging más fácil
- 📱 Offline-capable

---

## 🔄 ESTRATEGIA DE FALLBACK

### **Detección Automática**
```javascript
// Mobile detecta falla de WebSocket automáticamente
if (httpFallbackMode || !socket?.connected) {
    console.log('🔄 FALLBACK: Using HTTP instead of WebSocket')
    return this._sendMessageHTTPFallback(conversationId, text)
}
```

### **Escenarios de Fallback**
1. **Conexión inicial fallida**: HTTP inmediato
2. **Timeout de WebSocket**: HTTP después de 8s
3. **Desconexión de red**: HTTP hasta reconexión
4. **Máximo reintentos**: HTTP permanente + retry cada 30s

### **Estrategia Híbrida**
- **Envío de mensajes**: WebSocket → HTTP fallback automático
- **Historial**: Siempre HTTP (más eficiente para paginación)
- **Typing/Read**: Solo WebSocket (features opcionales)
- **Carga inicial**: HTTP para consistencia

---

## 📱 OPTIMIZACIONES MOBILE

### **Configuración WebSocket Mobile-First**
```javascript
socket = io(apiClient.wsURL, {
    transports: ['websocket'],        // Skip polling
    timeout: 8000,                    // Más corto para mobile
    reconnectionAttempts: 5,          // Límite para preservar batería
    reconnectionDelay: 1000,          // Retry rápido
    reconnectionDelayMax: 5000,       // Máximo para batería
})
```

### **Battery & Network Conscious**
- ⏱️ Timeouts cortos (8s vs 30s desktop)
- 🔋 Límite de reintentos (5 vs ∞)
- 📡 Reconnect delays optimizados
- 📱 Platform-specific configurations

### **Mobile Network Resilience**
- Auto-detección de cambios de red
- Retry inteligente en network switches
- Fallback inmediato en conexiones lentas
- Token refresh automático

---

## 🔐 SEGURIDAD

### **WebSocket Token Management**
```javascript
// Tokens de corta duración (5-10 min)
const realtimeToken = await this._ensureWebSocketToken()

// Refresh automático
if (reason === 'io server disconnect') {
    console.log('🔑 Server disconnect, refreshing token')
    this._refreshWebSocketToken()
}
```

### **Security Best Practices**
- 🔑 Tokens WebSocket de corta duración (5-10min)
- 🔄 Refresh automático antes de expiración
- 🔒 Secure storage (`SecureStore` mobile, `httpOnly` web)
- 📊 Error monitoring sin PII
- ⚡ Rate limiting por usuario/IP

---

## 🏗️ IMPLEMENTACIÓN POR PLATAFORMA

### **Mobile (React Native)**
```javascript
// mobile/src/services/api/messages.js
export const messageService = {
    // 🌐 HTTP CRUD
    async getChatMessages(chatId, page = 1) {
        return apiClient.get(`/messages/chats/${chatId}/messages`, { page })
    },
    
    // 🔌 WebSocket Real-time
    async sendDMMessage(conversationId, text, clientTempId = null) {
        if (httpFallbackMode || !socket?.connected) {
            return this._sendMessageHTTPFallback(conversationId, text)
        }
        // WebSocket send...
    }
}
```

### **Frontend (Next.js)**
```javascript
// frontend/lib/api/messages.js
export const messageService = {
    // 🌐 HTTP CRUD
    async getChatMessages(chatId, page = 1) {
        return apiClient.get(`/messages/chats/${chatId}/messages`, { page })
    },
    
    // 🔌 WebSocket Real-time
    async sendDMMessage(conversationId, text, clientTempId = null) {
        if (fallbackMode || !this.socket?.connected) {
            return this._sendMessageHTTPFallback(conversationId, text)
        }
        // WebSocket send...
    }
}
```

### **Backend (Flask + Socket.IO)**
```python
# backend/app/routes/messages.py
@socketio.on('dm:send')
def handle_dm_send(data):
    # WebSocket handler
    
@bp.route('/messages/chats/<int:chat_id>/messages', methods=['POST'])
def send_message_http(chat_id):
    # HTTP fallback handler
```

---

## 📊 MONITORING & DEBUGGING

### **Connection Status Tracking**
```javascript
getConnectionStatus() {
    if (httpFallbackMode) return 'http_fallback'
    if (!socket) return 'not_initialized'
    if (socket.connected) return 'websocket_connected'
    return 'websocket_disconnected'
}
```

### **Logging Standards**
```javascript
// ✅ Bueno: Logs estructurados sin PII
console.log('🔌 WEBSOCKET: Connected successfully', {
    socketId: socket.id,
    transport: socket.io.engine.transport.name,
    reconnectAttempts
})

// ❌ Malo: Logs con contenido de usuario
console.log('Message sent:', { text: 'secret message' })
```

### **Métricas Clave**
- 📡 Conexiones WebSocket activas
- ⏱️ Latencia de mensajes p50/p95/p99
- 🔄 Tasa de fallback HTTP
- 🔁 Reconexiones por minuto
- 📱 Errores por plataforma

---

## 🚀 BENEFICIOS DE LA ARQUITECTURA

### **Performance**
- ⚡ Mensajes tiempo real: <50ms
- 📊 Historial eficiente: HTTP cache + paginación
- 🔄 Fallback sin interrupciones: <200ms switch time
- 📱 Mobile optimizado: Battery & network aware

### **Reliability**
- 🛡️ 99.9% disponibilidad (WebSocket + HTTP redundancy)
- 🔧 Debugging simplificado por protocolo
- 📱 Network resilience para mobile
- 🔄 Graceful degradation automática

### **Scalability**
- ⚖️ Load balancing independiente por protocolo
- 📈 Horizontal scaling: WebSocket servers + HTTP servers
- 🗄️ CDN para historial HTTP
- 💾 Cache layers optimizados

### **Developer Experience**
- 🔍 Logs estructurados por protocolo
- 🛠️ APIs unificadas (mismo método, protocolo automático)
- 📚 Documentación clara de cuándo usar cada protocolo
- 🔧 Testing independiente: WebSocket vs HTTP

---

## 🎯 REGLAS DE IMPLEMENTACIÓN

### **OBLIGATORIO - Mobile**
1. **Timeouts cortos**: 8s WebSocket, 30s HTTP
2. **Límite de reconexión**: Máximo 5 intentos
3. **Fallback automático**: Sin intervención manual
4. **Token refresh**: Antes de expiración
5. **Logs estructurados**: Sin PII, con contexto

### **OBLIGATORIO - Frontend**
1. **Cache HTTP**: Para historial de mensajes
2. **WebSocket resilience**: Auto-reconnect en network changes
3. **User feedback**: Indicadores de conexión/fallback
4. **Error boundaries**: Graceful fallback en crashes
5. **Performance monitoring**: Latencia y fallback rates

### **OBLIGATORIO - Backend**
1. **Dual handlers**: WebSocket + HTTP para mismo endpoint
2. **Rate limiting**: Por protocolo y usuario
3. **Monitoring**: Métricas separadas por protocolo
4. **Security**: Token validation en ambos protocolos
5. **Fallback logic**: Consistencia entre protocolos

---

## 🔧 CONFIGURACIÓN RECOMENDADA

### **Mobile (React Native)**
```javascript
// Configuración optimizada para mobile networks
const MOBILE_WS_CONFIG = {
    timeout: 8000,                    // Network mobile más lento
    reconnectionAttempts: 5,          // Preservar batería
    reconnectionDelay: 1000,          // Retry rápido
    reconnectionDelayMax: 5000,       // Límite para batería
    transports: ['websocket']         // Skip polling
}
```

### **Frontend (Web)**
```javascript
// Configuración optimizada para web
const WEB_WS_CONFIG = {
    timeout: 15000,                   // Network web más estable
    reconnectionAttempts: 10,         // Más reintentos
    reconnectionDelay: 2000,          // Delay estándar
    reconnectionDelayMax: 10000,      // Más tiempo para retry
    transports: ['websocket', 'polling'] // Polling fallback
}
```

### **Backend (Flask)**
```python
# Configuración de Socket.IO
SOCKETIO_CONFIG = {
    'cors_allowed_origins': CORS_ORIGINS,
    'async_mode': 'threading',
    'ping_interval': 20,              # Mobile-friendly
    'ping_timeout': 30,               # Balance mobile/web
    'max_http_buffer_size': 4096      # Límite de mensaje
}
```

---

## 📈 ROADMAP & MEJORAS FUTURAS

### **Fase 1 - Implementación Base** ✅
- [x] Mobile: Arquitectura híbrida
- [x] Frontend: Arquitectura híbrida  
- [x] Backend: Dual handlers
- [x] Documentación completa

### **Fase 2 - Optimización**
- [ ] **Cache inteligente**: Redis para mensajes frecuentes
- [ ] **Compression**: WebSocket message compression
- [ ] **CDN**: Estáticos y historial de mensajes
- [ ] **Monitoring**: Dashboards tiempo real

### **Fase 3 - Escalabilidad**
- [ ] **Load balancing**: WebSocket sticky sessions
- [ ] **Horizontal scaling**: Multiple WebSocket servers
- [ ] **Message queuing**: Redis Pub/Sub entre servers
- [ ] **Geographic distribution**: Edge servers

### **Fase 4 - Avanzado**
- [ ] **E2EE**: End-to-end encryption híbrida
- [ ] **Offline sync**: IndexedDB + sync al reconectar
- [ ] **Message threading**: Hilos de conversación
- [ ] **Rich media**: Archivos, imágenes, videos

---

## ⚠️ CONSIDERACIONES IMPORTANTES

### **Limitaciones Actuales**
- **E2EE**: Pendiente implementación completa
- **Offline**: Limitado a cache browser
- **Rich media**: Solo texto actualmente
- **Threading**: Una conversación lineal

### **Trade-offs**
- **Complejidad**: Dos protocolos vs uno
- **Testing**: Requerimientos duplicados
- **Monitoring**: Métricas por protocolo
- **Debugging**: Logs en dos sistemas

### **Mitigaciones**
- **APIs unificadas**: Mismo método, protocolo transparente
- **Logs estructurados**: Contexto claro por protocolo
- **Testing automatizado**: CI/CD para ambos protocolos
- **Monitoring integrado**: Dashboard único con métricas separadas

---

*📝 Documento actualizado: $(date)*
*🏗️ Versión: 1.0*
*👥 Team: ParkDog Development*

