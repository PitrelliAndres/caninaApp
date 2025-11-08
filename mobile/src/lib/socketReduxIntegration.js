import optimizedMobileSocketClient from '../services/OptimizedMobileSocketClient'
import { store } from '../store'
import { 
  setConnected, 
  addMessage, 
  markMessagesAsRead, 
  setUserTyping, 
  updateUserOnlineStatus,
  incrementUnreadCount,
  setConversations
} from '../store/slices/chatSlice'
import { setOnlineStatus, setNetworkError } from '../store/slices/uiSlice'
import MobileLogger from '../utils/logger'

class SocketReduxIntegration {
  constructor() {
    this.isInitialized = false
    this.unsubscribeNetInfo = null
    this.currentConversationId = null
  }

  /**
   * Inicializar integración Socket.IO <-> Redux
   */
  initialize() {
    if (this.isInitialized) return

    this.setupSocketEventListeners()
    this.setupReduxStateSync()
    this.isInitialized = true

    MobileLogger.logInfo('Socket Redux integration initialized', {}, 'SocketRedux')
  }

  /**
   * Event listeners del socket -> Redux actions
   */
  setupSocketEventListeners() {
    // Connection events
    optimizedMobileSocketClient.on('connect', () => {
      store.dispatch(setConnected(true))
      store.dispatch(setOnlineStatus(true))
      store.dispatch(setNetworkError(null))
      
      MobileLogger.logInfo('Socket connected - Redux updated', {}, 'SocketRedux')
    })

    optimizedMobileSocketClient.on('disconnect', (reason) => {
      store.dispatch(setConnected(false))
      
      // No marcar como offline si fue desconexión manual
      if (reason !== 'io client disconnect') {
        store.dispatch(setNetworkError('Connection lost'))
      }
      
      MobileLogger.logInfo('Socket disconnected - Redux updated', { reason }, 'SocketRedux')
    })

    optimizedMobileSocketClient.on('connect_error', (error) => {
      store.dispatch(setConnected(false))
      store.dispatch(setNetworkError(error.message || 'Connection error'))
      
      MobileLogger.logError(error, {}, 'SocketRedux')
    })

    // DM message events
    optimizedMobileSocketClient.on('dm:new', (data) => {
      const { message, conversationId } = data
      
      // Agregar mensaje al state
      store.dispatch(addMessage(message))
      
      // Si no es la conversación actual, incrementar unread
      const state = store.getState()
      const currentChatId = state.chat.currentChat?.chat_id
      
      if (currentChatId !== conversationId) {
        store.dispatch(incrementUnreadCount({ chatId: conversationId }))
      }
      
      MobileLogger.logInfo('New message received', { 
        conversationId, 
        messageId: message.id,
        isCurrentChat: currentChatId === conversationId 
      }, 'SocketRedux')
    })

    // Message acknowledgment
    optimizedMobileSocketClient.on('dm:ack', (data) => {
      const { tempId, serverId, conversationId } = data
      
      // Actualizar mensaje temporal con ID del servidor
      const state = store.getState()
      const messages = state.chat.messages.map(msg => 
        msg.temp_id === tempId 
          ? { ...msg, id: serverId, temp_id: undefined, status: 'sent' }
          : msg
      )
      
      store.dispatch({ type: 'chat/setMessages', payload: messages })
      
      MobileLogger.logInfo('Message acknowledged', { tempId, serverId }, 'SocketRedux')
    })

    // Read receipts
    optimizedMobileSocketClient.on('dm:read-receipt', (data) => {
      const { conversationId, upToMessageId, userId } = data
      
      store.dispatch(markMessagesAsRead({ 
        chatId: conversationId, 
        userId,
        upToMessageId 
      }))
      
      MobileLogger.logInfo('Read receipt received', { 
        conversationId, 
        upToMessageId, 
        userId 
      }, 'SocketRedux')
    })

    // Typing indicators
    optimizedMobileSocketClient.on('dm:typing', (data) => {
      const { conversationId, userId, isTyping } = data
      
      store.dispatch(setUserTyping({ 
        chatId: conversationId, 
        userId, 
        isTyping 
      }))
      
      // Auto-clear typing after 3 seconds
      if (isTyping) {
        setTimeout(() => {
          store.dispatch(setUserTyping({ 
            chatId: conversationId, 
            userId, 
            isTyping: false 
          }))
        }, 3000)
      }
    })

    // User presence updates
    optimizedMobileSocketClient.on('user:online', (data) => {
      const { userId } = data
      store.dispatch(updateUserOnlineStatus({ userId, isOnline: true }))
    })

    optimizedMobileSocketClient.on('user:offline', (data) => {
      const { userId } = data
      store.dispatch(updateUserOnlineStatus({ userId, isOnline: false }))
    })

    // Conversation list updates
    optimizedMobileSocketClient.on('conversations:updated', (data) => {
      const { conversations } = data
      store.dispatch(setConversations(conversations))
    })
  }

  /**
   * Sincronizar state de Redux con acciones del socket
   */
  setupReduxStateSync() {
    // Subscribirse a cambios de Redux para actualizar socket
    let previousState = store.getState()
    
    store.subscribe(() => {
      const currentState = store.getState()
      
      // Detectar cambios en conversación actual
      const prevCurrentChat = previousState.chat.currentChat
      const currentChat = currentState.chat.currentChat
      
      if (prevCurrentChat?.chat_id !== currentChat?.chat_id) {
        this.handleConversationChange(prevCurrentChat, currentChat)
      }
      
      // Detectar cambios en estado de la app
      const prevAppState = previousState.ui.isOnline
      const currentAppState = currentState.ui.isOnline
      
      if (prevAppState !== currentAppState) {
        this.handleNetworkStateChange(currentAppState)
      }
      
      previousState = currentState
    })
  }

  /**
   * Manejar cambio de conversación
   */
  handleConversationChange(prevChat, currentChat) {
    // Salir de conversación anterior
    if (prevChat?.chat_id && prevChat.chat_id !== currentChat?.chat_id) {
      optimizedMobileSocketClient.leaveConversation(prevChat.chat_id)
      
      MobileLogger.logInfo('Left conversation', { 
        conversationId: prevChat.chat_id 
      }, 'SocketRedux')
    }
    
    // Unirse a nueva conversación
    if (currentChat?.chat_id) {
      optimizedMobileSocketClient.joinConversation(currentChat.chat_id)
      this.currentConversationId = currentChat.chat_id
      
      MobileLogger.logInfo('Joined conversation', { 
        conversationId: currentChat.chat_id 
      }, 'SocketRedux')
    } else {
      this.currentConversationId = null
    }
  }

  /**
   * Manejar cambios de estado de red
   */
  handleNetworkStateChange(isOnline) {
    if (isOnline && !optimizedMobileSocketClient.socket?.connected) {
      // Intentar reconectar cuando vuelve la conexión
      this.reconnectSocket()
    }
  }

  /**
   * Reconectar socket con token actual
   */
  async reconnectSocket() {
    try {
      const { secureStorage } = await import('../services/storage/secureStorage')
      const token = await secureStorage.getItemAsync('jwt_token')

      if (token) {
        await optimizedMobileSocketClient.connect(token)
      }
    } catch (error) {
      MobileLogger.logError(error, {}, 'SocketRedux')
    }
  }

  /**
   * Actions convenience methods (para usar desde componentes)
   */
  
  // Enviar mensaje
  sendMessage(conversationId, text, callback) {
    const tempId = `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    
    // Agregar mensaje optimista al Redux
    const tempMessage = {
      id: tempId,
      temp_id: tempId,
      text,
      sender_id: store.getState().user.user?.id,
      receiver_id: store.getState().chat.currentChat?.user?.id,
      conversation_id: conversationId,
      created_at: new Date().toISOString(),
      status: 'sending',
      is_read: false
    }
    
    store.dispatch(addMessage(tempMessage))
    
    // Enviar via socket
    const success = optimizedMobileSocketClient.sendMessage(conversationId, text, tempId)
    
    if (!success) {
      // Marcar como fallido si no se pudo enviar
      const updatedMessage = { ...tempMessage, status: 'failed' }
      const state = store.getState()
      const messages = state.chat.messages.map(msg => 
        msg.temp_id === tempId ? updatedMessage : msg
      )
      store.dispatch({ type: 'chat/setMessages', payload: messages })
    }
    
    if (callback) callback(success)
    
    return tempId
  }

  // Marcar como leído
  markAsRead(conversationId, upToMessageId) {
    return optimizedMobileSocketClient.markAsRead(conversationId, upToMessageId)
  }

  // Typing indicator
  emitTyping(conversationId, isTyping = true) {
    return optimizedMobileSocketClient.emitTyping(conversationId, isTyping)
  }

  // Obtener métricas
  getSocketMetrics() {
    return optimizedMobileSocketClient.getMetrics()
  }

  // Cleanup
  destroy() {
    if (this.unsubscribeNetInfo) {
      this.unsubscribeNetInfo()
    }
    
    optimizedMobileSocketClient.disconnect()
    this.isInitialized = false
    
    MobileLogger.logInfo('Socket Redux integration destroyed', {}, 'SocketRedux')
  }
}

// Singleton instance
export const socketReduxIntegration = new SocketReduxIntegration()

// Hook para usar en componentes
export const useSocketActions = () => {
  return {
    sendMessage: socketReduxIntegration.sendMessage.bind(socketReduxIntegration),
    markAsRead: socketReduxIntegration.markAsRead.bind(socketReduxIntegration),
    emitTyping: socketReduxIntegration.emitTyping.bind(socketReduxIntegration),
    getMetrics: socketReduxIntegration.getSocketMetrics.bind(socketReduxIntegration),
  }
}

export default socketReduxIntegration
