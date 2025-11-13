/**
 * Chat Integration Service
 * Bridges WebSocket events with MessageSyncEngine and Redux
 * This is the glue between legacy messageService and new SQLite architecture
 */

import { messageService } from './api/messages';
import messageSyncEngine from './MessageSyncEngine';
import { store } from '../store';
import {
  setConnected,
  setSyncing,
  handleIncomingMessage,
  handleMessageAck,
  handleMessageFailed,
  updateUserOnlineStatus,
  syncAllData,
} from '../store/slices/chatSlice';

class ChatIntegration {
  constructor() {
    this.initialized = false;
    this.syncEngineListenerCleanup = null;
  }

  /**
   * Initialize the entire chat system
   * Call this once on app startup
   */
  async initialize() {
    if (this.initialized) {
      console.log('[ChatIntegration] Already initialized');
      return;
    }

    try {
      console.log('[ChatIntegration] Initializing chat system...');

      // 1. Initialize SQLite and MessageSyncEngine
      await messageSyncEngine.initialize();

      // 2. Setup MessageSyncEngine event listeners
      this.setupSyncEngineListeners();

      // 3. Setup WebSocket event listeners
      this.setupWebSocketListeners();

      // 4. Initial sync (if online)
      await store.dispatch(syncAllData());

      this.initialized = true;
      console.log('[ChatIntegration] Chat system initialized successfully');

    } catch (error) {
      console.error('[ChatIntegration] Initialization failed:', error);
      throw error;
    }
  }

  /**
   * Setup MessageSyncEngine event listeners
   * These events come from the sync engine's internal operations
   */
  setupSyncEngineListeners() {
    this.syncEngineListenerCleanup = messageSyncEngine.subscribe((event, data) => {
      switch (event) {
        case 'sync_started':
          store.dispatch(setSyncing(true));
          break;

        case 'sync_completed':
          store.dispatch(setSyncing(false));
          break;

        case 'sync_failed':
          store.dispatch(setSyncing(false));
          console.error('[ChatIntegration] Sync failed:', data);
          break;

        case 'message_sent':
          // Message successfully sent to server
          console.log('[ChatIntegration] Message sent:', data);
          break;

        case 'message_failed':
          // Message send failed
          store.dispatch(handleMessageFailed({
            temp_id: data.temp_id,
            error: data.error,
          }));
          break;

        case 'message_received':
          // New message received from server (already saved to SQLite)
          store.dispatch(handleIncomingMessage(data));
          break;

        case 'message_ack':
          // Server acknowledged our message
          store.dispatch(handleMessageAck({
            temp_id: data.temp_id,
            server_id: data.server_id,
          }));
          break;

        case 'messages_received':
          // Batch of messages fetched from server
          console.log(`[ChatIntegration] Received ${data.count} messages for ${data.conversation_id}`);
          break;

        case 'conversations_synced':
          // Conversations list synced
          console.log(`[ChatIntegration] Synced ${data.count} conversations`);
          break;

        case 'messages_read':
          // Read receipts processed
          console.log(`[ChatIntegration] Marked messages as read in ${data.conversation_id}`);
          break;

        default:
          // console.log('[ChatIntegration] Unknown sync event:', event, data);
          break;
      }
    });
  }

  /**
   * Setup WebSocket event listeners
   * These events come from the server via Socket.IO
   */
  setupWebSocketListeners() {
    // Connection events
    const socket = messageService.getSocket();

    if (socket) {
      socket.on('connect', () => {
        console.log('[ChatIntegration] WebSocket connected');
        store.dispatch(setConnected(true));

        // Trigger sync after reconnection
        store.dispatch(syncAllData());
      });

      socket.on('disconnect', () => {
        console.log('[ChatIntegration] WebSocket disconnected');
        store.dispatch(setConnected(false));
      });

      socket.on('connect_error', (error) => {
        console.error('[ChatIntegration] WebSocket connection error:', error);
        store.dispatch(setConnected(false));
      });
    }

    // DM events - forward to MessageSyncEngine
    messageService.onNewDMMessage(async (data) => {
      try {
        // Let MessageSyncEngine handle saving to DB
        await messageSyncEngine.handleIncomingMessage(data.message);

        // Redux will be notified via MessageSyncEngine events
      } catch (error) {
        console.error('[ChatIntegration] Error handling incoming message:', error);
      }
    });

    // Message acknowledgment
    messageService.onDMAck((data) => {
      try {
        // Let MessageSyncEngine handle the ack
        messageSyncEngine.handleMessageAck(data.temp_id, data.message);

        // Redux will be notified via MessageSyncEngine events
      } catch (error) {
        console.error('[ChatIntegration] Error handling message ack:', error);
      }
    });

    // Read receipts
    messageService.onDMReadReceipt((data) => {
      // Read receipts are handled by MessageSyncEngine in markAsRead
      console.log('[ChatIntegration] Read receipt received:', data);
    });

    // User presence
    messageService.onUserStatus((data) => {
      store.dispatch(updateUserOnlineStatus({
        userId: data.userId,
        isOnline: data.isOnline,
      }));
    });

    // Typing indicators are handled locally in DMChatScreen
    // (they don't need SQLite persistence)
  }

  /**
   * Cleanup on app shutdown or logout
   */
  async cleanup() {
    if (!this.initialized) return;

    try {
      console.log('[ChatIntegration] Cleaning up...');

      // Unsubscribe from sync engine
      if (this.syncEngineListenerCleanup) {
        this.syncEngineListenerCleanup();
        this.syncEngineListenerCleanup = null;
      }

      // Remove WebSocket listeners
      messageService.removeAllListeners();

      // Shutdown sync engine
      await messageSyncEngine.shutdown();

      this.initialized = false;
      console.log('[ChatIntegration] Cleanup complete');

    } catch (error) {
      console.error('[ChatIntegration] Cleanup failed:', error);
    }
  }

  /**
   * Clear all chat data (logout scenario)
   */
  async clearAllData() {
    try {
      await messageSyncEngine.clearAllData();
      console.log('[ChatIntegration] All chat data cleared');
    } catch (error) {
      console.error('[ChatIntegration] Failed to clear data:', error);
      throw error;
    }
  }

  /**
   * Get sync statistics
   */
  async getStats() {
    return await messageSyncEngine.getStats();
  }

  /**
   * Check if initialized
   */
  isInitialized() {
    return this.initialized;
  }
}

// Export singleton instance
const chatIntegration = new ChatIntegration();
export default chatIntegration;
