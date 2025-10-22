import { getMCPClient } from "../lib/mcp-client";
import { createLLMAdapter } from "../lib/llm-adapter";
import type { Message, LLMConfig } from "../lib/types";
import { loadMCPConfig } from "../lib/mcp-config";

// Load environment variables
export const PORT = process.env.PORT || 3000;
export const LLM_CONFIG: LLMConfig = {
  provider: (process.env.LLM_PROVIDER as any) || 'lmstudio',
  apiKey: process.env.LLM_API_KEY || undefined, // LM Studio doesn't need API key
  baseUrl: process.env.LLM_BASE_URL || 'http://127.0.0.1:1234/v1',
  model: process.env.LLM_MODEL || 'qwen/qwen3-14b',
  maxTokens: parseInt(process.env.LLM_MAX_TOKENS || '4096'),
  temperature: parseFloat(process.env.LLM_TEMPERATURE || '0.7'),
};

export const llmAdapter = createLLMAdapter(LLM_CONFIG);
export const mcpClient = getMCPClient();

// Store active conversations
export const conversations = new Map<string, Message[]>();

// WebSocket clients
export const wsClients = new Set<any>();

// Broadcast message to all connected WebSocket clients
export function broadcastToClients(message: any) {
  const messageStr = JSON.stringify(message);
  for (const client of wsClients) {
    try {
      client.send(messageStr);
    } catch (error) {
      console.error('Failed to send to client:', error);
    }
  }
}

// Initialize MCP servers from mcp.config.json
export async function initializeMCPServers() {
  console.log('🔧 Loading MCP server configurations...');

  const servers = await loadMCPConfig();

  if (servers.length === 0) {
    console.log('ℹ️  No MCP servers configured. Add servers to mcp.config.json to enable tools.');
    return;
  }

  for (const serverConfig of servers) {
    try {
      console.log(`📡 Connecting to ${serverConfig.name}...`);
      await mcpClient.connect(serverConfig);
      console.log(`✅ Connected to ${serverConfig.name}`);
    } catch (error) {
      console.error(`❌ Failed to connect to ${serverConfig.name}:`, error);
    }
  }

  const tools = await mcpClient.listTools();
  console.log(`🛠️  Total tools available: ${tools.length}`);
    console.log(`🤖 LLM Provider: ${LLM_CONFIG.provider} (${LLM_CONFIG.model})`);
    console.log(`🔧 MCP Servers: ${mcpClient.getConnectedServers().length} connected`);
}