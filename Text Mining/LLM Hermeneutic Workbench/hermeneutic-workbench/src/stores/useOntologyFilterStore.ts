/**
 * Ontology Filter Store - Manages filter state for Ontology Population data
 */
import { create } from 'zustand';
import type { MappingStatus } from '../types/ontologyPopulation';

interface OntologyFilterState {
    // Ontology-specific filters
    activeClassFilters: Set<string>;         // Filter by ontology class
    activePropertyFilters: Set<string>;      // Filter by ontology property
    activeClaimTypeFilters: Set<string>;     // Filter by claim type
    activeCertaintyFilters: Set<string>;     // Filter by certainty level
    activeMappingStatusFilter: MappingStatus | null; // mapped/unmapped/uncertain

    // Actions
    toggleClassFilter: (className: string) => void;
    togglePropertyFilter: (property: string) => void;
    toggleClaimTypeFilter: (claimType: string) => void;
    toggleCertaintyFilter: (level: string) => void;
    setMappingStatusFilter: (status: MappingStatus | null) => void;
    clearAllFilters: () => void;
    hasActiveFilters: () => boolean;
}

export const useOntologyFilterStore = create<OntologyFilterState>((set, get) => ({
    // Initial state
    activeClassFilters: new Set<string>(),
    activePropertyFilters: new Set<string>(),
    activeClaimTypeFilters: new Set<string>(),
    activeCertaintyFilters: new Set<string>(),
    activeMappingStatusFilter: null,

    toggleClassFilter: (className: string) => {
        set((state) => {
            const newFilters = new Set(state.activeClassFilters);
            if (newFilters.has(className)) {
                newFilters.delete(className);
            } else {
                newFilters.add(className);
            }
            return { activeClassFilters: newFilters };
        });
    },

    togglePropertyFilter: (property: string) => {
        set((state) => {
            const newFilters = new Set(state.activePropertyFilters);
            if (newFilters.has(property)) {
                newFilters.delete(property);
            } else {
                newFilters.add(property);
            }
            return { activePropertyFilters: newFilters };
        });
    },

    toggleClaimTypeFilter: (claimType: string) => {
        set((state) => {
            const newFilters = new Set(state.activeClaimTypeFilters);
            if (newFilters.has(claimType)) {
                newFilters.delete(claimType);
            } else {
                newFilters.add(claimType);
            }
            return { activeClaimTypeFilters: newFilters };
        });
    },

    toggleCertaintyFilter: (level: string) => {
        set((state) => {
            const newFilters = new Set(state.activeCertaintyFilters);
            if (newFilters.has(level)) {
                newFilters.delete(level);
            } else {
                newFilters.add(level);
            }
            return { activeCertaintyFilters: newFilters };
        });
    },

    setMappingStatusFilter: (status: MappingStatus | null) => {
        set((state) => ({
            activeMappingStatusFilter: state.activeMappingStatusFilter === status ? null : status
        }));
    },

    clearAllFilters: () => {
        set({
            activeClassFilters: new Set<string>(),
            activePropertyFilters: new Set<string>(),
            activeClaimTypeFilters: new Set<string>(),
            activeCertaintyFilters: new Set<string>(),
            activeMappingStatusFilter: null,
        });
    },

    hasActiveFilters: () => {
        const state = get();
        return (
            state.activeClassFilters.size > 0 ||
            state.activePropertyFilters.size > 0 ||
            state.activeClaimTypeFilters.size > 0 ||
            state.activeCertaintyFilters.size > 0 ||
            state.activeMappingStatusFilter !== null
        );
    },
}));
