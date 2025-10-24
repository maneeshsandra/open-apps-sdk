/**
 * Component Context - React Context for component communication
 * Replaces window.openai with direct DOM/React integration
 */

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import type { ComponentContext, DisplayMode, Theme, ToolCallResult } from './types';

// WebSocket connection for real-time communication
let ws: WebSocket | null = null;

interface ComponentProviderProps {
  children: ReactNode;
  wsUrl?: string;
  // Allow overriding context values (useful for rendering message components)
  initialToolOutput?: any;
  initialToolInput?: any;
  // Skip WebSocket for static components (rendered from stored messages)
  skipWebSocket?: boolean;
  conversationId?: string | null;
  onFollowup?: (prompt: string) => Promise<void> | void;
  // Whether the component should be readonly (non-interactive)
  readonly?: boolean;
}

const Context = createContext<ComponentContext | null>(null);

// Export Context for use in hooks
export { Context };

export function ComponentProvider({ 
  children, 
  wsUrl = 'ws://localhost:3000/ws',
  initialToolOutput,
  initialToolInput,
  skipWebSocket = false,
  conversationId,
  onFollowup,
  readonly = false,
}: ComponentProviderProps) {
  const [theme, setTheme] = useState<Theme>('light');
  const [locale, setLocale] = useState('en-US');
  const [displayMode, setDisplayMode] = useState<DisplayMode>('inline');
  const [toolInput, setToolInput] = useState<any>(initialToolInput || null);
  const [toolOutput, setToolOutput] = useState<any>(initialToolOutput || null);
  const [componentState, setComponentStateInternal] = useState<any>(null);

  // Initialize WebSocket connection (skip for static message components)
  useEffect(() => {
    if (skipWebSocket) {
      return; // Don't initialize WebSocket for static components
    }
    
    if (!ws || ws.readyState === WebSocket.CLOSED) {
      ws = new WebSocket(wsUrl);

      ws.onopen = () => {
        console.log('✅ WebSocket connected');
      };

      ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          handleWSMessage(message);
        } catch (error) {
          console.error('Failed to parse WebSocket message:', error);
        }
      };

      ws.onerror = (error) => {
        console.error('WebSocket error:', error);
      };

      ws.onclose = () => {
        console.log('WebSocket disconnected');
        // Attempt to reconnect after 3 seconds
        setTimeout(() => {
          if (ws?.readyState === WebSocket.CLOSED) {
            ws = null;
          }
        }, 3000);
      };
    }

    return () => {
      // Don't close WebSocket on unmount, keep it alive for the session
    };
  }, [wsUrl]);

  const handleWSMessage = useCallback((message: any) => {
    switch (message.type) {
      case 'init':
      case 'set_globals':
        if (message.payload.theme) setTheme(message.payload.theme);
        if (message.payload.locale) setLocale(message.payload.locale);
        if (message.payload.displayMode) setDisplayMode(message.payload.displayMode);
        if (message.payload.toolInput) setToolInput(message.payload.toolInput);
        if (message.payload.toolOutput) setToolOutput(message.payload.toolOutput);
        if (message.payload.componentState) setComponentStateInternal(message.payload.componentState);
        break;

      case 'tool_result':
        // Update tool output with the structured content from tool execution
        if (message.payload.result?.structuredContent) {
          setToolOutput(message.payload.result.structuredContent);
        }
        break;

      default:
        console.log('Unknown message type:', message.type);
    }
  }, []);

  const callTool = useCallback(async (name: string, args: Record<string, unknown>, headers?: Record<string, string>): Promise<ToolCallResult> => {
    return new Promise((resolve, reject) => {
      // For static components (skipWebSocket=true), we can't make tool calls
      if (skipWebSocket) {
        console.warn('Tool calls are not available in static component mode');
        reject(new Error('Tool calls are not available in this context. This component is rendered from a stored message.'));
        return;
      }

      if (!ws || ws.readyState !== WebSocket.OPEN) {
        reject(new Error('WebSocket not connected'));
        return;
      }

      const messageId = `tool-${Date.now()}`;
      
      // Include headers in the arguments if provided
      const callArgs = headers ? { ...args, __headers__: headers } : args;
      
      // Listen for response
      const handler = (event: MessageEvent) => {
        try {
          const message = JSON.parse(event.data);
          if (message.id === messageId) {
            ws?.removeEventListener('message', handler);
            
            if (message.type === 'tool_result') {
              resolve(message.payload.result);
            } else if (message.type === 'error') {
              reject(new Error(message.payload.error));
            }
          }
        } catch (error) {
          console.error('Failed to parse tool result:', error);
        }
      };

      ws.addEventListener('message', handler);

      // Send tool call request
      ws.send(JSON.stringify({
        type: 'tool_call',
        id: messageId,
        payload: { name, args: callArgs },
      }));

      // Timeout after 30 seconds
      setTimeout(() => {
        ws?.removeEventListener('message', handler);
        reject(new Error('Tool call timeout'));
      }, 30000);
    });
  }, [skipWebSocket]);

  const sendMessage = useCallback(async (prompt: string): Promise<void> => {
    const trimmedPrompt = prompt?.trim();
    if (!trimmedPrompt) {
      return;
    }

    if (onFollowup) {
      await onFollowup(trimmedPrompt);
      return;
    }

    if (skipWebSocket) {
      console.warn('sendMessage is not available in static component mode');
      throw new Error('Message sending is not available in this context. This component is rendered from a stored message.');
    }

    if (!ws || ws.readyState !== WebSocket.OPEN) {
      throw new Error('WebSocket not connected');
    }

    ws.send(JSON.stringify({
      type: 'follow_up_message',
      payload: { prompt: trimmedPrompt, conversationId },
    }));
  }, [skipWebSocket, conversationId, onFollowup]);

  const setComponentState = useCallback(async (state: any): Promise<void> => {
    // Allow local state updates even in static mode
    setComponentStateInternal(state);

    // But skip WebSocket sync for static components
    if (skipWebSocket) {
      return;
    }

    if (!ws || ws.readyState !== WebSocket.OPEN) {
      throw new Error('WebSocket not connected');
    }

    ws.send(JSON.stringify({
      type: 'set_component_state',
      payload: { state },
    }));
  }, [skipWebSocket]);

  const requestDisplayMode = useCallback(async (mode: DisplayMode): Promise<{ mode: DisplayMode }> => {
    return new Promise((resolve, reject) => {
      if (skipWebSocket) {
        console.warn('requestDisplayMode is not available in static component mode');
        reject(new Error('Display mode requests are not available in this context.'));
        return;
      }

      if (!ws || ws.readyState !== WebSocket.OPEN) {
        reject(new Error('WebSocket not connected'));
        return;
      }

      const messageId = `display-${Date.now()}`;
      
      const handler = (event: MessageEvent) => {
        try {
          const message = JSON.parse(event.data);
          if (message.id === messageId) {
            ws?.removeEventListener('message', handler);
            resolve({ mode: message.payload.mode });
          }
        } catch (error) {
          console.error('Failed to parse display mode response:', error);
        }
      };

      ws.addEventListener('message', handler);

      ws.send(JSON.stringify({
        type: 'request_display_mode',
        id: messageId,
        payload: { mode },
      }));

      setTimeout(() => {
        ws?.removeEventListener('message', handler);
        reject(new Error('Display mode request timeout'));
      }, 5000);
    });
  }, [skipWebSocket]);

  const contextValue: ComponentContext = {
    theme,
    userAgent: {
      device: { type: 'desktop' }, // Detect from window.navigator
      capabilities: {
        hover: true,
        touch: 'ontouchstart' in window,
      },
    },
    locale,
    displayMode,
    safeArea: {
      insets: { top: 0, bottom: 0, left: 0, right: 0 },
    },
    toolInput,
    toolOutput,
    componentState,
    readonly,
    callTool,
    sendMessage,
    setComponentState,
    requestDisplayMode,
  };

  return <Context.Provider value={contextValue}>
    <div data-readonly={readonly ? 'true' : 'false'}>
      {children}
    </div>
  </Context.Provider>;
}
