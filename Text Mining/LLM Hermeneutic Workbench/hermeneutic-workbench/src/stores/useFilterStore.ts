/**
 * Filter Store - Manages filter state for the dashboard
 */
import { create } from 'zustand';
import type { PatternFilter } from '../types/data';

interface FilterState {
    // Filter values
    activeTypeFilters: Set<string>;
    activePatternFilter: PatternFilter | null;
    activeRelationFilter: string | null;
    searchTerm: string;

    // Actions
    toggleTypeFilter: (entityType: string) => void;
    setPatternFilter: (filter: PatternFilter | null) => void;
    setRelationFilter: (relation: string | null) => void;
    setSearchTerm: (term: string) => void;
    clearAllFilters: () => void;
    hasActiveFilters: () => boolean;
}

export const useFilterStore = create<FilterState>((set, get) => ({
    // Initial state
    activeTypeFilters: new Set<string>(),
    activePatternFilter: null,
    activeRelationFilter: null,
    searchTerm: '',

    toggleTypeFilter: (entityType: string) => {
        console.log('[FilterStore] toggleTypeFilter called with:', entityType);
        set((state) => {
            const newFilters = new Set(state.activeTypeFilters);
            if (newFilters.has(entityType)) {
                newFilters.delete(entityType);
                console.log('[FilterStore] Removed filter:', entityType);
            } else {
                newFilters.add(entityType);
                console.log('[FilterStore] Added filter:', entityType);
            }
            console.log('[FilterStore] New activeTypeFilters:', Array.from(newFilters));
            return { activeTypeFilters: newFilters };
        });
    },

    setPatternFilter: (filter: PatternFilter | null) => {
        set({ activePatternFilter: filter });
    },

    setRelationFilter: (relation: string | null) => {
        set({ activeRelationFilter: relation });
    },

    setSearchTerm: (term: string) => {
        set({ searchTerm: term.toLowerCase().trim() });
    },

    clearAllFilters: () => {
        set({
            activeTypeFilters: new Set<string>(),
            activePatternFilter: null,
            activeRelationFilter: null,
            searchTerm: '',
        });
    },

    hasActiveFilters: () => {
        const state = get();
        return (
            state.activeTypeFilters.size > 0 ||
            state.activePatternFilter !== null ||
            state.activeRelationFilter !== null ||
            state.searchTerm !== ''
        );
    },
}));
