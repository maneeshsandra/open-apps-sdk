/**
 * SQLite Database for Conversation and Message Storage
 * Using bun:sqlite for database operations
 */

import { Database } from 'bun:sqlite';
import path from 'path';

// Database file path
const DB_PATH = process.env.NODE_ENV === 'test' ? path.join(process.cwd(),'data','test.db') : path.join(process.cwd(), 'data', 'conversations.db');

// Initialize database
let db: Database | null = null;

export function getDatabase(): Database {
  if (!db) {
    // Ensure data directory exists
    const fs = require('fs');
    const dataDir = path.join(process.cwd(), 'data');
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }

    db = new Database(DB_PATH, { create: true });
    
    // IMPORTANT: Enable foreign keys (disabled by default in SQLite)
    db.run('PRAGMA foreign_keys = ON');
    
    initializeSchema();
  }
  return db;
}

/**
 * Create a database instance with initialized schema
 * Used for testing with in-memory databases
 */
export function createDatabase(dbPath: string = DB_PATH): Database {
  const database = new Database(dbPath, { create: true });
  database.run('PRAGMA foreign_keys = ON');
  initializeSchemaForDb(database);
  return database;
}

function initializeSchema() {
  if (!db) return;
  initializeSchemaForDb(db);
}

function initializeSchemaForDb(database: Database) {

  // Conversations table
  database.run(`
    CREATE TABLE IF NOT EXISTS conversations (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    )
  `);

  // Messages table with component metadata
  database.run(`
    CREATE TABLE IF NOT EXISTS messages (
      id TEXT PRIMARY KEY,
      conversation_id TEXT NOT NULL,
      role TEXT NOT NULL,
      content TEXT NOT NULL,
      timestamp INTEGER NOT NULL,
      
      -- Component metadata for re-rendering
      component_name TEXT,
      component_props TEXT,
      
      -- Tool execution metadata
      tool_name TEXT,
      tool_args TEXT,
      tool_result TEXT,
      
      FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE
    )
  `);

  // Create indexes for better query performance
  database.run(`CREATE INDEX IF NOT EXISTS idx_messages_conversation ON messages(conversation_id)`);
  database.run(`CREATE INDEX IF NOT EXISTS idx_messages_timestamp ON messages(timestamp)`);
  database.run(`CREATE INDEX IF NOT EXISTS idx_conversations_updated ON conversations(updated_at DESC)`);
}

// Types
export interface Conversation {
  id: string;
  title: string;
  created_at: number;
  updated_at: number;
}

export interface StoredMessage {
  id: string;
  conversation_id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
  
  // Component metadata
  component_name?: string;
  component_props?: string; // JSON string
  
  // Tool metadata
  tool_name?: string;
  tool_args?: string; // JSON string
  tool_result?: string; // JSON string
}

// ============= CONVERSATION CRUD =============

export function createConversation(title: string): Conversation {
  const db = getDatabase();
  const id = `conv-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  const now = Date.now();

  db.run(
    `INSERT INTO conversations (id, title, created_at, updated_at) VALUES (?, ?, ?, ?)`,
    [id, title, now, now]
  );

  return { id, title, created_at: now, updated_at: now };
}

export function getConversation(id: string): Conversation | null {
  const db = getDatabase();
  return db.query(`SELECT * FROM conversations WHERE id = ?`).get(id) as Conversation | null;
}

export function getAllConversations(): Conversation[] {
  const db = getDatabase();
  return db.query(`SELECT * FROM conversations ORDER BY updated_at DESC`).all() as Conversation[];
}

export function updateConversation(id: string, title: string): boolean {
  const db = getDatabase();
  const result = db.run(
    `UPDATE conversations SET title = ?, updated_at = ? WHERE id = ?`,
    [title, Date.now(), id]
  );
  return result.changes > 0;
}

export function deleteConversation(id: string): boolean {
  const db = getDatabase();
  const result = db.run(`DELETE FROM conversations WHERE id = ?`, [id]);
  return result.changes > 0;
}

export function updateConversationTimestamp(id: string): void {
  const db = getDatabase();
  db.run(`UPDATE conversations SET updated_at = ? WHERE id = ?`, [Date.now(), id]);
}

// ============= MESSAGE CRUD =============

export interface CreateMessageParams {
  conversation_id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  
  // Optional component metadata
  component_name?: string;
  component_props?: any;
  
  // Optional tool metadata
  tool_name?: string;
  tool_args?: any;
  tool_result?: any;
}

export function createMessage(params: CreateMessageParams): StoredMessage {
  const db = getDatabase();
  const id = `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  const timestamp = Date.now();

  db.run(
    `INSERT INTO messages (
      id, conversation_id, role, content, timestamp,
      component_name, component_props,
      tool_name, tool_args, tool_result
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      id,
      params.conversation_id,
      params.role,
      params.content,
      timestamp,
      params.component_name || null,
      params.component_props ? JSON.stringify(params.component_props) : null,
      params.tool_name || null,
      params.tool_args ? JSON.stringify(params.tool_args) : null,
      params.tool_result ? JSON.stringify(params.tool_result) : null,
    ]
  );

  // Update conversation timestamp
  updateConversationTimestamp(params.conversation_id);

  return {
    id,
    conversation_id: params.conversation_id,
    role: params.role,
    content: params.content,
    timestamp,
    component_name: params.component_name,
    component_props: params.component_props ? JSON.stringify(params.component_props) : undefined,
    tool_name: params.tool_name,
    tool_args: params.tool_args ? JSON.stringify(params.tool_args) : undefined,
    tool_result: params.tool_result ? JSON.stringify(params.tool_result) : undefined,
  };
}

export function getMessage(id: string): StoredMessage | null {
  const db = getDatabase();
  return db.query(`SELECT * FROM messages WHERE id = ?`).get(id) as StoredMessage | null;
}

export function getMessagesByConversation(conversation_id: string): StoredMessage[] {
  const db = getDatabase();
  return db.query(
    `SELECT * FROM messages WHERE conversation_id = ? ORDER BY timestamp ASC`
  ).all(conversation_id) as StoredMessage[];
}

export function updateMessage(id: string, content: string): boolean {
  const db = getDatabase();
  const result = db.run(`UPDATE messages SET content = ? WHERE id = ?`, [content, id]);
  return result.changes > 0;
}

export function deleteMessage(id: string): boolean {
  const db = getDatabase();
  const result = db.run(`DELETE FROM messages WHERE id = ?`, [id]);
  return result.changes > 0;
}

// ============= HELPER FUNCTIONS =============

/**
 * Parse stored message to runtime format with parsed JSON fields
 */
export function parseStoredMessage(stored: StoredMessage): any {
  return {
    id: stored.id,
    conversation_id: stored.conversation_id,
    role: stored.role,
    content: stored.content,
    timestamp: new Date(stored.timestamp),
    component_name: stored.component_name,
    component_props: stored.component_props ? JSON.parse(stored.component_props) : undefined,
    tool_name: stored.tool_name,
    tool_args: stored.tool_args ? JSON.parse(stored.tool_args) : undefined,
    tool_result: stored.tool_result ? JSON.parse(stored.tool_result) : undefined,
  };
}

/**
 * Generate a conversation title from the first user message
 */
export function generateConversationTitle(firstMessage: string): string {
  const maxLength = 50;
  if (firstMessage.length <= maxLength) {
    return firstMessage;
  }
  return firstMessage.substring(0, maxLength - 3) + '...';
}

// Close database connection on process exit
process.on('exit', () => {
  if (db) {
    db.close();
  }
});
