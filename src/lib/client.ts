/**
 * Open Apps SDK - Client Entry Point
 * Client-side React components and hooks
 */

export { ComponentProvider, Context, useComponentContext, useToolOutput, useComponentState, useTheme, useReadonly } from './component-context';
export { registerComponents, registerComponent, getComponent, renderComponent, getRegisteredComponents, getComponentForTool, loadComponentConfig } from './component-registry';
export { useOpenApps, useToolInput, useCallTool, useRequestDisplayMode, useSendFollowup, useComponentContext as useComponentContextHook } from './use-open-apps';
export { default as App } from '../client/App';
export type { ComponentContext, DisplayMode, Theme, ToolCallResult } from './types';
export type { ComponentRegistrationConfig } from './component-registry';