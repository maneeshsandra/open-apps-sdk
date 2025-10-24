import "./index.css";
/**
 * Chat Interface - ChatGPT-style UI with SQLite persistence
 */

import { useState, useEffect, useRef } from 'react';
import logo from '../logo.png';
import type { Message, ToolCallResult } from '../lib/types';
import { ComponentProvider } from '../lib/component-context';
import { useTheme } from '../lib/use-open-apps';
import { renderComponent, hasComponent, getComponentForTool } from '../lib/component-registry';

interface ChatMessage extends Message {
  id: string;
  timestamp: Date;
  component_name?: string;
  component_props?: any;
  tool_result?: ToolCallResult;
  tool_name?: string;
}

interface Conversation {
  id: string;
  title: string;
  created_at: number;
  updated_at: number;
}

function resolveComponentId(message: ChatMessage): string | null {
  const meta = message.tool_result?._meta as { componentId?: unknown; component_id?: unknown } | undefined;

  const candidate = message.component_name
    ?? (typeof meta?.componentId === 'string' ? meta.componentId : undefined)
    ?? (typeof meta?.component_id === 'string' ? (meta.component_id as string) : undefined)
    ?? (message.tool_name ? getComponentForTool(message.tool_name) || undefined : undefined);

  if (!candidate) {
    return null;
  }

  return hasComponent(candidate) ? candidate : null;
}

function App() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const theme = useTheme();

  const isDark = theme === 'dark';

  useEffect(() => {
    loadConversations();
  }, []);

  // Load the most recent conversation after conversations are loaded
  useEffect(() => {
    if (conversations.length > 0 && !currentConversationId) {
      // Load the most recent conversation (first in the list since they're sorted by updated_at DESC)
      const mostRecent = conversations[0];
      if (mostRecent) {
        setCurrentConversationId(mostRecent.id);
      }
    }
  }, [conversations]);

  useEffect(() => {
    if (currentConversationId) {
      loadConversation(currentConversationId);
    } else {
      // Clear messages if no conversation is selected
      setMessages([]);
    }
  }, [currentConversationId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.style.height = 'auto';
      inputRef.current.style.height = `${Math.min(inputRef.current.scrollHeight, 200)}px`;
    }
  }, [input]);

  const loadConversations = async () => {
    try {
      const response = await fetch('/api/conversations');
      const data = await response.json();
      setConversations(data.conversations || []);
    } catch (error) {
      console.error('Failed to load conversations:', error);
    }
  };

  const loadConversation = async (id: string) => {
    try {
      const response = await fetch(`/api/conversations/${id}`);
      const data = await response.json();
      
      if (data.messages) {
        // Ensure messages have proper structure
        const formattedMessages = data.messages.map((msg: any) => ({
          ...msg,
          timestamp: new Date(msg.timestamp),
        }));
        setMessages(formattedMessages);
      }
    } catch (error) {
      console.error('Failed to load conversation:', error);
    }
  };

  const createNewConversation = () => {
    setCurrentConversationId(null);
    setMessages([]);
    setInput('');
  };

  const deleteConversation = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (!confirm('Delete this conversation?')) return;

    try {
      await fetch(`/api/conversations/${id}`, { method: 'DELETE' });
      loadConversations();
      
      if (currentConversationId === id) {
        createNewConversation();
      }
    } catch (error) {
      console.error('Failed to delete conversation:', error);
    }
  };

  const sendMessage = async (messageText?: string) => {
    const text = messageText || input.trim();
    if (!text || isLoading) return;

    const userMessage: ChatMessage = {
      id: `msg-${Date.now()}`,
      role: 'user',
      content: text,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [userMessage],
          conversationId: currentConversationId,
        }),
      });

      const data = await response.json();

      if (data.error) {
        console.error('Chat API error:', data.error);
        setMessages(prev => [...prev, {
          id: `msg-${Date.now()}-error`,
          role: 'assistant',
          content: `Error: ${data.error}`,
          timestamp: new Date(),
        }]);
        return;
      }

      if (data.conversationId && !currentConversationId) {
        setCurrentConversationId(data.conversationId);
        loadConversations();
      }

      const assistantMessage: ChatMessage = {
        id: `msg-${Date.now()}-assistant`,
        role: 'assistant',
        content: data.message.content,
        timestamp: new Date(),
      };

      if (data.toolResults && data.toolResults.length > 0) {
        const firstToolResult = data.toolResults[0];
        const toolName = firstToolResult.toolName;
        const resultMeta = firstToolResult.result?._meta as Record<string, unknown> | undefined;
        const metaComponentName = typeof resultMeta?.componentId === 'string'
          ? (resultMeta.componentId as string)
          : typeof resultMeta?.component_id === 'string'
          ? (resultMeta.component_id as string)
          : undefined;

        const resolvedComponentName = metaComponentName
          ?? getComponentForTool(toolName)
          ?? undefined;

        assistantMessage.component_name = resolvedComponentName;
        assistantMessage.component_props = firstToolResult.result?.structuredContent ?? null;
        assistantMessage.tool_name = toolName;
        assistantMessage.tool_result = firstToolResult.result;
      }

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error: any) {
      console.error('Failed to send message:', error);
      setMessages(prev => [...prev, {
        id: `msg-${Date.now()}-error`,
        role: 'assistant',
        content: 'Failed to send message. Please try again.',
        timestamp: new Date(),
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const suggestedPrompts = [
    "Show me the available categories",
    "What are your bestsellers in men's fashion?",
    "What's the weather in San Francisco?",
    "Show me some electronic products",
  ];

  const latestComponentIndex = (() => {
    const indices = messages
      .map((message, index) => (resolveComponentId(message) ? index : -1))
      .filter(index => index !== -1);

    return indices.length > 0 ? indices[indices.length - 1] : -1;
  })();

  return (
    <div className={`chat-container ${isDark ? 'dark' : 'light'}`}>
      <div className={`chat-sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="chat-sidebar-header">
          <button className="btn-new-chat" onClick={createNewConversation}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 5v14M5 12h14"/>
            </svg>
            New chat
          </button>
        </div>
        
        <div className="chat-sidebar-conversations">
          {conversations.map(conv => (
            <div
              key={conv.id}
              className={`conversation-item ${currentConversationId === conv.id ? 'active' : ''}`}
              onClick={() => setCurrentConversationId(conv.id)}
            >
              <div className="conversation-title">{conv.title}</div>
              <button 
                className="btn-delete-conversation"
                onClick={(e) => deleteConversation(conv.id, e)}
                title="Delete conversation"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/>
                </svg>
              </button>
            </div>
          ))}
        </div>
      </div>

      <button 
        className="btn-toggle-sidebar"
        onClick={() => setSidebarOpen(!sidebarOpen)}
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M3 12h18M3 6h18M3 18h18"/>
        </svg>
      </button>

      <div className="chat-main">
        <div className="chat-messages">
          {messages.length === 0 ? (
            <div className="chat-welcome">
                <div className="welcome-hero">
                <img
                  src={logo}
                  alt="Open Apps SDK"
                  className="welcome-image"
                />
                </div>
              <h1 className="welcome-title">How can I help you today?</h1>
              <div className="suggested-prompts">
                {suggestedPrompts.map((prompt, idx) => (
                  <button
                    key={idx}
                    className="prompt-button"
                    onClick={() => sendMessage(prompt)}
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <>
              {messages.map((msg, index) => {
                const isLatestComponent = index === latestComponentIndex;

                return (
                  <MessageBubble 
                    key={msg.id} 
                    message={msg} 
                    isDark={isDark}
                    isLatestComponent={isLatestComponent}
                    conversationId={currentConversationId}
                    onFollowup={sendMessage}
                  />
                );
              })}
              
              {isLoading && (
                <div className="chat-message assistant">
                  <div className="message-avatar">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                    </svg>
                  </div>
                  <div className="message-content">
                    <div className="typing-indicator">
                      <span></span>
                      <span></span>
                      <span></span>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
          
          <div ref={messagesEndRef} />
        </div>

        <div className="chat-input-container">
          <div className="chat-input-wrapper">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyPress}
              placeholder="Message Open Apps SDK..."
              className="chat-input"
              disabled={isLoading}
              rows={1}
            />
            <button
              onClick={() => sendMessage()}
              disabled={isLoading || !input.trim()}
              className="btn-send"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z"/>
              </svg>
            </button>
          </div>
          <div className="chat-disclaimer">
            Our AI can make mistakes. Consider checking important information.
          </div>
        </div>
      </div>
    </div>
  );
}

function MessageBubble({ 
  message, 
  isDark, 
  isLatestComponent,
  conversationId,
  onFollowup,
}: { 
  message: ChatMessage; 
  isDark: boolean; 
  isLatestComponent: boolean;
  conversationId: string | null;
  onFollowup: (messageText?: string) => Promise<void>;
}) {
  const isUser = message.role === 'user';
  const componentId = resolveComponentId(message);
  const componentProps = message.component_props ?? message.tool_result?.structuredContent ?? null;

  return (
    <div className={`chat-message ${isUser ? 'user' : 'assistant'}`}>
      {!isUser && (
        <div className="message-avatar">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
          </svg>
        </div>
      )}
      
      <div className="message-content">
        {componentId ? (
          <div className="message-component">
            <ComponentProvider 
              initialToolOutput={componentProps}
              skipWebSocket={!isLatestComponent}
              conversationId={conversationId}
              readonly={!isLatestComponent}
              onFollowup={async (prompt) => {
                await onFollowup(prompt);
              }}
            >
              {renderComponent(componentId, componentProps)}
            </ComponentProvider>
          </div>
        ) : (
          <div className="message-text">{message.content}</div>
        )}
      </div>
    </div>
  );
}


export default App;
