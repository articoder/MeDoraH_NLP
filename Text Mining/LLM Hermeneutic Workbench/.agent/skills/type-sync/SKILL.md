---
name: type-sync
description: Synchronize TypeScript interfaces with Rust structs for Tauri IPC. Use when adding "new data types", fixing "type mismatch", or ensuring "frontend-backend type consistency".
---

# Type Synchronization (TypeScript ↔ Rust)

## Purpose

This skill ensures TypeScript interfaces and Rust structs stay synchronized. Type mismatches cause runtime IPC failures, so keeping them aligned is critical.

## When to Use

- User adds a "new data type" or "struct"
- User encounters "type mismatch" errors
- User modifies Rust structs that cross the IPC boundary
- User needs to "sync types" between frontend and backend

## Instructions

### Key Files

| Language | File | Purpose |
|----------|------|---------|
| Rust | `src-tauri/src/models/mod.rs` | Data structure definitions |
| TypeScript | `src/types/data.ts` | Frontend type definitions |

### Type Mapping Rules

| Rust Type | TypeScript Type |
|-----------|-----------------|
| `String` | `string` |
| `i32`, `i64`, `isize` | `number` |
| `u32`, `u64`, `usize` | `number` |
| `f32`, `f64` | `number` |
| `bool` | `boolean` |
| `Vec<T>` | `T[]` |
| `Option<T>` | `T \| undefined` or `T?` |
| `HashMap<K, V>` | `Record<K, V>` |
| `HashSet<T>` | `Set<T>` (rarely) or `T[]` |

### Field Naming

Rust uses `snake_case`, TypeScript typically uses `camelCase`. However, this project keeps **snake_case in both** for simplicity:

```rust
// Rust
#[derive(Serialize, Deserialize)]
pub struct Entity {
    pub name: String,
    pub entity_type: String,  // snake_case
}
```

```typescript
// TypeScript
export interface Entity {
    name: string;
    entity_type: string;  // Keep snake_case to match
}
```

### Adding a New Type

1. **Define in Rust** (`src-tauri/src/models/mod.rs`):
   ```rust
   #[derive(Debug, Clone, Serialize, Deserialize)]
   pub struct NewType {
       pub field_one: String,
       pub field_two: i32,
       #[serde(default)]
       pub optional_field: Option<String>,
   }
   ```

2. **Mirror in TypeScript** (`src/types/data.ts`):
   ```typescript
   export interface NewType {
       field_one: string;
       field_two: number;
       optional_field?: string;
   }
   ```

## Examples

### Current Entity Type Sync

**Rust:**
```rust
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Entity {
    pub name: String,
    pub entity_type: String,
}
```

**TypeScript:**
```typescript
export interface Entity {
    name: string;
    entity_type: string;
}
```

### Current Extraction Type Sync

**Rust:**
```rust
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Extraction {
    pub subject_entity: Entity,
    pub relation: Relation,
    pub object_entity: Entity,
    pub evidence_text: String,
    #[serde(default)]
    pub evidence_sources: Vec<String>,
}
```

**TypeScript:**
```typescript
export interface Extraction {
    subject_entity: Entity;
    relation: Relation;
    object_entity: Entity;
    evidence_text: string;
    evidence_sources?: string[];
}
```

## Common Pitfalls

1. **Forgetting `#[serde(default)]`**: Required for optional fields in Rust
2. **Field name mismatch**: Must be exact match including case
3. **Missing derive macros**: Rust structs need `Serialize, Deserialize`
4. **Nested type sync**: If struct A contains struct B, both must be synced

## Verification

1. Rust compiles without serde errors
2. Frontend TypeScript shows no type errors
3. IPC calls successfully deserialize data
4. Console shows expected data structure (use `console.log` to inspect)
