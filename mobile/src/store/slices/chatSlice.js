/**
 * Chat Slice - Refactored for SQLite persistence
 * Redux now only handles UI state, data is in SQLite
 */

import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import MessageRepository from '../../database/repositories/MessageRepository';
import ConversationRepository from '../../database/repositories/ConversationRepository';
import messageSyncEngine from '../../services/MessageSyncEngine';

// ============================================
// ASYNC THUNKS (Data Operations)
// ============================================

/**
 * Load conversations from local DB
 */
export const loadConversations = createAsyncThunk(
  'chat/loadConversations',
  async (_, { rejectWithValue }) => {
    try {
      const conversations = await messageSyncEngine.getConversations();
      return conversations;
    } catch (error) {
      console.error('[ChatSlice] loadConversations failed:', error);
      return rejectWithValue(error.message);
    }
  }
);

/**
 * Load messages for a conversation
 */
export const loadMessages = createAsyncThunk(
  'chat/loadMessages',
  async ({ conversationId, limit = 50, beforeTimestamp = null }, { rejectWithValue }) => {
    try {
      const messages = await messageSyncEngine.getMessages(
        conversationId,
        limit,
        beforeTimestamp
      );
      return { conversationId, messages };
    } catch (error) {
      console.error('[ChatSlice] loadMessages failed:', error);
      return rejectWithValue(error.message);
    }
  }
);

/**
 * Send a message (offline-first)
 */
export const sendMessage = createAsyncThunk(
  'chat/sendMessage',
  async ({ conversationId, content, receiverId, currentUserId }, { rejectWithValue }) => {
    try {
      const result = await messageSyncEngine.sendMessage(
        conversationId,
        content,
        receiverId,
        currentUserId
      );
      return { conversationId, ...result };
    } catch (error) {
      console.error('[ChatSlice] sendMessage failed:', error);
      return rejectWithValue(error.message);
    }
  }
);

/**
 * Mark messages as read
 */
export const markConversationAsRead = createAsyncThunk(
  'chat/markAsRead',
  async ({ conversationId, messageIds }, { rejectWithValue }) => {
    try {
      await messageSyncEngine.markAsRead(conversationId, messageIds);
      return { conversationId };
    } catch (error) {
      console.error('[ChatSlice] markAsRead failed:', error);
      return rejectWithValue(error.message);
    }
  }
);

/**
 * Retry failed message
 */
export const retryFailedMessage = createAsyncThunk(
  'chat/retryMessage',
  async ({ tempId }, { rejectWithValue }) => {
    try {
      await messageSyncEngine.retryMessage(tempId);
      return { tempId };
    } catch (error) {
      console.error('[ChatSlice] retryMessage failed:', error);
      return rejectWithValue(error.message);
    }
  }
);

/**
 * Sync all data
 */
export const syncAllData = createAsyncThunk(
  'chat/syncAll',
  async (_, { rejectWithValue }) => {
    try {
      await messageSyncEngine.syncAll();
      return true;
    } catch (error) {
      console.error('[ChatSlice] syncAll failed:', error);
      return rejectWithValue(error.message);
    }
  }
);

// ============================================
// SLICE (UI State Only)
// ============================================

const initialState = {
  // UI State
  loading: false,
  connected: false,
  syncing: false,

  // Current active chat
  currentConversationId: null,
  currentConversation: null,

  // Typing indicators (per conversation)
  typing: {}, // { conversationId: userId }

  // Cached data (read from SQLite, held temporarily)
  conversations: [],
  messages: [], // Messages for current conversation only

  // Error handling
  error: null,
};

const chatSlice = createSlice({
  name: 'chat',
  initialState,
  reducers: {
    // ========================================
    // Connection State
    // ========================================
    setConnected: (state, action) => {
      state.connected = action.payload;
    },

    setSyncing: (state, action) => {
      state.syncing = action.payload;
    },

    // ========================================
    // Current Chat
    // ========================================
    setCurrentConversation: (state, action) => {
      const conversation = action.payload;
      state.currentConversationId = conversation?.id || null;
      state.currentConversation = conversation;

      // Clear messages when switching chats (will reload from DB)
      if (conversation?.id !== state.currentConversationId) {
        state.messages = [];
      }
    },

    clearCurrentConversation: (state) => {
      state.currentConversationId = null;
      state.currentConversation = null;
      state.messages = [];
      state.typing = {};
    },

    // ========================================
    // Typing Indicators
    // ========================================
    setUserTyping: (state, action) => {
      const { conversationId, userId, isTyping } = action.payload;

      if (isTyping) {
        state.typing[conversationId] = userId;
      } else {
        delete state.typing[conversationId];
      }
    },

    clearTyping: (state, action) => {
      const { conversationId } = action.payload;
      delete state.typing[conversationId];
    },

    // ========================================
    // Real-time Updates (from WebSocket)
    // ========================================
    handleIncomingMessage: (state, action) => {
      const message = action.payload;

      // If message is for current conversation, add it to cached messages
      if (message.conversation_id === state.currentConversationId) {
        // Check if already exists (avoid duplicates)
        const exists = state.messages.some(m => m.id === message.id);
        if (!exists) {
          state.messages.push(message);
        }
      }

      // Update conversation in cached list
      const convIndex = state.conversations.findIndex(c => c.id === message.conversation_id);
      if (convIndex !== -1) {
        state.conversations[convIndex].last_message_at = message.created_at;
        state.conversations[convIndex].last_message_preview = message.content.substring(0, 100);

        // Increment unread if not current chat
        if (message.conversation_id !== state.currentConversationId) {
          state.conversations[convIndex].unread_count =
            (state.conversations[convIndex].unread_count || 0) + 1;
        }
      }
    },

    handleMessageAck: (state, action) => {
      const { temp_id, server_id } = action.payload;

      // Update message in cached list
      const msgIndex = state.messages.findIndex(m => m.temp_id === temp_id);
      if (msgIndex !== -1) {
        state.messages[msgIndex].id = server_id;
        state.messages[msgIndex].status = 'sent';
      }
    },

    handleMessageFailed: (state, action) => {
      const { temp_id, error } = action.payload;

      // Update message status
      const msgIndex = state.messages.findIndex(m => m.temp_id === temp_id);
      if (msgIndex !== -1) {
        state.messages[msgIndex].status = 'failed';
        state.messages[msgIndex].error = error;
      }
    },

    // ========================================
    // User Presence
    // ========================================
    updateUserOnlineStatus: (state, action) => {
      const { userId, isOnline } = action.payload;

      // Update in conversations list
      state.conversations.forEach(conv => {
        if (conv.user1_id === userId || conv.user2_id === userId) {
          conv.other_user_online = isOnline ? 1 : 0;
        }
      });

      // Update current conversation
      if (state.currentConversation) {
        if (
          state.currentConversation.user1_id === userId ||
          state.currentConversation.user2_id === userId
        ) {
          state.currentConversation.other_user_online = isOnline ? 1 : 0;
        }
      }
    },

    // ========================================
    // Reset
    // ========================================
    resetChat: () => {
      return initialState;
    },

    clearError: (state) => {
      state.error = null;
    },
  },

  // ========================================
  // EXTRA REDUCERS (Async Thunks)
  // ========================================
  extraReducers: (builder) => {
    // Load Conversations
    builder
      .addCase(loadConversations.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loadConversations.fulfilled, (state, action) => {
        state.loading = false;
        state.conversations = action.payload;
      })
      .addCase(loadConversations.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });

    // Load Messages
    builder
      .addCase(loadMessages.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loadMessages.fulfilled, (state, action) => {
        state.loading = false;
        const { conversationId, messages } = action.payload;

        // Only update if still on this conversation
        if (conversationId === state.currentConversationId) {
          state.messages = messages;
        }
      })
      .addCase(loadMessages.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });

    // Send Message
    builder
      .addCase(sendMessage.pending, (state) => {
        // Don't set loading, message already optimistically added
      })
      .addCase(sendMessage.fulfilled, (state, action) => {
        const { conversationId, temp_id, created_at } = action.payload;

        // Add optimistic message to UI
        if (conversationId === state.currentConversationId) {
          state.messages.push({
            temp_id,
            conversation_id: conversationId,
            created_at,
            status: 'pending',
          });
        }
      })
      .addCase(sendMessage.rejected, (state, action) => {
        state.error = action.payload;
      });

    // Mark as Read
    builder
      .addCase(markConversationAsRead.fulfilled, (state, action) => {
        const { conversationId } = action.payload;

        // Reset unread count in cached conversation
        const conv = state.conversations.find(c => c.id === conversationId);
        if (conv) {
          conv.unread_count = 0;
        }

        // Mark messages as read in cached list
        if (conversationId === state.currentConversationId) {
          state.messages = state.messages.map(msg => ({
            ...msg,
            status: msg.status === 'delivered' ? 'read' : msg.status,
          }));
        }
      });

    // Sync All
    builder
      .addCase(syncAllData.pending, (state) => {
        state.syncing = true;
      })
      .addCase(syncAllData.fulfilled, (state) => {
        state.syncing = false;
      })
      .addCase(syncAllData.rejected, (state, action) => {
        state.syncing = false;
        state.error = action.payload;
      });
  },
});

// ============================================
// ACTIONS
// ============================================

export const {
  setConnected,
  setSyncing,
  setCurrentConversation,
  clearCurrentConversation,
  setUserTyping,
  clearTyping,
  handleIncomingMessage,
  handleMessageAck,
  handleMessageFailed,
  updateUserOnlineStatus,
  resetChat,
  clearError,
} = chatSlice.actions;

// ============================================
// SELECTORS
// ============================================

export const selectConversations = (state) => state.chat.conversations;
export const selectCurrentConversation = (state) => state.chat.currentConversation;
export const selectCurrentConversationId = (state) => state.chat.currentConversationId;
export const selectMessages = (state) => state.chat.messages;
export const selectChatLoading = (state) => state.chat.loading;
export const selectChatConnected = (state) => state.chat.connected;
export const selectChatSyncing = (state) => state.chat.syncing;
export const selectChatError = (state) => state.chat.error;

export const selectUserTyping = (state, conversationId) => state.chat.typing[conversationId];

export const selectUnreadCount = (state, conversationId) => {
  const conv = state.chat.conversations.find(c => c.id === conversationId);
  return conv?.unread_count || 0;
};

export const selectTotalUnreadCount = (state) => {
  return state.chat.conversations.reduce((total, conv) => {
    return total + (conv.unread_count || 0);
  }, 0);
};

export const selectConversationStats = (state) => ({
  total: state.chat.conversations.length,
  unread: state.chat.conversations.filter(c => c.unread_count > 0).length,
  totalUnreadMessages: selectTotalUnreadCount(state),
});

// ============================================
// EXPORT
// ============================================

export default chatSlice.reducer;
