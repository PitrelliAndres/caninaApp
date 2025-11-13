/**
 * Message Sync Engine
 * Orchestrates synchronization between local SQLite and server
 * Implements offline-first architecture with intelligent sync
 */

import sqliteService from '../database/sqliteService';
import MessageRepository from '../database/repositories/MessageRepository';
import ConversationRepository from '../database/repositories/ConversationRepository';
import MessageQueueRepository from '../database/repositories/MessageQueueRepository';
import messageService from './api/messages';
import { generateULID } from '../utils/ulid';
import NetInfo from '@react-native-community/netinfo';

class MessageSyncEngine {
  constructor() {
    this.isSyncing = false;
    this.syncInterval = null;
    this.networkState = null;
    this.listeners = new Set();
  }

  /**
   * Initialize sync engine
   */
  async initialize() {
    try {
      // Initialize SQLite
      await sqliteService.init();

      // Setup network listener
      this.setupNetworkListener();

      // Start periodic sync
      this.startPeriodicSync();

      console.log('[SyncEngine] Initialized successfully');
    } catch (error) {
      console.error('[SyncEngine] Initialization failed:', error);
      throw error;
    }
  }

  /**
   * Setup network state listener
   */
  setupNetworkListener() {
    NetInfo.addEventListener(state => {
      const wasOffline = this.networkState?.isConnected === false;
      const isNowOnline = state.isConnected === true;

      this.networkState = state;

      // If we just came online, trigger sync
      if (wasOffline && isNowOnline) {
        console.log('[SyncEngine] Network restored, triggering sync');
        this.syncAll();
      }
    });
  }

  /**
   * Start periodic background sync
   */
  startPeriodicSync() {
    // Sync every 30 seconds when online
    this.syncInterval = setInterval(() => {
      if (this.networkState?.isConnected) {
        this.syncAll();
      }
    }, 30 * 1000);
  }

  /**
   * Stop periodic sync
   */
  stopPeriodicSync() {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }
  }

  /**
   * Full synchronization
   */
  async syncAll() {
    if (this.isSyncing) {
      console.log('[SyncEngine] Sync already in progress, skipping');
      return;
    }

    if (!this.networkState?.isConnected) {
      console.log('[SyncEngine] Offline, skipping sync');
      return;
    }

    this.isSyncing = true;
    this.notifyListeners('sync_started');

    try {
      console.log('[SyncEngine] Starting full sync');

      // Step 1: Send pending messages
      await this.sendPendingMessages();

      // Step 2: Fetch new messages from server (delta sync)
      await this.fetchNewMessages();

      // Step 3: Sync conversations list
      await this.syncConversations();

      // Step 4: Cleanup old data
      await this.cleanup();

      console.log('[SyncEngine] Full sync completed');
      this.notifyListeners('sync_completed');

    } catch (error) {
      console.error('[SyncEngine] Sync failed:', error);
      this.notifyListeners('sync_failed', error);
    } finally {
      this.isSyncing = false;
    }
  }

  /**
   * Send pending messages from queue
   */
  async sendPendingMessages() {
    try {
      const pendingQueue = await MessageQueueRepository.getPendingMessages(20);

      console.log(`[SyncEngine] Sending ${pendingQueue.length} pending messages`);

      for (const queueItem of pendingQueue) {
        try {
          // Mark as processing
          await MessageQueueRepository.markAsProcessing(queueItem.id);

          // Parse payload
          const payload = JSON.parse(queueItem.payload);

          // Send via API
          const response = await messageService.sendMessage(
            queueItem.conversation_id,
            payload
          );

          // Update message with server ID
          await MessageRepository.updateMessageWithServerId(
            queueItem.temp_id,
            response.message.id
          );

          // Mark queue item as completed
          await MessageQueueRepository.markAsCompleted(queueItem.id);

          // Update conversation
          await ConversationRepository.updateLastMessage(
            queueItem.conversation_id,
            response.message.id,
            payload.content.substring(0, 100),
            response.message.created_at
          );

          console.log(`[SyncEngine] Message sent: ${queueItem.temp_id} -> ${response.message.id}`);

          this.notifyListeners('message_sent', {
            temp_id: queueItem.temp_id,
            server_id: response.message.id,
          });

        } catch (error) {
          console.error(`[SyncEngine] Failed to send message ${queueItem.temp_id}:`, error);

          // Mark as failed and schedule retry
          await MessageQueueRepository.markAsFailed(
            queueItem.id,
            error.message
          );

          // Update message status
          await MessageRepository.updateMessageStatus(
            queueItem.temp_id,
            'failed',
            null,
            error.message
          );

          this.notifyListeners('message_failed', {
            temp_id: queueItem.temp_id,
            error: error.message,
          });
        }
      }

    } catch (error) {
      console.error('[SyncEngine] sendPendingMessages failed:', error);
      throw error;
    }
  }

  /**
   * Fetch new messages from server (delta sync)
   */
  async fetchNewMessages() {
    try {
      // Get last sync timestamp
      const lastSync = await sqliteService.getSyncState('last_message_sync') || 0;

      console.log(`[SyncEngine] Fetching messages since ${new Date(lastSync).toISOString()}`);

      // Fetch messages from server
      // TODO: Backend needs to implement this endpoint
      // For now, we'll fetch recent messages for each conversation
      const conversations = await ConversationRepository.getAllConversations(20);

      for (const conv of conversations) {
        try {
          // Get last message timestamp for this conversation
          const lastMessage = await MessageRepository.getLastMessage(conv.id);
          const cursor = lastMessage?.id;

          // Fetch new messages
          const response = await messageService.getMessages(conv.id, {
            after: cursor,
            limit: 50,
          });

          if (response.messages && response.messages.length > 0) {
            // Insert new messages
            await MessageRepository.bulkInsertMessages(response.messages);

            // Update conversation
            const lastMsg = response.messages[response.messages.length - 1];
            await ConversationRepository.updateLastMessage(
              conv.id,
              lastMsg.id,
              lastMsg.content.substring(0, 100),
              lastMsg.created_at
            );

            console.log(`[SyncEngine] Fetched ${response.messages.length} new messages for ${conv.id}`);

            this.notifyListeners('messages_received', {
              conversation_id: conv.id,
              count: response.messages.length,
            });
          }

          // Update sync timestamp
          await ConversationRepository.updateSyncTimestamp(conv.id, response.cursor);

        } catch (error) {
          console.error(`[SyncEngine] Failed to fetch messages for ${conv.id}:`, error);
        }
      }

      // Update global sync timestamp
      await sqliteService.setSyncState('last_message_sync', Date.now());

    } catch (error) {
      console.error('[SyncEngine] fetchNewMessages failed:', error);
      throw error;
    }
  }

  /**
   * Sync conversations list with pagination support
   * Fetches all pages automatically
   */
  async syncConversations() {
    try {
      console.log('[SyncEngine] Syncing conversations');

      let allConversations = [];
      let cursor = null;
      let hasMore = true;
      let pageCount = 0;
      const maxPages = 50; // Safety limit (50 pages × 20 = 1000 conversations max)

      // Fetch all pages
      while (hasMore && pageCount < maxPages) {
        pageCount++;

        // Fetch conversations from server with cursor
        const response = await messageService.getConversations({ cursor, limit: 20 });

        if (response.conversations && response.conversations.length > 0) {
          allConversations = allConversations.concat(response.conversations);
          console.log(`[SyncEngine] Fetched page ${pageCount}: ${response.conversations.length} conversations`);
        }

        // Check if there are more pages
        hasMore = response.pagination?.has_more || false;
        cursor = response.pagination?.next_cursor || null;

        if (!hasMore || !cursor) {
          break;
        }
      }

      if (allConversations.length > 0) {
        // Transform server format to local format
        const conversations = allConversations.map(conv => ({
          id: conv.chat_id, // Note: API returns 'chat_id'
          user1_id: conv.user1_id,
          user2_id: conv.user2_id,
          last_message_id: conv.last_message_id,
          last_message_at: conv.last_message_time ? new Date(conv.last_message_time).getTime() : Date.now(),
          last_message_preview: conv.last_message || '',
          unread_count: conv.unread || 0,
          other_user_name: conv.user?.nickname,
          other_user_avatar: conv.user?.avatar,
          other_user_online: conv.user?.is_online || false,
        }));

        // Bulk upsert
        await ConversationRepository.bulkUpsertConversations(conversations);

        console.log(`[SyncEngine] Synced ${conversations.length} conversations in ${pageCount} pages`);

        this.notifyListeners('conversations_synced', {
          count: conversations.length,
          pages: pageCount,
        });
      } else {
        console.log('[SyncEngine] No conversations to sync');
      }

      // Update global sync timestamp
      await sqliteService.setSyncState('last_conversation_sync', Date.now());

    } catch (error) {
      console.error('[SyncEngine] syncConversations failed:', error);
      throw error;
    }
  }

  /**
   * Send a new message (offline-first)
   */
  async sendMessage(conversationId, content, receiverId, currentUserId) {
    try {
      const tempId = generateULID();
      const now = Date.now();

      // 1. Insert message to local DB
      const message = await MessageRepository.insertMessage({
        temp_id: tempId,
        conversation_id: conversationId,
        sender_id: currentUserId,
        receiver_id: receiverId,
        content,
        created_at: now,
        status: 'pending',
      });

      // 2. Update conversation
      await ConversationRepository.updateLastMessage(
        conversationId,
        null, // No server ID yet
        content.substring(0, 100),
        now
      );

      // 3. Enqueue for sending
      await MessageQueueRepository.enqueue(
        tempId,
        conversationId,
        {
          temp_id: tempId,
          content,
        },
        'normal'
      );

      console.log(`[SyncEngine] Message queued: ${tempId}`);

      // 4. Try to send immediately if online
      if (this.networkState?.isConnected) {
        // Don't await, send in background
        this.sendPendingMessages().catch(err => {
          console.error('[SyncEngine] Background send failed:', err);
        });
      }

      return {
        temp_id: tempId,
        created_at: now,
        status: 'pending',
      };

    } catch (error) {
      console.error('[SyncEngine] sendMessage failed:', error);
      throw error;
    }
  }

  /**
   * Mark messages as read
   */
  async markAsRead(conversationId, messageIds) {
    try {
      // Update local DB
      for (const msgId of messageIds) {
        await MessageRepository.markAsRead(msgId);
      }

      // Reset unread count
      const lastMessageId = messageIds[messageIds.length - 1];
      await ConversationRepository.resetUnreadCount(conversationId, lastMessageId);

      // Sync to server if online
      if (this.networkState?.isConnected) {
        try {
          await messageService.markAsRead(conversationId, lastMessageId);
        } catch (error) {
          console.error('[SyncEngine] Failed to sync read status:', error);
          // Non-critical, will sync later
        }
      }

      console.log(`[SyncEngine] Marked ${messageIds.length} messages as read`);

      this.notifyListeners('messages_read', {
        conversation_id: conversationId,
        message_ids: messageIds,
      });

    } catch (error) {
      console.error('[SyncEngine] markAsRead failed:', error);
      throw error;
    }
  }

  /**
   * Get messages for a conversation (from local DB)
   */
  async getMessages(conversationId, limit = 50, beforeTimestamp = null) {
    try {
      const messages = await MessageRepository.getMessagesByConversation(
        conversationId,
        limit,
        beforeTimestamp
      );

      // If we have few messages, try to fetch more from server
      if (messages.length < 10 && this.networkState?.isConnected) {
        await this.fetchNewMessages();

        // Re-query
        return await MessageRepository.getMessagesByConversation(
          conversationId,
          limit,
          beforeTimestamp
        );
      }

      return messages;

    } catch (error) {
      console.error('[SyncEngine] getMessages failed:', error);
      throw error;
    }
  }

  /**
   * Get conversations (from local DB)
   */
  async getConversations(limit = 100) {
    try {
      const conversations = await ConversationRepository.getAllConversations(limit);

      // If empty, try to sync from server
      if (conversations.length === 0 && this.networkState?.isConnected) {
        await this.syncConversations();

        // Re-query
        return await ConversationRepository.getAllConversations(limit);
      }

      return conversations;

    } catch (error) {
      console.error('[SyncEngine] getConversations failed:', error);
      throw error;
    }
  }

  /**
   * Retry failed message
   */
  async retryMessage(tempId) {
    try {
      // Find in queue
      const queueItem = await MessageQueueRepository.getByTempId(tempId);

      if (!queueItem) {
        throw new Error('Message not found in queue');
      }

      // Retry
      await MessageQueueRepository.retry(queueItem.id);

      // Update message status
      await MessageRepository.updateMessageStatus(tempId, 'pending', null, null);

      // Trigger send
      await this.sendPendingMessages();

      console.log(`[SyncEngine] Message retry initiated: ${tempId}`);

    } catch (error) {
      console.error('[SyncEngine] retryMessage failed:', error);
      throw error;
    }
  }

  /**
   * Cleanup old data
   */
  async cleanup() {
    try {
      // Clean completed queue items (older than 1 hour)
      await MessageQueueRepository.cleanupCompleted();

      // Optionally delete old messages (implement data retention policy)
      // await MessageRepository.deleteOldMessages(90); // Keep 90 days

      console.log('[SyncEngine] Cleanup completed');

    } catch (error) {
      console.error('[SyncEngine] Cleanup failed:', error);
    }
  }

  /**
   * Handle incoming WebSocket message
   */
  async handleIncomingMessage(message) {
    try {
      // Check if message already exists (avoid duplicates)
      const existing = await MessageRepository.getMessageById(message.id);

      if (existing) {
        console.log(`[SyncEngine] Message ${message.id} already exists, skipping`);
        return;
      }

      // Insert message
      await MessageRepository.insertMessage({
        id: message.id,
        temp_id: message.temp_id || message.id,
        conversation_id: message.conversation_id,
        sender_id: message.sender_id,
        receiver_id: message.receiver_id,
        content: message.content,
        created_at: message.created_at,
        status: 'delivered',
      });

      // Update conversation
      await ConversationRepository.updateLastMessage(
        message.conversation_id,
        message.id,
        message.content.substring(0, 100),
        message.created_at
      );

      // Increment unread count (if not from current user)
      const currentUserId = await sqliteService.getSyncState('user_id');
      if (message.sender_id !== currentUserId) {
        await ConversationRepository.incrementUnreadCount(message.conversation_id);
      }

      console.log(`[SyncEngine] Incoming message saved: ${message.id}`);

      this.notifyListeners('message_received', message);

    } catch (error) {
      console.error('[SyncEngine] handleIncomingMessage failed:', error);
    }
  }

  /**
   * Handle message acknowledgment from server
   */
  async handleMessageAck(tempId, serverMessage) {
    try {
      // Update message with server ID
      await MessageRepository.updateMessageWithServerId(tempId, serverMessage.id);

      // Mark queue item as completed
      await MessageQueueRepository.deleteByTempId(tempId);

      console.log(`[SyncEngine] Message acknowledged: ${tempId} -> ${serverMessage.id}`);

      this.notifyListeners('message_ack', {
        temp_id: tempId,
        server_id: serverMessage.id,
      });

    } catch (error) {
      console.error('[SyncEngine] handleMessageAck failed:', error);
    }
  }

  /**
   * Get sync statistics
   */
  async getStats() {
    const stats = await sqliteService.getStats();
    const queueStats = await MessageQueueRepository.getStats();

    return {
      ...stats,
      queue: queueStats,
      isSyncing: this.isSyncing,
      isOnline: this.networkState?.isConnected || false,
    };
  }

  /**
   * Subscribe to sync events
   */
  subscribe(callback) {
    this.listeners.add(callback);

    // Return unsubscribe function
    return () => {
      this.listeners.delete(callback);
    };
  }

  /**
   * Notify all listeners
   */
  notifyListeners(event, data = null) {
    this.listeners.forEach(callback => {
      try {
        callback(event, data);
      } catch (error) {
        console.error('[SyncEngine] Listener error:', error);
      }
    });
  }

  /**
   * Clear all local data (logout)
   */
  async clearAllData() {
    try {
      await sqliteService.clearAllData();
      console.log('[SyncEngine] All local data cleared');
    } catch (error) {
      console.error('[SyncEngine] clearAllData failed:', error);
      throw error;
    }
  }

  /**
   * Shutdown sync engine
   */
  async shutdown() {
    this.stopPeriodicSync();
    await sqliteService.close();
    console.log('[SyncEngine] Shutdown complete');
  }
}

// Export singleton instance
const messageSyncEngine = new MessageSyncEngine();
export default messageSyncEngine;
