/**
 * Core types for the Open Apps SDK
 */

import type React from 'react';

// ============================================================================
// MCP Types
// ============================================================================

export interface MCPServerConfig {
  name: string;
  command: string;
  args?: string[];
  env?: Record<string, string>;
  transport: 'stdio' | 'sse' | 'http';
  url?: string; // For HTTP/SSE transports
}

export interface MCPTool {
  name: string;
  description?: string;
  inputSchema: {
    type: 'object';
    properties?: Record<string, any>;
    required?: string[];
  };
  _meta?: {
    // Component rendering metadata
    componentId?: string;
    componentAccessible?: boolean;
    toolInvoking?: string;
    toolInvoked?: string;
  };
}

export interface MCPResource {
  uri: string;
  name?: string;
  description?: string;
  mimeType?: string;
  text?: string;
  blob?: string;
  _meta?: {
    // Component styling metadata
    prefersBorder?: boolean;
    componentDescription?: string;
  };
}

export interface ToolCallResult {
  content: Array<{
    type: 'text' | 'image' | 'resource';
    text?: string;
    data?: string;
    mimeType?: string;
  }>;
  structuredContent?: any;
  _meta?: any;
  isError?: boolean;
}

// ============================================================================
// LLM Types
// ============================================================================

export type LLMProvider = 'openai' | 'anthropic' | 'groq' | 'ollama' | 'lmstudio' | 'custom';

export interface LLMConfig {
  provider: LLMProvider;
  apiKey?: string;
  baseUrl: string;
  model: string;
  maxTokens?: number;
  temperature?: number;
}

export interface Message {
  role: 'system' | 'user' | 'assistant' | 'tool';
  content: string;
  name?: string;
  tool_calls?: ToolCall[];
  tool_call_id?: string;
}

export interface ToolCall {
  id: string;
  type: 'function';
  function: {
    name: string;
    arguments: string;
  };
}

export interface ChatCompletionRequest {
  messages: Message[];
  tools?: MCPTool[];
  temperature?: number;
  max_tokens?: number;
  stream?: boolean;
}

export interface ChatCompletionResponse {
  id: string;
  choices: Array<{
    index: number;
    message: Message;
    finish_reason: 'stop' | 'tool_calls' | 'length';
  }>;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

export interface ChatCompletionChunk {
  id: string;
  choices: Array<{
    index: number;
    delta: Partial<Message>;
    finish_reason: string | null;
  }>;
}

// ============================================================================
// Component Bridge Types (React Context-based, no iframe/window APIs)
// ============================================================================

export type DisplayMode = 'inline' | 'fullscreen' | 'pip';
export type Theme = 'light' | 'dark';
export type DeviceType = 'mobile' | 'tablet' | 'desktop' | 'unknown';

export interface SafeAreaInsets {
  top: number;
  bottom: number;
  left: number;
  right: number;
}

export interface SafeArea {
  insets: SafeAreaInsets;
}

export interface UserAgent {
  device: {
    type: DeviceType;
  };
  capabilities: {
    hover: boolean;
    touch: boolean;
  };
}

// State passed to components via React Context
export interface ComponentContext<
  ToolInput = any,
  ToolOutput = any,
  ComponentState = any
> {
  theme: Theme;
  userAgent: UserAgent;
  locale: string;
  displayMode: DisplayMode;
  safeArea: SafeArea;
  
  // Tool data
  toolInput: ToolInput;
  toolOutput: ToolOutput | null;
  componentState: ComponentState | null;
  
  // Readonly state - when true, components should disable interactive elements
  readonly: boolean;
  
  // Methods accessible via context
  callTool(name: string, args: Record<string, unknown>, headers?: Record<string, string>): Promise<ToolCallResult>;
  sendMessage(prompt: string): Promise<void>;
  setComponentState(state: ComponentState): Promise<void>;
  requestDisplayMode(mode: DisplayMode): Promise<{ mode: DisplayMode }>;
}

// ============================================================================
// WebSocket Message Types
// ============================================================================

export type WSMessageType =
  | 'init'
  | 'set_globals'
  | 'chat_message'
  | 'tool_call'
  | 'tool_result'
  | 'set_widget_state'
  | 'request_display_mode'
  | 'follow_up_message'
  | 'error';

export interface WSMessage<T = any> {
  type: WSMessageType;
  payload: T;
  id?: string;
}

export interface ChatMessagePayload {
  message: string;
  conversationId?: string;
}

export interface ToolCallPayload {
  name: string;
  args: Record<string, unknown>;
  conversationId?: string;
}

export interface SetComponentStatePayload {
  state: any;
  conversationId?: string;
}

// ============================================================================
// Conversation Types
// ============================================================================

export interface Conversation {
  id: string;
  messages: Message[];
  metadata?: {
    title?: string;
    createdAt: string;
    updatedAt: string;
  };
}

export interface ComponentRender {
  id: string;
  toolName: string;
  toolInput: any;
  toolOutput: any;
  componentId?: string; // References registered React component
  displayMode: DisplayMode;
  componentState?: any;
}

// ============================================================================
// Component Registry Types
// ============================================================================

export interface ComponentRegistration {
  id: string;
  name: string;
  component: React.ComponentType<any>; // React component to render directly
  description?: string;
  associatedTools?: string[]; // Tool names that use this component
}
