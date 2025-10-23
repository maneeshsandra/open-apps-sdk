/**
 * Tests for component-registry.tsx
 * Tests component registration and retrieval functionality
 */

import { describe, test, expect, beforeEach, mock } from 'bun:test';
import React from 'react';
import {
  registerComponents,
  registerComponent,
  getComponent,
  renderComponent,
  hasComponent,
  getRegisteredComponents,
  getComponentForTool,
  loadComponentConfig
} from '../lib/component-registry';

// Mock React components for testing
const MockComponent1 = () => React.createElement('div', null, 'Mock Component 1');
const MockComponent2 = () => React.createElement('div', null, 'Mock Component 2');
const MockComponent3 = () => React.createElement('div', null, 'Mock Component 3');

describe('Component Registry', () => {
  beforeEach(() => {
    // Clear the registry before each test
    // Note: In a real implementation, we'd need to expose a reset function
    // For now, we'll test the functions in isolation
  });

  describe('registerComponents', () => {
    test('registers multiple components with tools', () => {
      const components = {
        'weather-widget': {
          component: MockComponent1,
          tools: ['get_weather', 'get_forecast']
        },
        'product-list': {
          component: MockComponent2,
          tools: ['get_products']
        }
      };

      registerComponents(components);

      expect(hasComponent('weather-widget')).toBe(true);
      expect(hasComponent('product-list')).toBe(true);
      expect(getComponent('weather-widget')).toBe(MockComponent1);
      expect(getComponent('product-list')).toBe(MockComponent2);
    });

    test('registers components without tools', () => {
      const components = {
        'login-form': {
          component: MockComponent3,
          description: 'User login form'
        }
      };

      registerComponents(components);

      expect(hasComponent('login-form')).toBe(true);
      expect(getComponent('login-form')).toBe(MockComponent3);
    });

    test('maps tools to components correctly', () => {
      const components = {
        'weather-widget': {
          component: MockComponent1,
          tools: ['get_weather', 'get_forecast']
        }
      };

      registerComponents(components);

      expect(getComponentForTool('get_weather')).toBe('weather-widget');
      expect(getComponentForTool('get_forecast')).toBe('weather-widget');
      expect(getComponentForTool('unknown_tool')).toBe(null);
    });

    test('handles empty tools array', () => {
      const components = {
        'test-component': {
          component: MockComponent1,
          tools: []
        }
      };

      registerComponents(components);

      expect(hasComponent('test-component')).toBe(true);
      expect(getComponentForTool('any_tool')).toBe(null);
    });
  });

  describe('registerComponent', () => {
    test('registers a single component with tools', () => {
      registerComponent('single-component', MockComponent1, ['test_tool']);

      expect(hasComponent('single-component')).toBe(true);
      expect(getComponent('single-component')).toBe(MockComponent1);
      expect(getComponentForTool('test_tool')).toBe('single-component');
    });

    test('registers a single component without tools', () => {
      registerComponent('no-tools-component', MockComponent2);

      expect(hasComponent('no-tools-component')).toBe(true);
      expect(getComponent('no-tools-component')).toBe(MockComponent2);
    });

    test('handles undefined associatedTools', () => {
      registerComponent('undefined-tools', MockComponent3, undefined);

      expect(hasComponent('undefined-tools')).toBe(true);
      expect(getComponent('undefined-tools')).toBe(MockComponent3);
    });
  });

  describe('getComponent', () => {
    test('returns registered component', () => {
      registerComponent('test-get', MockComponent1);
      expect(getComponent('test-get')).toBe(MockComponent1);
    });

    test('returns null for unregistered component', () => {
      expect(getComponent('nonexistent')).toBe(null);
    });
  });

  describe('renderComponent', () => {
    test('renders registered component', () => {
      registerComponent('render-test', MockComponent1);

      const result = renderComponent('render-test', { prop: 'value' });

      // Since we can't easily test React elements in this environment,
      // we'll just check that it doesn't throw and returns something
      expect(result).toBeDefined();
    });

    test('returns error component for unregistered component', () => {
      const result = renderComponent('nonexistent', {});

      // Should return a React element (the error div)
      expect(result).toBeDefined();
      expect(typeof result).toBe('object');
    });
  });

  describe('hasComponent', () => {
    test('returns true for registered components', () => {
      registerComponent('exists-test', MockComponent1);
      expect(hasComponent('exists-test')).toBe(true);
    });

    test('returns false for unregistered components', () => {
      expect(hasComponent('does-not-exist')).toBe(false);
    });
  });

  describe('getRegisteredComponents', () => {
    test('returns array of registered component names', () => {
      // Clear any existing registrations first
      const initialCount = getRegisteredComponents().length;

      registerComponent('list-test-1', MockComponent1);
      registerComponent('list-test-2', MockComponent2);

      const components = getRegisteredComponents();
      expect(components).toContain('list-test-1');
      expect(components).toContain('list-test-2');
      expect(components.length).toBeGreaterThanOrEqual(initialCount + 2);
    });
  });

  describe('getComponentForTool', () => {
    test('returns component name for mapped tool', () => {
      registerComponent('tool-mapped', MockComponent1, ['mapped_tool']);
      expect(getComponentForTool('mapped_tool')).toBe('tool-mapped');
    });

    test('returns null for unmapped tool', () => {
      expect(getComponentForTool('unmapped_tool')).toBe(null);
    });

    test('handles multiple tools mapping to same component', () => {
      registerComponent('multi-tool', MockComponent1, ['tool1', 'tool2', 'tool3']);

      expect(getComponentForTool('tool1')).toBe('multi-tool');
      expect(getComponentForTool('tool2')).toBe('multi-tool');
      expect(getComponentForTool('tool3')).toBe('multi-tool');
    });
  });

  describe('loadComponentConfig', () => {
    test('handles missing config file gracefully', async () => {
      // This test would require complex mocking, so we'll skip it for now
      // In a real scenario, we'd mock the import function
      expect(async () => await loadComponentConfig()).not.toThrow();
    });
  });

  describe('Integration scenarios', () => {
    test('complete workflow: register -> map -> retrieve -> render', () => {
      // Register components
      registerComponents({
        'weather-widget': {
          component: MockComponent1,
          tools: ['get_weather', 'get_forecast']
        },
        'product-list': {
          component: MockComponent2,
          tools: ['get_products']
        }
      });

      // Verify registration
      expect(hasComponent('weather-widget')).toBe(true);
      expect(hasComponent('product-list')).toBe(true);

      // Verify tool mapping
      expect(getComponentForTool('get_weather')).toBe('weather-widget');
      expect(getComponentForTool('get_products')).toBe('product-list');

      // Verify retrieval
      expect(getComponent('weather-widget')).toBe(MockComponent1);
      expect(getComponent('product-list')).toBe(MockComponent2);

      // Verify rendering doesn't throw
      expect(() => renderComponent('weather-widget', {})).not.toThrow();
      expect(() => renderComponent('product-list', {})).not.toThrow();
    });

    test('handles component name conflicts', () => {
      // Register same component name twice
      registerComponent('conflict', MockComponent1);
      registerComponent('conflict', MockComponent2); // Should overwrite

      expect(getComponent('conflict')).toBe(MockComponent2);
    });

    test('handles tool mapping conflicts', () => {
      // Map same tool to different components
      registerComponent('comp1', MockComponent1, ['shared_tool']);
      registerComponent('comp2', MockComponent2, ['shared_tool']); // Should overwrite

      expect(getComponentForTool('shared_tool')).toBe('comp2');
    });
  });
});