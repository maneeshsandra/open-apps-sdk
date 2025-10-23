/**
 * LLM Adapter - Unified interface for multiple LLM providers
 */

import type {
  LLMConfig,
  ChatCompletionRequest,
  ChatCompletionResponse,
  ChatCompletionChunk,
  MCPTool,
} from './types';

export interface LLMAdapter {
  chat(request: ChatCompletionRequest): Promise<ChatCompletionResponse>;
  stream(request: ChatCompletionRequest): AsyncIterableIterator<ChatCompletionChunk>;
}

/**
 * Base adapter for OpenAI-compatible APIs
 * Works with: OpenAI, Groq, LM Studio, Ollama (with /v1 endpoint), and others
 */
export class OpenAICompatibleAdapter implements LLMAdapter {
  constructor(private config: LLMConfig) {}

  private sanitizeMessagesForOpenAI(messages: any[]): any[] {
    return messages.map(message => {
      // Only include fields that are valid for OpenAI API messages
      const sanitized: any = {
        role: message.role,
        content: message.content,
      };

      // Only include optional fields that are part of OpenAI spec
      if (message.name && typeof message.name === 'string') {
        sanitized.name = message.name;
      }
      if (message.tool_calls && Array.isArray(message.tool_calls)) {
        sanitized.tool_calls = message.tool_calls;
      }
      if (message.tool_call_id && typeof message.tool_call_id === 'string') {
        sanitized.tool_call_id = message.tool_call_id;
      }

      return sanitized;
    });
  }

  async chat(request: ChatCompletionRequest): Promise<ChatCompletionResponse> {
    const url = `${this.config.baseUrl}/chat/completions`;
    
    const body = {
      model: this.config.model,
      messages: this.sanitizeMessagesForOpenAI(request.messages),
      temperature: request.temperature ?? this.config.temperature ?? 0.7,
      max_tokens: request.max_tokens ?? this.config.maxTokens,
      ...(request.tools && request.tools.length > 0 && {
        tools: this.convertToolsToOpenAIFormat(request.tools),
        tool_choice: 'auto',
      }),
    };

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    // Only add Authorization header if API key is provided
    if (this.config.apiKey) {
      headers['Authorization'] = `Bearer ${this.config.apiKey}`;
    }

    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`LLM API error (${response.status}): ${error}`);
    }

    return await response.json();
  }

  async *stream(request: ChatCompletionRequest): AsyncIterableIterator<ChatCompletionChunk> {
    const url = `${this.config.baseUrl}/chat/completions`;
    
    const body = {
      model: this.config.model,
      messages: this.sanitizeMessagesForOpenAI(request.messages),
      temperature: request.temperature ?? this.config.temperature ?? 0.7,
      max_tokens: request.max_tokens ?? this.config.maxTokens,
      stream: true,
      ...(request.tools && request.tools.length > 0 && {
        tools: this.convertToolsToOpenAIFormat(request.tools),
        tool_choice: 'auto',
      }),
    };

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (this.config.apiKey) {
      headers['Authorization'] = `Bearer ${this.config.apiKey}`;
    }

    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`LLM API error (${response.status}): ${error}`);
    }

    if (!response.body) {
      throw new Error('Response body is null');
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || trimmed === 'data: [DONE]') continue;
        
        if (trimmed.startsWith('data: ')) {
          try {
            const json = JSON.parse(trimmed.slice(6));
            yield json;
          } catch (e) {
            console.error('Failed to parse SSE data:', trimmed);
          }
        }
      }
    }
  }

  private convertToolsToOpenAIFormat(tools: MCPTool[]) {
    return tools.map(tool => ({
      type: 'function',
      function: {
        name: tool.name,
        description: tool.description || '',
        parameters: tool.inputSchema,
      },
    }));
  }
}

/**
 * Anthropic Claude adapter
 */
export class AnthropicAdapter implements LLMAdapter {
  constructor(private config: LLMConfig) {}

  async chat(request: ChatCompletionRequest): Promise<ChatCompletionResponse> {
    const url = `${this.config.baseUrl}/v1/messages`;
    
    // Convert OpenAI format to Anthropic format
    const systemMessages = request.messages.filter(m => m.role === 'system');
    const otherMessages = request.messages.filter(m => m.role !== 'system');
    
    const body = {
      model: this.config.model,
      max_tokens: request.max_tokens ?? this.config.maxTokens ?? 4096,
      temperature: request.temperature ?? this.config.temperature ?? 0.7,
      system: systemMessages.map(m => m.content).join('\n'),
      messages: otherMessages.map(m => ({
        role: m.role === 'assistant' ? 'assistant' : 'user',
        content: m.content,
      })),
      ...(request.tools && request.tools.length > 0 && {
        tools: this.convertToolsToAnthropicFormat(request.tools),
      }),
    };

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': this.config.apiKey || '',
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Anthropic API error: ${response.status} ${error}`);
    }

    const result = await response.json();
    
    // Convert Anthropic format back to OpenAI format
    return this.convertAnthropicResponse(result);
  }

  async *stream(request: ChatCompletionRequest): AsyncIterableIterator<ChatCompletionChunk> {
    // Similar implementation with streaming
    throw new Error('Anthropic streaming not yet implemented');
  }

  private convertToolsToAnthropicFormat(tools: MCPTool[]) {
    return tools.map(tool => ({
      name: tool.name,
      description: tool.description || '',
      input_schema: tool.inputSchema,
    }));
  }

  private convertAnthropicResponse(anthropicResponse: any): ChatCompletionResponse {
    return {
      id: anthropicResponse.id,
      choices: [{
        index: 0,
        message: {
          role: 'assistant',
          content: anthropicResponse.content[0]?.text || '',
        },
        finish_reason: anthropicResponse.stop_reason === 'end_turn' ? 'stop' : 'tool_calls',
      }],
      usage: {
        prompt_tokens: anthropicResponse.usage?.input_tokens || 0,
        completion_tokens: anthropicResponse.usage?.output_tokens || 0,
        total_tokens: (anthropicResponse.usage?.input_tokens || 0) + (anthropicResponse.usage?.output_tokens || 0),
      },
    };
  }
}

/**
 * Create LLM adapter based on configuration
 */
export function createLLMAdapter(config: LLMConfig): LLMAdapter {
  switch (config.provider) {
    case 'anthropic':
      return new AnthropicAdapter(config);
    
    case 'openai':
    case 'groq':
    case 'ollama':
    case 'lmstudio':
    case 'custom':
    default:
      return new OpenAICompatibleAdapter(config);
  }
}
