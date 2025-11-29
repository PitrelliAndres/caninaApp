/**
 * SQLite Service - Local database wrapper
 * Provides clean API for database operations
 */

import SQLite from 'react-native-sqlite-storage';
import { Platform } from 'react-native';
import schema from './schema.sql';

// Enable promise-based API
SQLite.enablePromise(true);

// Enable debug mode in development
if (__DEV__) {
  SQLite.DEBUG(true);
}

class SQLiteService {
  constructor() {
    this.db = null;
    this.isInitialized = false;
  }

  /**
   * Initialize database and run migrations
   */
  async init() {
    if (this.isInitialized) {
      return this.db;
    }

    try {
      // Open database
      this.db = await SQLite.openDatabase(
        {
          name: 'parkdog.db',
          location: 'default',
          createFromLocation: undefined,
        },
        () => console.log('[SQLite] Database opened successfully'),
        (error) => console.error('[SQLite] Error opening database:', error)
      );

      // Run migrations
      await this.runMigrations();

      this.isInitialized = true;
      console.log('[SQLite] Database initialized');

      return this.db;
    } catch (error) {
      console.error('[SQLite] Initialization failed:', error);
      throw error;
    }
  }

  /**
   * Run database migrations
   */
  async runMigrations() {
    try {
      // Create migrations table if not exists
      await this.db.executeSql(`
        CREATE TABLE IF NOT EXISTS migrations (
          version INTEGER PRIMARY KEY,
          name TEXT NOT NULL,
          applied_at INTEGER NOT NULL
        )
      `);

      // Get current version
      const [result] = await this.db.executeSql(
        'SELECT MAX(version) as version FROM migrations'
      );
      const currentVersion = result.rows.item(0).version || 0;

      console.log(`[SQLite] Current schema version: ${currentVersion}`);

      // Run migrations
      if (currentVersion < 1) {
        await this.migration_v1();
      }

      // Add future migrations here
      // if (currentVersion < 2) await this.migration_v2();

    } catch (error) {
      console.error('[SQLite] Migration failed:', error);
      throw error;
    }
  }

  /**
   * Migration v1: Initial schema
   */
  async migration_v1() {
    console.log('[SQLite] Running migration v1...');

    const statements = [
      // Messages table
      `CREATE TABLE IF NOT EXISTS messages (
        id TEXT PRIMARY KEY,
        temp_id TEXT UNIQUE NOT NULL,
        conversation_id TEXT NOT NULL,
        sender_id TEXT NOT NULL,
        receiver_id TEXT NOT NULL,
        content TEXT NOT NULL,
        created_at INTEGER NOT NULL,
        updated_at INTEGER,
        status TEXT NOT NULL DEFAULT 'pending',
        retry_count INTEGER DEFAULT 0,
        last_retry_at INTEGER,
        error TEXT,
        ciphertext TEXT,
        nonce TEXT,
        tag TEXT,
        key_version TEXT,
        algorithm TEXT,
        is_deleted INTEGER DEFAULT 0,
        deleted_at INTEGER,
        FOREIGN KEY(conversation_id) REFERENCES conversations(id) ON DELETE CASCADE
      )`,

      // Messages indexes
      `CREATE INDEX IF NOT EXISTS idx_messages_conversation_time
        ON messages(conversation_id, created_at DESC)`,
      `CREATE INDEX IF NOT EXISTS idx_messages_status
        ON messages(status)`,
      `CREATE INDEX IF NOT EXISTS idx_messages_temp_id
        ON messages(temp_id)`,
      `CREATE INDEX IF NOT EXISTS idx_messages_sync
        ON messages(updated_at DESC, id)`,

      // Conversations table
      `CREATE TABLE IF NOT EXISTS conversations (
        id TEXT PRIMARY KEY,
        user1_id TEXT NOT NULL,
        user2_id TEXT NOT NULL,
        last_message_id TEXT,
        last_message_at INTEGER,
        last_message_preview TEXT,
        last_read_message_id TEXT,
        last_read_at INTEGER,
        unread_count INTEGER DEFAULT 0,
        synced_at INTEGER,
        last_sync_cursor TEXT,
        other_user_name TEXT,
        other_user_avatar TEXT,
        other_user_online INTEGER DEFAULT 0,
        created_at INTEGER NOT NULL,
        updated_at INTEGER,
        is_deleted INTEGER DEFAULT 0,
        deleted_at INTEGER,
        UNIQUE(user1_id, user2_id)
      )`,

      // Conversations indexes
      `CREATE INDEX IF NOT EXISTS idx_conversations_last_message
        ON conversations(last_message_at DESC)`,
      `CREATE INDEX IF NOT EXISTS idx_conversations_unread
        ON conversations(unread_count DESC, last_message_at DESC)`,
      `CREATE INDEX IF NOT EXISTS idx_conversations_users
        ON conversations(user1_id, user2_id)`,

      // Sync state table
      `CREATE TABLE IF NOT EXISTS sync_state (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL,
        updated_at INTEGER NOT NULL
      )`,

      // Message queue table
      `CREATE TABLE IF NOT EXISTS message_queue (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        temp_id TEXT NOT NULL,
        conversation_id TEXT NOT NULL,
        priority TEXT DEFAULT 'normal',
        queued_at INTEGER NOT NULL,
        scheduled_for INTEGER,
        attempts INTEGER DEFAULT 0,
        max_attempts INTEGER DEFAULT 5,
        payload TEXT NOT NULL,
        status TEXT DEFAULT 'pending',
        error TEXT,
        FOREIGN KEY(temp_id) REFERENCES messages(temp_id) ON DELETE CASCADE
      )`,

      // Message queue indexes
      `CREATE INDEX IF NOT EXISTS idx_queue_pending
        ON message_queue(status, priority, scheduled_for)`,
      `CREATE INDEX IF NOT EXISTS idx_queue_temp_id
        ON message_queue(temp_id)`,

      // User cache table
      `CREATE TABLE IF NOT EXISTS user_cache (
        user_id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        avatar_url TEXT,
        bio TEXT,
        online INTEGER DEFAULT 0,
        last_seen_at INTEGER,
        cached_at INTEGER NOT NULL,
        expires_at INTEGER
      )`,

      // User cache index
      `CREATE INDEX IF NOT EXISTS idx_user_cache_expiry
        ON user_cache(expires_at)`,

      // Record migration
      `INSERT INTO migrations (version, name, applied_at)
       VALUES (1, 'initial_schema', ${Date.now()})`,
    ];

    // Execute all statements in a transaction
    // Note: Don't use async/await inside transaction callback
    // The transaction completes when the callback returns, not when promises resolve
    await this.db.transaction((tx) => {
      for (const statement of statements) {
        tx.executeSql(statement);
      }
    });

    console.log('[SQLite] Migration v1 completed');
  }

  /**
   * Execute a raw SQL query
   */
  async query(sql, params = []) {
    if (!this.db) {
      throw new Error('[SQLite] Database not initialized');
    }

    try {
      const [result] = await this.db.executeSql(sql, params);
      return this.resultToArray(result);
    } catch (error) {
      console.error('[SQLite] Query failed:', sql, params, error);
      throw error;
    }
  }

  /**
   * Execute multiple queries in a transaction
   */
  async transaction(callback) {
    if (!this.db) {
      throw new Error('[SQLite] Database not initialized');
    }

    return await this.db.transaction(callback);
  }

  /**
   * Convert SQLite result to array
   */
  resultToArray(result) {
    const rows = [];
    for (let i = 0; i < result.rows.length; i++) {
      rows.push(result.rows.item(i));
    }
    return rows;
  }

  /**
   * Insert a record
   */
  async insert(table, data) {
    const keys = Object.keys(data);
    const values = Object.values(data);
    const placeholders = keys.map(() => '?').join(', ');

    const sql = `INSERT INTO ${table} (${keys.join(', ')}) VALUES (${placeholders})`;

    try {
      const [result] = await this.db.executeSql(sql, values);
      return result.insertId;
    } catch (error) {
      console.error('[SQLite] Insert failed:', table, data, error);
      throw error;
    }
  }

  /**
   * Bulk insert records (optimized)
   */
  async bulkInsert(table, records) {
    if (!records || records.length === 0) return;

    // Don't use async/await inside transaction callback
    await this.transaction((tx) => {
      const keys = Object.keys(records[0]);
      const placeholders = keys.map(() => '?').join(', ');
      const sql = `INSERT OR REPLACE INTO ${table} (${keys.join(', ')}) VALUES (${placeholders})`;

      for (const record of records) {
        const values = keys.map(key => record[key]);
        tx.executeSql(sql, values);
      }
    });
  }

  /**
   * Update a record
   */
  async update(table, data, where, whereParams = []) {
    const keys = Object.keys(data);
    const values = Object.values(data);
    const setClause = keys.map(key => `${key} = ?`).join(', ');

    const sql = `UPDATE ${table} SET ${setClause} WHERE ${where}`;

    try {
      const [result] = await this.db.executeSql(sql, [...values, ...whereParams]);
      return result.rowsAffected;
    } catch (error) {
      console.error('[SQLite] Update failed:', table, data, error);
      throw error;
    }
  }

  /**
   * Delete records
   */
  async delete(table, where, whereParams = []) {
    const sql = `DELETE FROM ${table} WHERE ${where}`;

    try {
      const [result] = await this.db.executeSql(sql, whereParams);
      return result.rowsAffected;
    } catch (error) {
      console.error('[SQLite] Delete failed:', table, error);
      throw error;
    }
  }

  /**
   * Select records
   */
  async select(table, where = null, whereParams = [], orderBy = null, limit = null) {
    let sql = `SELECT * FROM ${table}`;

    if (where) {
      sql += ` WHERE ${where}`;
    }

    if (orderBy) {
      sql += ` ORDER BY ${orderBy}`;
    }

    if (limit) {
      sql += ` LIMIT ${limit}`;
    }

    return await this.query(sql, whereParams);
  }

  /**
   * Count records
   */
  async count(table, where = null, whereParams = []) {
    let sql = `SELECT COUNT(*) as count FROM ${table}`;

    if (where) {
      sql += ` WHERE ${where}`;
    }

    const result = await this.query(sql, whereParams);
    return result[0]?.count || 0;
  }

  /**
   * Get sync state value
   */
  async getSyncState(key) {
    const result = await this.query(
      'SELECT value, updated_at FROM sync_state WHERE key = ?',
      [key]
    );

    if (result.length === 0) return null;

    try {
      return JSON.parse(result[0].value);
    } catch {
      return result[0].value;
    }
  }

  /**
   * Set sync state value
   */
  async setSyncState(key, value) {
    const serializedValue = typeof value === 'object' ? JSON.stringify(value) : String(value);

    await this.query(
      `INSERT OR REPLACE INTO sync_state (key, value, updated_at) VALUES (?, ?, ?)`,
      [key, serializedValue, Date.now()]
    );
  }

  /**
   * Clear all data (logout)
   */
  async clearAllData() {
    // Don't use async/await inside transaction callback
    await this.transaction((tx) => {
      tx.executeSql('DELETE FROM messages');
      tx.executeSql('DELETE FROM conversations');
      tx.executeSql('DELETE FROM message_queue');
      tx.executeSql('DELETE FROM user_cache');
      tx.executeSql('DELETE FROM sync_state');
    });

    console.log('[SQLite] All data cleared');
  }

  /**
   * Close database connection
   */
  async close() {
    if (this.db) {
      await this.db.close();
      this.db = null;
      this.isInitialized = false;
      console.log('[SQLite] Database closed');
    }
  }

  /**
   * Get database statistics
   */
  async getStats() {
    const stats = {
      messages: await this.count('messages'),
      conversations: await this.count('conversations'),
      pendingMessages: await this.count('message_queue', 'status = ?', ['pending']),
      unreadConversations: await this.count('conversations', 'unread_count > 0'),
    };

    return stats;
  }

  /**
   * Vacuum database (optimize storage)
   */
  async vacuum() {
    await this.query('VACUUM');
    console.log('[SQLite] Database vacuumed');
  }

  /**
   * Delete old messages (data retention)
   */
  async deleteOldMessages(daysToKeep = 30) {
    const cutoffDate = Date.now() - (daysToKeep * 24 * 60 * 60 * 1000);

    const deleted = await this.delete(
      'messages',
      'created_at < ? AND is_deleted = 0',
      [cutoffDate]
    );

    console.log(`[SQLite] Deleted ${deleted} old messages`);
    return deleted;
  }
}

// Export singleton instance
const sqliteService = new SQLiteService();
export default sqliteService;
