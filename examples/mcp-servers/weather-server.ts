#!/usr/bin/env bun

/**
 * Example MCP Server: Weather Service
 * Provides weather information and renders a custom weather widget
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { ListToolsRequestSchema, CallToolRequestSchema, ListResourcesRequestSchema } from '@modelcontextprotocol/sdk/types.js';

// Create MCP server
const server = new Server(
  {
    name: 'weather-server',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},
      resources: {},
    },
  }
);

// Mock weather data (in production, this would call a real API)
const weatherDatabase: Record<string, any> = {
  'san francisco': { temperature: 68, condition: 'Foggy', humidity: 75, windSpeed: 12 },
  'new york': { temperature: 72, condition: 'Sunny', humidity: 60, windSpeed: 8 },
  'london': { temperature: 58, condition: 'Rainy', humidity: 85, windSpeed: 15 },
  'tokyo': { temperature: 75, condition: 'Cloudy', humidity: 70, windSpeed: 10 },
  'paris': { temperature: 65, condition: 'Partly Cloudy', humidity: 65, windSpeed: 7 },
  'sydney': { temperature: 80, condition: 'Sunny', humidity: 55, windSpeed: 14 },
};

// List available tools
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: 'get_weather',
        description: 'Get current weather information for a city. Returns temperature, condition, humidity, and wind speed.',
        inputSchema: {
          type: 'object',
          properties: {
            location: {
              type: 'string',
              description: 'City name (e.g., "San Francisco", "New York", "London")',
            },
          },
          required: ['location'],
        },
        _meta: {
          componentId: 'weather-widget',
          componentAccessible: true,
          toolInvoking: 'Fetching weather data...',
          toolInvoked: 'Weather data retrieved',
        },
      },
      {
        name: 'get_forecast',
        description: 'Get 5-day weather forecast for a city',
        inputSchema: {
          type: 'object',
          properties: {
            location: {
              type: 'string',
              description: 'City name',
            },
          },
          required: ['location'],
        },
      },
    ],
  };
});

// Handle tool calls
server.setRequestHandler(CallToolRequestSchema, async (request: any) => {
  const { name, arguments: args } = request.params;

  if (name === 'get_weather') {
    const location = (args as any).location.toLowerCase();
    const weather = weatherDatabase[location];

    if (!weather) {
      return {
        content: [
          {
            type: 'text',
            text: `Weather data not available for ${location}. Try: San Francisco, New York, London, Tokyo, Paris, or Sydney.`,
          },
        ],
        isError: true,
      };
    }

    return {
      content: [
        {
          type: 'text',
          text: `Weather in ${location}: ${weather.condition}, ${weather.temperature}°F`,
        },
      ],
      structuredContent: {
        location: location.charAt(0).toUpperCase() + location.slice(1),
        temperature: weather.temperature,
        condition: weather.condition,
        humidity: weather.humidity,
        windSpeed: weather.windSpeed,
        unit: 'fahrenheit',
        timestamp: new Date().toISOString(),
      },
    };
  }

  if (name === 'get_forecast') {
    const location = (args as any).location.toLowerCase();
    const baseWeather = weatherDatabase[location];

    if (!baseWeather) {
      return {
        content: [
          {
            type: 'text',
            text: `Forecast not available for ${location}`,
          },
        ],
        isError: true,
      };
    }

    // Generate mock 5-day forecast
    const forecast = Array.from({ length: 5 }, (_, i) => ({
      day: new Date(Date.now() + i * 24 * 60 * 60 * 1000).toLocaleDateString('en-US', { weekday: 'short' }),
      high: baseWeather.temperature + Math.floor(Math.random() * 10 - 5),
      low: baseWeather.temperature - Math.floor(Math.random() * 15 + 5),
      condition: ['Sunny', 'Cloudy', 'Rainy', 'Partly Cloudy'][Math.floor(Math.random() * 4)],
    }));

    return {
      content: [
        {
          type: 'text',
          text: `5-day forecast for ${location}:\n${forecast.map(d => `${d.day}: ${d.condition}, High: ${d.high}°F, Low: ${d.low}°F`).join('\n')}`,
        },
      ],
      structuredContent: {
        location: location.charAt(0).toUpperCase() + location.slice(1),
        forecast,
      },
    };
  }

  throw new Error(`Unknown tool: ${name}`);
});

// List resources (for UI components)
server.setRequestHandler(ListResourcesRequestSchema, async () => {
  return {
    resources: [
      {
        uri: 'weather://widget',
        name: 'Weather Widget',
        description: 'Interactive weather display component',
        mimeType: 'application/x-react-component',
      },
    ],
  };
});

// Start the server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('Weather MCP Server started');
}

main().catch((error) => {
  console.error('Server error:', error);
  process.exit(1);
});
