---
name: tauri-command
description: Add new Rust Tauri IPC commands to the backend. Use when adding "backend functionality", "Rust command", "IPC command", or "Tauri invoke" functionality.
---

# Tauri Command Creation

## Purpose

This skill defines how to create new Tauri IPC commands in Rust that can be called from the React frontend. Commands bridge the gap between the TypeScript UI and Rust backend.

## When to Use

- User asks to "add a backend command" or "Tauri command"
- User needs to "call Rust from frontend"
- User wants to "add file system access" or other native functionality
- User asks for "IPC functionality"

## Instructions

### 1. Define the Rust Command

File: `hermeneutic-workbench/src-tauri/src/commands/mod.rs`

```rust
/// Description of what the command does
#[tauri::command]
pub async fn my_new_command(param1: String, param2: i32) -> Result<ReturnType, CommandError> {
    // Implementation
    Ok(result)
}
```

### 2. Register the Command

File: `hermeneutic-workbench/src-tauri/src/lib.rs`

Add to the `invoke_handler`:

```rust
.invoke_handler(tauri::generate_handler![
    commands::load_json_file,
    commands::load_raw_json,
    commands::my_new_command,  // Add new command here
])
```

### 3. Create TypeScript Types

File: `hermeneutic-workbench/src/types/data.ts`

Ensure matching TypeScript interfaces exist for any Rust structs:

```typescript
export interface ReturnType {
  field1: string;
  field2: number;
}
```

### 4. Call from Frontend

```typescript
import { invoke } from '@tauri-apps/api/core';

const result = await invoke<ReturnType>('my_new_command', {
  param1: 'value',
  param2: 42
});
```

## Examples

### Existing Command: load_json_file

```rust
// src-tauri/src/commands/mod.rs
#[tauri::command]
pub async fn load_json_file(path: String) -> Result<AnalysisResult, CommandError> {
    let contents = fs::read_to_string(&path)?;
    let speaker_turns: Vec<SpeakerTurn> = serde_json::from_str(&contents)?;
    let result = AnalysisResult::from_speaker_turns(speaker_turns);
    Ok(result)
}
```

### Error Handling Pattern

```rust
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
```

### Complete Example: Add a Save Command

**Rust side:**
```rust
#[tauri::command]
pub async fn save_json_file(path: String, data: Vec<SpeakerTurn>) -> Result<(), CommandError> {
    let json = serde_json::to_string_pretty(&data)?;
    fs::write(&path, json)?;
    Ok(())
}
```

**TypeScript side:**
```typescript
import { invoke } from '@tauri-apps/api/core';

async function saveData(path: string, data: SpeakerTurn[]) {
  await invoke('save_json_file', { path, data });
}
```

## Common Pitfalls

1. **Forgetting to register**: Command must be in `invoke_handler` macro
2. **Type mismatches**: Rust struct field names must match TypeScript exactly (use `snake_case` in Rust, converted to `camelCase` or kept as `snake_case`)
3. **Missing serde derives**: Ensure `#[derive(Serialize, Deserialize)]` on all types
4. **Async issues**: Commands should be `async fn` for non-blocking behavior

## Verification

1. Run `npm run tauri dev` - Rust compiles without errors
2. Call command from frontend - no runtime errors
3. Check browser console for IPC response
4. Use `load_raw_json` pattern for debugging data flow
