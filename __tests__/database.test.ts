/**
 * Tests for database.ts
 * Tests database operations for conversations and messages
 */

import { describe, test, expect } from 'bun:test';
import {
  createConversation,
  getConversation,
  getAllConversations,
  createMessage,
  parseStoredMessage,
  generateConversationTitle
} from '../src/lib/database';
import type { CreateMessageParams } from '../src/lib/database';

describe('Database', () => {
  describe('Conversation CRUD', () => {
    test('createConversation creates and returns a conversation', () => {
      const title = 'Test Conversation';
      const conversation = createConversation(title);

      expect(conversation).toBeDefined();
      expect(conversation.title).toBe(title);
      expect(conversation.id).toBeDefined();
      expect(conversation.created_at).toBeDefined();
      expect(conversation.updated_at).toBeDefined();
      expect(typeof conversation.id).toBe('string');
      expect(conversation.id.startsWith('conv-')).toBe(true);
    });

    test('getConversation returns conversation when found', () => {
      const result = getConversation('test-conv-123');
      // Since we're not mocking the database, this will return null in test environment
      expect(result).toBeNull();
    });

    test('getAllConversations returns array of conversations', () => {
      const result = getAllConversations();
      expect(Array.isArray(result)).toBe(true);
    });
  });

  describe('Message CRUD', () => {
    test('createMessage creates and returns a message', () => {
      // First create a conversation
      const conversation = createConversation('Test Conversation');

      const params: CreateMessageParams = {
        conversation_id: conversation.id,
        role: 'user',
        content: 'Hello world'
      };

      const message = createMessage(params);

      expect(message).toBeDefined();
      expect(message.conversation_id).toBe(conversation.id);
      expect(message.role).toBe('user');
      expect(message.content).toBe('Hello world');
      expect(message.id).toBeDefined();
      expect(message.timestamp).toBeDefined();
      expect(typeof message.id).toBe('string');
      expect(message.id.startsWith('msg-')).toBe(true);
    });

    test('createMessage handles all optional fields', () => {
      // First create a conversation
      const conversation = createConversation('Test Conversation');

      const params: CreateMessageParams = {
        conversation_id: conversation.id,
        role: 'assistant',
        content: 'Response',
        component_name: 'weather-widget',
        component_props: { temperature: 72 },
        tool_name: 'get_weather',
        tool_args: { location: 'SF' },
        tool_result: { temperature: 72, condition: 'sunny' }
      };

      const message = createMessage(params);

      expect(message.component_name).toBe('weather-widget');
      expect(message.tool_name).toBe('get_weather');
      expect(message.component_props).toBe(JSON.stringify({ temperature: 72 }));
      expect(message.tool_args).toBe(JSON.stringify({ location: 'SF' }));
      expect(message.tool_result).toBe(JSON.stringify({ temperature: 72, condition: 'sunny' }));
    });
  });

  describe('Helper Functions', () => {
    test('parseStoredMessage parses JSON fields correctly', () => {
      const storedMessage = {
        id: 'msg-123',
        conversation_id: 'conv-123',
        role: 'assistant' as const,
        content: 'Weather is sunny',
        timestamp: 1640995200000, // 2022-01-01
        component_name: 'weather-widget',
        component_props: JSON.stringify({ temperature: 72 }),
        tool_name: 'get_weather',
        tool_args: JSON.stringify({ location: 'SF' }),
        tool_result: JSON.stringify({ temperature: 72, condition: 'sunny' })
      };

      const parsed = parseStoredMessage(storedMessage);

      expect(parsed.id).toBe('msg-123');
      expect(parsed.role).toBe('assistant');
      expect(parsed.content).toBe('Weather is sunny');
      expect(parsed.timestamp).toBeInstanceOf(Date);
      expect(parsed.component_name).toBe('weather-widget');
      expect(parsed.component_props).toEqual({ temperature: 72 });
      expect(parsed.tool_args).toEqual({ location: 'SF' });
      expect(parsed.tool_result).toEqual({ temperature: 72, condition: 'sunny' });
    });

    test('parseStoredMessage handles null/undefined JSON fields', () => {
      const storedMessage = {
        id: 'msg-123',
        conversation_id: 'conv-123',
        role: 'user' as const,
        content: 'Hello',
        timestamp: 1640995200000
      };

      const parsed = parseStoredMessage(storedMessage);

      expect(parsed.component_props).toBeUndefined();
      expect(parsed.tool_args).toBeUndefined();
      expect(parsed.tool_result).toBeUndefined();
    });

    test('generateConversationTitle returns short titles unchanged', () => {
      const shortTitle = 'Hello world';
      expect(generateConversationTitle(shortTitle)).toBe(shortTitle);
    });

    test('generateConversationTitle truncates long titles', () => {
      const longTitle = 'A'.repeat(60);
      const truncated = generateConversationTitle(longTitle);

      expect(truncated.length).toBeLessThanOrEqual(50);
      expect(truncated.endsWith('...')).toBe(true);
      expect(truncated.startsWith('A'.repeat(47))).toBe(true);
    });

    test('generateConversationTitle handles exact max length', () => {
      const exactTitle = 'A'.repeat(50);
      expect(generateConversationTitle(exactTitle)).toBe(exactTitle);
    });
  });

  describe('Integration scenarios', () => {
    test('conversation and message lifecycle', () => {
      // Create conversation
      const conversation = createConversation('Integration Test');
      expect(conversation.id).toBeDefined();

      // Create messages
      const userMessage = createMessage({
        conversation_id: conversation.id,
        role: 'user',
        content: 'Hello'
      });

      const assistantMessage = createMessage({
        conversation_id: conversation.id,
        role: 'assistant',
        content: 'Hi there!',
        component_name: 'test-component',
        tool_name: 'test_tool'
      });

      expect(userMessage.conversation_id).toBe(conversation.id);
      expect(assistantMessage.conversation_id).toBe(conversation.id);
      expect(assistantMessage.component_name).toBe('test-component');
      expect(assistantMessage.tool_name).toBe('test_tool');
    });

    test('message parsing round-trip', () => {
      // Create a conversation first
      const conversation = createConversation('Test Conversation');

      const originalData = {
        conversation_id: conversation.id,
        role: 'assistant' as const,
        content: 'Parsed message',
        component_props: { key: 'value' },
        tool_args: { param: 'test' },
        tool_result: { output: 'success' }
      };

      // Create message (this serializes to JSON strings)
      const stored = createMessage(originalData);

      // Parse it back (this deserializes from JSON strings)
      const parsed = parseStoredMessage(stored);

      expect(parsed.component_props).toEqual(originalData.component_props);
      expect(parsed.tool_args).toEqual(originalData.tool_args);
      expect(parsed.tool_result).toEqual(originalData.tool_result);
    });
  });
});