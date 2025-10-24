import { serve } from "bun";
import { PORT, initializeMCPServers } from "./server/init";
import { routes } from "./server/routes";
import { websocket } from "./server/websocket";

const server = serve({
  port: PORT,
  routes,
  websocket,
  development: process.env.NODE_ENV !== "production" && {
    hmr: true,
    console: true,
  },
});

// Start server initialization
initializeMCPServers().catch(console.error);

console.log(`🚀 Open Apps SDK Server running at ${server.url}`);
console.log(`📡 WebSocket endpoint: ws://localhost:${PORT}/ws`);

