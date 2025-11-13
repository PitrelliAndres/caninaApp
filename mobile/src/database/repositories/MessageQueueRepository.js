/**
 * Message Queue Repository
 * Implements Outbox Pattern for reliable message delivery
 */

import sqliteService from '../sqliteService';

class MessageQueueRepository {
  /**
   * Enqueue a message for sending
   */
  async enqueue(tempId, conversationId, payload, priority = 'normal') {
    const data = {
      temp_id: tempId,
      conversation_id: conversationId,
      priority,
      queued_at: Date.now(),
      scheduled_for: Date.now(), // Send immediately
      attempts: 0,
      max_attempts: 5,
      payload: JSON.stringify(payload),
      status: 'pending',
      error: null,
    };

    return await sqliteService.insert('message_queue', data);
  }

  /**
   * Get pending messages to send
   */
  async getPendingMessages(limit = 10) {
    const now = Date.now();

    const sql = `
      SELECT * FROM message_queue
      WHERE status = 'pending'
      AND scheduled_for <= ?
      AND attempts < max_attempts
      ORDER BY
        CASE priority
          WHEN 'high' THEN 1
          WHEN 'normal' THEN 2
          WHEN 'low' THEN 3
        END,
        queued_at ASC
      LIMIT ?
    `;

    return await sqliteService.query(sql, [now, limit]);
  }

  /**
   * Mark message as processing
   */
  async markAsProcessing(queueId) {
    return await sqliteService.update(
      'message_queue',
      {
        status: 'processing',
      },
      'id = ?',
      [queueId]
    );
  }

  /**
   * Mark message as completed
   */
  async markAsCompleted(queueId) {
    return await sqliteService.update(
      'message_queue',
      {
        status: 'completed',
      },
      'id = ?',
      [queueId]
    );
  }

  /**
   * Mark message as failed and schedule retry
   */
  async markAsFailed(queueId, error, retryDelay = null) {
    const queue = await this.getById(queueId);

    if (!queue) return 0;

    const newAttempts = (queue.attempts || 0) + 1;

    // Calculate exponential backoff: 2s, 4s, 8s, 16s, 32s
    const defaultRetryDelay = Math.min(2000 * Math.pow(2, newAttempts - 1), 32000);
    const nextRetry = Date.now() + (retryDelay || defaultRetryDelay);

    const updates = {
      attempts: newAttempts,
      error: error,
      scheduled_for: nextRetry,
    };

    // If max attempts reached, mark as failed permanently
    if (newAttempts >= queue.max_attempts) {
      updates.status = 'failed';
    } else {
      updates.status = 'pending'; // Will retry
    }

    return await sqliteService.update(
      'message_queue',
      updates,
      'id = ?',
      [queueId]
    );
  }

  /**
   * Get queue item by ID
   */
  async getById(queueId) {
    const items = await sqliteService.select(
      'message_queue',
      'id = ?',
      [queueId]
    );

    return items[0] || null;
  }

  /**
   * Get queue item by temp_id
   */
  async getByTempId(tempId) {
    const items = await sqliteService.select(
      'message_queue',
      'temp_id = ?',
      [tempId]
    );

    return items[0] || null;
  }

  /**
   * Delete queue item
   */
  async delete(queueId) {
    return await sqliteService.delete(
      'message_queue',
      'id = ?',
      [queueId]
    );
  }

  /**
   * Delete by temp_id
   */
  async deleteByTempId(tempId) {
    return await sqliteService.delete(
      'message_queue',
      'temp_id = ?',
      [tempId]
    );
  }

  /**
   * Get failed messages
   */
  async getFailedMessages(conversationId = null) {
    if (conversationId) {
      return await sqliteService.select(
        'message_queue',
        'status = ? AND conversation_id = ?',
        ['failed', conversationId],
        'queued_at DESC'
      );
    }

    return await sqliteService.select(
      'message_queue',
      'status = ?',
      ['failed'],
      'queued_at DESC'
    );
  }

  /**
   * Retry a failed message
   */
  async retry(queueId) {
    return await sqliteService.update(
      'message_queue',
      {
        status: 'pending',
        scheduled_for: Date.now(),
        error: null,
      },
      'id = ?',
      [queueId]
    );
  }

  /**
   * Retry all failed messages for a conversation
   */
  async retryAllFailed(conversationId = null) {
    const where = conversationId
      ? 'status = ? AND conversation_id = ?'
      : 'status = ?';

    const params = conversationId
      ? ['failed', conversationId]
      : ['failed'];

    return await sqliteService.update(
      'message_queue',
      {
        status: 'pending',
        scheduled_for: Date.now(),
        error: null,
      },
      where,
      params
    );
  }

  /**
   * Clean up completed messages (older than 1 hour)
   */
  async cleanupCompleted() {
    const cutoff = Date.now() - (60 * 60 * 1000); // 1 hour

    return await sqliteService.delete(
      'message_queue',
      'status = ? AND queued_at < ?',
      ['completed', cutoff]
    );
  }

  /**
   * Get queue statistics
   */
  async getStats() {
    const total = await sqliteService.count('message_queue');
    const pending = await sqliteService.count('message_queue', 'status = ?', ['pending']);
    const processing = await sqliteService.count('message_queue', 'status = ?', ['processing']);
    const failed = await sqliteService.count('message_queue', 'status = ?', ['failed']);
    const completed = await sqliteService.count('message_queue', 'status = ?', ['completed']);

    return {
      total,
      pending,
      processing,
      failed,
      completed,
    };
  }

  /**
   * Get queue depth (pending + processing)
   */
  async getQueueDepth() {
    const sql = `
      SELECT COUNT(*) as count
      FROM message_queue
      WHERE status IN ('pending', 'processing')
    `;

    const result = await sqliteService.query(sql);
    return result[0]?.count || 0;
  }

  /**
   * Clear entire queue (use with caution)
   */
  async clearAll() {
    return await sqliteService.delete('message_queue', '1=1');
  }
}

export default new MessageQueueRepository();
