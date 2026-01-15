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

## Common Pitfalls

1. **Not using selectors**: Always select specific state to avoid unnecessary re-renders
2. **Mutating state directly**: Always use `set()` to update state
3. **Missing TypeScript types**: Define complete interface for state and actions
4. **Forgetting async error handling**: Wrap IPC calls in try/catch

## Verification

1. Store imports without errors
2. State updates trigger component re-renders
3. TypeScript shows no type errors
4. Console logging confirms state changes (add `console.log('[StoreName]', state)` if debugging)
