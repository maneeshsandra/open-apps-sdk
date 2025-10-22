import { wsClients, broadcastToClients, mcpClient } from "./init";

// Handle WebSocket messages
export async function handleWSMessage(ws: any, message: any) {
  const { type, id, payload } = message;

  switch (type) {
    case 'tool_call':
      try {
        const result = await mcpClient.callTool(payload.name, payload.args);
        ws.send(JSON.stringify({
          type: 'tool_result',
          id,
          payload: { result },
        }));
      } catch (error: any) {
        ws.send(JSON.stringify({
          type: 'error',
          id,
          payload: { error: error.message },
        }));
      }
      break;

    case 'follow_up_message':
      broadcastToClients({
        type: 'chat_message',
        payload: { message: payload.prompt },
      });
      break;

    case 'set_component_state':
      // Broadcast state change to all clients
      broadcastToClients({
        type: 'set_globals',
        payload: { componentState: payload.state },
      });
      break;

    case 'request_display_mode':
      ws.send(JSON.stringify({
        type: 'display_mode_response',
        id,
        payload: { mode: payload.mode },
      }));

      broadcastToClients({
        type: 'set_globals',
        payload: { displayMode: payload.mode },
      });
      break;

    default:
      console.log('Unknown WebSocket message type:', type);
  }
}

export const websocket = {
  open(ws: any) {
    console.log('WebSocket client connected');
    wsClients.add(ws);

    // Send initial state
    ws.send(JSON.stringify({
      type: 'init',
      payload: {
        theme: 'light',
        locale: 'en-US',
        displayMode: 'inline',
      },
    }));
  },

  message(ws: any, message: any) {
    try {
      const data = JSON.parse(message as string);
      handleWSMessage(ws, data);
    } catch (error) {
      console.error('Failed to parse WebSocket message:', error);
    }
  },

  close(ws: any) {
    console.log('WebSocket client disconnected');
    wsClients.delete(ws);
  },
};