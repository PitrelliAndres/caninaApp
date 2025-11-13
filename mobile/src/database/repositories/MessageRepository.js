/**
 * Message Repository
 * Handles all message-related database operations
 */

import sqliteService from '../sqliteService';
import { generateULID } from '../../utils/ulid';

class MessageRepository {
  /**
   * Insert a new message
   */
  async insertMessage(message) {
    const now = Date.now();

    const data = {
      id: message.id || null,
      temp_id: message.temp_id || generateULID(),
      conversation_id: message.conversation_id,
      sender_id: message.sender_id,
      receiver_id: message.receiver_id,
      content: message.content,
      created_at: message.created_at || now,
      updated_at: now,
      status: message.status || 'pending',
      retry_count: message.retry_count || 0,
      // E2EE fields
      ciphertext: message.ciphertext || null,
      nonce: message.nonce || null,
      tag: message.tag || null,
      key_version: message.key_version || null,
      algorithm: message.algorithm || null,
    };

    await sqliteService.insert('messages', data);
    return data;
  }

  /**
   * Bulk insert messages (for initial sync)
   */
  async bulkInsertMessages(messages) {
    if (!messages || messages.length === 0) return;

    const records = messages.map(msg => ({
      id: msg.id,
      temp_id: msg.temp_id || msg.id, // Use server ID as temp_id if not provided
      conversation_id: msg.conversation_id,
      sender_id: msg.sender_id,
      receiver_id: msg.receiver_id,
      content: msg.content,
      created_at: msg.created_at || Date.now(),
      updated_at: Date.now(),
      status: msg.status || 'sent',
      retry_count: 0,
      ciphertext: msg.ciphertext || null,
      nonce: msg.nonce || null,
      tag: msg.tag || null,
      key_version: msg.key_version || null,
      algorithm: msg.algorithm || null,
      is_deleted: 0,
    }));

    await sqliteService.bulkInsert('messages', records);
  }

  /**
   * Get messages for a conversation
   */
  async getMessagesByConversation(conversationId, limit = 50, beforeTimestamp = null) {
    let sql = `
      SELECT * FROM messages
      WHERE conversation_id = ?
      AND is_deleted = 0
    `;

    const params = [conversationId];

    if (beforeTimestamp) {
      sql += ' AND created_at < ?';
      params.push(beforeTimestamp);
    }

    sql += ' ORDER BY created_at DESC LIMIT ?';
    params.push(limit);

    const messages = await sqliteService.query(sql, params);

    // Reverse to get chronological order (oldest first)
    return messages.reverse();
  }

  /**
   * Get message by temp_id
   */
  async getMessageByTempId(tempId) {
    const messages = await sqliteService.select(
      'messages',
      'temp_id = ?',
      [tempId]
    );

    return messages[0] || null;
  }

  /**
   * Get message by server ID
   */
  async getMessageById(id) {
    const messages = await sqliteService.select(
      'messages',
      'id = ?',
      [id]
    );

    return messages[0] || null;
  }

  /**
   * Update message status
   */
  async updateMessageStatus(tempId, status, serverId = null, error = null) {
    const updates = {
      status,
      updated_at: Date.now(),
    };

    if (serverId) {
      updates.id = serverId;
    }

    if (error) {
      updates.error = error;
    }

    return await sqliteService.update(
      'messages',
      updates,
      'temp_id = ?',
      [tempId]
    );
  }

  /**
   * Update message with server ID (after acknowledgment)
   */
  async updateMessageWithServerId(tempId, serverId) {
    return await sqliteService.update(
      'messages',
      {
        id: serverId,
        status: 'sent',
        updated_at: Date.now(),
      },
      'temp_id = ?',
      [tempId]
    );
  }

  /**
   * Increment retry count
   */
  async incrementRetryCount(tempId) {
    const message = await this.getMessageByTempId(tempId);

    if (!message) return 0;

    const newRetryCount = (message.retry_count || 0) + 1;

    await sqliteService.update(
      'messages',
      {
        retry_count: newRetryCount,
        last_retry_at: Date.now(),
      },
      'temp_id = ?',
      [tempId]
    );

    return newRetryCount;
  }

  /**
   * Get pending messages (to be sent)
   */
  async getPendingMessages(limit = 20) {
    return await sqliteService.select(
      'messages',
      "status IN ('pending', 'failed')",
      [],
      'created_at ASC',
      limit
    );
  }

  /**
   * Get failed messages
   */
  async getFailedMessages(conversationId = null) {
    if (conversationId) {
      return await sqliteService.select(
        'messages',
        'status = ? AND conversation_id = ?',
        ['failed', conversationId],
        'created_at DESC'
      );
    }

    return await sqliteService.select(
      'messages',
      'status = ?',
      ['failed'],
      'created_at DESC'
    );
  }

  /**
   * Mark message as read
   */
  async markAsRead(messageId) {
    return await sqliteService.update(
      'messages',
      { status: 'read', updated_at: Date.now() },
      'id = ?',
      [messageId]
    );
  }

  /**
   * Soft delete message
   */
  async softDeleteMessage(messageId) {
    return await sqliteService.update(
      'messages',
      {
        is_deleted: 1,
        deleted_at: Date.now(),
        updated_at: Date.now(),
      },
      'id = ?',
      [messageId]
    );
  }

  /**
   * Hard delete message
   */
  async deleteMessage(messageId) {
    return await sqliteService.delete('messages', 'id = ?', [messageId]);
  }

  /**
   * Delete all messages for a conversation
   */
  async deleteMessagesByConversation(conversationId) {
    return await sqliteService.delete(
      'messages',
      'conversation_id = ?',
      [conversationId]
    );
  }

  /**
   * Get unread message count for a conversation
   */
  async getUnreadCount(conversationId, currentUserId) {
    const sql = `
      SELECT COUNT(*) as count
      FROM messages
      WHERE conversation_id = ?
      AND sender_id != ?
      AND status != 'read'
      AND is_deleted = 0
    `;

    const result = await sqliteService.query(sql, [conversationId, currentUserId]);
    return result[0]?.count || 0;
  }

  /**
   * Get last message for a conversation
   */
  async getLastMessage(conversationId) {
    const messages = await sqliteService.select(
      'messages',
      'conversation_id = ? AND is_deleted = 0',
      [conversationId],
      'created_at DESC',
      1
    );

    return messages[0] || null;
  }

  /**
   * Search messages by content
   */
  async searchMessages(query, conversationId = null, limit = 50) {
    let sql = `
      SELECT * FROM messages
      WHERE content LIKE ?
      AND is_deleted = 0
    `;

    const params = [`%${query}%`];

    if (conversationId) {
      sql += ' AND conversation_id = ?';
      params.push(conversationId);
    }

    sql += ' ORDER BY created_at DESC LIMIT ?';
    params.push(limit);

    return await sqliteService.query(sql, params);
  }

  /**
   * Get messages modified since timestamp (for sync)
   */
  async getMessagesSince(timestamp, limit = 100) {
    return await sqliteService.select(
      'messages',
      'updated_at > ?',
      [timestamp],
      'updated_at ASC',
      limit
    );
  }

  /**
   * Get total message count
   */
  async getTotalCount() {
    return await sqliteService.count('messages', 'is_deleted = 0');
  }

  /**
   * Delete old messages (retention policy)
   */
  async deleteOldMessages(daysToKeep = 30) {
    const cutoffDate = Date.now() - (daysToKeep * 24 * 60 * 60 * 1000);

    return await sqliteService.delete(
      'messages',
      'created_at < ? AND is_deleted = 0',
      [cutoffDate]
    );
  }
}

export default new MessageRepository();
