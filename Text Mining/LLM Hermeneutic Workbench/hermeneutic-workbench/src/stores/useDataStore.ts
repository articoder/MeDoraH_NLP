/**
 * Data Store - Manages loaded JSON data and computed analytics
 */
import { create } from 'zustand';
import { invoke } from '@tauri-apps/api/core';
import type {
    SpeakerTurn,
    GlobalStats,
    EntityTypeInfo,
    StructuralPattern,
    RelationDiversity
} from '../types/data';

interface DataState {
    // Raw data
    speakerTurns: SpeakerTurn[];
    isLoading: boolean;
    error: string | null;
    loadedFilePath: string | null;

    // Computed analytics
    globalStats: GlobalStats | null;
    entityTypes: EntityTypeInfo[];
    entityTypesHighFreq: EntityTypeInfo[];
    entityTypesMediumFreq: EntityTypeInfo[];
    entityTypesLowFreq: EntityTypeInfo[];
    structuralPatterns: StructuralPattern[];
    relationFrequencyMap: Record<string, number>;
    multiTypedEntities: Record<string, string[]>;
    subjectOnlyTypes: string[];
    objectOnlyTypes: string[];
    topDiverseRelations: RelationDiversity[];

    // Actions
    loadJsonFile: (path: string) => Promise<void>;
    clearData: () => void;
}

export const useDataStore = create<DataState>((set) => ({
    // Initial state
    speakerTurns: [],
    isLoading: false,
    error: null,
    loadedFilePath: null,
    globalStats: null,
    entityTypes: [],
    entityTypesHighFreq: [],
    entityTypesMediumFreq: [],
    entityTypesLowFreq: [],
    structuralPatterns: [],
    relationFrequencyMap: {},
    multiTypedEntities: {},
    subjectOnlyTypes: [],
    objectOnlyTypes: [],
    topDiverseRelations: [],

    loadJsonFile: async (path: string) => {
        console.log('[DataStore] loadJsonFile called with path:', path);
        set({ isLoading: true, error: null });

        try {
            // Call Rust backend to load and process JSON
            console.log('[DataStore] Calling invoke...');
            const result = await invoke<{
                speaker_turns: SpeakerTurn[];
                global_stats: GlobalStats;
                entity_types: EntityTypeInfo[];
                entity_types_high_freq: EntityTypeInfo[];
                entity_types_medium_freq: EntityTypeInfo[];
                entity_types_low_freq: EntityTypeInfo[];
                structural_patterns: StructuralPattern[];
                relation_frequency_map: Record<string, number>;
                multi_typed_entities: Record<string, string[]>;
                subject_only_types: string[];
                object_only_types: string[];
                top_diverse_relations: RelationDiversity[];
            }>('load_json_file', { path });

            console.log('[DataStore] Got result:', {
                speakerTurnsCount: result.speaker_turns.length,
                entityTypesCount: result.entity_types.length,
                highFreqCount: result.entity_types_high_freq.length,
            });

            set({
                speakerTurns: result.speaker_turns,
                globalStats: result.global_stats,
                entityTypes: result.entity_types,
                entityTypesHighFreq: result.entity_types_high_freq,
                entityTypesMediumFreq: result.entity_types_medium_freq,
                entityTypesLowFreq: result.entity_types_low_freq,
                structuralPatterns: result.structural_patterns,
                relationFrequencyMap: result.relation_frequency_map,
                multiTypedEntities: result.multi_typed_entities,
                subjectOnlyTypes: result.subject_only_types,
                objectOnlyTypes: result.object_only_types,
                topDiverseRelations: result.top_diverse_relations,
                loadedFilePath: path,
                isLoading: false,
                error: null,
            });
            console.log('[DataStore] State updated successfully');
        } catch (err) {
            console.error('[DataStore] Error loading JSON:', err);
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
            entityTypes: [],
            entityTypesHighFreq: [],
            entityTypesMediumFreq: [],
            entityTypesLowFreq: [],
            structuralPatterns: [],
            relationFrequencyMap: {},
            multiTypedEntities: {},
            subjectOnlyTypes: [],
            objectOnlyTypes: [],
            topDiverseRelations: [],
            loadedFilePath: null,
            error: null,
        });
    },
}));
