//! Data models for Semantic Triple analysis
//! These structures match the JSON schema used by the LLM Hermeneutic Workbench

pub mod ontology_models;

use serde::{Deserialize, Serialize};
use std::collections::{HashMap, HashSet};

/// Entity in a semantic triple (subject or object)
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Entity {
    pub name: String,
    pub entity_type: String,
}

/// Relation in a semantic triple
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Relation {
    pub surface_form: String,
    pub semantic_form: String,
}

/// A single extraction (semantic triple with evidence)
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Extraction {
    pub subject_entity: Entity,
    pub relation: Relation,
    pub object_entity: Entity,
    pub evidence_text: String,
    #[serde(default)]
    pub evidence_sources: Vec<String>,
}

/// A speaker turn containing multiple extractions
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SpeakerTurn {
    pub speaker_name: String,
    pub role: String,
    pub utterance_order: i32,
    pub extractions: Vec<Extraction>,
    #[serde(default)]
    pub extraction_count: Option<i32>,
    #[serde(default)]
    pub source: Option<String>,
    #[serde(default)]
    pub metadata_source_file: Option<String>,
    #[serde(default)]
    pub metadata_interview_id: Option<String>,
}

/// Global statistics computed from the data
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GlobalStats {
    pub total_extractions: usize,
    pub total_speaker_turns: usize,
    pub unique_entity_types: usize,
    pub unique_entity_names: usize,
    pub unique_relations: usize,
}

/// Entity type information with frequency counts
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct EntityTypeInfo {
    pub name: String,
    pub count: usize,
    pub utterance_count: usize,
}

/// Structural pattern (subject_type -> relation -> object_type)
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct StructuralPattern {
    pub subject_type: String,
    pub relation: String,
    pub object_type: String,
    pub count: usize,
}

/// Relation diversity metrics
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RelationDiversity {
    pub relation: String,
    pub domain_size: usize,
    pub range_size: usize,
    pub total_diversity: usize,
}

/// Complete analysis result returned to the frontend
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AnalysisResult {
    pub speaker_turns: Vec<SpeakerTurn>,
    pub global_stats: GlobalStats,
    pub entity_types: Vec<EntityTypeInfo>,
    pub entity_types_high_freq: Vec<EntityTypeInfo>,
    pub entity_types_medium_freq: Vec<EntityTypeInfo>,
    pub entity_types_low_freq: Vec<EntityTypeInfo>,
    pub structural_patterns: Vec<StructuralPattern>,
    pub relation_frequency_map: HashMap<String, usize>,
    pub multi_typed_entities: HashMap<String, Vec<String>>,
    pub subject_only_types: Vec<String>,
    pub object_only_types: Vec<String>,
    pub top_diverse_relations: Vec<RelationDiversity>,
}

impl AnalysisResult {
    /// Analyze speaker turns and compute all analytics
    pub fn from_speaker_turns(mut speaker_turns: Vec<SpeakerTurn>) -> Self {
        let mut entity_type_counts: HashMap<String, usize> = HashMap::new();
        let mut entity_utterance_tracker: HashMap<String, HashSet<(String, i32)>> = HashMap::new();
        let mut structural_pattern_counts: HashMap<(String, String, String), usize> = HashMap::new();
        let mut multi_type_entities: HashMap<String, HashSet<String>> = HashMap::new();
        let mut all_subject_types: HashSet<String> = HashSet::new();
        let mut all_object_types: HashSet<String> = HashSet::new();
        let mut relation_domain: HashMap<String, HashSet<String>> = HashMap::new();
        let mut relation_range: HashMap<String, HashSet<String>> = HashMap::new();
        let mut relation_frequency_map: HashMap<String, usize> = HashMap::new();
        let mut unique_entity_names: HashSet<String> = HashSet::new();
        let mut unique_relations: HashSet<String> = HashSet::new();
        let mut total_extractions = 0;

        // Process all speaker turns
        for turn in &mut speaker_turns {
            let turn_id = (turn.speaker_name.clone(), turn.utterance_order);
            turn.extraction_count = Some(turn.extractions.len() as i32);
            total_extractions += turn.extractions.len();

            for extraction in &turn.extractions {
                let subj_name = &extraction.subject_entity.name;
                let subj_type = &extraction.subject_entity.entity_type;
                let rel_form = &extraction.relation.semantic_form;
                let obj_name = &extraction.object_entity.name;
                let obj_type = &extraction.object_entity.entity_type;

                // Track unique relations
                if !rel_form.is_empty() {
                    unique_relations.insert(rel_form.clone());
                    *relation_frequency_map.entry(rel_form.clone()).or_insert(0) += 1;
                }

                // Track subject entity
                if !subj_type.is_empty() {
                    *entity_type_counts.entry(subj_type.clone()).or_insert(0) += 1;
                    entity_utterance_tracker
                        .entry(subj_type.clone())
                        .or_default()
                        .insert(turn_id.clone());
                    all_subject_types.insert(subj_type.clone());
                    
                    if !subj_name.is_empty() {
                        multi_type_entities
                            .entry(subj_name.clone())
                            .or_default()
                            .insert(subj_type.clone());
                        unique_entity_names.insert(subj_name.clone());
                    }
                }

                // Track object entity
                if !obj_type.is_empty() {
                    *entity_type_counts.entry(obj_type.clone()).or_insert(0) += 1;
                    entity_utterance_tracker
                        .entry(obj_type.clone())
                        .or_default()
                        .insert(turn_id.clone());
                    all_object_types.insert(obj_type.clone());
                    
                    if !obj_name.is_empty() {
                        multi_type_entities
                            .entry(obj_name.clone())
                            .or_default()
                            .insert(obj_type.clone());
                        unique_entity_names.insert(obj_name.clone());
                    }
                }

                // Track structural patterns
                if !subj_type.is_empty() && !rel_form.is_empty() && !obj_type.is_empty() {
                    let pattern = (subj_type.clone(), rel_form.clone(), obj_type.clone());
                    *structural_pattern_counts.entry(pattern).or_insert(0) += 1;
                    
                    relation_domain
                        .entry(rel_form.clone())
                        .or_default()
                        .insert(subj_type.clone());
                    relation_range
                        .entry(rel_form.clone())
                        .or_default()
                        .insert(obj_type.clone());
                }
            }
        }

        // Build entity types list sorted by count
        let mut entity_types: Vec<EntityTypeInfo> = entity_type_counts
            .iter()
            .map(|(name, count)| EntityTypeInfo {
                name: name.clone(),
                count: *count,
                utterance_count: entity_utterance_tracker
                    .get(name)
                    .map(|s| s.len())
                    .unwrap_or(0),
            })
            .collect();
        entity_types.sort_by(|a, b| b.count.cmp(&a.count));

        // Categorize by frequency
        let entity_types_high_freq: Vec<EntityTypeInfo> = entity_types
            .iter()
            .filter(|e| e.utterance_count > 3)
            .cloned()
            .collect();
        let entity_types_medium_freq: Vec<EntityTypeInfo> = entity_types
            .iter()
            .filter(|e| e.utterance_count >= 2 && e.utterance_count <= 3)
            .cloned()
            .collect();
        let entity_types_low_freq: Vec<EntityTypeInfo> = entity_types
            .iter()
            .filter(|e| e.utterance_count < 2)
            .cloned()
            .collect();

        // Build structural patterns list sorted by count
        let mut structural_patterns: Vec<StructuralPattern> = structural_pattern_counts
            .into_iter()
            .map(|((s, r, o), count)| StructuralPattern {
                subject_type: s,
                relation: r,
                object_type: o,
                count,
            })
            .collect();
        structural_patterns.sort_by(|a, b| b.count.cmp(&a.count));

        // Multi-typed entities (entities with more than one type)
        let multi_typed_entities: HashMap<String, Vec<String>> = multi_type_entities
            .into_iter()
            .filter(|(_, types)| types.len() > 1)
            .map(|(name, types)| {
                let mut types_vec: Vec<String> = types.into_iter().collect();
                types_vec.sort();
                (name, types_vec)
            })
            .collect();

        // Subject-only and object-only types
        let subject_only_types: Vec<String> = all_subject_types
            .difference(&all_object_types)
            .cloned()
            .collect();
        let object_only_types: Vec<String> = all_object_types
            .difference(&all_subject_types)
            .cloned()
            .collect();

        // Top diverse relations
        let all_rels: HashSet<String> = relation_domain
            .keys()
            .chain(relation_range.keys())
            .cloned()
            .collect();
        let mut top_diverse_relations: Vec<RelationDiversity> = all_rels
            .into_iter()
            .map(|rel| {
                let domain_size = relation_domain.get(&rel).map(|s| s.len()).unwrap_or(0);
                let range_size = relation_range.get(&rel).map(|s| s.len()).unwrap_or(0);
                RelationDiversity {
                    relation: rel,
                    domain_size,
                    range_size,
                    total_diversity: domain_size + range_size,
                }
            })
            .collect();
        top_diverse_relations.sort_by(|a, b| b.total_diversity.cmp(&a.total_diversity));
        top_diverse_relations.truncate(20);

        // Build global stats
        let global_stats = GlobalStats {
            total_extractions,
            total_speaker_turns: speaker_turns.len(),
            unique_entity_types: entity_types.len(),
            unique_entity_names: unique_entity_names.len(),
            unique_relations: unique_relations.len(),
        };

        AnalysisResult {
            speaker_turns,
            global_stats,
            entity_types,
            entity_types_high_freq,
            entity_types_medium_freq,
            entity_types_low_freq,
            structural_patterns,
            relation_frequency_map,
            multi_typed_entities,
            subject_only_types,
            object_only_types,
            top_diverse_relations,
        }
    }
}
