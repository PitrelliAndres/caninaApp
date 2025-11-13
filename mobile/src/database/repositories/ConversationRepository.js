/**
 * Conversation Repository
 * Handles all conversation-related database operations
 */

import sqliteService from '../sqliteService';
import MessageRepository from './MessageRepository';

class ConversationRepository {
  /**
   * Insert or update a conversation
   */
  async upsertConversation(conversation) {
    const now = Date.now();

    // Ensure user1_id < user2_id for uniqueness constraint
    const [user1, user2] = [conversation.user1_id, conversation.user2_id].sort();

    const data = {
      id: conversation.id,
      user1_id: user1,
      user2_id: user2,
      last_message_id: conversation.last_message_id || null,
      last_message_at: conversation.last_message_at || now,
      last_message_preview: conversation.last_message_preview || null,
      last_read_message_id: conversation.last_read_message_id || null,
      last_read_at: conversation.last_read_at || null,
      unread_count: conversation.unread_count || 0,
      synced_at: conversation.synced_at || now,
      last_sync_cursor: conversation.last_sync_cursor || null,
      other_user_name: conversation.other_user_name || null,
      other_user_avatar: conversation.other_user_avatar || null,
      other_user_online: conversation.other_user_online ? 1 : 0,
      created_at: conversation.created_at || now,
      updated_at: now,
      is_deleted: 0,
    };

    // Use INSERT OR REPLACE for upsert
    const keys = Object.keys(data);
    const values = Object.values(data);
    const placeholders = keys.map(() => '?').join(', ');

    const sql = `INSERT OR REPLACE INTO conversations (${keys.join(', ')}) VALUES (${placeholders})`;

    await sqliteService.query(sql, values);
    return data;
  }

  /**
   * Bulk upsert conversations
   */
  async bulkUpsertConversations(conversations) {
    if (!conversations || conversations.length === 0) return;

    const records = conversations.map(conv => {
      const [user1, user2] = [conv.user1_id, conv.user2_id].sort();

      return {
        id: conv.id,
        user1_id: user1,
        user2_id: user2,
        last_message_id: conv.last_message_id || null,
        last_message_at: conv.last_message_at || Date.now(),
        last_message_preview: conv.last_message_preview || null,
        last_read_message_id: conv.last_read_message_id || null,
        last_read_at: conv.last_read_at || null,
        unread_count: conv.unread_count || 0,
        synced_at: Date.now(),
        last_sync_cursor: null,
        other_user_name: conv.other_user_name || null,
        other_user_avatar: conv.other_user_avatar || null,
        other_user_online: conv.other_user_online ? 1 : 0,
        created_at: conv.created_at || Date.now(),
        updated_at: Date.now(),
        is_deleted: 0,
      };
    });

    await sqliteService.bulkInsert('conversations', records);
  }

  /**
   * Get conversation by ID
   */
  async getConversationById(conversationId) {
    const conversations = await sqliteService.select(
      'conversations',
      'id = ?',
      [conversationId]
    );

    return conversations[0] || null;
  }

  /**
   * Get conversation by users
   */
  async getConversationByUsers(user1Id, user2Id) {
    const [user1, user2] = [user1Id, user2Id].sort();

    const conversations = await sqliteService.select(
      'conversations',
      'user1_id = ? AND user2_id = ?',
      [user1, user2]
    );

    return conversations[0] || null;
  }

  /**
   * Get all conversations (sorted by last message)
   */
  async getAllConversations(limit = 100, offset = 0) {
    const sql = `
      SELECT * FROM conversations
      WHERE is_deleted = 0
      ORDER BY last_message_at DESC
      LIMIT ? OFFSET ?
    `;

    return await sqliteService.query(sql, [limit, offset]);
  }

  /**
   * Get conversations with unread messages
   */
  async getUnreadConversations() {
    return await sqliteService.select(
      'conversations',
      'unread_count > 0 AND is_deleted = 0',
      [],
      'unread_count DESC, last_message_at DESC'
    );
  }

  /**
   * Update last message
   */
  async updateLastMessage(conversationId, messageId, messagePreview, timestamp) {
    return await sqliteService.update(
      'conversations',
      {
        last_message_id: messageId,
        last_message_at: timestamp,
        last_message_preview: messagePreview,
        updated_at: Date.now(),
      },
      'id = ?',
      [conversationId]
    );
  }

  /**
   * Increment unread count
   */
  async incrementUnreadCount(conversationId) {
    const sql = `
      UPDATE conversations
      SET unread_count = unread_count + 1,
          updated_at = ?
      WHERE id = ?
    `;

    await sqliteService.query(sql, [Date.now(), conversationId]);
  }

  /**
   * Reset unread count (mark as read)
   */
  async resetUnreadCount(conversationId, lastReadMessageId = null) {
    const updates = {
      unread_count: 0,
      updated_at: Date.now(),
    };

    if (lastReadMessageId) {
      updates.last_read_message_id = lastReadMessageId;
      updates.last_read_at = Date.now();
    }

    return await sqliteService.update(
      'conversations',
      updates,
      'id = ?',
      [conversationId]
    );
  }

  /**
   * Update user online status
   */
  async updateUserOnlineStatus(userId, isOnline) {
    const sql = `
      UPDATE conversations
      SET other_user_online = ?,
          updated_at = ?
      WHERE (user1_id = ? OR user2_id = ?)
      AND is_deleted = 0
    `;

    await sqliteService.query(sql, [
      isOnline ? 1 : 0,
      Date.now(),
      userId,
      userId,
    ]);
  }

  /**
   * Update user info cache
   */
  async updateUserInfo(userId, name, avatarUrl) {
    const sql = `
      UPDATE conversations
      SET other_user_name = ?,
          other_user_avatar = ?,
          updated_at = ?
      WHERE (user1_id = ? OR user2_id = ?)
      AND is_deleted = 0
    `;

    await sqliteService.query(sql, [
      name,
      avatarUrl,
      Date.now(),
      userId,
      userId,
    ]);
  }

  /**
   * Update sync timestamp
   */
  async updateSyncTimestamp(conversationId, cursor = null) {
    const updates = {
      synced_at: Date.now(),
      updated_at: Date.now(),
    };

    if (cursor) {
      updates.last_sync_cursor = cursor;
    }

    return await sqliteService.update(
      'conversations',
      updates,
      'id = ?',
      [conversationId]
    );
  }

  /**
   * Soft delete conversation
   */
  async softDeleteConversation(conversationId) {
    return await sqliteService.update(
      'conversations',
      {
        is_deleted: 1,
        deleted_at: Date.now(),
        updated_at: Date.now(),
      },
      'id = ?',
      [conversationId]
    );
  }

  /**
   * Hard delete conversation (and cascade to messages)
   */
  async deleteConversation(conversationId) {
    await sqliteService.transaction(async (tx) => {
      // Delete messages first
      await tx.executeSql('DELETE FROM messages WHERE conversation_id = ?', [conversationId]);

      // Delete conversation
      await tx.executeSql('DELETE FROM conversations WHERE id = ?', [conversationId]);
    });
  }

  /**
   * Get total unread count (for badge)
   */
  async getTotalUnreadCount() {
    const sql = 'SELECT SUM(unread_count) as total FROM conversations WHERE is_deleted = 0';
    const result = await sqliteService.query(sql);

    return result[0]?.total || 0;
  }

  /**
   * Search conversations by user name
   */
  async searchConversations(query, limit = 50) {
    const sql = `
      SELECT * FROM conversations
      WHERE other_user_name LIKE ?
      AND is_deleted = 0
      ORDER BY last_message_at DESC
      LIMIT ?
    `;

    return await sqliteService.query(sql, [`%${query}%`, limit]);
  }

  /**
   * Get conversations that need sync
   */
  async getConversationsNeedingSync(olderThan = 5 * 60 * 1000) {
    // Get conversations not synced in the last 5 minutes
    const cutoff = Date.now() - olderThan;

    return await sqliteService.select(
      'conversations',
      '(synced_at IS NULL OR synced_at < ?) AND is_deleted = 0',
      [cutoff],
      'last_message_at DESC'
    );
  }

  /**
   * Get conversation count
   */
  async getTotalCount() {
    return await sqliteService.count('conversations', 'is_deleted = 0');
  }

  /**
   * Refresh conversation metadata from messages
   */
  async refreshConversationMetadata(conversationId) {
    // Get last message
    const lastMessage = await MessageRepository.getLastMessage(conversationId);

    if (!lastMessage) return;

    // Update conversation
    await this.updateLastMessage(
      conversationId,
      lastMessage.id,
      lastMessage.content.substring(0, 100),
      lastMessage.created_at
    );
  }

  /**
   * Get statistics
   */
  async getStats() {
    const total = await this.getTotalCount();
    const unread = await sqliteService.count(
      'conversations',
      'unread_count > 0 AND is_deleted = 0'
    );
    const totalUnread = await this.getTotalUnreadCount();

    return {
      total,
      unread,
      totalUnreadMessages: totalUnread,
    };
  }
}

export default new ConversationRepository();
