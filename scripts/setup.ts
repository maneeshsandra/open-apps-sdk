#!/usr/bin/env bun

/**
 * Setup script for Open Apps SDK
 * Run with: bun run setup
 */

import { existsSync } from 'fs';
import { resolve } from 'path';

console.log('🚀 Open Apps SDK - Setup');
console.log('========================\n');

// Check if mcp.config.json exists
const mcpConfigPath = resolve(process.cwd(), 'mcp.config.json');
const mcpConfigExists = existsSync(mcpConfigPath);

if (!mcpConfigExists) {
  console.log('📋 Creating mcp.config.json...');
  const examplePath = resolve(process.cwd(), 'mcp.config.example.json');
  const exampleContent = await Bun.file(examplePath).text();
  await Bun.write(mcpConfigPath, exampleContent);
  console.log('✅ Created mcp.config.json');
  console.log('   Edit this file to configure your MCP servers\n');
} else {
  console.log('✅ mcp.config.json already exists\n');
}

// Check if .env exists
const envPath = resolve(process.cwd(), '.env');
const envExists = existsSync(envPath);

if (!envExists) {
  console.log('📋 Creating .env...');
  const envExamplePath = resolve(process.cwd(), '.env.example');
  const envExampleContent = await Bun.file(envExamplePath).text();
  await Bun.write(envPath, envExampleContent);
  console.log('✅ Created .env');
  console.log('   Edit this file to configure your LLM provider\n');
} else {
  console.log('✅ .env already exists\n');
}

console.log('🎉 Setup complete!\n');
console.log('Next steps:');
console.log('1. Edit mcp.config.json to add your MCP servers');
console.log('2. Edit .env to configure your LLM provider');
console.log('3. Run: bun run dev');
console.log('\n📖 Documentation:');
console.log('   - MCP Configuration: docs/mcp-configuration.md');
console.log('   - API Reference: docs/API.md');
console.log('   - Frontend Guide: docs/frontend.md');
