//! Tauri commands for data loading and processing

pub mod ontology_commands;

use crate::models::{AnalysisResult, SpeakerTurn};
use std::fs;
use thiserror::Error;

#[derive(Debug, Error)]
pub enum CommandError {
    #[error("Failed to read file: {0}")]
    IoError(#[from] std::io::Error),
    #[error("Failed to parse JSON: {0}")]
    JsonError(#[from] serde_json::Error),
}

impl serde::Serialize for CommandError {
    fn serialize<S>(&self, serializer: S) -> Result<S::Ok, S::Error>
    where
        S: serde::Serializer,
    {
        serializer.serialize_str(&self.to_string())
    }
}

/// Load and analyze a JSON file containing semantic triple data
#[tauri::command]
pub async fn load_json_file(path: String) -> Result<AnalysisResult, CommandError> {
    // Read the file
    let contents = fs::read_to_string(&path)?;
    
    // Parse JSON as array of speaker turns
    let speaker_turns: Vec<SpeakerTurn> = serde_json::from_str(&contents)?;
    
    // Perform analysis
    let result = AnalysisResult::from_speaker_turns(speaker_turns);
    
    Ok(result)
}

/// Get the raw JSON data without analysis (for debugging or direct access)
#[tauri::command]
pub async fn load_raw_json(path: String) -> Result<Vec<SpeakerTurn>, CommandError> {
    let contents = fs::read_to_string(&path)?;
    let speaker_turns: Vec<SpeakerTurn> = serde_json::from_str(&contents)?;
    Ok(speaker_turns)
}
