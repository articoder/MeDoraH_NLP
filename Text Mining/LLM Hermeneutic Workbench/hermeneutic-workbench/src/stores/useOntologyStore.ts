/**
 * Ontology Store - Manages loaded ontology population data and computed analytics
 */
import { create } from 'zustand';
import { invoke } from '@tauri-apps/api/core';
import type {
    OntologySpeakerTurn,
    OntologyGlobalStats,
    OntologyClassInfo,
    OntologyPropertyInfo,
    ClaimTypeInfo,
    CertaintyLevelInfo,
} from '../types/ontologyPopulation';

interface OntologyState {
    // Raw data
    speakerTurns: OntologySpeakerTurn[];
    isLoading: boolean;
    error: string | null;
    loadedFilePath: string | null;

    // Computed analytics
    globalStats: OntologyGlobalStats | null;
    ontologyClasses: OntologyClassInfo[];
    ontologyProperties: OntologyPropertyInfo[];
    claimTypeDistribution: ClaimTypeInfo[];
    certaintyLevelDistribution: CertaintyLevelInfo[];

    // Actions
    loadOntologyFile: (path: string) => Promise<void>;
    clearData: () => void;
}

export const useOntologyStore = create<OntologyState>((set) => ({
    // Initial state
    speakerTurns: [],
    isLoading: false,
    error: null,
    loadedFilePath: null,
    globalStats: null,
    ontologyClasses: [],
    ontologyProperties: [],
    claimTypeDistribution: [],
    certaintyLevelDistribution: [],

    loadOntologyFile: async (path: string) => {
        console.log('[OntologyStore] loadOntologyFile called with path:', path);
        set({ isLoading: true, error: null });

        try {
            // Call Rust backend to load and process ontology JSON
            console.log('[OntologyStore] Calling invoke...');
            const result = await invoke<{
                speaker_turns: OntologySpeakerTurn[];
                global_stats: OntologyGlobalStats;
                ontology_classes: OntologyClassInfo[];
                ontology_properties: OntologyPropertyInfo[];
                claim_type_distribution: ClaimTypeInfo[];
                certainty_level_distribution: CertaintyLevelInfo[];
            }>('load_ontology_file', { path });

            console.log('[OntologyStore] Got result:', {
                speakerTurnsCount: result.speaker_turns.length,
                ontologyClassesCount: result.ontology_classes.length,
                globalStats: result.global_stats,
            });

            set({
                speakerTurns: result.speaker_turns,
                globalStats: result.global_stats,
                ontologyClasses: result.ontology_classes,
                ontologyProperties: result.ontology_properties,
                claimTypeDistribution: result.claim_type_distribution,
                certaintyLevelDistribution: result.certainty_level_distribution,
                loadedFilePath: path,
                isLoading: false,
                error: null,
            });
            console.log('[OntologyStore] State updated successfully');
        } catch (err) {
            console.error('[OntologyStore] Error loading ontology JSON:', err);
            set({
                error: err instanceof Error ? err.message : String(err),
                isLoading: false
            });
        }
    },

    clearData: () => {
        set({
            speakerTurns: [],
            globalStats: null,
            ontologyClasses: [],
            ontologyProperties: [],
            claimTypeDistribution: [],
            certaintyLevelDistribution: [],
            loadedFilePath: null,
            error: null,
        });
    },
}));
