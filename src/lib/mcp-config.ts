/**
 * MCP Configuration Loader
 * Loads MCP server configurations from mcp.config.json
 */

import type { MCPServerConfig } from './types';
import { resolve } from 'path';
import { existsSync } from 'fs';

interface MCPConfigFile {
  mcpServers: Record<string, {
    command: string;
    args?: string[];
    transport?: 'stdio' | 'sse';
    env?: Record<string, string>;
  }>;
}

/**
 * Load MCP server configurations from mcp.config.json
 * Falls back to empty config if file doesn't exist
 */
export async function loadMCPConfig(): Promise<MCPServerConfig[]> {
  const configPath = resolve(process.cwd(), 'mcp.config.json');
  
  if (!existsSync(configPath)) {
    console.warn('⚠️  No mcp.config.json found. Create one to configure your MCP servers.');
    console.warn('   See mcp.config.example.json for examples.');
    return [];
  }

  try {
    const configFile = await Bun.file(configPath).json() as MCPConfigFile;
    
    const servers: MCPServerConfig[] = [];
    
    for (const [name, config] of Object.entries(configFile.mcpServers)) {
      servers.push({
        name,
        command: config.command,
        args: config.args || [],
        transport: config.transport || 'stdio',
        env: config.env,
      });
    }
    
    console.log(`✅ Loaded ${servers.length} MCP server(s) from mcp.config.json`);
    return servers;
  } catch (error) {
    console.error('❌ Failed to load mcp.config.json:', error);
    throw error;
  }
}

/**
 * Validate MCP configuration
 */
export function validateMCPConfig(config: MCPServerConfig): string[] {
  const errors: string[] = [];
  
  if (!config.name) {
    errors.push('Server name is required');
  }
  
  if (!config.command) {
    errors.push('Command is required');
  }
  
  if (!['stdio', 'sse'].includes(config.transport)) {
    errors.push('Transport must be either "stdio" or "sse"');
  }
  
  return errors;
}
