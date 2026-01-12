/**
 * TypeScript interfaces for Semantic Triple data
 * Matches the JSON structure used by the original dashboard
 */

export interface Entity {
    name: string;
    entity_type: string;
}

export interface Relation {
    surface_form: string;
    semantic_form: string;
}

export interface Extraction {
    subject_entity: Entity;
    relation: Relation;
    object_entity: Entity;
    evidence_text: string;
    evidence_sources?: string[];
}

export interface SpeakerTurn {
    speaker_name: string;
    role: string;
    utterance_order: number;
    extractions: Extraction[];
    extraction_count?: number;
    source?: string;
    metadata_source_file?: string;
    metadata_interview_id?: string;
}

export interface GlobalStats {
    total_extractions: number;
    total_speaker_turns: number;
    unique_entity_types: number;
    unique_entity_names: number;
    unique_relations: number;
}

export interface EntityTypeInfo {
    name: string;
    count: number;
    utterance_count: number;
}

export interface StructuralPattern {
    subject_type: string;
    relation: string;
    object_type: string;
    count: number;
}

export interface PatternFilter {
    subject_type: string;
    relation: string;
    object_type: string;
}

export interface FilterState {
    activeTypeFilters: Set<string>;
    activePatternFilter: PatternFilter | null;
    activeRelationFilter: string | null;
    searchTerm: string;
}

export interface RelationDiversity {
    relation: string;
    domain_size: number;
    range_size: number;
    total_diversity: number;
}
