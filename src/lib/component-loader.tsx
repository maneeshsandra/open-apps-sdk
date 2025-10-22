/**
 * Component Loader
 * Dynamically loads React components from various sources
 */

import React from 'react';
import { getComponent, hasComponent } from './component-registry';

export interface ComponentMetadata {
  componentId?: string;
  componentUrl?: string;
  componentCode?: string;
  componentProps?: any;
  componentAccessible?: boolean;
}

export interface ComponentLoaderConfig {
  allowedDomains?: string[];
  cacheStrategy?: 'memory' | 'session' | 'none';
  timeout?: number;
  integrity?: { [url: string]: string }; // SRI hashes
}

// In-memory cache for loaded components
const componentCache = new Map<string, React.ComponentType<any>>();

// Session storage cache key prefix
const CACHE_PREFIX = 'open-apps-component-';

/**
 * Load component from URL using dynamic import
 * Supports ES modules with default or named exports
 */
async function loadComponentFromURL(
  url: string,
  config: ComponentLoaderConfig
): Promise<React.ComponentType<any> | null> {
  try {
    // Validate domain if allowedDomains is configured
    if (config.allowedDomains && config.allowedDomains.length > 0) {
      const urlObj = new URL(url);
      const isAllowed = config.allowedDomains.some(domain => 
        urlObj.hostname === domain || urlObj.hostname.endsWith(`.${domain}`)
      );
      
      if (!isAllowed) {
        console.error(`Component URL ${url} is not from an allowed domain`);
        return null;
      }
    }

    // Check cache first
    const cacheKey = url;
    if (config.cacheStrategy === 'memory' && componentCache.has(cacheKey)) {
      return componentCache.get(cacheKey)!;
    }

    if (config.cacheStrategy === 'session') {
      const cached = sessionStorage.getItem(CACHE_PREFIX + cacheKey);
      if (cached) {
        // Note: This is simplified - in production, you'd need a more sophisticated
        // approach to serialize/deserialize React components
        console.warn('Session cache for components not fully implemented');
      }
    }

    // Dynamically import the component
    const module = await import(/* @vite-ignore */ url) as any;
    const moduleKeys = Object.keys(module);
    const Component = module.default || (moduleKeys.length > 0 ? module[moduleKeys[0] as keyof typeof module] : null);

    if (!Component) {
      throw new Error(`No component found in module at ${url}`);
    }

    // Cache the component
    if (config.cacheStrategy === 'memory') {
      componentCache.set(cacheKey, Component);
    }

    return Component;
  } catch (error) {
    console.error(`Failed to load component from URL ${url}:`, error);
    return null;
  }
}

/**
 * Load component from bundled code string
 * WARNING: This executes arbitrary JavaScript. Use with extreme caution!
 * Only use with trusted sources or in sandboxed environments.
 */
async function loadComponentFromCode(
  code: string,
  config: ComponentLoaderConfig
): Promise<React.ComponentType<any> | null> {
  try {
    // Create a blob URL for the code
    const blob = new Blob([code], { type: 'application/javascript' });
    const blobUrl = URL.createObjectURL(blob);

    try {
      const module = await import(/* @vite-ignore */ blobUrl) as any;
      const moduleKeys = Object.keys(module);
      const Component = module.default || (moduleKeys.length > 0 ? module[moduleKeys[0] as keyof typeof module] : null);
      
      if (!Component) {
        throw new Error('No component found in bundled code');
      }

      return Component;
    } finally {
      // Clean up blob URL
      URL.revokeObjectURL(blobUrl);
    }
  } catch (error) {
    console.error('Failed to load component from code:', error);
    return null;
  }
}

/**
 * Main component loader function
 * Tries multiple loading strategies in order:
 * 1. Local registry
 * 2. URL-based loading
 * 3. Bundled code execution
 */
export async function loadComponent(
  metadata: ComponentMetadata,
  config: ComponentLoaderConfig = {}
): Promise<React.ComponentType<any> | null> {
  // Strategy 1: Check local registry first (most performant and secure)
  if (metadata.componentId && hasComponent(metadata.componentId)) {
    console.log(`✅ Loading component from registry: ${metadata.componentId}`);
    return getComponent(metadata.componentId);
  }

  // Strategy 2: Load from URL (recommended for production)
  if (metadata.componentUrl) {
    console.log(`⬇️ Loading component from URL: ${metadata.componentUrl}`);
    const component = await loadComponentFromURL(metadata.componentUrl, config);
    if (component) return component;
  }

  // Strategy 3: Load from bundled code (use with caution)
  if (metadata.componentCode) {
    console.warn('⚠️ Loading component from bundled code - ensure source is trusted!');
    const component = await loadComponentFromCode(metadata.componentCode, config);
    if (component) return component;
  }

  // No component could be loaded
  console.warn('❌ No component could be loaded from metadata:', metadata);
  return null;
}

/**
 * Preload components for better performance
 */
export async function preloadComponents(
  urls: string[],
  config: ComponentLoaderConfig = {}
): Promise<void> {
  const promises = urls.map(url => 
    loadComponentFromURL(url, { ...config, cacheStrategy: 'memory' })
  );
  
  await Promise.allSettled(promises);
}

/**
 * Clear component cache
 */
export function clearComponentCache(strategy: 'memory' | 'session' | 'all' = 'all'): void {
  if (strategy === 'memory' || strategy === 'all') {
    componentCache.clear();
  }
  
  if (strategy === 'session' || strategy === 'all') {
    const keys = Object.keys(sessionStorage);
    keys.forEach(key => {
      if (key.startsWith(CACHE_PREFIX)) {
        sessionStorage.removeItem(key);
      }
    });
  }
}

/**
 * Wrapper component that handles loading states and errors
 */
export function DynamicComponent({ 
  metadata, 
  config,
  fallback 
}: {
  metadata: ComponentMetadata;
  config?: ComponentLoaderConfig;
  fallback?: React.ReactNode;
}) {
  const [Component, setComponent] = React.useState<React.ComponentType<any> | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<Error | null>(null);

  React.useEffect(() => {
    let mounted = true;

    const load = async () => {
      try {
        setLoading(true);
        const loadedComponent = await loadComponent(metadata, config);
        
        if (mounted) {
          if (loadedComponent) {
            setComponent(() => loadedComponent);
            setError(null);
          } else {
            setError(new Error('Component could not be loaded'));
          }
        }
      } catch (err) {
        if (mounted) {
          setError(err instanceof Error ? err : new Error('Unknown error'));
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    load();

    return () => {
      mounted = false;
    };
  }, [metadata.componentId, metadata.componentUrl, metadata.componentCode]);

  if (loading) {
    return fallback || (
      <div style={{ padding: '1rem', textAlign: 'center', color: '#666' }}>
        Loading component...
      </div>
    );
  }

  if (error || !Component) {
    return fallback || (
      <div style={{ 
        padding: '1rem', 
        background: '#fee', 
        borderRadius: '0.5rem',
        color: '#c00',
        border: '1px solid #fcc'
      }}>
        <strong>Failed to load component</strong>
        {error && <div style={{ fontSize: '0.875rem', marginTop: '0.5rem' }}>{error.message}</div>}
      </div>
    );
  }

  // Pass component props from metadata
  const props = metadata.componentProps || {};
  return <Component {...props} />;
}

export default loadComponent;
