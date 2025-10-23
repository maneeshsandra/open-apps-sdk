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

        // Add system message for tool usage if tools are available
        if (!conversationMessages.some(m => m.role === 'system')) {
          conversationMessages.unshift({
            role: 'system',
            content: `You are the assistant for the Open Apps SDK demo application. Follow these rules strictly:\n\n1) Primary goal: help the user by either answering directly or, when appropriate, invoking one of the available tools. Use tools for factual lookups, data retrieval, creating/modifying resources, or any task that requires access to the backend.\n\n2) Tool call format: when you decide to call a tool, respond with a JSON-only tool call in the assistant message using the field "tool_calls" (an array). Each tool call must follow this shape exactly:\n{\n  "id": "<unique-id>",\n  "type": "function",\n  "function": {\n    "name": "<tool_name>",\n    "arguments": "<stringified-json-arguments>"\n  }\n}\n\nThe "arguments" value must be a JSON string (escape characters as needed). Do NOT include extra explanatory text around the JSON object. The assistant message's top-level "content" may be empty when issuing tool calls.\n\n3) After tool execution: the platform will run the requested tool(s) and return tool results as messages with role "tool". When you receive tool results, continue the conversation by integrating the tool output into a final assistant response. If the tool result includes structured content and an accompanying _meta object with componentId and componentProps, you may reference them and rely on the platform to render the component; do not attempt to duplicate rendering logic in text.\n\n4) Component metadata: if you want the frontend to render a UI component, ensure the tool returns structuredContent and _meta.componentId (string) and _meta.componentProps (object). The assistant should then produce a brief natural-language summary (1–2 sentences) and let the platform render the component from the metadata.\n\n5) Keep responses focused and concise. Do not explain the internal tool-calling mechanics to the user. If more information is needed to call a tool, ask a single clarifying question.\n\n6) Error handling: if a tool fails, ask the user whether to retry or provide an alternative action. Do not expose internal errors or stack traces to the user.\n\n7) Safety & Privacy: do not request or store secrets (passwords, API keys) from users. When asked for private data, instruct the user to provide it via a secure channel.\n\nAlways follow the exact JSON tool-call schema above when invoking tools; otherwise, prefer a concise natural-language reply. Thank you.`,
          });
        }

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