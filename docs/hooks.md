# Component Hooks Documentation

This document provides comprehensive information about the hooks available in the Open Apps SDK, their usage patterns, and importance in building conversational components.

## Overview

Hooks in the Open Apps SDK enable React components to interact with the conversational backend, manage state, and respond to LLM tool calls. They provide a clean, type-safe interface for building rich conversational UIs.

## Core Concepts

### Component Lifecycle

Components in the Open Apps SDK follow this lifecycle:

1. **Tool Call**: LLM decides to call a tool
2. **Component Render**: SDK renders the associated component
3. **Data Flow**: `toolInput` → Component Logic → `toolOutput`
4. **User Interaction**: Component can call additional tools
5. **State Persistence**: Component state survives re-renders

### Data Flow

```
LLM Tool Call → MCP Server → structuredContent → toolOutput → Component
Component → callTool() → MCP Server → structuredContent → toolOutput
```

## Hook Reference

### useComponentContext

**Purpose**: The primary hook providing access to all component functionality.

**Importance**: This is the most comprehensive hook, offering a single import for all common component needs. It simplifies component development by providing a consistent interface.

```typescript
const {
  toolInput,        // Arguments passed to the tool
  toolOutput,       // Structured data from tool responses
  componentState,   // Persistent component state
  theme,           // Current theme ('light' | 'dark')
  displayMode,     // Display mode ('inline' | 'modal', etc.)
  callTool,        // Function to call MCP tools
  setComponentState, // Update persistent state
  sendMessage,     // Send followup messages
} = useComponentContext<TInput, TOutput, TState>();
```

**When to use**: For components that need multiple SDK features. Use generic types for better TypeScript support.

**Example**:
```typescript
interface WeatherInput {
  location: string;
}

interface WeatherData {
  temperature: number;
  condition: string;
}

function WeatherWidget() {
  const {
    toolInput,
    toolOutput,
    callTool,
    theme
  } = useComponentContext<WeatherInput, WeatherData>();

  // Component logic here
}
```

### useToolInput

**Purpose**: Access arguments passed to the tool that triggered this component.

**Importance**: Essential for components that need to know what parameters were used to generate their current state. This enables dynamic component behavior based on tool arguments.

```typescript
const input = useToolInput<T>();
```

**When to use**: When your component needs to know the original tool parameters.

**Example**:
```typescript
function ProductDetail() {
  const input = useToolInput<{ productId: number }>();

  // Use input.productId to fetch/display product
  return <div>Product: {input?.productId}</div>;
}
```

### useToolOutput

**Purpose**: Access structured data returned from tool execution.

**Importance**: This is the primary way components receive data from MCP servers. The structured content enables rich, typed component rendering.

```typescript
const output = useToolOutput<T>();
```

**When to use**: To display data returned by tools. Most components will use this hook.

**Example**:
```typescript
interface WeatherData {
  location: string;
  temperature: number;
  condition: string;
}

function WeatherDisplay() {
  const weather = useToolOutput<WeatherData>();

  if (!weather) return <div>Loading...</div>;

  return (
    <div>
      <h2>{weather.location}</h2>
      <p>{weather.temperature}°F - {weather.condition}</p>
    </div>
  );
}
```

### useComponentState

**Purpose**: Manage persistent state that survives component re-renders and conversation updates.

**Importance**: Critical for interactive components that need to maintain state across tool calls. Unlike React's useState, this state persists in the conversation context.

```typescript
const [state, setState] = useComponentState<T>(initialState);
```

**When to use**: For any component that needs to remember user interactions, form data, or UI state.

**Example**:
```typescript
function ShoppingCart() {
  const [cart, setCart] = useComponentState<{ items: CartItem[] }>({
    items: []
  });

  const addItem = (item: CartItem) => {
    setCart(prev => ({
      items: [...prev.items, item]
    }));
  };

  return (
    <div>
      {cart.items.map(item => <CartItem key={item.id} item={item} />)}
      <button onClick={() => addItem(newItem)}>Add Item</button>
    </div>
  );
}
```

### useCallTool

**Purpose**: Call MCP tools from within components, with optional authentication headers.

**Importance**: Enables components to trigger backend actions, creating interactive conversational experiences. The headers parameter allows secure API calls.

```typescript
const callTool = useCallTool();

await callTool(name: string, args: object, headers?: Record<string, string>);
```

**When to use**: When components need to perform actions that require backend processing.

**Authentication Example**:
```typescript
function AuthenticatedComponent() {
  const callTool = useCallTool();

  const fetchUserData = async () => {
    await callTool('get_user_data', {
      userId: '123'
    }, {
      'Authorization': 'Bearer eyJ...',
      'X-API-Key': 'secret-key'
    });
  };

  return <button onClick={fetchUserData}>Load Data</button>;
}
```

### useTheme

**Purpose**: Access the current theme setting.

**Importance**: Ensures components respect user theme preferences, providing consistent visual experience.

```typescript
const theme = useTheme(); // 'light' | 'dark'
```

**When to use**: For styling components that need to adapt to light/dark themes.

**Example**:
```typescript
function ThemedButton({ children }) {
  const theme = useTheme();

  return (
    <button className={`btn btn-${theme}`}>
      {children}
    </button>
  );
}
```

### useDisplayMode

**Purpose**: Access the current display mode.

**Importance**: Allows components to adapt their layout and behavior based on how they're being displayed (inline, modal, fullscreen, etc.).

```typescript
const displayMode = useDisplayMode(); // 'inline' | 'modal' | etc.
```

**When to use**: For responsive component layouts.

### useSendFollowup

**Purpose**: Send followup messages to continue the conversation.

**Importance**: Enables components to drive conversation flow by sending messages back to the LLM.

```typescript
const sendFollowup = useSendFollowup();

await sendFollowup(message: string);
```

**When to use**: When components need to ask questions or provide information back to the LLM.

**Example**:
```typescript
function QuestionForm() {
  const sendFollowup = useSendFollowup();

  const submitAnswer = async (answer: string) => {
    await sendFollowup(`The user answered: ${answer}`);
  };

  return (
    <form onSubmit={(e) => {
      e.preventDefault();
      submitAnswer(inputValue);
    }}>
      <input value={inputValue} onChange={setInputValue} />
      <button type="submit">Submit</button>
    </form>
  );
}
```

## Advanced Patterns

### Combining Hooks

```typescript
function AdvancedComponent() {
  // Use specific hooks for clarity
  const input = useToolInput<InputType>();
  const output = useToolOutput<OutputType>();
  const [state, setState] = useComponentState<StateType>();
  const callTool = useCallTool();
  const theme = useTheme();

  // Or use the combined hook
  const context = useComponentContext<InputType, OutputType, StateType>();

  // Both approaches work - choose based on needs
}
```

### Error Handling

```typescript
function RobustComponent() {
  const callTool = useCallTool();

  const handleAction = async () => {
    try {
      await callTool('risky_operation', args);
    } catch (error) {
      // Handle errors gracefully
      console.error('Tool call failed:', error);
      // Maybe show user feedback or retry
    }
  };
}
```

### State Synchronization

```typescript
function SynchronizedComponent() {
  const output = useToolOutput();
  const [localState, setLocalState] = useComponentState();

  // Sync local state with tool output when it changes
  useEffect(() => {
    if (output && !localState) {
      setLocalState(output.initialState);
    }
  }, [output, localState, setLocalState]);
}
```

## Best Practices

### 1. Type Safety
Always use TypeScript generics with hooks for better development experience:

```typescript
// ✅ Good
const output = useToolOutput<WeatherData>();

// ❌ Avoid
const output = useToolOutput();
```

### 2. Null Checking
Components should handle cases where data isn't available yet:

```typescript
// ✅ Good
const output = useToolOutput();
if (!output) return <div>Loading...</div>;

// ❌ Avoid
return <div>{output.temperature}</div>; // Potential undefined error
```

### 3. State Management
Use `useComponentState` for conversation-persistent data, `useState` for temporary UI state.

### 4. Performance
Be mindful of re-renders. Use `useCallback` for functions passed to event handlers.

### 5. Authentication
Always include necessary headers when calling authenticated tools:

```typescript
await callTool('protected_api', args, {
  'Authorization': `Bearer ${token}`,
  'X-API-Key': apiKey
});
```

## Troubleshooting

### Component Not Rendering
- Check that the MCP server returns `_meta.componentId` matching your component registration
- Verify `components.config.js` exports the component correctly

### Tool Calls Failing
- Ensure WebSocket connection is established
- Check that tool name matches MCP server definition
- Verify authentication headers if required

### State Not Persisting
- Use `useComponentState` instead of `useState` for conversation state
- Check that state updates are called correctly

## Migration Guide

### From useComponentContext to Individual Hooks

```typescript
// Old approach
const { toolOutput, callTool } = useComponentContext();

// New approach (more explicit)
const toolOutput = useToolOutput();
const callTool = useCallTool();
```

### From Custom State to useComponentState

```typescript
// Old approach (lost on re-render)
const [state, setState] = useState(initial);

// New approach (persists)
const [state, setState] = useComponentState(initial);
```

This documentation covers the essential hooks for building components with the Open Apps SDK. For more examples, see the `examples/components/` directory in the repository.