// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/

mod commands;
mod models;

use commands::{load_json_file, load_raw_json};
use commands::ontology_commands::load_ontology_file;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_shell::init())
        .invoke_handler(tauri::generate_handler![
            load_json_file,
            load_raw_json,
            load_ontology_file
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

