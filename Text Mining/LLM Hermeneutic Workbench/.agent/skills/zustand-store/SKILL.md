---
name: zustand-store
description: Create or modify Zustand state stores in the LLM Hermeneutic Workbench. Use when adding "new state", "new store", "state management", or modifying existing store logic.
---

# Zustand Store Management

## Purpose

This skill defines how to create and modify Zustand stores for state management in the LLM Hermeneutic Workbench. The app uses 4 stores following a consistent pattern.

## When to Use

- User asks to "add new state" or "create a store"
- User wants to "manage state" for a new feature
- User needs to "modify existing store" logic
- User asks about "global state" or "shared state"

## Instructions

### Existing Stores

| Store | File | Purpose |
|-------|------|---------|
| useDataStore | `src/stores/useDataStore.ts` | JSON data loading, analytics |
| useFilterStore | `src/stores/useFilterStore.ts` | Filter state management |
| useUIStore | `src/stores/useUIStore.ts` | UI state (modals, sections) |
| useExportStore | `src/stores/useExportStore.ts` | Export selection state |

### Create a New Store

File: `hermeneutic-workbench/src/stores/use<Name>Store.ts`

```typescript
/**
 * <Name> Store - Brief description of purpose
 */
import { create } from 'zustand';

interface <Name>State {
  // State properties
  someValue: string;
  isLoading: boolean;
  
  // Actions
  setSomeValue: (value: string) => void;
  reset: () => void;
}

export const use<Name>Store = create<<Name>State>((set) => ({
  // Initial state
  someValue: '',
  isLoading: false,
  
  // Actions
  setSomeValue: (value: string) => {
    set({ someValue: value });
  },
  
  reset: () => {
    set({ someValue: '', isLoading: false });
  },
}));
```

### Access Store in Components

```tsx
import { use<Name>Store } from '../stores/use<Name>Store';

function MyComponent() {
  // Select specific state
  const someValue = use<Name>Store((state) => state.someValue);
  const setSomeValue = use<Name>Store((state) => state.setSomeValue);
  
  // Or destructure multiple values
  const { someValue, isLoading, setSomeValue } = use<Name>Store();
  
  return <div>{someValue}</div>;
}
```

### Adding Async Actions

For Tauri IPC calls (like in useDataStore):

```typescript
import { invoke } from '@tauri-apps/api/core';

interface DataState {
  data: SomeType[];
  isLoading: boolean;
  error: string | null;
  
  loadData: (path: string) => Promise<void>;
}

export const useDataStore = create<DataState>((set) => ({
  data: [],
  isLoading: false,
  error: null,
  
  loadData: async (path: string) => {
    set({ isLoading: true, error: null });
    try {
      const result = await invoke<SomeType[]>('tauri_command_name', { path });
      set({ data: result, isLoading: false });
    } catch (err) {
      set({ error: String(err), isLoading: false });
    }
  },
}));
```

---

## Performance Best Practices

Based on Vercel's React Best Practices for re-render optimization:

### 1. Use Selectors (CRITICAL)

Always select specific state to avoid unnecessary re-renders:

```tsx
// ❌ Bad: Re-renders on ANY store change
const { data, filters, isLoading } = useDataStore();

// ✅ Good: Only re-renders when selected state changes
const data = useDataStore((state) => state.data);
const isLoading = useDataStore((state) => state.isLoading);
```

### 2. Subscribe to Derived Booleans

Don't compute derived values in components - do it in the selector:

```tsx
// ❌ Bad: Derives boolean every render, re-renders on data array change
const data = useDataStore((state) => state.data);
const hasData = data.length > 0;

// ✅ Good: Only re-renders when boolean changes
const hasData = useDataStore((state) => state.data.length > 0);
```

### 3. Don't Subscribe to Callback-Only State

If you only use state in event handlers, don't subscribe:

```tsx
// ❌ Bad: Re-renders when items change even though we only use it in onClick
const items = useStore((state) => state.items);

function handleClick() {
  console.log(items);
}

// ✅ Good: Use getState() for callback-only access
const handleClick = () => {
  const items = useStore.getState().items;
  console.log(items);
};
```

### 4. Functional setState for Stable Callbacks

Use functional form when new state depends on previous state:

```tsx
// ❌ Bad: Callback identity changes every render
const count = useStore((state) => state.count);
const increment = () => set({ count: count + 1 });

// ✅ Good: Callback can be stable (memoizable)
const increment = () => set((state) => ({ count: state.count + 1 }));
```

### 5. Lazy State Initialization

For expensive initial values, use a function:

```tsx
// ❌ Bad: Expensive computation runs every render
const useExpensiveStore = create((set) => ({
  data: computeExpensiveInitialData(), // Runs immediately
}));

// ✅ Good: Lazy initialization
const useExpensiveStore = create((set) => {
  const initialData = computeExpensiveInitialData(); // Runs once
  return {
    data: initialData,
    // ...
  };
});
```

### 6. Use startTransition for Non-Urgent Updates

Wrap non-critical state updates to keep UI responsive:

```tsx
import { startTransition } from 'react';

// ✅ For non-urgent filter updates
function handleFilterChange(newFilter: string) {
  startTransition(() => {
    setFilter(newFilter);
  });
}
```

---

## Examples

### Reference: useFilterStore Pattern

```typescript
// Current filter store structure
interface FilterState {
    activeTypeFilters: Set<string>;
    activePatternFilter: PatternFilter | null;
    activeRelationFilter: string | null;
    searchTerm: string;
    
    setActiveTypeFilters: (filters: Set<string>) => void;
    toggleTypeFilter: (type: string) => void;
    // ...more actions
}
```

### Reference: useUIStore Pattern

```typescript
// Current UI store structure
interface UIState {
    isNetworkModalOpen: boolean;
    collapsedSections: Record<string, boolean>;
    patternsDisplayCount: number;
    
    setNetworkModalOpen: (open: boolean) => void;
    toggleSection: (section: string) => void;
    // ...more actions
}
```

### Optimized Selector Patterns

```typescript
// Complex selector - memoize if needed
const selectFilteredCount = (state: DataState) => 
  state.data.filter(/* ... */).length;

// Use in component
const filteredCount = useDataStore(selectFilteredCount);
```

---

## Common Pitfalls

1. **Not using selectors**: Always select specific state to avoid unnecessary re-renders
2. **Mutating state directly**: Always use `set()` to update state
3. **Missing TypeScript types**: Define complete interface for state and actions
4. **Forgetting async error handling**: Wrap IPC calls in try/catch
5. **Subscribing to unused state**: Use `getState()` for callback-only access
6. **Deriving values in components**: Move derivation to selectors
7. **Unstable callbacks**: Use functional `set()` when depending on previous state

## Verification

1. Store imports without errors
2. State updates trigger component re-renders
3. TypeScript shows no type errors
4. Console logging confirms state changes (add `console.log('[StoreName]', state)` if debugging)
5. React DevTools shows minimal re-renders when using selectors
