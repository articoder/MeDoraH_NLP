//! Data models for Ontology Population analysis
//! These structures match the richer JSON schema with ontology mappings, epistemic stances, and provenance

use serde::{Deserialize, Serialize};
use std::collections::{HashMap, HashSet};

/// Ontology mapping for entities and relations
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct OntologyMapping {
    pub mapping_status: String, // "mapped" | "unmapped" | "uncertain"
    #[serde(default)]
    pub class: Option<String>,      // Used for entity classes
    #[serde(default)]
    pub property: Option<String>,   // Used for relation properties
}

/// Entity with ontology mapping
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct OntologyEntity {
    pub canonical_name: String,
    pub ontology_mapping: OntologyMapping,
}

/// Relation with ontology mapping and negation flag
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct OntologyRelation {
    pub surface_form: String,
    pub ontology_mapping: OntologyMapping,
    #[serde(default)]
    pub is_negated: bool,
}

/// Claim type classification
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ClaimType {
    pub mapping_status: String,
    pub class: String,
}

/// Epistemic stance capturing the nature of knowledge claims
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct EpistemicStance {
    pub claim_type: Vec<ClaimType>,
    pub certainty_level: OntologyMapping,
    pub temporal_grounding: OntologyMapping,
    #[serde(default)]
    pub attribution_type: Option<String>,
}

/// Reasoning/justification for mapping decisions
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Reasons {
    pub sub_obj_classes: String,
    pub relation: String,
    pub epistemic_stance: String,
}

/// Provenance/evidence information
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Provenance {
    pub evidence_sentence_ids: Vec<String>,
    pub evidence_text: String,
}

/// A single ontology extraction (rich semantic triple)
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct OntologyExtraction {
    pub extraction_id: String,
    pub subject: OntologyEntity,
    pub relation: OntologyRelation,
    pub object: OntologyEntity,
    pub epistemic_stance: EpistemicStance,
    pub reasons: Reasons,
    pub provenance: Provenance,
}

/// Speaker turn containing ontology extractions
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct OntologySpeakerTurn {
    pub speaker_name: String,
    pub role: String,
    pub utterance_order: i32,
    pub extractions: Vec<OntologyExtraction>,
}

/// Global statistics for ontology population data
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct OntologyGlobalStats {
    pub total_extractions: usize,
    pub total_speaker_turns: usize,
    pub unique_ontology_classes: usize,
    pub unique_ontology_properties: usize,
    pub mapped_count: usize,
    pub unmapped_count: usize,
    pub uncertain_count: usize,
}

/// Claim type distribution
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ClaimTypeInfo {
    pub name: String,
    pub count: usize,
}

/// Certainty level distribution
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CertaintyLevelInfo {
    pub level: String,
    pub count: usize,
}

/// Ontology class information
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct OntologyClassInfo {
    pub name: String,
    pub count: usize,
    pub role: String, // "subject" | "object" | "both"
}

/// Ontology property information
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct OntologyPropertyInfo {
    pub name: String,
    pub count: usize,
    pub mapping_status: String,
}

/// Complete analysis result for ontology population data
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct OntologyAnalysisResult {
    pub speaker_turns: Vec<OntologySpeakerTurn>,
    pub global_stats: OntologyGlobalStats,
    pub ontology_classes: Vec<OntologyClassInfo>,
    pub ontology_properties: Vec<OntologyPropertyInfo>,
    pub claim_type_distribution: Vec<ClaimTypeInfo>,
    pub certainty_level_distribution: Vec<CertaintyLevelInfo>,
}

impl OntologyAnalysisResult {
    /// Analyze speaker turns and compute all analytics
    pub fn from_speaker_turns(speaker_turns: Vec<OntologySpeakerTurn>) -> Self {
        let mut total_extractions = 0;
        let mut mapped_count = 0;
        let mut unmapped_count = 0;
        let mut uncertain_count = 0;
        
        let mut ontology_classes: HashMap<String, (usize, HashSet<String>)> = HashMap::new();
        let mut ontology_properties: HashMap<String, (usize, String)> = HashMap::new();
        let mut claim_types: HashMap<String, usize> = HashMap::new();
        let mut certainty_levels: HashMap<String, usize> = HashMap::new();

        for turn in &speaker_turns {
            total_extractions += turn.extractions.len();

            for extraction in &turn.extractions {
                // Count mapping statuses for subject
                match extraction.subject.ontology_mapping.mapping_status.as_str() {
                    "mapped" => mapped_count += 1,
                    "unmapped" => unmapped_count += 1,
                    "uncertain" => uncertain_count += 1,
                    _ => {}
                }
                
                // Count mapping statuses for object
                match extraction.object.ontology_mapping.mapping_status.as_str() {
                    "mapped" => mapped_count += 1,
                    "unmapped" => unmapped_count += 1,
                    "uncertain" => uncertain_count += 1,
                    _ => {}
                }
                
                // Count mapping statuses for relation
                match extraction.relation.ontology_mapping.mapping_status.as_str() {
                    "mapped" => mapped_count += 1,
                    "unmapped" => unmapped_count += 1,
                    "uncertain" => uncertain_count += 1,
                    _ => {}
                }

                // Track ontology classes
                if let Some(ref class) = extraction.subject.ontology_mapping.class {
                    let entry = ontology_classes.entry(class.clone()).or_insert((0, HashSet::new()));
                    entry.0 += 1;
                    entry.1.insert("subject".to_string());
                }
                if let Some(ref class) = extraction.object.ontology_mapping.class {
                    let entry = ontology_classes.entry(class.clone()).or_insert((0, HashSet::new()));
                    entry.0 += 1;
                    entry.1.insert("object".to_string());
                }

                // Track ontology properties
                if let Some(ref property) = extraction.relation.ontology_mapping.property {
                    let entry = ontology_properties.entry(property.clone())
                        .or_insert((0, extraction.relation.ontology_mapping.mapping_status.clone()));
                    entry.0 += 1;
                }

                // Track claim types
                for ct in &extraction.epistemic_stance.claim_type {
                    *claim_types.entry(ct.class.clone()).or_insert(0) += 1;
                }

                // Track certainty levels
                if let Some(ref level) = extraction.epistemic_stance.certainty_level.class {
                    *certainty_levels.entry(level.clone()).or_insert(0) += 1;
                }
            }
        }

        // Build ontology classes list
        let mut ontology_classes_list: Vec<OntologyClassInfo> = ontology_classes
            .into_iter()
            .map(|(name, (count, roles))| {
                let role = if roles.len() > 1 {
                    "both".to_string()
                } else {
                    roles.into_iter().next().unwrap_or_default()
                };
                OntologyClassInfo { name, count, role }
            })
            .collect();
        ontology_classes_list.sort_by(|a, b| b.count.cmp(&a.count));

        // Build ontology properties list
        let mut ontology_properties_list: Vec<OntologyPropertyInfo> = ontology_properties
            .into_iter()
            .map(|(name, (count, mapping_status))| OntologyPropertyInfo {
                name,
                count,
                mapping_status,
            })
            .collect();
        ontology_properties_list.sort_by(|a, b| b.count.cmp(&a.count));

        // Build claim type distribution
        let mut claim_type_distribution: Vec<ClaimTypeInfo> = claim_types
            .into_iter()
            .map(|(name, count)| ClaimTypeInfo { name, count })
            .collect();
        claim_type_distribution.sort_by(|a, b| b.count.cmp(&a.count));

        // Build certainty level distribution
        let mut certainty_level_distribution: Vec<CertaintyLevelInfo> = certainty_levels
            .into_iter()
            .map(|(level, count)| CertaintyLevelInfo { level, count })
            .collect();
        certainty_level_distribution.sort_by(|a, b| b.count.cmp(&a.count));

        let global_stats = OntologyGlobalStats {
            total_extractions,
            total_speaker_turns: speaker_turns.len(),
            unique_ontology_classes: ontology_classes_list.len(),
            unique_ontology_properties: ontology_properties_list.len(),
            mapped_count,
            unmapped_count,
            uncertain_count,
        };

        OntologyAnalysisResult {
            speaker_turns,
            global_stats,
            ontology_classes: ontology_classes_list,
            ontology_properties: ontology_properties_list,
            claim_type_distribution,
            certainty_level_distribution,
        }
    }
}
