import index from "../index.html";
import { llmAdapter, mcpClient, wsClients, broadcastToClients } from "./init";
import * as db from "../lib/database";

export const routes = {
  "/ws": {
    async GET(req: any, server: any) {
      if (server.upgrade(req)) {
        return undefined;
      }

      return new Response("WebSocket upgrade failed", { status: 500 });
    },
  },

  // Serve index.html for frontend routes
  "/": index,
  "/chat": index,
  "/settings": index,

  // List available tools
  "/api/tools": {
    async POST() {
      const tools = await mcpClient.listTools();
      return Response.json({ tools });
    },
  },

  // Call a specific tool
  "/api/tools/:name": {
    async POST(req: any) {
      const toolName = req.params.name;
      const body = await req.json();

      try {
        const result = await mcpClient.callTool(toolName, body.args || {});
        return Response.json({ result });
      } catch (error: any) {
        return Response.json(
          { error: error.message },
          { status: 500 }
        );
      }
    },
  },

  // Chat endpoint
  "/api/chat": {
    async POST(req: any) {
      const body = await req.json();
      const { messages, conversationId } = body;

      try {
        // Get or create conversation
        let conversation = conversationId ? db.getConversation(conversationId) : null;

        if (!conversation && messages && messages.length > 0) {
          // Create new conversation with title from first message
          const firstUserMessage = messages.find((m: any) => m.role === 'user');
          const title = firstUserMessage
            ? db.generateConversationTitle(firstUserMessage.content)
            : 'New Conversation';
          conversation = db.createConversation(title);
        }

        if (!conversation) {
          throw new Error('No conversation found or created');
        }

        // Load conversation history from database or use provided messages
        let conversationMessages: any[];
        if (conversationId) {
          const storedMessages = db.getMessagesByConversation(conversationId);
          conversationMessages = storedMessages.map(m => db.parseStoredMessage(m));
        } else {
          conversationMessages = [];
        }

        // Add new messages
        const newMessages = messages || [];
        for (const msg of newMessages) {
          conversationMessages.push(msg);
          // Save user message to database
          if (msg.role === 'user') {
            db.createMessage({
              conversation_id: conversation.id,
              role: msg.role,
              content: msg.content,
            });
          }
        }

        // Get available tools
        const tools = await mcpClient.listTools();

        // Call LLM
        let response;
        try {
          response = await llmAdapter.chat({
            messages: conversationMessages,
            tools,
          });

          if (!response || !response.choices || response.choices.length === 0) {
            throw new Error('Invalid response from LLM - no choices returned');
          }
        } catch (error: any) {
          console.error('LLM API error:', error);
          return Response.json(
            {
              error: `LLM error: ${error.message}`,
              details: 'Check that LM Studio is running and the model is loaded'
            },
            { status: 500 }
          );
        }

        // Check if assistant wants to call tools
        const assistantMessage = response.choices[0]?.message;
        if (!assistantMessage) {
          throw new Error('No message in LLM response');
        }

        conversationMessages.push(assistantMessage);

        // Handle tool calls
        if (assistantMessage.tool_calls && assistantMessage.tool_calls.length > 0) {
          const toolResults: any[] = [];

          for (const toolCall of assistantMessage.tool_calls) {
            const toolName = toolCall.function.name;
            const toolArgs = JSON.parse(toolCall.function.arguments);

            // Execute tool
            const toolResult = await mcpClient.callTool(toolName, toolArgs);

            // Store tool result
            toolResults.push({
              toolName,
              toolArgs,
              result: toolResult,
            });

            // Add tool result to messages
            conversationMessages.push({
              role: 'tool',
              content: JSON.stringify(toolResult),
              tool_call_id: toolCall.id,
            });

            // Broadcast tool result to WebSocket clients
            broadcastToClients({
              type: 'tool_result',
              payload: {
                toolName,
                toolArgs,
                result: toolResult,
              },
            });
          }

          // Call LLM again with tool results
          const finalResponse = await llmAdapter.chat({
            messages: conversationMessages,
            tools,
          });

          const finalMessage = finalResponse.choices[0]?.message;
          if (!finalMessage) {
            throw new Error('No final response from LLM');
          }

          conversationMessages.push(finalMessage);

          // Save assistant message with component metadata
          const resultMeta = toolResults[0].result?._meta as Record<string, unknown> | undefined;
          const metaComponentName = typeof resultMeta?.componentId === 'string'
            ? (resultMeta.componentId as string)
            : typeof resultMeta?.component_id === 'string'
            ? (resultMeta.component_id as string)
            : undefined;
          const componentName = metaComponentName;
          db.createMessage({
            conversation_id: conversation.id,
            role: 'assistant',
            content: finalMessage.content || '',
            component_name: componentName || undefined,
            component_props: toolResults[0].result?.structuredContent,
            tool_name: toolResults[0].toolName,
            tool_args: toolResults[0].toolArgs,
            tool_result: toolResults[0].result,
          });

          return Response.json({
            conversationId: conversation.id,
            message: finalMessage,
            toolCalls: assistantMessage.tool_calls,
            toolResults,
          });
        }

        // Save simple assistant message (no tools)
        db.createMessage({
          conversation_id: conversation.id,
          role: 'assistant',
          content: assistantMessage.content || '',
        });

        return Response.json({
          conversationId: conversation.id,
          message: assistantMessage,
        });
      } catch (error: any) {
        console.error('Chat error:', error);
        return Response.json(
          { error: error.message },
          { status: 500 }
        );
      }
    },
  },

  // ========== CONVERSATION MANAGEMENT APIs ==========

  // Get all conversations
  "/api/conversations": {
    async GET() {
      try {
        const conversations = db.getAllConversations();
        return Response.json({ conversations });
      } catch (error: any) {
        return Response.json({ error: error.message }, { status: 500 });
      }
    },
  },

  // Get a specific conversation with messages
  "/api/conversations/:id": {
    async GET(req: any) {
      try {
        const conversation = db.getConversation(req.params.id);
        if (!conversation) {
          return Response.json({ error: 'Conversation not found' }, { status: 404 });
        }

        const messages = db.getMessagesByConversation(req.params.id);
        const parsedMessages = messages.map(m => db.parseStoredMessage(m));

        return Response.json({
          conversation,
          messages: parsedMessages,
        });
      } catch (error: any) {
        return Response.json({ error: error.message }, { status: 500 });
      }
    },

    async PATCH(req: any) {
      try {
        const body = await req.json();
        const success = db.updateConversation(req.params.id, body.title);

        if (!success) {
          return Response.json({ error: 'Conversation not found' }, { status: 404 });
        }

        return Response.json({ success: true });
      } catch (error: any) {
        return Response.json({ error: error.message }, { status: 500 });
      }
    },

    async DELETE(req: any) {
      try {
        const success = db.deleteConversation(req.params.id);

        if (!success) {
          return Response.json({ error: 'Conversation not found' }, { status: 404 });
        }

        return Response.json({ success: true });
      } catch (error: any) {
        return Response.json({ error: error.message }, { status: 500 });
      }
    },
  },

  // Message management
  "/api/messages/:id": {
    async PATCH(req: any) {
      try {
        const body = await req.json();
        const success = db.updateMessage(req.params.id, body.content);

        if (!success) {
          return Response.json({ error: 'Message not found' }, { status: 404 });
        }

        return Response.json({ success: true });
      } catch (error: any) {
        return Response.json({ error: error.message }, { status: 500 });
      }
    },

    async DELETE(req: any) {
      try {
        const success = db.deleteMessage(req.params.id);

        if (!success) {
          return Response.json({ error: 'Message not found' }, { status: 404 });
        }

        return Response.json({ success: true });
      } catch (error: any) {
        return Response.json({ error: error.message }, { status: 500 });
      }
    },
  },

  // Catch-all for other routes
  "/*": index,
};