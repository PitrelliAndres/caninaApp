/**
 * Cliente WebSocket
 */

import { io } from 'socket.io-client'
import { AppState } from 'react-native'
import NetInfo from '@react-native-community/netinfo'
import * as SecureStore from 'expo-secure-store'
import MobileLogger from '../utils/logger'

class OptimizedMobileSocketClient {
  constructor() {
    this.socket = null
    this.isConnecting = false
    this.reconnectAttempts = 0
    this.maxReconnectAttempts = 3
    this.reconnectDelays = [2000, 5000, 15000]
    this.reconnectTimeout = null
    this.heartbeatInterval = null
    this.eventHandlers = new Map()
    this.lastActivity = Date.now()
    
    // Mobile-specific optimizations
    this.appState = AppState.currentState
    this.networkType = null
    this.isBackground = false
    this.batteryOptimized = true
    
    // Connection metrics para debugging
    this.metrics = {
      connectTime: null,
      reconnects: 0,
      messagesReceived: 0,
      messagesSent: 0,
      networkChanges: 0
    }
    
    // Current conversation tracking for push notifications
    this.currentConversationId = null
    
    // Rate limiting más agresivo para móvil
    this.rateLimits = new Map()
    this.messageQueue = []
    this.maxQueueSize = 20
    
    this.initializeMobileListeners()
    this.bindMethods()
  }
  
  bindMethods() {
    this.connect = this.connect.bind(this)
    this.disconnect = this.disconnect.bind(this)
    this.emit = this.emit.bind(this)
    this.on = this.on.bind(this)
    this.off = this.off.bind(this)
    this.handleAppStateChange = this.handleAppStateChange.bind(this)
    this.handleNetworkChange = this.handleNetworkChange.bind(this)
  }
  
  /**
   * Configurar listeners específicos de móvil
   */
  initializeMobileListeners() {
    // Listener de estado de app (background/foreground)
    AppState.addEventListener('change', this.handleAppStateChange)
    
    // Listener de cambios de red
    NetInfo.addEventListener(this.handleNetworkChange)
  }
  
  /**
   * Manejar cambios de estado de app
   */
  handleAppStateChange(nextAppState) {
    const previousState = this.appState
    this.appState = nextAppState
    
    MobileLogger.logInfo('App state changed', {
      from: previousState,
      to: nextAppState,
      hasSocket: !!this.socket,
      isConnected: this.socket?.connected || false
    }, 'MobileSocket')
    
    if (nextAppState === 'background') {
      this.isBackground = true
      this.handleBackgroundMode()
    } else if (nextAppState === 'active') {
      this.isBackground = false
      this.handleForegroundMode()
    }
  }
  
  /**
   * Manejar cambios de red móvil
   */
  handleNetworkChange(netInfo) {
    const previousNetwork = this.networkType
    this.networkType = netInfo.type
    this.metrics.networkChanges++
    
    MobileLogger.logInfo('Network changed', {
      from: previousNetwork,
      to: netInfo.type,
      isConnected: netInfo.isConnected,
      isWifiEnabled: netInfo.isWifiEnabled,
      strength: netInfo.details?.strength,
      socketConnected: this.socket?.connected || false
    }, 'MobileSocket')
    
    // Reconectar si la red mejoró y no estamos conectados
    if (netInfo.isConnected && !this.socket?.connected && !this.isConnecting) {
      setTimeout(() => {
        this.reconnectAfterNetworkChange()
      }, 1000) // Dar tiempo a que la red se estabilice
    }
    
    // Ajustar configuración según tipo de red
    this.adjustForNetworkType(netInfo)
  }
  
  /**
   * Ajustar configuración según red
   */
  adjustForNetworkType(netInfo) {
    if (!this.socket) return
    
    // Configuraciones específicas por tipo de red
    const configs = {
      'cellular': {
        pingInterval: 30000,  // Menos frecuente para ahorrar datos
        pingTimeout: 60000,   // Más tolerante en celular
      },
      'wifi': {
        pingInterval: 15000,  // Más frecuente en wifi
        pingTimeout: 30000,   // Menos tolerante en wifi
      }
    }
    
    const config = configs[netInfo.type] || configs['wifi']
    
    // Aplicar configuración si es significativamente diferente
    if (this.socket.io.engine) {
      this.socket.io.engine.pingInterval = config.pingInterval
      this.socket.io.engine.pingTimeout = config.pingTimeout
    }
  }
  
  /**
   * Modo background - optimizar batería
   */
  handleBackgroundMode() {
    if (!this.socket?.connected) return
    
    // TODO: Enable push notifications when app goes to background
    // If user is in a conversation, emit leave event to enable push notifications
    if (this.currentConversationId) {
      MobileLogger.logInfo('App backgrounded - leaving conversation for push notifications', {
        conversationId: this.currentConversationId
      }, 'MobileSocket')
      
      this.emit('dm:leave', { 
        conversationId: this.currentConversationId,
        reason: 'app_backgrounded' // Indicar que fue por background
      }, 'high')
    }
    
    // Reducir frecuencia de heartbeat en background
    this.stopHeartbeat()
    this.startHeartbeat(60000) // 1 minuto en background
    
    // Limpiar queue de mensajes no críticos
    this.messageQueue = this.messageQueue.filter(msg => msg.priority === 'high')
    
    MobileLogger.logInfo('Background mode optimizations applied', {
      queueSize: this.messageQueue.length,
      heartbeatInterval: 60000,
      leftConversation: !!this.currentConversationId
    }, 'MobileSocket')
  }
  
  /**
   * Modo foreground - restaurar performance normal
   */
  handleForegroundMode() {
    if (!this.socket?.connected) {
      // Reconectar si no está conectado
      this.reconnectAfterForeground()
      return
    }
    
    // TODO: Re-join conversation when app comes to foreground
    // This will disable push notifications and resume real-time updates
    if (this.currentConversationId) {
      MobileLogger.logInfo('App foregrounded - rejoining conversation', {
        conversationId: this.currentConversationId
      }, 'MobileSocket')
      
      this.emit('dm:join', { 
        conversationId: this.currentConversationId,
        reason: 'app_foregrounded' 
      }, 'high')
    }
    
    // Restaurar heartbeat normal
    this.stopHeartbeat()
    this.startHeartbeat()
    
    // Procesar queue pendiente
    this.processQueuedMessages()
    
    MobileLogger.logInfo('Foreground mode - normal performance restored', {
      queueSize: this.messageQueue.length,
      rejoinedConversation: !!this.currentConversationId
    }, 'MobileSocket')
  }
  
  /**
   * Conectar con optimizaciones móviles
   */
  async connect(token, options = {}) {
    if (this.isConnecting || (this.socket && this.socket.connected)) {
      return this.socket
    }
    
    if (!token) {
      throw new Error('Token JWT requerido')
    }
    
    this.isConnecting = true
    
    try {
      // Optimizaciones para móvil
      const mobileOptions = {
        transports: ['websocket'], // Skip polling en móvil
        upgrade: true,
        rememberUpgrade: true,
        
        // Timeouts optimizados para redes móviles
        timeout: 15000,
        
        // Heartbeat más conservador para batería
        pingTimeout: this.networkType === 'cellular' ? 60000 : 30000,
        pingInterval: this.networkType === 'cellular' ? 30000 : 15000,
        
        // Tamaño de buffer optimizado para móvil
        maxHttpBufferSize: 2048, // 2KB máximo
        compression: true,
        
        // Reconexión manual para mejor control
        reconnection: false,
        
        // Auth
        auth: { token },
        
        // Opciones adicionales
        ...options
      }
      
      const backendUrl = process.env.EXPO_PUBLIC_WS_URL || 'http://localhost:5000'
      this.socket = io(backendUrl, mobileOptions)
      
      this.setupMobileEventHandlers()
      this.metrics.connectTime = Date.now()
      
      return new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
          this.isConnecting = false
          reject(new Error('Mobile connection timeout'))
        }, mobileOptions.timeout)
        
        this.socket.once('connect', () => {
          clearTimeout(timeout)
          this.isConnecting = false
          this.reconnectAttempts = 0
          this.startHeartbeat()
          
          MobileLogger.logInfo('Mobile WebSocket connected', {
            transport: this.socket.io.engine.transport.name,
            networkType: this.networkType,
            appState: this.appState
          }, 'MobileSocket')
          
          resolve(this.socket)
        })
        
        this.socket.once('connect_error', (error) => {
          clearTimeout(timeout)
          this.isConnecting = false
          MobileLogger.logError(error, {
            networkType: this.networkType,
            reconnectAttempt: this.reconnectAttempts
          }, 'MobileSocket')
          reject(error)
        })
      })
      
    } catch (error) {
      this.isConnecting = false
      throw error
    }
  }
  
  /**
   * Event handlers optimizados para móvil
   */
  setupMobileEventHandlers() {
    if (!this.socket) return
    
    this.socket.on('connect', () => {
      this.reconnectAttempts = 0
      this.startHeartbeat()
      this.processQueuedMessages()
      this.triggerHandlers('connect')
      
      MobileLogger.logInfo('Mobile socket connected', {
        socketId: this.socket.id,
        networkType: this.networkType,
        appState: this.appState,
        transport: this.socket.io.engine?.transport?.name
      }, 'MobileSocket')
    })
    
    this.socket.on('disconnect', (reason) => {
      this.stopHeartbeat()
      this.triggerHandlers('disconnect', reason)
      
      MobileLogger.logInfo('Mobile socket disconnected', {
        reason,
        networkType: this.networkType,
        appState: this.appState
      }, 'MobileSocket')
      
      // Solo reconectar si no fue desconexión manual y app está en foreground
      if (reason !== 'io client disconnect' && !this.isBackground) {
        this.scheduleReconnect()
      }
    })
    
    this.socket.on('connect_error', (error) => {
      MobileLogger.logError(error, {
        networkType: this.networkType,
        appState: this.appState,
        reconnectAttempts: this.reconnectAttempts
      }, 'MobileSocket')
      
      this.triggerHandlers('connect_error', error)
      
      if (!this.isBackground) {
        this.scheduleReconnect()
      }
    })
    
    // Message handlers optimizados
    this.socket.on('dm:new', (data) => {
      this.metrics.messagesReceived++
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
      // Solo procesar typing en foreground
      if (!this.isBackground) {
        this.handleMessage('dm:typing', data)
      }
    })
    
    this.socket.on('error', (error) => {
      MobileLogger.logError(error, {
        networkType: this.networkType,
        appState: this.appState
      }, 'MobileSocket')
      this.triggerHandlers('error', error)
    })
    
    this.socket.on('pong', () => {
      this.lastActivity = Date.now()
    })
  }
  
  /**
   * Emit optimizado para móvil
   */
  emit(event, data, priority = 'normal', callback) {
    if (!this.socket || !this.socket.connected) {
      // Queue con prioridad
      if (this.messageQueue.length < this.maxQueueSize) {
        this.messageQueue.push({ 
          event, 
          data, 
          callback, 
          priority,
          timestamp: Date.now() 
        })
      }
      return false
    }
    
    // Rate limiting más agresivo en móvil
    if (this.isRateLimited(event)) {
      return false
    }
    
    try {
      this.socket.emit(event, data, callback)
      this.metrics.messagesSent++
      this.updateRateLimit(event)
      return true
    } catch (error) {
      MobileLogger.logError(error, { event }, 'MobileSocket')
      return false
    }
  }
  
  /**
   * Rate limiting específico para móvil
   */
  isRateLimited(event) {
    const now = Date.now()
    const limits = {
      'dm:send': { max: 5, window: 10000 },      // 5 mensajes por 10s
      'dm:typing': { max: 2, window: 2000 },     // 2 typing por 2s
      'dm:read': { max: 10, window: 10000 }      // 10 read por 10s
    }
    
    const limit = limits[event]
    if (!limit) return false
    
    const key = `rate_${event}`
    const eventTimes = this.rateLimits.get(key) || []
    
    const validTimes = eventTimes.filter(time => now - time < limit.window)
    
    if (validTimes.length >= limit.max) {
      return true
    }
    
    return false
  }
  
  updateRateLimit(event) {
    const now = Date.now()
    const key = `rate_${event}`
    const eventTimes = this.rateLimits.get(key) || []
    
    eventTimes.push(now)
    this.rateLimits.set(key, eventTimes)
  }
  
  /**
   * Procesar queue con delays para móvil
   */
  async processQueuedMessages() {
    if (!this.socket?.connected || this.messageQueue.length === 0) return
    
    // Procesar mensajes de alta prioridad primero
    this.messageQueue.sort((a, b) => {
      const priorities = { high: 0, normal: 1, low: 2 }
      return priorities[a.priority] - priorities[b.priority]
    })
    
    const now = Date.now()
    const batch = []
    
    // Procesar por lotes con límite de tiempo
    while (this.messageQueue.length > 0 && batch.length < 5) {
      const message = this.messageQueue.shift()
      
      // Descartar mensajes muy antiguos
      if (now - message.timestamp > 60000) continue
      
      batch.push(message)
    }
    
    // Enviar lote con delays
    for (const message of batch) {
      try {
        this.socket.emit(message.event, message.data, message.callback)
        await new Promise(resolve => setTimeout(resolve, 200)) // 200ms delay
      } catch (error) {
        MobileLogger.logError(error, { event: message.event }, 'MobileSocket')
      }
    }
  }
  
  /**
   * Reconexión inteligente para móvil
   */
  scheduleReconnect() {
    if (this.reconnectTimeout || this.isBackground) return
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      MobileLogger.logWarning('Max mobile reconnection attempts reached', {
        attempts: this.reconnectAttempts
      }, 'MobileSocket')
      return
    }
    
    const delay = this.reconnectDelays[Math.min(this.reconnectAttempts, this.reconnectDelays.length - 1)]
    
    this.reconnectTimeout = setTimeout(async () => {
      this.reconnectTimeout = null
      this.reconnectAttempts++
      this.metrics.reconnects++
      
      try {
        const token = await SecureStore.getItemAsync('jwt_token')
        if (token) {
          await this.connect(token)
        }
      } catch (error) {
        MobileLogger.logError(error, { attempt: this.reconnectAttempts }, 'MobileSocket')
        this.scheduleReconnect()
      }
    }, delay)
  }
  
  /**
   * Reconectar después de cambio de red
   */
  async reconnectAfterNetworkChange() {
    if (this.isConnecting || this.isBackground) return
    
    try {
      const token = await SecureStore.getItemAsync('jwt_token')
      if (token) {
        await this.connect(token)
      }
    } catch (error) {
      MobileLogger.logError(error, {}, 'MobileSocket')
    }
  }
  
  /**
   * Reconectar después de volver a foreground
   */
  async reconnectAfterForeground() {
    try {
      const token = await SecureStore.getItemAsync('jwt_token')
      if (token) {
        await this.connect(token)
      }
    } catch (error) {
      MobileLogger.logError(error, {}, 'MobileSocket')
    }
  }
  
  /**
   * Heartbeat adaptativo
   */
  startHeartbeat(interval = 20000) {
    this.stopHeartbeat()
    
    this.heartbeatInterval = setInterval(() => {
      if (!this.socket?.connected) return
      
      const now = Date.now()
      
      // Heartbeat menos frecuente si no hay actividad
      const inactivityThreshold = this.isBackground ? 30000 : 15000
      if (now - this.lastActivity < inactivityThreshold) {
        this.socket.emit('ping', now)
      }
      
      // Detectar conexión muerta
      const deadConnectionThreshold = this.isBackground ? 120000 : 60000
      if (now - this.lastActivity > deadConnectionThreshold) {
        MobileLogger.logWarning('Dead connection detected', {
          lastActivity: this.lastActivity,
          timeSince: now - this.lastActivity
        }, 'MobileSocket')
        this.socket.disconnect()
      }
      
    }, interval)
  }
  
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
  
  triggerHandlers(event, data) {
    if (this.eventHandlers.has(event)) {
      const handlers = this.eventHandlers.get(event)
      handlers.forEach(handler => {
        try {
          handler(data)
        } catch (error) {
          MobileLogger.logError(error, { event }, 'MobileSocket')
        }
      })
    }
  }
  
  /**
   * Validación y procesamiento de mensajes
   */
  handleMessage(event, data) {
    if (!this.validateMessageData(event, data)) {
      MobileLogger.logWarning('Invalid message received', { event, data }, 'MobileSocket')
      return
    }
    
    this.triggerHandlers(event, data)
  }
  
  validateMessageData(event, data) {
    if (!data || typeof data !== 'object') return false
    
    switch (event) {
      case 'dm:new':
        return data.message && data.conversationId
      case 'dm:ack':
        return data.tempId && data.serverId
      case 'dm:typing':
        return data.conversationId && data.userId !== undefined
      default:
        return true
    }
  }
  
  /**
   * Métodos de conveniencia DM
   */
  joinConversation(conversationId) {
    // Track current conversation for push notification management
    this.currentConversationId = conversationId
    return this.emit('dm:join', { conversationId }, 'high')
  }
  
  leaveConversation(conversationId) {
    // TODO: Enable push notifications when user leaves chat on mobile
    // Critical for mobile UX - users expect notifications when app is backgrounded
    // Integration with FCM/APNS required
    
    // Clear current conversation tracking
    if (this.currentConversationId === conversationId) {
      this.currentConversationId = null
    }
    
    return this.emit('dm:leave', { conversationId }, 'high')
  }
  
  sendMessage(conversationId, text, tempId) {
    return this.emit('dm:send', {
      conversationId,
      text,
      tempId: tempId || `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    }, 'high')
  }
  
  markAsRead(conversationId, upToMessageId) {
    return this.emit('dm:read', { conversationId, upToMessageId }, 'normal')
  }
  
  emitTyping(conversationId, isTyping = true) {
    // Solo en foreground
    if (this.isBackground) return
    
    return this.emit('dm:typing', { conversationId, isTyping }, 'low')
  }
  
  /**
   * Desconectar y limpiar
   */
  disconnect() {
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout)
      this.reconnectTimeout = null
    }
    
    this.stopHeartbeat()
    
    // Limpiar listeners móviles
    AppState.removeEventListener('change', this.handleAppStateChange)
    // NetInfo listeners se limpian automáticamente
    
    this.rateLimits.clear()
    this.messageQueue = []
    
    if (this.socket) {
      this.socket.disconnect()
      this.socket = null
    }
    
    MobileLogger.logInfo('Mobile socket disconnected and cleaned up', {}, 'MobileSocket')
  }
  
  /**
   * Métricas específicas móviles
   */
  getMetrics() {
    return {
      ...this.metrics,
      isConnected: this.socket && this.socket.connected,
      reconnectAttempts: this.reconnectAttempts,
      queueSize: this.messageQueue.length,
      lastActivity: this.lastActivity,
      appState: this.appState,
      networkType: this.networkType,
      isBackground: this.isBackground,
      uptime: this.metrics.connectTime ? Date.now() - this.metrics.connectTime : 0
    }
  }
}

// Instancia singleton para móvil
const optimizedMobileSocketClient = new OptimizedMobileSocketClient()

export default optimizedMobileSocketClient