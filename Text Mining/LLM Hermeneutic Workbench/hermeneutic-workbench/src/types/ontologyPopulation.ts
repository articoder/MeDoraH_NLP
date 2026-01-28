/**
 * TypeScript interfaces for Ontology Population data
 * Matches the richer JSON schema with ontology mappings, epistemic stances, and provenance
 */

// Mapping status enum-like type
export type MappingStatus = 'mapped' | 'unmapped' | 'uncertain';

// Ontology mapping for entities and relations
export interface OntologyMapping {
    mapping_status: MappingStatus;
    class?: string;      // Used for entity classes
    property?: string;   // Used for relation properties
}

// Entity with ontology mapping
export interface OntologyEntity {
    canonical_name: string;
    ontology_mapping: OntologyMapping;
}

// Relation with ontology mapping and negation flag
export interface OntologyRelation {
    surface_form: string;
    ontology_mapping: OntologyMapping;
    is_negated: boolean;
}

// Claim type classification
export interface ClaimType {
    mapping_status: 'mapped' | 'unmapped';
    class: string; // direct_experience | inference | hearsay | general_knowledge | hypothetical | evaluative_judgment | <llm_suggestion>
}

// Epistemic stance capturing the nature of knowledge claims
export interface EpistemicStance {
    claim_type: ClaimType[];
    certainty_level: OntologyMapping;
    temporal_grounding: OntologyMapping;
    attribution_type?: string; // direct_quote | indirect_report | general_attribution
}

// Reasoning/justification for mapping decisions
export interface Reasons {
    sub_obj_classes: string;
    relation: string;
    epistemic_stance: string;
}

// Provenance/evidence information
export interface Provenance {
    evidence_sentence_ids: string[];
    evidence_text: string;
}

// A single ontology extraction (rich semantic triple)
export interface OntologyExtraction {
    extraction_id: string;
    subject: OntologyEntity;
    relation: OntologyRelation;
    object: OntologyEntity;
    epistemic_stance: EpistemicStance;
    reasons: Reasons;
    provenance: Provenance;
}

// Speaker turn containing ontology extractions
export interface OntologySpeakerTurn {
    speaker_name: string;
    role: string;
    utterance_order: number;
    extractions: OntologyExtraction[];
}

// Global statistics for ontology population data
export interface OntologyGlobalStats {
    total_extractions: number;
    total_speaker_turns: number;
    unique_ontology_classes: number;
    unique_ontology_properties: number;
    mapping_status_counts: Record<MappingStatus, number>;
}

// Claim type distribution
export interface ClaimTypeInfo {
    name: string;
    count: number;
}

// Certainty level distribution
export interface CertaintyLevelInfo {
    level: string;
    count: number;
}

// Ontology class information
export interface OntologyClassInfo {
    name: string;
    count: number;
    role: 'subject' | 'object' | 'both';
}

// Ontology property information
export interface OntologyPropertyInfo {
    name: string;
    count: number;
    mapping_status: MappingStatus;
}
