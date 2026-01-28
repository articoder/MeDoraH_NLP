//! Tauri commands for ontology population data loading and processing

use crate::models::ontology_models::{OntologyAnalysisResult, OntologySpeakerTurn};
use std::fs;
use thiserror::Error;

#[derive(Debug, Error)]
pub enum OntologyCommandError {
    #[error("Failed to read file: {0}")]
    IoError(#[from] std::io::Error),
    #[error("Failed to parse JSON: {0}")]
    JsonError(#[from] serde_json::Error),
}

impl serde::Serialize for OntologyCommandError {
    fn serialize<S>(&self, serializer: S) -> Result<S::Ok, S::Error>
    where
        S: serde::Serializer,
    {
        serializer.serialize_str(&self.to_string())
    }
}

/// Load and analyze a JSON file containing ontology population data
#[tauri::command]
pub async fn load_ontology_file(path: String) -> Result<OntologyAnalysisResult, OntologyCommandError> {
    // Read the file
    let contents = fs::read_to_string(&path)?;
    
    // Parse JSON as array of speaker turns
    let speaker_turns: Vec<OntologySpeakerTurn> = serde_json::from_str(&contents)?;
    
    // Perform analysis
    let result = OntologyAnalysisResult::from_speaker_turns(speaker_turns);
    
    Ok(result)
}
