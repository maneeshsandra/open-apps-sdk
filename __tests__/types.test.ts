/**
 * Tests for types.ts
 * Verifies type definitions and exports
 */

import { describe, test, expect } from 'bun:test';
import type {
  MCPServerConfig,
  MCPTool,
  MCPResource,
  ToolCallResult,
  LLMConfig,
  Message,
  ToolCall,
  ComponentContext,
  WSMessage,
  Conversation,
  ComponentConfig,
  ComponentsConfig,
  ComponentRegistration
} from '../lib/types';

describe('Types', () => {
  describe('MCP Types', () => {
    test('MCPServerConfig interface', () => {
      const config: MCPServerConfig = {
        name: 'test-server',
        command: 'bun',
        args: ['run', 'server.ts'],
        transport: 'stdio'
      };

      expect(config.name).toBe('test-server');
      expect(config.command).toBe('bun');
      expect(config.args).toEqual(['run', 'server.ts']);
      expect(config.transport).toBe('stdio');
    });

    test('MCPTool interface', () => {
      const tool: MCPTool = {
        name: 'get_weather',
        description: 'Get weather information',
        inputSchema: {
          type: 'object',
          properties: {
            location: {
              type: 'string'
            }
          },
          required: ['location']
        },
        _meta: {
          componentId: 'weather-widget',
          componentAccessible: true
        }
      };

      expect(tool.name).toBe('get_weather');
      expect(tool._meta?.componentId).toBe('weather-widget');
    });

    test('MCPResource interface', () => {
      const resource: MCPResource = {
        uri: 'file:///data/weather.json',
        name: 'Weather Data',
        description: 'Current weather data',
        mimeType: 'application/json',
        text: '{"temperature": 72}',
        _meta: {
          prefersBorder: true
        }
      };

      expect(resource.uri).toBe('file:///data/weather.json');
      expect(resource._meta?.prefersBorder).toBe(true);
    });

    test('ToolCallResult interface', () => {
      const result: ToolCallResult = {
        content: [
          {
            type: 'text',
            text: 'Weather is sunny'
          }
        ],
        structuredContent: {
          temperature: 72,
          condition: 'sunny'
        },
        _meta: {
          componentId: 'weather-widget'
        }
      };

      expect(result.content[0]?.text).toBe('Weather is sunny');
      expect(result.structuredContent.temperature).toBe(72);
    });
  });

  describe('LLM Types', () => {
    test('LLMConfig interface', () => {
      const config: LLMConfig = {
        provider: 'openai',
        apiKey: 'sk-test123',
        baseUrl: 'https://api.openai.com/v1',
        model: 'gpt-4',
        maxTokens: 4096,
        temperature: 0.7
      };

      expect(config.provider).toBe('openai');
      expect(config.model).toBe('gpt-4');
      expect(config.temperature).toBe(0.7);
    });

    test('Message interface', () => {
      const message: Message = {
        role: 'user',
        content: 'Hello world'
      };

      expect(message.role).toBe('user');
      expect(message.content).toBe('Hello world');
    });

    test('ToolCall interface', () => {
      const toolCall: ToolCall = {
        id: 'call_123',
        type: 'function',
        function: {
          name: 'get_weather',
          arguments: '{"location": "San Francisco"}'
        }
      };

      expect(toolCall.id).toBe('call_123');
      expect(toolCall.function.name).toBe('get_weather');
    });
  });

  describe('Component Context Types', () => {
    test('ComponentContext interface structure', () => {
      // Test that we can create a properly typed context object
      const context: ComponentContext<string, { data: string }, { count: number }> = {
        theme: 'light',
        userAgent: {
          device: { type: 'desktop' },
          capabilities: { hover: true, touch: false }
        },
        locale: 'en-US',
        displayMode: 'inline',
        safeArea: { insets: { top: 0, bottom: 0, left: 0, right: 0 } },
        toolInput: 'test input',
        toolOutput: { data: 'test output' },
        componentState: { count: 0 },
        readonly: false,
        callTool: async () => ({ content: [] }),
        sendMessage: async () => {},
        setComponentState: async () => {},
        requestDisplayMode: async () => ({ mode: 'inline' })
      };

      expect(context.theme).toBe('light');
      expect(context.toolInput).toBe('test input');
      expect(context.toolOutput?.data).toBe('test output');
      expect(context.componentState?.count).toBe(0);
    });
  });

  describe('WebSocket Types', () => {
    test('WSMessage interface', () => {
      const message: WSMessage<{ data: string }> = {
        type: 'chat_message',
        payload: { data: 'hello' },
        id: 'msg_123'
      };

      expect(message.type).toBe('chat_message');
      expect(message.payload.data).toBe('hello');
      expect(message.id).toBe('msg_123');
    });
  });

  describe('Conversation Types', () => {
    test('Conversation interface', () => {
      const conversation: Conversation = {
        id: 'conv_123',
        messages: [
          {
            role: 'user',
            content: 'Hello'
          },
          {
            role: 'assistant',
            content: 'Hi there!'
          }
        ],
        metadata: {
          title: 'Test Conversation',
          createdAt: '2025-01-01T00:00:00Z',
          updatedAt: '2025-01-01T00:01:00Z'
        }
      };

      expect(conversation.id).toBe('conv_123');
      expect(conversation.messages).toHaveLength(2);
      expect(conversation.metadata?.title).toBe('Test Conversation');
    });
  });

  describe('Component Registry Types', () => {
    test('ComponentConfig interface', () => {
      const config: ComponentConfig = {
        module: './components/WeatherWidget',
        export: 'WeatherWidget',
        tool: ['get_weather'],
        description: 'Weather display component'
      };

      expect(config.module).toBe('./components/WeatherWidget');
      expect(config.tool).toEqual(['get_weather']);
    });

    test('ComponentsConfig interface', () => {
      const config: ComponentsConfig = {
        components: {
          'weather-widget': {
            module: './WeatherWidget.tsx',
            export: 'WeatherWidget',
            tool: ['get_weather']
          }
        }
      };

      expect(config.components['weather-widget']?.export).toBe('WeatherWidget');
    });

    test('ComponentRegistration interface', () => {
      const registration: ComponentRegistration = {
        id: 'weather-1',
        name: 'Weather Widget',
        component: () => null, // Mock React component
        description: 'Displays weather information',
        associatedTools: ['get_weather', 'get_forecast']
      };

      expect(registration.id).toBe('weather-1');
      expect(registration.associatedTools).toHaveLength(2);
    });
  });

  describe('Type Guards and Utilities', () => {
    test('can create union types correctly', () => {
      // Test that union types work as expected
      const themes: ('light' | 'dark')[] = ['light', 'dark'];
      const displayModes: ('inline' | 'fullscreen' | 'pip')[] = ['inline', 'fullscreen', 'pip'];
      const providers: ('openai' | 'anthropic' | 'groq' | 'ollama' | 'lmstudio' | 'custom')[] =
        ['openai', 'anthropic', 'groq', 'ollama', 'lmstudio', 'custom'];

      expect(themes).toHaveLength(2);
      expect(displayModes).toHaveLength(3);
      expect(providers).toHaveLength(6);
    });

    test('optional properties work correctly', () => {
      // Test that optional properties can be omitted
      const minimalTool: MCPTool = {
        name: 'test_tool',
        inputSchema: { type: 'object' }
      };

      const fullTool: MCPTool = {
        name: 'test_tool',
        description: 'A test tool',
        inputSchema: { type: 'object' },
        _meta: { componentId: 'test' }
      };

      expect(minimalTool.name).toBe('test_tool');
      expect(fullTool.description).toBe('A test tool');
      expect(fullTool._meta?.componentId).toBe('test');
    });
  });
});