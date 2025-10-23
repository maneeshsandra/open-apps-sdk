/**
 * Tests for mcp-config.ts
 * Tests MCP configuration validation
 */

import { describe, test, expect } from 'bun:test';
import { validateMCPConfig } from '../lib/mcp-config';
import type { MCPServerConfig } from '../lib/types';

describe('MCP Config', () => {
  describe('validateMCPConfig', () => {
    test('validates correct config', () => {
      const config: MCPServerConfig = {
        name: 'test-server',
        command: 'bun',
        args: ['run', 'server.ts'],
        transport: 'stdio'
      };

      const errors = validateMCPConfig(config);
      expect(errors).toHaveLength(0);
    });

    test('validates config with all optional fields', () => {
      const config: MCPServerConfig = {
        name: 'test-server',
        command: 'bun',
        args: ['run', 'server.ts'],
        transport: 'stdio',
        env: { KEY: 'value' },
        url: 'http://localhost:3000'
      };

      const errors = validateMCPConfig(config);
      expect(errors).toHaveLength(0);
    });

    test('detects missing name', () => {
      const config: MCPServerConfig = {
        name: '',
        command: 'bun',
        args: [],
        transport: 'stdio'
      };

      const errors = validateMCPConfig(config);
      expect(errors).toContain('Server name is required');
    });

    test('detects missing command', () => {
      const config: MCPServerConfig = {
        name: 'test-server',
        command: '',
        args: [],
        transport: 'stdio'
      };

      const errors = validateMCPConfig(config);
      expect(errors).toContain('Command is required');
    });

    test('detects invalid transport', () => {
      const config: MCPServerConfig = {
        name: 'test-server',
        command: 'bun',
        args: [],
        transport: 'invalid' as any
      };

      const errors = validateMCPConfig(config);
      expect(errors).toContain('Transport must be either "stdio" or "sse"');
    });

    test('returns multiple errors', () => {
      const config: MCPServerConfig = {
        name: '',
        command: '',
        args: [],
        transport: 'invalid' as any
      };

      const errors = validateMCPConfig(config);
      expect(errors).toHaveLength(3);
      expect(errors).toContain('Server name is required');
      expect(errors).toContain('Command is required');
      expect(errors).toContain('Transport must be either "stdio" or "sse"');
    });

    test('accepts sse transport', () => {
      const config: MCPServerConfig = {
        name: 'test-server',
        command: 'bun',
        args: [],
        transport: 'sse'
      };

      const errors = validateMCPConfig(config);
      expect(errors).toHaveLength(0);
    });

    test('accepts stdio transport', () => {
      const config: MCPServerConfig = {
        name: 'test-server',
        command: 'bun',
        args: [],
        transport: 'stdio'
      };

      const errors = validateMCPConfig(config);
      expect(errors).toHaveLength(0);
    });

    test('handles undefined optional fields', () => {
      const config: MCPServerConfig = {
        name: 'test-server',
        command: 'bun',
        transport: 'stdio'
      };

      const errors = validateMCPConfig(config);
      expect(errors).toHaveLength(0);
    });

    test('validates realistic server configs', () => {
      const weatherServer: MCPServerConfig = {
        name: 'weather-server',
        command: 'bun',
        args: ['run', 'examples/mcp-servers/weather-server.ts'],
        transport: 'stdio'
      };

      const ecommerceServer: MCPServerConfig = {
        name: 'ecommerce-server',
        command: 'node',
        args: ['examples/mcp-servers/ecommerce-server.js'],
        transport: 'stdio',
        env: { NODE_ENV: 'development' }
      };

      expect(validateMCPConfig(weatherServer)).toHaveLength(0);
      expect(validateMCPConfig(ecommerceServer)).toHaveLength(0);
    });
  });
});