/**
 * MCP Client - Manages connections to MCP servers and tool execution
 */

import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import type {
  MCPServerConfig,
  MCPTool,
  MCPResource,
  ToolCallResult,
} from './types';

export class MCPClient {
  private connections = new Map<string, Client>();
  private tools = new Map<string, { serverName: string; tool: MCPTool }>();
  private resources = new Map<string, { serverName: string; resource: MCPResource }>();

  /**
   * Connect to an MCP server
   */
  async connect(config: MCPServerConfig): Promise<void> {
    if (this.connections.has(config.name)) {
      console.warn(`Server ${config.name} is already connected`);
      return;
    }

    try {
      let transport;

      // Currently supporting stdio transport (most common for local servers)
      if (config.transport === 'stdio') {
        transport = new StdioClientTransport({
          command: config.command,
          args: config.args || [],
          env: config.env,
        });
      } else {
        throw new Error(`Transport ${config.transport} not yet implemented`);
      }

      const client = new Client(
        {
          name: 'open-apps-sdk',
          version: '0.1.0',
        },
        {
          capabilities: {
            sampling: {},
          },
        }
      );

      await client.connect(transport);

      // Store connection
      this.connections.set(config.name, client);

      // Fetch and register tools
      await this.registerToolsFromServer(config.name, client);

      // Fetch and register resources
      await this.registerResourcesFromServer(config.name, client);

      console.log(`✅ Connected to MCP server: ${config.name}`);
    } catch (error) {
      console.error(`Failed to connect to MCP server ${config.name}:`, error);
      throw error;
    }
  }

  /**
   * Disconnect from an MCP server
   */
  async disconnect(serverName: string): Promise<void> {
    const client = this.connections.get(serverName);
    if (!client) {
      console.warn(`Server ${serverName} is not connected`);
      return;
    }

    await client.close();
    this.connections.delete(serverName);

    // Remove tools from this server
    for (const [toolName, { serverName: sName }] of this.tools.entries()) {
      if (sName === serverName) {
        this.tools.delete(toolName);
      }
    }

    // Remove resources from this server
    for (const [uri, { serverName: sName }] of this.resources.entries()) {
      if (sName === serverName) {
        this.resources.delete(uri);
      }
    }

    console.log(`✅ Disconnected from MCP server: ${serverName}`);
  }

  /**
   * List all available tools from all connected servers
   */
  async listTools(): Promise<MCPTool[]> {
    return Array.from(this.tools.values()).map(({ tool }) => tool);
  }

  /**
   * Call a tool by name
   */
  async callTool(name: string, args: Record<string, unknown>, headers?: Record<string, string>): Promise<ToolCallResult> {
    const toolInfo = this.tools.get(name);
    if (!toolInfo) {
      throw new Error(`Tool ${name} not found`);
    }

    const client = this.connections.get(toolInfo.serverName);
    if (!client) {
      throw new Error(`Server ${toolInfo.serverName} not connected`);
    }

    try {
      // Include headers in the tool call if provided
      const callArguments = headers ? { ...args, __headers__: headers } : args;
      
      const result = await client.callTool({
        name,
        arguments: callArguments,
      });

      const resultMeta = (result as any)._meta as Record<string, unknown> | undefined;
      const toolMeta = toolInfo.tool._meta as Record<string, unknown> | undefined;
      const mergedMeta = resultMeta || toolMeta
        ? { ...(toolMeta || {}), ...(resultMeta || {}) }
        : undefined;

      return {
        content: result.content as any,
        structuredContent: (result as any).structuredContent,
        _meta: mergedMeta,
        isError: result.isError as boolean | undefined,
      };
    } catch (error) {
      console.error(`Error calling tool ${name}:`, error);
      throw error;
    }
  }

  /**
   * Get a resource by URI
   */
  async getResource(uri: string): Promise<MCPResource | null> {
    const resourceInfo = this.resources.get(uri);
    if (!resourceInfo) {
      return null;
    }

    const client = this.connections.get(resourceInfo.serverName);
    if (!client) {
      throw new Error(`Server ${resourceInfo.serverName} not connected`);
    }

    try {
      const result = await client.readResource({ uri });
      const content = result.contents[0];

      return {
        uri,
        name: resourceInfo.resource.name,
        description: resourceInfo.resource.description,
        mimeType: (content as any)?.mimeType,
        text: (content as any)?.text,
        blob: (content as any)?.blob,
        _meta: (content as any)?._meta,
      };
    } catch (error) {
      console.error(`Error reading resource ${uri}:`, error);
      throw error;
    }
  }

  /**
   * List all connected servers
   */
  getConnectedServers(): string[] {
    return Array.from(this.connections.keys());
  }

  /**
   * Check if a server is connected
   */
  isConnected(serverName: string): boolean {
    return this.connections.has(serverName);
  }

  /**
   * Private: Register tools from a server
   */
  private async registerToolsFromServer(serverName: string, client: Client): Promise<void> {
    try {
      const response = await client.listTools();
      
      for (const tool of response.tools) {
        const mcpTool: MCPTool = {
          name: tool.name,
          description: tool.description,
          inputSchema: tool.inputSchema as any,
          _meta: (tool as any)._meta,
        };

        this.tools.set(tool.name, { serverName, tool: mcpTool });
      }

      console.log(`Registered ${response.tools.length} tools from ${serverName}`);
    } catch (error) {
      console.error(`Failed to register tools from ${serverName}:`, error);
    }
  }

  /**
   * Private: Register resources from a server
   */
  private async registerResourcesFromServer(serverName: string, client: Client): Promise<void> {
    try {
      const response = await client.listResources();
      
      for (const resource of response.resources) {
        const mcpResource: MCPResource = {
          uri: resource.uri,
          name: resource.name,
          description: resource.description,
          mimeType: resource.mimeType,
          _meta: (resource as any)._meta,
        };

        this.resources.set(resource.uri, { serverName, resource: mcpResource });
      }

      console.log(`Registered ${response.resources.length} resources from ${serverName}`);
    } catch (error) {
      console.error(`Failed to register resources from ${serverName}:`, error);
    }
  }
}

// Singleton instance
let mcpClientInstance: MCPClient | null = null;

export function getMCPClient(): MCPClient {
  if (!mcpClientInstance) {
    mcpClientInstance = new MCPClient();
  }
  return mcpClientInstance;
}
