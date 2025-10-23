/**
 * Component Registry
 * Manages component registration and mapping to tools
 * Components are registered programmatically by importing and calling registerComponents()
 */

import React from 'react';

// Component Registry Type
type ComponentMap = {
  [key: string]: React.ComponentType<any>;
};

// Tool to Component mapping
type ToolToComponentMap = {
  [toolName: string]: string;
};

// Component registration config
export interface ComponentRegistrationConfig {
  component: React.ComponentType<any>;
  tools?: string[];
  description?: string;
}

// Registry state
let COMPONENT_REGISTRY: ComponentMap = {};
let TOOL_TO_COMPONENT_MAP: ToolToComponentMap = {};

/**
 * Register multiple components at once
 * This is the primary way users will register their components
 * 
 * @example
 * registerComponents({
 *   'weather-widget': {
 *     component: WeatherWidget,
 *     tools: ['get_weather', 'get_forecast']
 *   },
 *   'product-list': {
 *     component: ProductList,
 *     tools: ['get_products']
 *   }
 * });
 */
export function registerComponents(
  components: Record<string, ComponentRegistrationConfig>
): void {
  Object.entries(components).forEach(([componentName, config]) => {
    // Register the component
    COMPONENT_REGISTRY[componentName] = config.component;

    // Map tools to this component
    if (config.tools && Array.isArray(config.tools)) {
      config.tools.forEach(toolName => {
        TOOL_TO_COMPONENT_MAP[toolName] = componentName;
      });
    }

    console.log(`✓ Registered component: ${componentName}`);
  });

  console.log(
    `Component registry now has ${Object.keys(COMPONENT_REGISTRY).length} components`
  );
}

/**
 * Get a component by name from the registry
 */
export function getComponent(componentName: string): React.ComponentType<any> | null {
  return COMPONENT_REGISTRY[componentName] || null;
}

/**
 * Render a component dynamically with props
 */
export function renderComponent(componentName: string, props: any): React.ReactNode {
  const Component = getComponent(componentName);
  
  if (!Component) {
    console.warn(`Component "${componentName}" not found in registry`);
    return (
      <div style={{ 
        padding: '1rem', 
        background: '#fee', 
        borderRadius: '0.5rem',
        color: '#c00'
      }}>
        Component "{componentName}" not found
      </div>
    );
  }

  // Pass props directly - components will get them through ComponentProvider's toolOutput
  // ComponentProvider wraps each message component and sets toolOutput to the component_props
  return <Component />;
}

/**
 * Check if a component exists in the registry
 */
export function hasComponent(componentName: string): boolean {
  return componentName in COMPONENT_REGISTRY;
}

/**
 * Get all registered component names
 */
export function getRegisteredComponents(): string[] {
  return Object.keys(COMPONENT_REGISTRY);
}

/**
 * Get component name for a given tool
 * Tool-to-component mappings are registered via registerComponents()
 */
export function getComponentForTool(toolName: string): string | null {
  return TOOL_TO_COMPONENT_MAP[toolName] || null;
}

/**
 * Manually register a single component at runtime (for advanced use cases)
 * Consider using registerComponents() for bulk registration instead
 */
export function registerComponent(
  componentName: string,
  component: React.ComponentType<any>,
  associatedTools?: string[]
): void {
  COMPONENT_REGISTRY[componentName] = component;
  
  if (associatedTools) {
    associatedTools.forEach(toolName => {
      TOOL_TO_COMPONENT_MAP[toolName] = componentName;
    });
  }
  
  console.log(`Manually registered component: ${componentName}`);
}

/**
 * Load component configurations from components.config.js
 * Automatically registers components defined in the config file
 */
export async function loadComponentConfig(): Promise<void> {
  try {
    const config = await import('../../components.config.js');
    
    if (config.components) {
      registerComponents(config.components);
      console.log(`✅ Loaded ${Object.keys(config.components).length} component(s) from components.config.js`);
    } else {
      console.warn('⚠️  components.config.js does not export a "components" object.');
    }
  } catch (error) {
    console.warn('⚠️  No components.config.js found or failed to load. Create one to configure your components.');
    console.warn('   See components.config.example.json for examples.');
  }
}
