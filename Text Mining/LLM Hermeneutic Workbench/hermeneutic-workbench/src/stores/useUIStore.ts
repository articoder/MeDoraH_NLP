/**
 * UI Store - Manages UI state like modals, sidebars, etc.
 */
import { create } from 'zustand';

interface UIState {
    // Modal states
    isNetworkModalOpen: boolean;
    isSidebarCollapsed: boolean;

    // Pattern display settings
    patternsDisplayCount: number;
    patternsSortOrder: 'desc' | 'asc';

    // Collapsible sections state
    collapsedSections: Set<string>;

    // Actions
    openNetworkModal: () => void;
    closeNetworkModal: () => void;
    toggleSidebar: () => void;
    setPatternsDisplayCount: (count: number) => void;
    togglePatternsSortOrder: () => void;
    toggleSection: (sectionId: string) => void;
    isSectionCollapsed: (sectionId: string) => boolean;
}

export const useUIStore = create<UIState>((set, get) => ({
    // Initial state
    isNetworkModalOpen: false,
    isSidebarCollapsed: false,
    patternsDisplayCount: 25,
    patternsSortOrder: 'desc',
    collapsedSections: new Set(['entity-patterns', 'relation-cardinality', 'structural-patterns']),

    openNetworkModal: () => set({ isNetworkModalOpen: true }),
    closeNetworkModal: () => set({ isNetworkModalOpen: false }),

    toggleSidebar: () => set((state) => ({
        isSidebarCollapsed: !state.isSidebarCollapsed
    })),

    setPatternsDisplayCount: (count: number) => set({ patternsDisplayCount: count }),

    togglePatternsSortOrder: () => set((state) => ({
        patternsSortOrder: state.patternsSortOrder === 'desc' ? 'asc' : 'desc'
    })),

    toggleSection: (sectionId: string) => {
        set((state) => {
            const newSections = new Set(state.collapsedSections);
            if (newSections.has(sectionId)) {
                newSections.delete(sectionId);
            } else {
                newSections.add(sectionId);
            }
            return { collapsedSections: newSections };
        });
    },

    isSectionCollapsed: (sectionId: string) => {
        return get().collapsedSections.has(sectionId);
    },
}));
