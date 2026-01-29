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
    RelationPatternInfo,
} from '../types/ontologyPopulation';
import { RELATION_PATTERNS, getPatternForRelation } from '../lib/relationPatterns';

/**
 * Compute hierarchical pattern groupings from flat property list
 */
function computePropertyPatterns(properties: OntologyPropertyInfo[]): RelationPatternInfo[] {
    // Group properties by parent pattern
    const patternMap = new Map<string, OntologyPropertyInfo[]>();
    const unclassified: OntologyPropertyInfo[] = [];

    for (const prop of properties) {
        const patternName = getPatternForRelation(prop.name);
        if (patternName) {
            if (!patternMap.has(patternName)) {
                patternMap.set(patternName, []);
            }
            patternMap.get(patternName)!.push({ ...prop, parentPattern: patternName });
        } else {
            unclassified.push({ ...prop, parentPattern: 'Unclassified' });
        }
    }

    // Build RelationPatternInfo array from defined patterns
    const result: RelationPatternInfo[] = RELATION_PATTERNS
        .map(def => {
            const children = patternMap.get(def.patternName) || [];
            return {
                patternName: def.patternName,
                displayName: def.displayName,
                domainCategory: def.domainCategory,
                rangeCategory: def.rangeCategory,
                totalCount: children.reduce((sum, p) => sum + p.count, 0),
                childRelations: children.sort((a, b) => b.count - a.count),
            };
        })
        .filter(p => p.totalCount > 0); // Only include patterns with data

    // Add unclassified pattern if there are any
    if (unclassified.length > 0) {
        result.push({
            patternName: 'Unclassified',
            displayName: 'Other Relations',
            domainCategory: 'Unspecified',
            rangeCategory: 'Unspecified',
            totalCount: unclassified.reduce((sum, p) => sum + p.count, 0),
            childRelations: unclassified.sort((a, b) => b.count - a.count),
        });
    }

    return result;
}

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
    ontologyPropertyPatterns: RelationPatternInfo[]; // NEW: Hierarchical pattern groupings
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
    ontologyPropertyPatterns: [],
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

            // Compute hierarchical pattern groupings
            const propertyPatterns = computePropertyPatterns(result.ontology_properties);

            console.log('[OntologyStore] Got result:', {
                speakerTurnsCount: result.speaker_turns.length,
                ontologyClassesCount: result.ontology_classes.length,
                ontologyPropertyPatternsCount: propertyPatterns.length,
                globalStats: result.global_stats,
            });

            set({
                speakerTurns: result.speaker_turns,
                globalStats: result.global_stats,
                ontologyClasses: result.ontology_classes,
                ontologyProperties: result.ontology_properties,
                ontologyPropertyPatterns: propertyPatterns,
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
            ontologyPropertyPatterns: [],
            claimTypeDistribution: [],
            certaintyLevelDistribution: [],
            loadedFilePath: null,
            error: null,
        });
    },
}));

