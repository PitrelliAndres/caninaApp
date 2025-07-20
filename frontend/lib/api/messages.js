/**
 * Servicio de mensajes
 */
import { apiClient } from './client'
import io from 'socket.io-client'

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
  connectWebSocket(token) {
    if (socket) return socket
    
    socket = io(apiClient.wsURL, {
      auth: { token },
      transports: ['websocket']
    })
    
    socket.on('connect', () => {
      console.log('WebSocket connected')
    })
    
    socket.on('disconnect', () => {
      console.log('WebSocket disconnected')
    })
    
    return socket
  },

  disconnectWebSocket() {
    if (socket) {
      socket.disconnect()
      socket = null
    }
  },

  emitTyping(chatId, otherUserId) {
    if (socket) {
      socket.emit('typing', { chat_id: chatId, other_user_id: otherUserId })
    }
  },

  markAsRead(chatId) {
    if (socket) {
      socket.emit('mark_read', { chat_id: chatId })
    }
  }
}
