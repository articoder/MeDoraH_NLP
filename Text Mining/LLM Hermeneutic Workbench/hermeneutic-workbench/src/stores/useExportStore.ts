/**
 * Export Store - Manages export checkbox state
 */
import { create } from 'zustand';

interface ExportState {
    // Checkbox states
    exportEntities: boolean;
    exportPatterns: boolean;
    exportTriples: boolean;

    // Actions
    toggleExportEntities: () => void;
    toggleExportPatterns: () => void;
    toggleExportTriples: () => void;
    resetExportSelections: () => void;
}

export const useExportStore = create<ExportState>((set) => ({
    // Initial state - all unchecked
    exportEntities: false,
    exportPatterns: false,
    exportTriples: false,

    toggleExportEntities: () => {
        set((state) => ({ exportEntities: !state.exportEntities }));
    },

    toggleExportPatterns: () => {
        set((state) => ({ exportPatterns: !state.exportPatterns }));
    },

    toggleExportTriples: () => {
        set((state) => ({ exportTriples: !state.exportTriples }));
    },

    resetExportSelections: () => {
        set({ exportEntities: false, exportPatterns: false, exportTriples: false });
    },
}));
