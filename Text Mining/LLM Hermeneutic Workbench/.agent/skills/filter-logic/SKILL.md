---
name: filter-logic
description: Add filtering capabilities to the LLM Hermeneutic Workbench. Use when adding "new filter", "search functionality", or modifying "filter behavior" in App.tsx.
---

# Filter Logic

## Purpose

This skill explains how to add or modify filtering capabilities in the application. All filter logic is centralized in `App.tsx` using React's `useMemo` hook for performance.

## When to Use

- User wants to "add a new filter"
- User asks to "filter by" a new criterion
- User needs to "modify filter behavior"
- User wants to "add search" functionality

## Instructions

### Current Filter Architecture

Filters are managed in two places:

1. **Filter State**: `src/stores/useFilterStore.ts` - stores active filter values
2. **Filter Logic**: `src/App.tsx` - applies filters via `useMemo`

### Adding a New Filter

#### Step 1: Add State to useFilterStore

File: `hermeneutic-workbench/src/stores/useFilterStore.ts`

```typescript
interface FilterState {
    // Existing filters
    activeTypeFilters: Set<string>;
    activePatternFilter: PatternFilter | null;
    activeRelationFilter: string | null;
    searchTerm: string;
    
    // Add new filter
    newFilter: string | null;
    setNewFilter: (value: string | null) => void;
}

export const useFilterStore = create<FilterState>((set) => ({
    // ... existing state
    
    newFilter: null,
    setNewFilter: (value) => set({ newFilter: value }),
}));
```

#### Step 2: Add Filter Logic to App.tsx

File: `hermeneutic-workbench/src/App.tsx`

```typescript
// 1. Import the new filter from store
const { activeTypeFilters, newFilter } = useFilterStore();

// 2. Add to useMemo dependencies
const filteredTurns = useMemo(() => {
    return speakerTurns.map(turn => {
        const filteredExtractions = turn.extractions.filter(extraction => {
            // Existing filters...
            
            // New filter logic
            if (newFilter) {
                // Apply your filter condition
                if (!extraction.someField.includes(newFilter)) return false;
            }
            
            return true;
        });
        
        return { ...turn, extractions: filteredExtractions };
    }).filter(turn => turn.extractions.length > 0);
}, [speakerTurns, activeTypeFilters, newFilter]); // Add to dependencies!
```

#### Step 3: Add UI Control

Add a button or input in the relevant component (Sidebar, AppBar, etc.):

```tsx
const { newFilter, setNewFilter } = useFilterStore();

<button onClick={() => setNewFilter('value')}>
    Apply Filter
</button>
```

## Examples

### Current Type Filter Implementation

```typescript
// In App.tsx useMemo
if (activeTypeFilters.size > 0) {
    const subjType = extraction.subject_entity.entity_type;
    const objType = extraction.object_entity.entity_type;
    const hasMatchingType = activeTypeFilters.has(subjType) || activeTypeFilters.has(objType);
    if (!hasMatchingType) return false;
}
```

### Current Search Filter Implementation

```typescript
if (searchTerm) {
    const searchLower = searchTerm.toLowerCase();
    const matchesSearch =
        extraction.evidence_text.toLowerCase().includes(searchLower) ||
        extraction.subject_entity.name.toLowerCase().includes(searchLower) ||
        extraction.object_entity.name.toLowerCase().includes(searchLower) ||
        extraction.relation.semantic_form.toLowerCase().includes(searchLower);
    if (!matchesSearch) return false;
}
```

### Current Pattern Filter Implementation

```typescript
if (activePatternFilter) {
    const matchesPattern =
        extraction.subject_entity.entity_type === activePatternFilter.subject_type &&
        extraction.relation.semantic_form === activePatternFilter.relation &&
        extraction.object_entity.entity_type === activePatternFilter.object_type;
    if (!matchesPattern) return false;
}
```

## Common Pitfalls

1. **Missing useMemo dependency**: Always add new filter to dependency array
2. **Filtering on wrong level**: Remember we filter extractions, not turns
3. **Case sensitivity**: Use `.toLowerCase()` for string comparisons
4. **Empty state handling**: Return early if filter value is null/empty

## Verification

1. Apply filter via UI - extraction cards update immediately
2. Check console for `[App] Recalculating filters...` log
3. Verify filtered count changes in GlobalSummary
4. Clear filter - all extractions return
