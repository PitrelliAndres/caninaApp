-- ParkDog Mobile Local Database Schema
-- Version: 1.0.0
-- SQLite 3.x

-- ============================================
-- MESSAGES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS messages (
  -- Identifiers
  id TEXT PRIMARY KEY,                    -- Server ULID (once received)
  temp_id TEXT UNIQUE NOT NULL,           -- Client-generated ULID for idempotency
  conversation_id TEXT NOT NULL,

  -- Message data
  sender_id TEXT NOT NULL,
  receiver_id TEXT NOT NULL,
  content TEXT NOT NULL,                  -- Plaintext (or ciphertext if E2EE)

  -- Timestamps (Unix milliseconds for compatibility)
  created_at INTEGER NOT NULL,
  updated_at INTEGER,

  -- Status tracking
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'sent', 'delivered', 'read', 'failed'
  retry_count INTEGER DEFAULT 0,
  last_retry_at INTEGER,
  error TEXT,                             -- Error message if failed

  -- E2EE fields (future-proof)
  ciphertext TEXT,
  nonce TEXT,
  tag TEXT,
  key_version TEXT,
  algorithm TEXT,

  -- Soft delete
  is_deleted INTEGER DEFAULT 0,
  deleted_at INTEGER,

  FOREIGN KEY(conversation_id) REFERENCES conversations(id) ON DELETE CASCADE
);

-- Indexes for messages
CREATE INDEX IF NOT EXISTS idx_messages_conversation_time
  ON messages(conversation_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_messages_status
  ON messages(status)
  WHERE status IN ('pending', 'failed');

CREATE INDEX IF NOT EXISTS idx_messages_temp_id
  ON messages(temp_id);

CREATE INDEX IF NOT EXISTS idx_messages_server_id
  ON messages(id)
  WHERE id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_messages_sync
  ON messages(updated_at DESC, id)
  WHERE is_deleted = 0;

-- ============================================
-- CONVERSATIONS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS conversations (
  -- Identifiers
  id TEXT PRIMARY KEY,                    -- Server conversation ID
  user1_id TEXT NOT NULL,
  user2_id TEXT NOT NULL,

  -- Last message tracking
  last_message_id TEXT,
  last_message_at INTEGER,
  last_message_preview TEXT,              -- Cached preview

  -- Read tracking (watermark)
  last_read_message_id TEXT,              -- Last message I read
  last_read_at INTEGER,
  unread_count INTEGER DEFAULT 0,

  -- Sync metadata
  synced_at INTEGER,                      -- Last time we synced this conversation
  last_sync_cursor TEXT,                  -- Cursor for pagination

  -- User metadata (cached for performance)
  other_user_name TEXT,
  other_user_avatar TEXT,
  other_user_online INTEGER DEFAULT 0,    -- 0 = offline, 1 = online

  -- Timestamps
  created_at INTEGER NOT NULL,
  updated_at INTEGER,

  -- Soft delete
  is_deleted INTEGER DEFAULT 0,
  deleted_at INTEGER,

  UNIQUE(user1_id, user2_id)
);

-- Indexes for conversations
CREATE INDEX IF NOT EXISTS idx_conversations_last_message
  ON conversations(last_message_at DESC)
  WHERE is_deleted = 0;

CREATE INDEX IF NOT EXISTS idx_conversations_unread
  ON conversations(unread_count DESC, last_message_at DESC)
  WHERE unread_count > 0 AND is_deleted = 0;

CREATE INDEX IF NOT EXISTS idx_conversations_users
  ON conversations(user1_id, user2_id);

-- ============================================
-- SYNC_STATE TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS sync_state (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at INTEGER NOT NULL
);

-- Common sync state keys:
-- 'last_full_sync' - timestamp of last full sync
-- 'last_message_sync' - timestamp of last message delta sync
-- 'last_conversation_sync' - timestamp of last conversation sync
-- 'fcm_token' - current FCM token
-- 'user_id' - current logged-in user ID

-- ============================================
-- MESSAGE_QUEUE TABLE (Outbox pattern)
-- ============================================
CREATE TABLE IF NOT EXISTS message_queue (
  id INTEGER PRIMARY KEY AUTOINCREMENT,

  -- Message reference
  temp_id TEXT NOT NULL,                  -- References messages.temp_id
  conversation_id TEXT NOT NULL,

  -- Queue metadata
  priority TEXT DEFAULT 'normal',         -- 'high', 'normal', 'low'
  queued_at INTEGER NOT NULL,
  scheduled_for INTEGER,                  -- Retry scheduling
  attempts INTEGER DEFAULT 0,
  max_attempts INTEGER DEFAULT 5,

  -- Payload
  payload TEXT NOT NULL,                  -- JSON serialized message data

  -- Status
  status TEXT DEFAULT 'pending',          -- 'pending', 'processing', 'completed', 'failed'
  error TEXT,

  FOREIGN KEY(temp_id) REFERENCES messages(temp_id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_queue_pending
  ON message_queue(status, priority, scheduled_for)
  WHERE status = 'pending';

CREATE INDEX IF NOT EXISTS idx_queue_temp_id
  ON message_queue(temp_id);

-- ============================================
-- USER_CACHE TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS user_cache (
  user_id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  avatar_url TEXT,
  bio TEXT,
  online INTEGER DEFAULT 0,
  last_seen_at INTEGER,
  cached_at INTEGER NOT NULL,
  expires_at INTEGER                      -- TTL for cache invalidation
);

CREATE INDEX IF NOT EXISTS idx_user_cache_expiry
  ON user_cache(expires_at);

-- ============================================
-- MIGRATIONS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS migrations (
  version INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  applied_at INTEGER NOT NULL
);

-- Insert initial migration
INSERT OR IGNORE INTO migrations (version, name, applied_at)
VALUES (1, 'initial_schema', strftime('%s', 'now') * 1000);
