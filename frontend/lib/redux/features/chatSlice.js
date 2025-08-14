import { createSlice } from '@reduxjs/toolkit'

const initialState = {
  conversations: [],
  currentChat: null,
  messages: [],
  loading: false,
  connected: false,
  typing: {},
  unreadCounts: {},
}

const chatSlice = createSlice({
  name: 'chat',
  initialState,
  reducers: {
    setLoading: (state, action) => {
      state.loading = action.payload
    },
    
    setConnected: (state, action) => {
      state.connected = action.payload
    },
    
    setConversations: (state, action) => {
      state.conversations = action.payload
      // Actualizar conteos de no leídos
      const unreadCounts = {}
      action.payload.forEach(conv => {
        if (conv.unread > 0) {
          unreadCounts[conv.chat_id] = conv.unread
        }
      })
      state.unreadCounts = unreadCounts
    },
    
    setCurrentChat: (state, action) => {
      state.currentChat = action.payload
      if (action.payload) {
        // Limpiar contador de no leídos para este chat
        delete state.unreadCounts[action.payload.chat_id]
      }
    },
    
    setMessages: (state, action) => {
      state.messages = action.payload
    },
    
    addMessage: (state, action) => {
      const message = action.payload
      state.messages.push(message)
      
      // Actualizar última mensaje en conversaciones
      const conversation = state.conversations.find(c => 
        (c.user.id === message.sender_id && message.receiver_id === state.currentChat?.user?.id) ||
        (c.user.id === message.receiver_id && message.sender_id === state.currentChat?.user?.id)
      )
      
      if (conversation) {
        conversation.last_message = message.text.length > 50 
          ? message.text.substring(0, 50) + '...' 
          : message.text
        conversation.last_message_time = message.created_at
      }
    },
    
    markMessagesAsRead: (state, action) => {
      const { chatId, userId } = action.payload
      
      // Marcar mensajes como leídos
      state.messages = state.messages.map(msg => ({
        ...msg,
        is_read: msg.sender_id === userId ? true : msg.is_read
      }))
      
      // Limpiar contador no leídos
      delete state.unreadCounts[chatId]
    },
    
    setUserTyping: (state, action) => {
      const { chatId, userId, isTyping } = action.payload
      
      if (isTyping) {
        state.typing[chatId] = userId
      } else {
        delete state.typing[chatId]
      }
    },
    
    updateUserOnlineStatus: (state, action) => {
      const { userId, isOnline } = action.payload
      
      // Actualizar en conversaciones
      state.conversations = state.conversations.map(conv => ({
        ...conv,
        user: conv.user.id === userId 
          ? { ...conv.user, is_online: isOnline }
          : conv.user
      }))
      
      // Actualizar en chat actual
      if (state.currentChat?.user?.id === userId) {
        state.currentChat.user.is_online = isOnline
      }
    },
    
    incrementUnreadCount: (state, action) => {
      const { chatId } = action.payload
      state.unreadCounts[chatId] = (state.unreadCounts[chatId] || 0) + 1
    },
    
    clearChat: (state) => {
      state.currentChat = null
      state.messages = []
      state.typing = {}
    },
    
    resetChat: (state) => {
      return initialState
    }
  },
})

export const {
  setLoading,
  setConnected,
  setConversations,
  setCurrentChat,
  setMessages,
  addMessage,
  markMessagesAsRead,
  setUserTyping,
  updateUserOnlineStatus,
  incrementUnreadCount,
  clearChat,
  resetChat,
} = chatSlice.actions

export default chatSlice.reducer

// Selectors
export const selectConversations = (state) => state.chat.conversations
export const selectCurrentChat = (state) => state.chat.currentChat
export const selectMessages = (state) => state.chat.messages
export const selectChatLoading = (state) => state.chat.loading
export const selectChatConnected = (state) => state.chat.connected
export const selectUserTyping = (state) => (chatId) => state.chat.typing[chatId]
export const selectUnreadCount = (state) => (chatId) => state.chat.unreadCounts[chatId] || 0
export const selectTotalUnreadCount = (state) => 
  Object.values(state.chat.unreadCounts).reduce((total, count) => total + count, 0)