/**
 * Cliente WebSocke
 */
import { io } from 'socket.io-client'

class OptimizedSocketClient {
  constructor() {
    this.socket = null
    this.isConnecting = false
    this.reconnectAttempts = 0
    this.maxReconnectAttempts = 5
    this.reconnectDelays = [1000, 2000, 5000, 10000, 30000]
    this.reconnectTimeout = null
    this.heartbeatInterval = null
    this.eventHandlers = new Map()
    this.lastActivity = Date.now()
    this.connectionMetrics = {
      connectTime: null,
      reconnects: 0,
      messagesReceived: 0,
      messagesSent: 0
    }
    
    // Rate limiting para eventos salientes
    this.rateLimits = new Map()
    this.typingDebounce = null
    
    // Performance optimizations
    this.messageQueue = []
    this.isProcessingQueue = false
    this.maxQueueSize = 100
    
    this.bindMethods()
  }
  
  bindMethods() {
    this.connect = this.connect.bind(this)
    this.disconnect = this.disconnect.bind(this)
    this.emit = this.emit.bind(this)
    this.on = this.on.bind(this)
    this.off = this.off.bind(this)
  }
  
  /**
   * Conectar al WebSocket con configuración optimizada
   */
  async connect(token, options = {}) {
    if (this.isConnecting || (this.socket && this.socket.connected)) {
      return this.socket
    }
    
    if (!token) {
      throw new Error('Token JWT requerido para conexión WebSocket')
    }
    
    this.isConnecting = true
    
    try {
      const socketOptions = {
        // Transport optimizations
        transports: ['websocket', 'polling'],
        upgrade: true,
        rememberUpgrade: true,
        
        // Connection settings optimizados para mobile y web
        timeout: 10000,           // 10s connection timeout
        
        // Heartbeat settings para detectar desconexiones rápidamente
        pingTimeout: 20000,       // 20s antes de considerar desconectado
        pingInterval: 10000,      // Ping cada 10s
        
        // Memory optimizations
        maxHttpBufferSize: 4096,  // 4KB max message size
        compression: true,        // Comprimir mensajes
        
        // Reconexión automática deshabilitada (manejamos manualmente)
        reconnection: false,
        
        // Auth
        auth: { token },
        
        // Override con opciones del usuario
        ...options
      }
      
      const backendUrl = process.env.NEXT_PUBLIC_WS_URL || 'http://localhost:5000'
      this.socket = io(backendUrl, socketOptions)
      
      this.setupEventHandlers()
      this.connectionMetrics.connectTime = Date.now()
      
      return new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
          this.isConnecting = false
          reject(new Error('Connection timeout'))
        }, socketOptions.timeout)
        
        this.socket.once('connect', () => {
          clearTimeout(timeout)
          this.isConnecting = false
          this.reconnectAttempts = 0
          this.startHeartbeat()
          console.log('✅ WebSocket conectado')
          resolve(this.socket)
        })
        
        this.socket.once('connect_error', (error) => {
          clearTimeout(timeout)
          this.isConnecting = false
          console.error('❌ Error de conexión WebSocket:', error)
          reject(error)
        })
      })
      
    } catch (error) {
      this.isConnecting = false
      throw error
    }
  }
  
  /**
   * Configurar event handlers optimizados
   */
  setupEventHandlers() {
    if (!this.socket) return
    
    // Connection events
    this.socket.on('connect', () => {
      console.log('🔌 WebSocket conectado')
      this.reconnectAttempts = 0
      this.startHeartbeat()
      this.processQueuedMessages()
      this.triggerHandlers('connect')
    })
    
    this.socket.on('disconnect', (reason) => {
      console.log('🔌 WebSocket desconectado:', reason)
      this.stopHeartbeat()
      this.triggerHandlers('disconnect', reason)
      
      // Auto-reconnect si no fue desconexión manual
      if (reason !== 'io client disconnect' && reason !== 'io server disconnect') {
        this.scheduleReconnect()
      }
    })
    
    this.socket.on('connect_error', (error) => {
      console.error('❌ Error de conexión:', error)
      this.triggerHandlers('connect_error', error)
      this.scheduleReconnect()
    })
    
    // Message events con optimizaciones
    this.socket.on('dm:new', (data) => {
      this.connectionMetrics.messagesReceived++
      this.lastActivity = Date.now()
      this.handleMessage('dm:new', data)
    })
    
    this.socket.on('dm:ack', (data) => {
      this.handleMessage('dm:ack', data)
    })
    
    this.socket.on('dm:read-receipt', (data) => {
      this.handleMessage('dm:read-receipt', data)
    })
    
    this.socket.on('dm:typing', (data) => {
      // Los typing events son frecuentes y efímeros
      this.handleMessage('dm:typing', data)
    })
    
    this.socket.on('user_online', (data) => {
      this.handleMessage('user_online', data)
    })
    
    this.socket.on('user_offline', (data) => {
      this.handleMessage('user_offline', data)
    })
    
    this.socket.on('error', (error) => {
      console.error('🚨 Socket error:', error)
      this.triggerHandlers('error', error)
    })
    
    // Pong handler para heartbeat
    this.socket.on('pong', () => {
      this.lastActivity = Date.now()
    })
  }
  
  /**
   * Procesar mensaje con validaciones y optimizaciones
   */
  handleMessage(event, data) {
    // Validación básica de datos
    if (!this.validateMessageData(event, data)) {
      console.warn(`Mensaje inválido recibido: ${event}`, data)
      return
    }
    
    // Trigger handlers con debouncing para eventos frecuentes
    if (event === 'dm:typing') {
      this.debouncedTriggerHandlers(event, data, 100)
    } else {
      this.triggerHandlers(event, data)
    }
  }
  
  /**
   * Validar datos de mensaje para evitar problemas
   */
  validateMessageData(event, data) {
    if (!data || typeof data !== 'object') return false
    
    switch (event) {
      case 'dm:new':
        return data.message && data.conversationId
      case 'dm:ack':
        return data.tempId && data.serverId
      case 'dm:typing':
        return data.conversationId && data.userId !== undefined
      case 'user_online':
      case 'user_offline':
        return data.user_id !== undefined
      default:
        return true
    }
  }
  
  /**
   * Emit optimizado con rate limiting y queue
   */
  emit(event, data, callback) {
    if (!this.socket || !this.socket.connected) {
      // Queue mensaje si no está conectado
      if (this.messageQueue.length < this.maxQueueSize) {
        this.messageQueue.push({ event, data, callback, timestamp: Date.now() })
      }
      return false
    }
    
    // Rate limiting para eventos específicos
    if (this.isRateLimited(event)) {
      console.warn(`Rate limit aplicado para evento: ${event}`)
      return false
    }
    
    try {
      this.socket.emit(event, data, callback)
      this.connectionMetrics.messagesSent++
      this.updateRateLimit(event)
      return true
    } catch (error) {
      console.error(`Error emitiendo evento ${event}:`, error)
      return false
    }
  }
  
  /**
   * Rate limiting inteligente
   */
  isRateLimited(event) {
    const now = Date.now()
    const limits = {
      'dm:send': { max: 10, window: 10000 },      // 10 mensajes por 10s
      'dm:typing': { max: 5, window: 1000 },      // 5 typing events por 1s
      'dm:read': { max: 20, window: 5000 }        // 20 read events por 5s
    }
    
    const limit = limits[event]
    if (!limit) return false
    
    const key = `rate_${event}`
    const eventTimes = this.rateLimits.get(key) || []
    
    // Limpiar eventos antiguos fuera del window
    const validTimes = eventTimes.filter(time => now - time < limit.window)
    
    if (validTimes.length >= limit.max) {
      return true
    }
    
    return false
  }
  
  /**
   * Actualizar rate limit tracking
   */
  updateRateLimit(event) {
    const now = Date.now()
    const key = `rate_${event}`
    const eventTimes = this.rateLimits.get(key) || []
    
    eventTimes.push(now)
    this.rateLimits.set(key, eventTimes)
  }
  
  /**
   * Procesar mensajes en queue cuando se reconecta
   */
  async processQueuedMessages() {
    if (this.isProcessingQueue || this.messageQueue.length === 0) return
    
    this.isProcessingQueue = true
    const now = Date.now()
    
    // Filtrar mensajes muy antiguos (>30s)
    this.messageQueue = this.messageQueue.filter(msg => now - msg.timestamp < 30000)
    
    // Procesar queue con delay para evitar spam
    while (this.messageQueue.length > 0 && this.socket && this.socket.connected) {
      const message = this.messageQueue.shift()
      
      try {
        this.socket.emit(message.event, message.data, message.callback)
        await new Promise(resolve => setTimeout(resolve, 100)) // 100ms delay
      } catch (error) {
        console.error('Error procesando mensaje en queue:', error)
      }
    }
    
    this.isProcessingQueue = false
  }
  
  /**
   * Reconexión inteligente con backoff exponencial
   */
  scheduleReconnect() {
    if (this.reconnectTimeout) return
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('❌ Máximo de intentos de reconexión alcanzado')
      return
    }
    
    const delay = this.reconnectDelays[Math.min(this.reconnectAttempts, this.reconnectDelays.length - 1)]
    
    console.log(`🔄 Reconexión programada en ${delay}ms (intento ${this.reconnectAttempts + 1})`)
    
    this.reconnectTimeout = setTimeout(async () => {
      this.reconnectTimeout = null
      this.reconnectAttempts++
      this.connectionMetrics.reconnects++
      
      try {
        const token = localStorage.getItem('jwt_token')
        if (token) {
          await this.connect(token)
        }
      } catch (error) {
        console.error('❌ Fallo en reconexión:', error)
        this.scheduleReconnect()
      }
    }, delay)
  }
  
  /**
   * Heartbeat para detectar conexiones muertas
   */
  startHeartbeat() {
    this.stopHeartbeat()
    
    this.heartbeatInterval = setInterval(() => {
      if (this.socket && this.socket.connected) {
        const now = Date.now()
        
        // Si no hay actividad reciente, enviar ping
        if (now - this.lastActivity > 15000) {
          this.socket.emit('ping', now)
        }
        
        // Detectar conexión muerta
        if (now - this.lastActivity > 45000) {
          console.warn('⚠️ Conexión posiblemente muerta, reconectando...')
          this.socket.disconnect()
        }
      }
    }, 10000) // Check cada 10s
  }
  
  /**
   * Detener heartbeat
   */
  stopHeartbeat() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval)
      this.heartbeatInterval = null
    }
  }
  
  /**
   * Event handler management
   */
  on(event, handler) {
    if (!this.eventHandlers.has(event)) {
      this.eventHandlers.set(event, new Set())
    }
    this.eventHandlers.get(event).add(handler)
  }
  
  off(event, handler) {
    if (this.eventHandlers.has(event)) {
      this.eventHandlers.get(event).delete(handler)
    }
  }
  
  /**
   * Trigger handlers con optimizaciones
   */
  triggerHandlers(event, data) {
    if (this.eventHandlers.has(event)) {
      const handlers = this.eventHandlers.get(event)
      handlers.forEach(handler => {
        try {
          handler(data)
        } catch (error) {
          console.error(`Error en handler para ${event}:`, error)
        }
      })
    }
  }
  
  /**
   * Debounced handler triggering para eventos frecuentes
   */
  debouncedTriggerHandlers(event, data, delay = 100) {
    const key = `debounce_${event}`
    
    if (this[key]) {
      clearTimeout(this[key])
    }
    
    this[key] = setTimeout(() => {
      this.triggerHandlers(event, data)
      delete this[key]
    }, delay)
  }
  
  /**
   * Desconectar y limpiar recursos
   */
  disconnect() {
    // Limpiar timeouts
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout)
      this.reconnectTimeout = null
    }
    
    this.stopHeartbeat()
    
    // Limpiar rate limits
    this.rateLimits.clear()
    
    // Limpiar queue
    this.messageQueue = []
    
    // Desconectar socket
    if (this.socket) {
      this.socket.disconnect()
      this.socket = null
    }
    
    console.log('🔌 WebSocket desconectado y recursos limpiados')
  }
  
  /**
   * Obtener métricas de conexión
   */
  getMetrics() {
    return {
      ...this.connectionMetrics,
      isConnected: this.socket && this.socket.connected,
      reconnectAttempts: this.reconnectAttempts,
      queueSize: this.messageQueue.length,
      lastActivity: this.lastActivity,
      uptime: this.connectionMetrics.connectTime ? Date.now() - this.connectionMetrics.connectTime : 0
    }
  }
  
  /**
   * Métodos de conveniencia para DM
   */
  joinConversation(conversationId) {
    return this.emit('dm:join', { conversationId })
  }
  
  leaveConversation(conversationId) {
    // TODO: Enable push notifications when user leaves chat
    // Any new messages after leaving should trigger push notifications
    return this.emit('dm:leave', { conversationId })
  }
  
  sendMessage(conversationId, text, tempId) {
    return this.emit('dm:send', {
      conversationId,
      text,
      tempId: tempId || `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    })
  }
  
  markAsRead(conversationId, upToMessageId) {
    return this.emit('dm:read', { conversationId, upToMessageId })
  }
  
  emitTyping(conversationId, isTyping = true) {
    // Debounce typing events
    if (this.typingDebounce) {
      clearTimeout(this.typingDebounce)
    }
    
    this.emit('dm:typing', { conversationId, isTyping })
    
    // Auto-stop typing después de 3s
    if (isTyping) {
      this.typingDebounce = setTimeout(() => {
        this.emit('dm:typing', { conversationId, isTyping: false })
      }, 3000)
    }
  }
}

// Instancia singleton
const optimizedSocketClient = new OptimizedSocketClient()

export default optimizedSocketClient