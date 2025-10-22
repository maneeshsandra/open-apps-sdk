/**
 * Component Registry
 * Maps component names to their actual React components
 * Used for re-rendering components from stored messages
 */

import React from 'react';
// Import example components
import { 
  WeatherWidget,
  ProductList,
  ProductDetail,
  CartView,
  UserCarts,
  UserProfile,
  Login
} from '../../examples/components';

// Component Registry Type
type ComponentMap = {
  [key: string]: React.ComponentType<any>;
};

// Register all available components here
const COMPONENT_REGISTRY: ComponentMap = {
  // Weather components
  'weather-widget': WeatherWidget,
  'WeatherWidget': WeatherWidget, // Legacy support
  
  // E-commerce components
  'product-list': ProductList,
  'product-detail': ProductDetail,
  'cart-view': CartView,
  'user-carts': UserCarts,
  'user-profile': UserProfile,
  
  // Authentication components
  'login': Login,
};

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
 * Map tool name to component name
 * This allows automatic component selection based on the tool used
 */
const TOOL_TO_COMPONENT_MAP: { [toolName: string]: string } = {
  // Weather tools
  'get_weather': 'weather-widget',
  'get_forecast': 'weather-widget',
  'get_current_weather': 'weather-widget',
  
  // E-commerce product tools
  'get_products': 'product-list',
  'get_product': 'product-detail',
  
  // E-commerce cart tools
  'get_cart': 'cart-view',
  'get_carts': 'user-carts',
  'get_user_carts': 'user-carts',
  'add_cart': 'cart-view',
  'update_cart': 'cart-view',
  
  // User tools
  'get_user': 'user-profile',
};

/**
 * Get component name for a given tool
 */
export function getComponentForTool(toolName: string): string | null {
  return TOOL_TO_COMPONENT_MAP[toolName] || null;
}
