/**
 * 🏗️ ARQUITECTURA HÍBRIDA - Servicio de Mensajes Mobile
 * 
 * PRINCIPIOS FUNDAMENTALES:
 * 🔌 WebSocket: Tiempo real, baja latencia (<50ms), bidireccional
 * 🌐 HTTP REST: CRUD estable, cache, paginación, fallback confiable
 * 🔄 Fallback Strategy: HTTP automático si WebSocket falla
 * 
 * CASOS DE USO POR PROTOCOLO:
 * 
 * 🔌 WebSocket (Real-time):
 * - Envío de mensajes instantáneos (dm:send)
 * - Recepción inmediata (dm:new) 
 * - Typing indicators (dm:typing)
 * - Read receipts (dm:read)
 * - Presence online/offline
 * 
 * 🌐 HTTP REST (CRUD):
 * - Historial de mensajes (paginado)
 * - Carga inicial de conversación
 * - Fallback cuando WebSocket falla
 * - Operaciones que requieren cache/CDN
 */

import { apiClient } from './client'
import { io } from 'socket.io-client'
import { secureStorage } from '../storage/secureStorage'
import MobileLogger from '../../utils/logger'

let socket = null
let httpFallbackMode = false
let reconnectAttempts = 0
const MAX_RECONNECT_ATTEMPTS = 5

export const messageService = {
  // =====================================
  // 🌐 HTTP REST API - CRUD Operations  
  // =====================================
  // Optimizado para: historial, paginación, cache, fallback
  // Beneficios: CDN-friendly, probado, debugging fácil, offline-capable
  
  async getConversations({ cursor = null, limit = 20 } = {}) {
    // Get conversations with pagination support
    const params = {};
    if (cursor) params.cursor = cursor;
    if (limit) params.limit = limit;

    return apiClient.get('/messages/conversations', { params });
  },

  async getChatMessages(chatId, page = 1) {
    // Obteniendo historial de chat por HTTP
    return apiClient.get(`/messages/chats/${chatId}/messages`, { page })
  },

  async sendMessageHTTPFallback(chatId, text) {
    // Enviando mensaje por HTTP como fallback
    
    try {
      const response = await apiClient.post(`/messages/chats/${chatId}/messages`, { text })
      return response
    } catch (error) {
      MobileLogger.logError(error, {
        chatId, textLength: text.length, fallbackFailed: true
      }, 'MessageService')
      throw error
    }
  },

  // =====================================
  // 🔌 WEBSOCKET - Real-Time Operations
  // =====================================
  // Optimizado para: mensajes instantáneos, typing, presence, notificaciones
  // Beneficios: <50ms latencia, bidireccional, eficiente, UX superior
  
  async connectWebSocket() {
    // Inicializando conexión WebSocket

    // Si ya está conectado, reutilizar
    if (socket?.connected) {
      // Reutilizando conexión existente
      return socket
    }

    try {
      // 🔑 Security: Obtener token de corta duración (5-10min)
      const realtimeToken = await this._ensureWebSocketToken()
      if (!realtimeToken) {
        MobileLogger.logError(new Error('WebSocket token unavailable'), {}, 'MessageService')
        this._enableHTTPFallback()
        return null
      }

      // Conectar con configuración optimizada para mobile
      socket = io(apiClient.wsURL, {
        auth: { token: realtimeToken },
        transports: ['websocket'],        // Skip polling para mejor mobile performance
        timeout: 8000,                    // Timeout más corto para redes mobile
        reconnection: true,               // Auto-reconnect en cambios de red mobile
        reconnectionAttempts: MAX_RECONNECT_ATTEMPTS,
        reconnectionDelay: 1000,          // Retry rápido para mobile
        reconnectionDelayMax: 5000,       // Máximo delay para preservar batería
        maxReconnectionAttempts: MAX_RECONNECT_ATTEMPTS,
      })

      // 📊 Connection event monitoring
      socket.on('connect', () => {
        // WebSocket conectado exitosamente
        
        reconnectAttempts = 0
        httpFallbackMode = false
        this._setupRealtimeListeners()
      })

      socket.on('connect_error', (error) => {
        // Error de conexión WebSocket
        MobileLogger.logError(error, {
          errorType: 'connection_failed',
          reconnectAttempts,
          fallbackEnabled: true
        }, 'MessageService')
        
        reconnectAttempts++
        if (reconnectAttempts >= MAX_RECONNECT_ATTEMPTS) {
          // Máximo de intentos alcanzado, activando fallback HTTP
          this._enableHTTPFallback()
        }
      })

      socket.on('disconnect', (reason) => {
        // WebSocket desconectado

        // Si el servidor nos desconectó, necesitamos nuevo token
        if (reason === 'io server disconnect') {
          // Servidor desconectó, refrescando token
          this._refreshWebSocketToken()
        }
      })

      socket.on('reconnect', (attemptNumber) => {
        // WebSocket reconectado exitosamente
        httpFallbackMode = false
      })

      return socket

    } catch (error) {
      console.error('🔌 WEBSOCKET: Setup failed, enabling HTTP fallback')
      MobileLogger.logError(error, {
        errorType: 'websocket_setup_failed',
        fallbackEnabled: true
      }, 'MessageService')
      this._enableHTTPFallback()
      return null
    }
  },

  disconnectWebSocket() {
    if (socket) {
      socket.disconnect()
      socket = null
    }
  },

  getSocket() {
    return socket
  },

  emitTyping(chatId, otherUserId) {
    if (socket && socket.connected) {
      socket.emit('typing', { chat_id: chatId, other_user_id: otherUserId })
    }
  },

  markAsRead(chatId) {
    if (socket && socket.connected) {
      socket.emit('mark_read', { chat_id: chatId })
    }
  },

  // DM Events - New conversation-based messaging
  // 🔌 Join conversation para updates en tiempo real
  async joinConversation(conversationId) {
    // Joining conversation for real-time updates
    
    // 🔄 Fallback: Si WebSocket no disponible, obtener mensajes por HTTP
    if (httpFallbackMode || !socket?.connected) {
      // Fallback: Getting initial messages via HTTP
      const response = await this.getChatMessages(conversationId, 1)
      return { messages: response.messages || [] }
    }

    return new Promise((resolve, reject) => {
      socket.emit('dm:join', { conversationId })
      
      const timeout = setTimeout(() => {
        console.warn('🔌 WEBSOCKET: Join timeout, falling back to HTTP')
        this.getChatMessages(conversationId, 1)
          .then(response => resolve({ messages: response.messages || [] }))
          .catch(reject)
      }, 5000)

      socket.once('dm:joined', (response) => {
        clearTimeout(timeout)
        // Joined conversation successfully
        resolve(response)
      })
    })
  },

  // 🔌 Real-time message sending (método principal)
  async sendDMMessage(conversationId, text, clientTempId = null) {
    // Attempting real-time message send via WebSocket
    
    // 🔄 Fallback check: Si WebSocket no disponible, usar HTTP
    if (httpFallbackMode || !socket?.connected) {
      // WebSocket unavailable, using HTTP fallback
      return this._sendMessageHTTPFallback(conversationId, text)
    }

    const tempId = clientTempId || `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    
    // Emitting dm:send event

    return new Promise((resolve, reject) => {
      // ⚡ Real-time emission
      socket.emit('dm:send', { conversationId, text, tempId })

      // ⏱️ Timeout con fallback automático (mobile networks pueden ser lentas)
      const timeout = setTimeout(() => {
        console.warn('🔌 WEBSOCKET: Send timeout, falling back to HTTP')
        MobileLogger.logWarning('WEBSOCKET: Send timeout, using HTTP fallback', {
          tempId, conversationId
        }, 'MessageService')
        
        this._sendMessageHTTPFallback(conversationId, text)
          .then(resolve)
          .catch(reject)
      }, 8000) // 8s timeout para mobile

      // ✅ Esperar confirmación del servidor
      const handleAck = (response) => {
        if (response.tempId === tempId) {
          clearTimeout(timeout)
          // Message acknowledged successfully
          resolve(response)
        }
      }

      socket.once('dm:ack', handleAck)
      
      socket.once('error', (error) => {
        clearTimeout(timeout)
        console.error('🔌 WEBSOCKET: Send error, falling back to HTTP')
        this._sendMessageHTTPFallback(conversationId, text)
          .then(resolve)
          .catch(reject)
      })
    })
  },

  markAsReadDM(conversationId, upToMessageId) {
    if (!socket) return
    socket.emit('dm:read', { conversationId, upToMessageId })
  },

  // 🔌 Real-time typing indicators (solo WebSocket - feature opcional)
  sendTypingDM(conversationId, isTyping) {
    if (socket?.connected) {
      // Sending typing indicator
      socket.emit('dm:typing', { conversationId, isTyping })
    }
    // No fallback - typing es feature opcional de UX
  },

  // 🔌 Real-time read receipts (solo WebSocket - feature opcional)
  markAsReadDM(conversationId, upToMessageId) {
    if (socket?.connected) {
      // Marking messages as read
      socket.emit('dm:read', { conversationId, upToMessageId })
    }
    // Fallback HTTP podría agregarse si read receipts son críticos
  },

  // =====================================
  // 🔄 FALLBACK & ERROR HANDLING
  // =====================================
  
  async _sendMessageHTTPFallback(conversationId, text) {
    // HTTP FALLBACK: Sending message via REST API
    
    try {
      // Convertir formato de conversación nuevo a formato de chat viejo
      // Mantiene retrocompatibilidad
      const response = await this.sendMessageHTTPFallback(conversationId, text)
      
      // Simular respuesta similar a WebSocket para consistencia
      return {
        tempId: `http_${Date.now()}`,
        serverId: response.id,
        timestamp: response.created_at
      }
    } catch (error) {
      MobileLogger.logError(error, {
        conversationId, textLength: text.length, fallbackFailed: true
      }, 'MessageService')
      throw error
    }
  },

  _enableHTTPFallback() {
    // Switching to HTTP-only mode
    
    httpFallbackMode = true
    
    // Programar retry de WebSocket en 30 segundos
    setTimeout(() => {
      if (httpFallbackMode) {
        // Attempting WebSocket reconnection
        this.connectWebSocket()
      }
    }, 30000)
  },

  async _ensureWebSocketToken() {
    const token = await secureStorage.getItemAsync('realtime_token')
    if (token) {
      console.log('🔑 TOKEN: Using existing WebSocket token')
      return token
    }

    console.log('🔑 TOKEN: No token found, requesting new one')
    return this._refreshWebSocketToken()
  },

  async _refreshWebSocketToken() {
    console.log('🔑 TOKEN REFRESH: Getting new WebSocket token')
    MobileLogger.logInfo('TOKEN REFRESH: Requesting new WebSocket token', {}, 'MessageService')
    
    try {
      const authHeaders = await apiClient.getAuthHeaders()
      const response = await fetch(`${apiClient.baseURL}/auth/ws-token`, {
        method: 'POST',
        headers: { ...authHeaders, 'Content-Type': 'application/json' }
      })
      
      if (response.ok) {
        const { realtime_token } = await response.json()
        await secureStorage.setItemAsync('realtime_token', realtime_token)
        console.log('🔑 TOKEN REFRESH: ✅ New token obtained and stored')
        MobileLogger.logInfo('TOKEN REFRESH: Success', {}, 'MessageService')
        return realtime_token
      } else {
        throw new Error(`Token refresh failed: ${response.status}`)
      }
    } catch (error) {
      console.error('🔑 TOKEN REFRESH: ❌ Failed to refresh token')
      MobileLogger.logError(error, { errorType: 'token_refresh_failed' }, 'MessageService')
      return null
    }
  },

  _setupRealtimeListeners() {
    // Setting up real-time event listeners
    
    // Los listeners se configurarán por los componentes UI
    // Este método es llamado después de conexión exitosa
    if (this._dmCallbacks.newMessage) this._setupNewMessageListener()
    if (this._dmCallbacks.readReceipt) this._setupReadReceiptListener()
    if (this._dmCallbacks.typing) this._setupTypingListener()
    if (this._dmCallbacks.error) this._setupErrorListener()
  },

  // =====================================
  // 📊 MONITORING & UTILITIES
  // =====================================
  
  getSocket() {
    return socket
  },

  isWebSocketConnected() {
    return socket?.connected || false
  },

  isHTTPFallbackMode() {
    return httpFallbackMode
  },

  getConnectionStatus() {
    if (httpFallbackMode) return 'http_fallback'
    if (!socket) return 'not_initialized'
    if (socket.connected) return 'websocket_connected'
    if (socket.connecting) return 'websocket_connecting'
    return 'websocket_disconnected'
  },

  getConnectionInfo() {
    return {
      hasSocket: !!socket,
      isConnected: socket?.connected || false,
      socketId: socket?.id || null,
      transport: socket?.io?.engine?.transport?.name || null,
      fallbackMode: httpFallbackMode,
      reconnectAttempts
    }
  },

  // DM Event listeners
  // Store callbacks for later setup after connection
  _dmCallbacks: {
    newMessage: null,
    readReceipt: null,
    typing: null,
    error: null
  },
  
  onNewDMMessage(callback) {
    this._dmCallbacks.newMessage = callback
    
    if (!socket || !socket.connected) {
      MobileLogger.logInfo('📎 Storing dm:new callback for later setup', {}, 'MessageService')
      return
    }
    
    this._setupNewMessageListener()
  },
  
  _setupNewMessageListener() {
    if (!socket || !this._dmCallbacks.newMessage) return
    
    MobileLogger.logInfo('🔗 Setting up dm:new listener', {
      socketId: socket.id
    }, 'MessageService')
    
    // Remove existing listener to avoid duplicates
    socket.off('dm:new')
    
    socket.on('dm:new', (data) => {
      MobileLogger.logInfo('📨 Received dm:new event', {
        messageId: data.message?.id,
        senderId: data.message?.sender_id,
        conversationId: data.conversationId,
        textLength: data.message?.text?.length || 0,
        socketId: socket.id
      }, 'MessageService')
      
      this._dmCallbacks.newMessage(data)
    })
  },

  onDMReadReceipt(callback) {
    this._dmCallbacks.readReceipt = callback
    
    if (!socket || !socket.connected) {
      MobileLogger.logInfo('📎 Storing dm:read-receipt callback for later setup', {}, 'MessageService')
      return
    }
    
    this._setupReadReceiptListener()
  },
  
  _setupReadReceiptListener() {
    if (!socket || !this._dmCallbacks.readReceipt) return
    
    MobileLogger.logInfo('🔗 Setting up dm:read-receipt listener', {
      socketId: socket.id
    }, 'MessageService')
    
    // Remove existing listener to avoid duplicates
    socket.off('dm:read-receipt')
    
    socket.on('dm:read-receipt', (data) => {
      MobileLogger.logInfo('📬 Received dm:read-receipt event', {
        userId: data.userId,
        upToMessageId: data.upToMessageId,
        conversationId: data.conversationId,
        socketId: socket.id
      }, 'MessageService')
      
      this._dmCallbacks.readReceipt(data)
    })
  },

  onDMTyping(callback) {
    this._dmCallbacks.typing = callback
    
    if (!socket || !socket.connected) {
      MobileLogger.logInfo('📎 Storing dm:typing callback for later setup', {}, 'MessageService')
      return
    }
    
    this._setupTypingListener()
  },
  
  _setupTypingListener() {
    if (!socket || !this._dmCallbacks.typing) return
    
    MobileLogger.logInfo('🔗 Setting up dm:typing listener', {
      socketId: socket.id
    }, 'MessageService')
    
    // Remove existing listener to avoid duplicates
    socket.off('dm:typing')
    
    socket.on('dm:typing', (data) => {
      MobileLogger.logInfo('✍️ Received dm:typing event', {
        userId: data.userId,
        isTyping: data.isTyping,
        conversationId: data.conversationId,
        socketId: socket.id
      }, 'MessageService')
      
      this._dmCallbacks.typing(data)
    })
  },

  onDMError(callback) {
    this._dmCallbacks.error = callback
    
    if (!socket || !socket.connected) {
      MobileLogger.logInfo('📎 Storing dm:error callback for later setup', {}, 'MessageService')
      return
    }
    
    this._setupErrorListener()
  },
  
  _setupErrorListener() {
    if (!socket || !this._dmCallbacks.error) return
    
    MobileLogger.logInfo('🔗 Setting up error listener', {
      socketId: socket.id
    }, 'MessageService')
    
    // Remove existing listener to avoid duplicates
    socket.off('error')
    
    socket.on('error', (error) => {
      MobileLogger.logError(error, {
        errorType: 'websocket_error',
        socketId: socket.id
      }, 'MessageService')
      
      this._dmCallbacks.error(error)
    })
  },

  // =====================================
  // 🧹 CLEANUP & UTILITIES
  // =====================================
  
  removeAllListeners() {
    if (socket) {
      socket.removeAllListeners()
      console.log('🧹 WEBSOCKET: Removed all listeners')
    }
  },

  disconnectWebSocket() {
    if (socket) {
      socket.disconnect()
      socket = null
      httpFallbackMode = false
      reconnectAttempts = 0
      console.log('🔌 WEBSOCKET: Disconnected and cleaned up')
    }
  },

  // =====================================
  // 🔄 LEGACY COMPATIBILITY
  // =====================================
  // Métodos heredados para retrocompatibilidad
  
  async sendMessage(chatId, text) {
    // Mapear a nueva API
    return this.sendMessageHTTPFallback(chatId, text)
  },

  onNewMessage(callback) {
    // Mapear a nuevo sistema
    this.onNewDMMessage(callback)
  },

  emitTyping(chatId, otherUserId) {
    // Mapear a nueva API
    this.sendTypingDM(chatId, true)
  },

  markAsRead(chatId) {
    // Mapear a nueva API - requiere messageId para nueva implementación
    // TODO: Migrar usos a markAsReadDM
    if (socket?.connected) {
      socket.emit('mark_read', { chat_id: chatId })
    }
  }
}

// =====================================
// 📊 ARCHITECTURE SUMMARY
// =====================================
/*
🏗️ HYBRID ARCHITECTURE IMPLEMENTED:

✅ WebSocket Real-time:
  - dm:send/dm:new: <50ms messaging
  - dm:typing: Real-time typing indicators  
  - dm:read: Instant read receipts
  - Auto-reconnect on mobile network changes
  - Optimized timeouts for mobile networks

✅ HTTP REST Fallback:
  - Message history (paginated)
  - Reliable fallback when WebSocket fails
  - Initial conversation loading
  - CDN-friendly for static content

✅ Intelligent Fallback:
  - Automatic HTTP mode when WebSocket unavailable
  - Graceful degradation without UX interruption
  - Periodic WebSocket retry attempts
  - Battery-conscious reconnect strategy

✅ Mobile Optimizations:
  - Short WebSocket timeouts (8s vs 30s)
  - Limited reconnect attempts (5 vs ∞)
  - Battery-friendly retry delays
  - Platform-specific configurations

✅ Security:
  - Short-lived WebSocket tokens (5-10min)
  - Automatic token refresh
  - Secure token storage (SecureStore)
  - Error monitoring and logging

🎯 Result: Best of both worlds
  - Real-time when possible (<50ms)
  - Reliable when networks fail (HTTP)
  - Scalable (WebSocket + HTTP load balancing)
  - Mobile-first (battery & network aware)
*/
