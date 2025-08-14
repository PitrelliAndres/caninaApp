/**
 * Servicio de mensajes para móvil
 */
import { apiClient } from './client'
import { io } from 'socket.io-client'
import * as SecureStore from 'expo-secure-store'

let socket = null

export const messageService = {
  async getConversations() {
    return apiClient.get('/messages/conversations')
  },

  async getChatMessages(chatId, page = 1) {
    return apiClient.get(`/messages/chats/${chatId}/messages`, { page })
  },

  async sendMessage(chatId, text) {
    return apiClient.post(`/messages/chats/${chatId}/messages`, { text })
  },

  // WebSocket
  async connectWebSocket() {
    if (socket) return socket
    
    const token = await SecureStore.getItemAsync('jwt_token')
    if (!token) {
      console.warn('No token available for WebSocket connection')
      return null
    }
    
    socket = io(apiClient.wsURL, {
      auth: { token },
      transports: ['websocket'],
      forceNew: true,
      timeout: 20000,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    })
    
    socket.on('connect', () => {
      console.log('WebSocket connected')
    })
    
    socket.on('disconnect', (reason) => {
      console.log('WebSocket disconnected:', reason)
    })

    socket.on('connect_error', (error) => {
      console.error('WebSocket connection error:', error)
    })

    socket.on('reconnect', (attemptNumber) => {
      console.log('WebSocket reconnected after', attemptNumber, 'attempts')
    })
    
    return socket
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

  // Métodos para suscribirse a eventos WebSocket
  onNewMessage(callback) {
    if (socket) {
      socket.on('new_message', callback)
    }
  },

  onUserTyping(callback) {
    if (socket) {
      socket.on('user_typing', callback)
    }
  },

  onMessagesRead(callback) {
    if (socket) {
      socket.on('messages_read', callback)
    }
  },

  onUserOnline(callback) {
    if (socket) {
      socket.on('user_online', callback)
    }
  },

  onUserOffline(callback) {
    if (socket) {
      socket.on('user_offline', callback)
    }
  },

  // Limpiar listeners
  removeAllListeners() {
    if (socket) {
      socket.removeAllListeners()
    }
  }
}