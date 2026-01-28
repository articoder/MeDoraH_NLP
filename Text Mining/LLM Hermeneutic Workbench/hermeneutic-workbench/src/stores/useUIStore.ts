/**
 * UI Store - Manages UI state like modals, sidebars, etc.
 */
import { create } from 'zustand';

export type ActiveView = 'bottom-up' | 'ontology' | null;

interface UIState {
    // Modal states
    isNetworkModalOpen: boolean;
    isSidebarCollapsed: boolean;

    // Active data view - which mode is currently displayed
    activeView: ActiveView;

    // Pattern display settings
    patternsDisplayCount: number;
    patternsSortOrder: 'desc' | 'asc';

    // Collapsible sections state
    collapsedSections: Set<string>;

    // Panel visibility toggles (Statistics dropdown)
    showExportPanel: boolean;
    showAdvancedFilter: boolean;

    // Actions
    openNetworkModal: () => void;
    closeNetworkModal: () => void;
    toggleSidebar: () => void;
    setActiveView: (view: ActiveView) => void;
    setPatternsDisplayCount: (count: number) => void;
    togglePatternsSortOrder: () => void;
    toggleSection: (sectionId: string) => void;
    isSectionCollapsed: (sectionId: string) => boolean;
    toggleExportPanel: () => void;
    toggleAdvancedFilter: () => void;
}

export const useUIStore = create<UIState>((set, get) => ({
    // Initial state
    isNetworkModalOpen: false,
    isSidebarCollapsed: false,
    activeView: null,
    patternsDisplayCount: 25,
    patternsSortOrder: 'desc',
    collapsedSections: new Set(['entity-patterns', 'relation-cardinality', 'structural-patterns']),

    // Panel visibility - defaults to enabled
    showExportPanel: true,
    showAdvancedFilter: true,

    openNetworkModal: () => set({ isNetworkModalOpen: true }),
    closeNetworkModal: () => set({ isNetworkModalOpen: false }),

    toggleSidebar: () => set((state) => ({
        isSidebarCollapsed: !state.isSidebarCollapsed
    })),

    setActiveView: (view: ActiveView) => set({ activeView: view }),

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

    toggleExportPanel: () => set((state) => ({ showExportPanel: !state.showExportPanel })),
    toggleAdvancedFilter: () => set((state) => ({ showAdvancedFilter: !state.showAdvancedFilter })),
}));

