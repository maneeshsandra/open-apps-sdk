# Open Apps SDK

> Build LLM-agnostic conversational apps with custom UI components and MCP (Model Context Protocol) servers.

## 🌟 Overview

The Open Apps SDK is a framework for building rich, interactive applications that work with **any LLM** (Claude, GPT, Gemini, etc.) while maintaining full control over your UI components and data.

### Key Features

- ✅ **LLM-Agnostic**: Works with Claude, GPT, Gemini, or any other LLM
- ✅ **Custom UI Components**: Build and own your React components
- ✅ **MCP Integration**: Connect to multiple MCP servers
- ✅ **Flexible Loading**: Components via registry, URL, or bundled code
- ✅ **Type-Safe**: Full TypeScript support
- ✅ **Bun-Powered**: Fast builds and hot reloading

## 🚀 Quick Start

### Installation

```bash
# Clone the repository
git clone https://github.com/maneeshsandra/open-apps-sdk.git
cd open-apps-sdk

# Install dependencies
bun install

# Start development server
bun run dev
```

### Create Your First Component

```typescript
// components/MyComponent.tsx
import { useComponentContext } from 'open-apps-sdk';

export function MyComponent() {
  const { toolOutput, callTool } = useComponentContext();
  
  return (
    <div>
      <h2>{toolOutput?.title}</h2>
      <button onClick={() => callTool('my_tool', { arg: 'value' })}>
        Action
      </button>
    </div>
  );
}
```

### Register Component

```typescript
// src/App.tsx
import { registerComponent } from './lib/component-registry';
import { MyComponent } from '../components/MyComponent';

registerComponent('my-component', MyComponent);
```

### Build an MCP Server

```typescript
// examples/mcp-servers/my-server.ts
import { Server } from '@modelcontextprotocol/sdk/server/index.js';

const server = new Server({
  name: 'my-server',
  version: '1.0.0',
}, {
  capabilities: { tools: {} }
});

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  return {
    content: [{ type: 'text', text: 'Result' }],
    structuredContent: { data: {...} },
    _meta: {
      componentId: 'my-component',
      componentAccessible: true
    }
  };
});
```


## 🎯 Examples

### E-commerce Store

A full-featured shopping experience with product browsing, cart management, and checkout.

```bash
# Start the e-commerce MCP server
bun run examples/mcp-servers/ecommerce-server.ts
```

**Features:**
- Product catalog with categories
- Shopping cart CRUD operations
- User authentication
- Order management


## 🧩 Component Hooks

Our custom hooks make building components easy:

```typescript
// All-in-one hook
const {
  toolInput,       // Tool arguments
  toolOutput,      // Tool response data
  theme,           // 'light' | 'dark'
  callTool,        // Call MCP tools
  setComponentState, // Persist state
} = useComponentContext();

// Or use specific hooks
const output = useToolOutput();
const theme = useTheme();
const callTool = useCallTool();
```

## 🤝 Contributing

We welcome contributions! Here's how to get started:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

See [CONTRIBUTING.md](./CONTRIBUTING.md) for detailed guidelines.


## 🐛 Known Issues

See [TROUBLESHOOTING.md](./TROUBLESHOOTING.md) for common issues and solutions.

## 📄 License

MIT License - see [LICENSE](./LICENSE) for details.


---

**Built with ❤️ by the Open Apps SDK team**

[⭐ Star us on GitHub](https://github.com/maneeshsandra/open-apps-sdk) | [📚 Read the docs](./docs/) 