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

// Check if example folder exists
const exampleDirPath = resolve(process.cwd(), 'examples');
const exampleDirExists = existsSync(exampleDirPath);

if (!exampleDirExists) {
  console.log('📋 Creating example folder...');
  const examplesPath = resolve(process.cwd(), 'examples');
  const proc = Bun.spawn(['cp', '-r', examplesPath, exampleDirPath]);
  await proc.exited;
  console.log('✅ Created example folder');
  console.log('   This contains example components you can modify\n');
} else {
  console.log('✅ example folder already exists\n');
}

// Check if components.config.js exists
const componentsConfigPath = resolve(process.cwd(), 'components.config.js');
const componentsConfigExists = existsSync(componentsConfigPath);

if (!componentsConfigExists) {
  console.log('📋 Creating components.config.js...');
  const examplePath = resolve(process.cwd(), 'components.config.example.js');
  const exampleContent = await Bun.file(examplePath).text();
  // Replace the import paths to point to the example folder
  const updatedContent = exampleContent.replace(/'\.\/examples\//g, "'./example/");
  await Bun.write(componentsConfigPath, updatedContent);
  console.log('✅ Created components.config.js');
  console.log('   Edit this file to configure your components\n');
} else {
  console.log('✅ components.config.js already exists\n');
}

console.log('🎉 Setup complete!\n');
console.log('Next steps:');
console.log('1. Edit mcp.config.json to add your MCP servers');
console.log('2. Edit .env to configure your LLM provider');
console.log('3. Edit components.config.js to configure your components');
console.log('4. Run: bun run dev');
console.log('\n📖 Documentation:');
console.log('   - MCP Configuration: docs/mcp-configuration.md');
console.log('   - Component Configuration: docs/component-configuration.md');
console.log('   - API Reference: docs/API.md');
console.log('   - Frontend Guide: docs/frontend.md');
