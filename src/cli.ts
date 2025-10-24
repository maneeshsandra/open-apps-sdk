#!/usr/bin/env bun

/**
 * Open Apps SDK CLI
 * Command line interface for managing Open Apps SDK projects
 */

import { existsSync, readdirSync, statSync, mkdirSync, copyFileSync } from 'fs';
import { resolve, dirname, join } from 'path';
import { spawn } from 'child_process';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const sdkRoot = resolve(__dirname, '..');

// Recursive directory copy function
function copyDir(src: string, dest: string) {
  if (!existsSync(src)) return;
  
  if (!existsSync(dest)) {
    mkdirSync(dest, { recursive: true });
  }
  
  const entries = readdirSync(src);
  for (const entry of entries) {
    const srcPath = join(src, entry);
    const destPath = join(dest, entry);
    const stat = statSync(srcPath);
    
    if (stat.isDirectory()) {
      copyDir(srcPath, destPath);
    } else {
      copyFileSync(srcPath, destPath);
    }
  }
}

const args = process.argv.slice(2);
const command = args[0];

if (!command) {
  showHelp();
  process.exit(0);
}

switch (command) {
  case 'init':
    await handleInit();
    break;
  case 'start':
    await handleStart();
    break;
  case 'setup':
    await handleSetup();
    break;
  case 'help':
  case '--help':
  case '-h':
    showHelp();
    break;
  default:
    console.error(`Unknown command: ${command}`);
    showHelp();
    process.exit(1);
}

async function handleInit() {
  console.log('🚀 Open Apps SDK - Project Initialization');
  console.log('=========================================\n');

  const cwd = process.cwd();

  // Check if mcp.config.json exists
  const mcpConfigPath = resolve(cwd, 'mcp.config.json');
  const mcpConfigExists = existsSync(mcpConfigPath);

  if (!mcpConfigExists) {
    console.log('📋 Creating mcp.config.json...');
    const mcpConfigContent = `{
  "_comment": "MCP Server Configuration - Copy this to mcp.config.json and customize for your needs. See docs/mcp-configuration.md for full documentation.",
  "mcpServers": {
    "weather-server": {
      "command": "bun",
      "args": ["examples/mcp-servers/weather-server.ts"]
    },
    "ecommerce-server": {
      "command": "bun",
      "args": ["examples/mcp-servers/ecommerce-server.ts"],
      "transport": "stdio"
    }
  }
}`;
    await Bun.write(mcpConfigPath, mcpConfigContent);
    console.log('✅ Created mcp.config.json');
    console.log('   Edit this file to configure your MCP servers\n');
  } else {
    console.log('✅ mcp.config.json already exists\n');
  }

  // Check if .env exists
  const envPath = resolve(cwd, '.env');
  const envExists = existsSync(envPath);

  if (!envExists) {
    console.log('📋 Creating .env...');
    const envContent = `# Server Configuration
PORT=3000
NODE_ENV=development

# LLM Provider Configuration
# Supported providers: openai, anthropic, groq, ollama, lmstudio
LLM_PROVIDER=openai
LLM_API_KEY=your-api-key-here
LLM_BASE_URL=https://api.openai.com/v1
LLM_MODEL=gpt-4-turbo-preview

# Alternative provider examples:
# For Anthropic:
# LLM_PROVIDER=anthropic
# LLM_API_KEY=sk-ant-...
# LLM_MODEL=claude-3-5-sonnet-20241022

# For Groq:
# LLM_PROVIDER=groq
# LLM_API_KEY=gsk_...
# LLM_BASE_URL=https://api.groq.com/openai/v1
# LLM_MODEL=llama-3.1-70b-versatile

# For Ollama (local):
# LLM_PROVIDER=ollama
# LLM_BASE_URL=http://localhost:11434/v1
# LLM_MODEL=llama3.1

# For LM Studio (local):
# LLM_PROVIDER=lmstudio
# LLM_BASE_URL=http://localhost:1234/v1
# LLM_MODEL=local-model

# MCP Server Configuration
MCP_SERVERS_DIR=./mcp-servers
MCP_AUTO_DISCOVER=true

# CORS Configuration
CORS_ORIGIN=http://localhost:3000

# Database (for state persistence)
DATABASE_PATH=./data/app.db

# Authentication (optional)
JWT_SECRET=your-jwt-secret-here
OAUTH_CLIENT_ID=
OAUTH_CLIENT_SECRET=
`;
    await Bun.write(envPath, envContent);
    console.log('✅ Created .env');
    console.log('   Edit this file to configure your LLM provider\n');
  } else {
    console.log('✅ .env already exists\n');
  }

  // Check if components.config.js exists
  const componentsConfigPath = resolve(cwd, 'components.config.js');
  const componentsConfigExists = existsSync(componentsConfigPath);

  if (!componentsConfigExists) {
    console.log('📋 Creating components.config.js...');
    const componentsConfigContent = `/**
 * Component Configuration
 * Defines which components are available and their associated tools
 * Components are imported directly to enable dynamic registration
 */

import { WeatherWidget } from './examples/components/WeatherWidget';
import { ProductList } from './examples/components/ProductList';
import { ProductDetail } from './examples/components/ProductDetail';
import { CartView } from './examples/components/CartView';
import { UserCarts } from './examples/components/UserCarts';
import { UserProfile } from './examples/components/UserProfile';
import { Login } from './examples/components/Login';

export const components = {
  'weather-widget': {
    component: WeatherWidget,
    tools: ['get_weather', 'get_forecast', 'get_current_weather']
  },
  'product-list': {
    component: ProductList,
    tools: ['get_products']
  },
  'product-detail': {
    component: ProductDetail,
    tools: ['get_product']
  },
  'cart-view': {
    component: CartView,
    tools: ['get_cart', 'add_cart', 'update_cart']
  },
  'user-carts': {
    component: UserCarts,
    tools: ['get_carts', 'get_user_carts']
  },
  'user-profile': {
    component: UserProfile,
    tools: ['get_user']
  },
  'login': {
    component: Login,
    tools: []
  }
};
`;
    await Bun.write(componentsConfigPath, componentsConfigContent);
    console.log('✅ Created components.config.js');
    console.log('   Edit this file to configure your UI components\n');
  } else {
    console.log('✅ components.config.js already exists\n');
  }

  // Copy examples folder
  const examplesSrc = resolve(sdkRoot, 'examples');
  const examplesDest = resolve(cwd, 'examples');
  if (!existsSync(examplesDest)) {
    console.log('📋 Copying examples folder...');
    copyDir(examplesSrc, examplesDest);
    console.log('✅ Copied examples folder');
    console.log('   Modify examples/components/ and examples/mcp-servers/ for your app\n');
  } else {
    console.log('✅ examples folder already exists\n');
  }

  // Create package.json
  const packageJsonPath = resolve(cwd, 'package.json');
  if (!existsSync(packageJsonPath)) {
    console.log('📋 Creating package.json...');
    const packageJsonContent = `{
  "name": "my-open-apps-project",
  "version": "1.0.0",
  "description": "Open Apps SDK Project",
  "type": "module",
  "scripts": {
    "dev": "bun --hot index.ts",
    "start": "NODE_ENV=production bun index.ts",
    "build": "bun build frontend.tsx --outfile=dist/frontend.js --target=browser"
  },
  "dependencies": {
    "open-apps-sdk": "latest",
    "react": "^19",
    "react-dom": "^19"
  },
  "devDependencies": {
    "@types/bun": "latest",
    "@types/react": "^19",
    "@types/react-dom": "^19"
  }
}`;
    await Bun.write(packageJsonPath, packageJsonContent);
    console.log('✅ Created package.json');
    console.log('   Run \`bun install\` to install dependencies\n');
  } else {
    console.log('✅ package.json already exists\n');
  }

  // Create index.ts
  const indexTsPath = resolve(cwd, 'index.ts');
  if (!existsSync(indexTsPath)) {
    console.log('📋 Creating index.ts...');
    const indexTsContent = `import { serve } from "bun";
import { initializeMCPServers, PORT, llmAdapter, mcpClient } from "open-apps-sdk/server";
import index from "./index.html";

const routes = {
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

  // Simple chat endpoint
  "/api/chat": {
    async POST(req: any) {
      const body = await req.json();
      const { messages } = body;

      try {
        const response = await llmAdapter.chat(messages);
        const assistantMessage = response.choices[0].message;

        return Response.json({
          message: assistantMessage
        });
      } catch (error: any) {
        return Response.json(
          { error: error.message },
          { status: 500 }
        );
      }
    },
  },
};

const server = serve({
  port: PORT,
  routes,
  development: process.env.NODE_ENV !== "production" && {
    hmr: true,
    console: true,
  },
});

// Start server initialization
initializeMCPServers().catch(console.error);

console.log(\`🚀 Open Apps SDK Server running at \${server.url}\`);
console.log(\`📡 WebSocket endpoint: ws://localhost:\${PORT}/ws\`);
`;
    await Bun.write(indexTsPath, indexTsContent);
    console.log('✅ Created index.ts');
    console.log('   This is your server entry point\n');
  } else {
    console.log('✅ index.ts already exists\n');
  }

  // Create index.html
  const indexHtmlPath = resolve(cwd, 'index.html');
  if (!existsSync(indexHtmlPath)) {
    console.log('📋 Creating index.html...');
    const indexHtmlContent = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Open Apps SDK - My App</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="./dist/frontend.js"></script>
  </body>
</html>
`;
    await Bun.write(indexHtmlPath, indexHtmlContent);
    console.log('✅ Created index.html');
    console.log('   This serves your React frontend\n');
  } else {
    console.log('✅ index.html already exists\n');
  }

  // Create frontend.tsx
  const frontendTsxPath = resolve(cwd, 'frontend.tsx');
  if (!existsSync(frontendTsxPath)) {
    console.log('📋 Creating frontend.tsx...');
    const frontendTsxContent = `/**
 * This file is the entry point for the React app, it sets up the root
 * element and renders the App component to the DOM.
 *
 * It is included in \`index.html\`.
 */

import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { App, ComponentProvider } from "open-apps-sdk/client";

const elem = document.getElementById("root")!;

const app = (
  <StrictMode>
    <ComponentProvider>
      <App />
    </ComponentProvider>
  </StrictMode>
);

createRoot(elem).render(app);
`;
    await Bun.write(frontendTsxPath, frontendTsxContent);
    console.log('✅ Created frontend.tsx');
    console.log('   This renders your React app\n');
  } else {
    console.log('✅ frontend.tsx already exists\n');
  }

  console.log('🎉 Project initialized successfully!');
  console.log('Run \`bun install\` to install dependencies, then \`open-apps-sdk start\` to start the development server.');
}

async function handleStart() {
  console.log('🚀 Starting Open Apps SDK Server...');

  const cwd = process.cwd();

  // Check if required files exist
  const envPath = resolve(cwd, '.env');
  const mcpConfigPath = resolve(cwd, 'mcp.config.json');
  const componentsConfigPath = resolve(cwd, 'components.config.js');
  const indexTsPath = resolve(cwd, 'index.ts');

  if (!existsSync(envPath)) {
    console.error('❌ .env file not found. Run `open-apps-sdk init` first.');
    process.exit(1);
  }

  if (!existsSync(mcpConfigPath)) {
    console.error('❌ mcp.config.json file not found. Run `open-apps-sdk init` first.');
    process.exit(1);
  }

  if (!existsSync(componentsConfigPath)) {
    console.error('❌ components.config.js file not found. Run `open-apps-sdk init` first.');
    process.exit(1);
  }

  if (!existsSync(indexTsPath)) {
    console.error('❌ index.ts file not found. Run `open-apps-sdk init` first.');
    process.exit(1);
  }

  // Check if dependencies are installed
  const nodeModulesPath = resolve(cwd, 'node_modules');
  if (!existsSync(nodeModulesPath)) {
    console.log('📦 Installing dependencies...');
    const installProcess = spawn('bun', ['install'], {
      cwd,
      stdio: 'inherit'
    });
    await new Promise((resolve, reject) => {
      installProcess.on('close', (code) => {
        if (code === 0) {
          resolve(void 0);
        } else {
          reject(new Error(`bun install failed with code ${code}`));
        }
      });
      installProcess.on('error', reject);
    });
    console.log('✅ Dependencies installed');
  }

  // Build the frontend
  console.log('🔨 Building frontend...');
  const buildProcess = spawn('bun', ['run', 'build'], {
    cwd,
    stdio: 'inherit'
  });
  await new Promise((resolve, reject) => {
    buildProcess.on('close', (code) => {
      if (code === 0) {
        resolve(void 0);
      } else {
        reject(new Error(`build failed with code ${code}`));
      }
    });
    buildProcess.on('error', reject);
  });
  console.log('✅ Frontend built');

  // Start the server using bun on the project's index.ts
  const serverProcess = spawn('bun', ['--hot', 'index.ts'], {
    cwd,
    stdio: 'inherit',
    env: { ...process.env, NODE_ENV: 'development' }
  });

  serverProcess.on('close', (code) => {
    process.exit(code || 0);
  });

  serverProcess.on('error', (error) => {
    console.error('Failed to start server:', error);
    process.exit(1);
  });
}

async function handleSetup() {
  console.log('🚀 Open Apps SDK - Full Stack Setup');
  console.log('====================================\n');

  // Initialize project
  await handleInit();

  // Start the server in background
  console.log('🔄 Starting servers...\n');

  const cwd = process.cwd();

  // Start the server
  const serverProcess = spawn('bun', [resolve(sdkRoot, 'src', 'index.ts')], {
    cwd,
    stdio: ['inherit', 'inherit', 'inherit'],
    env: { ...process.env, NODE_ENV: 'development' },
    detached: false
  });

  // Wait a bit for server to start
  await new Promise(resolve => setTimeout(resolve, 2000));

  // Open browser
  console.log('🌐 Opening browser...');
  const openCmd = process.platform === 'darwin' ? 'open' :
                  process.platform === 'win32' ? 'start' : 'xdg-open';

  try {
    spawn(openCmd, ['http://localhost:3000'], {
      stdio: 'ignore',
      detached: true
    });
  } catch (error) {
    console.log('⚠️  Could not open browser automatically. Please open http://localhost:3000 manually.');
  }

  console.log('\n🎉 Setup complete!');
  console.log('📱 UI is running at: http://localhost:3000');
  console.log('🔧 API/WebSocket at: http://localhost:3000 (same port)');
  console.log('Press Ctrl+C to stop all servers\n');

  // Wait for server process
  serverProcess.on('close', (code) => {
    console.log(`\nServer stopped with code ${code}`);
    process.exit(code || 0);
  });

  serverProcess.on('error', (error) => {
    console.error('Failed to start server:', error);
    process.exit(1);
  });
}

function showHelp() {
  console.log(`
Open Apps SDK CLI

Usage:
  open-apps-sdk <command>

Commands:
  init     Initialize a new Open Apps SDK project
  start    Start the development server
  setup    Initialize project, start servers, and open UI
  help     Show this help message

Examples:
  open-apps-sdk init
  open-apps-sdk start
  open-apps-sdk setup

For more information, visit: https://github.com/maneeshsandra/open-apps-sdk
`);
}