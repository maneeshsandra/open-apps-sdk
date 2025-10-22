/**
 * useOpenApps Hook
 * Our LLM-agnostic version of OpenAI's window.openai API
 * Provides access to component context, state, and actions
 */

import { useContext, useSyncExternalStore, useCallback, useState, useEffect } from 'react';
import { Context } from './component-context';
import type { Theme, DisplayMode, ToolCallResult } from './types';

/**
 * Main hook to access the OpenApps context
 * Similar to OpenAI's useOpenAiGlobal but LLM-agnostic
 */
export function useOpenApps() {
  const context = useContext(Context);
  
  if (!context) {
    throw new Error('useOpenApps must be used within a ComponentProvider');
  }

  return context;
}

/**
 * Hook to get a specific global value (theme, locale, displayMode, etc.)
 * Implements the same pattern as OpenAI's useOpenAiGlobal
 */
export function useOpenAppsGlobal<K extends keyof OpenAppsGlobals>(
  key: K
): OpenAppsGlobals[K] {
  const context = useOpenApps();
  
  return useSyncExternalStore(
    (onChange) => {
      // Subscribe to changes
      const handleChange = () => onChange();
      
      // In a real implementation, you'd set up event listeners
      // For now, we'll use React's built-in reactivity
      
      return () => {
        // Cleanup
      };
    },
    () => context[key] as OpenAppsGlobals[K]
  );
}

/**
 * Global values accessible to components
 */
export interface OpenAppsGlobals {
  theme: Theme;
  locale: string;
  displayMode: DisplayMode;
  toolInput: any;
  toolOutput: any;
  componentState: any;
}

/**
 * Hook to access tool input (arguments passed to the tool)
 */
export function useToolInput<T = any>(): T | null {
  const { toolInput } = useOpenApps();
  return toolInput as T;
}

/**
 * Hook to access tool output (structured content from tool response)
 */
export function useToolOutput<T = any>(): T | null {
  const { toolOutput } = useOpenApps();
  return toolOutput as T;
}

/**
 * Hook to access and update component state
 * Similar to useState but persisted across sessions
 */
export function useComponentState<T = any>(
  defaultState?: T | (() => T | null) | null
): readonly [T | null, (state: T | null | ((prev: T | null) => T | null)) => void] {
  const { componentState, setComponentState } = useOpenApps();
  
  const [localState, setLocalState] = useState<T | null>(() => {
    if (componentState != null) {
      return componentState;
    }
    
    return typeof defaultState === 'function' 
      ? (defaultState as () => T | null)()
      : defaultState ?? null;
  });

  // Sync with context state
  useEffect(() => {
    if (componentState !== localState) {
      setLocalState(componentState);
    }
  }, [componentState]);

  const updateState = useCallback(
    (state: T | null | ((prev: T | null) => T | null)) => {
      setLocalState((prevState) => {
        const newState = typeof state === 'function' 
          ? (state as (prev: T | null) => T | null)(prevState)
          : state;

        if (newState != null) {
          setComponentState(newState);
        }

        return newState;
      });
    },
    [setComponentState]
  );

  return [localState, updateState] as const;
}

/**
 * Hook to access theme
 */
export function useTheme(): Theme {
  const { theme } = useOpenApps();
  return theme;
}

/**
 * Hook to access locale
 */
export function useLocale(): string {
  const { locale } = useOpenApps();
  return locale;
}

/**
 * Hook to access display mode
 */
export function useDisplayMode(): DisplayMode {
  const { displayMode } = useOpenApps();
  return displayMode;
}

/**
 * Hook to access readonly state
 */
export function useReadonly(): boolean {
  const { readonly } = useOpenApps();
  return readonly;
}

/**
 * Hook to call MCP tools from components
 */
export function useCallTool() {
  const { callTool } = useOpenApps();
  
  return useCallback(
    async (name: string, args: Record<string, unknown>, headers?: Record<string, string>): Promise<ToolCallResult> => {
      return await callTool(name, args, headers);
    },
    [callTool]
  );
}

/**
 * Hook to request display mode changes
 */
export function useRequestDisplayMode() {
  const { requestDisplayMode } = useOpenApps();
  
  return useCallback(
    async (mode: DisplayMode): Promise<{ mode: DisplayMode }> => {
      await requestDisplayMode(mode);
      return { mode };
    },
    [requestDisplayMode]
  );
}

/**
 * Hook to send followup messages to the conversation
 */
export function useSendFollowup() {
  const { sendMessage } = useOpenApps();
  
  return useCallback(
    async (message: string): Promise<void> => {
      await sendMessage(message);
    },
    [sendMessage]
  );
}

/**
 * Combined hook for common component needs
 */
export function useComponentContext<
  TInput = any,
  TOutput = any,
  TState = any
>() {
  const toolInput = useToolInput<TInput>();
  const toolOutput = useToolOutput<TOutput>();
  const [componentState, setComponentState] = useComponentState<TState>();
  const theme = useTheme();
  const locale = useLocale();
  const displayMode = useDisplayMode();
  const callTool = useCallTool();
  const requestDisplayMode = useRequestDisplayMode();
  const sendFollowup = useSendFollowup();

  return {
    // Data
    toolInput,
    toolOutput,
    componentState,
    
    // Environment
    theme,
    locale,
    displayMode,
    
    // Actions
    callTool,
    setComponentState,
    requestDisplayMode,
    sendFollowup,
  };
}

export default useOpenApps;
