# Agents.md

This file provides guidance to AI coding agents when working with code in this repository.

## Project Overview

This is a text mining project focused on semantic triple analysis and visualization. The project generates interactive HTML dashboards from JSON data containing extracted semantic triples (subject-relation-object) from text sources, primarily interview transcripts.

## Core Architecture

### Main Components
- **`generate_report_modern.py`**: Primary report generation script (Version 2.0) with streamlined template integration and network visualization
- **`semantic_triple_analysis.py`**: Advanced analytics script for comprehensive semantic triple analysis, network topology, and scientific visualization using pandas, networkx, and pyvis
- **`template_modern.html.j2`**: Self-contained Jinja2 template (~3500 lines) with embedded CSS/JS, responsive design, interactive filtering, and network visualization modal
- **`extracted_data.json`**: Sample input data containing speaker turn objects with semantic triple extractions

### Data Flow Architecture
1. **Input Processing**: JSON parsing with validation (must be array of speaker turns)
2. **Analytics Engine**: Multi-pass analysis computing:
   - Entity type frequency and utterance distribution
   - Structural pattern analysis (subject_type → relation → object_type)
   - Cardinality analysis (1:1, 1:N, N:1 relations)
   - Domain/range diversity metrics
   - Multi-typed entity detection
3. **Template Rendering**: Jinja2 processing with context data injection
4. **Output Generation**: Self-contained HTML with embedded assets

## Development Commands

### Generate HTML Report

**Primary Report Generation (v2.0)**
```bash
python3 generate_report_modern.py --input extracted_data.json --output report_modern.html
python3 generate_report_modern.py -i <input_file.json> -o <output_file.html>
```

**Advanced Analytics and Visualization**
```bash
python3 semantic_triple_analysis.py
```

### Common Development Tasks
```bash
# Quick test with primary report generator
python3 generate_report_modern.py -i extracted_data.json -o test_modern.html

# Run comprehensive analytics and visualization
python3 semantic_triple_analysis.py

# Validate JSON structure
python3 -c "import json; data=json.load(open('extracted_data.json')); print(f'Valid JSON with {len(data)} turns')"

# Open generated report in browser (macOS)
open test_modern.html
```

### Dependencies Management
Required Python version: 3.12+

**Core dependencies (report generation):**
```bash
pip install jinja2
```

**Advanced analytics dependencies:**
```bash
pip install pandas numpy networkx matplotlib seaborn pyvis
```

Standard library usage: `json`, `argparse`, `collections`, `sys`, `os`, `typing`

No external package management files (requirements.txt, setup.py) - minimal dependency approach.

## Data Structure Specification

### Input JSON Schema
```
Root: Array<SpeakerTurn>
SpeakerTurn: {
  speaker_name: string,
  role: string,
  utterance_order: number,
  extractions: Array<SemanticTriple>
}
SemanticTriple: {
  subject_entity: { name: string, entity_type: string },
  relation: { surface_form: string, semantic_form: string },
  object_entity: { name: string, entity_type: string },
  evidence_sources: Array<string>,
  evidence_text: string
}
```

### Template Context Variables
The template receives comprehensive analysis data including:
- `report_title`: Dashboard title string
- `global_stats`: Aggregated metrics (total_extractions, total_speaker_turns, unique_entity_types, unique_entity_names, unique_relations)
- `speaker_turns`: Full speaker turn data with extractions
- `all_entity_types`: Sorted entity types with frequency and utterance counts
- `entity_types_high_freq/medium_freq/low_freq`: Categorized entity types by utterance frequency
- `most_frequent_patterns/least_frequent_patterns`: Structural pattern rankings
- `multi_typed_entities`: Entities appearing as multiple types
- `subject_only_types/object_only_types`: Role-specific entity types
- `one_to_one_relations_sorted/one_to_many_relations_sorted/many_to_one_relations_sorted`: Cardinality patterns
- `top_diverse_relations`: Relations with highest domain/range diversity
- `relation_frequency_map`: Frequency counts for all relations

## Configuration Constants

### Primary Version (generate_report_modern.py)
- `TEMPLATE_FILE = "template_modern.html.j2"`: Primary template with network visualization
- `PATTERN_RANKING_COUNT = 150`: Number of top/bottom patterns to analyze
- `DIVERSE_RELATION_COUNT = 20`: Number of most diverse relations to display

### Template Design System
- **Background**: Clean white (`#FFFFFF`) with subtle secondary (`#F7F7F8`)
- **Typography**: Inter for body, PT Sans Narrow for UI elements, Source Code Pro for code
- **Accent Colors**: Primary (`#3A87FD`), Secondary (`#E07C3A`), Tertiary (`#5BB98C`)
- **Entity Badge Colors**: High frequency (blue), Medium (orange), Low (green/teal)

## Template Features

### Interactive Capabilities
- **Real-time filtering**: Filter by entity types, relations, and structural patterns
- **Text search**: Search across entity names, evidence text, and metadata
- **Collapsible sections**: Analytics panels collapse/expand for cleaner interface
- **CSV export**: Export entity types, patterns, and filtered triples
- **Responsive design**: Optimized for desktop with sticky navigation

### Network Visualization Modal
- **vis.js Integration**: CDN-loaded library with fallback support
- **Full-Screen Modal**: 96% viewport coverage with responsive design
- **Interactive Controls**:
  - Physics simulation toggle
  - Node/Edge label toggles with dropdown menu
  - Hop distance control (0, +1, +2 hops from selection)
  - Cluster toggle for entity type grouping
  - Node search within network
  - Fit-to-view functionality
- **Export Options**: PNG image, JSON data, CSV edges
- **Filter Synchronization**: Network respects all active dashboard filters
- **Keyboard Shortcuts**: P (physics), L (labels), F (fit), C (cluster)

### Sidebar Panels
1. **Export Panel**: Checkbox-based multi-export for entities, patterns, and triples
2. **Entity Types Panel**: Categorized entity type badges with frequency legend
3. **Pattern Analytics Panel**: Collapsible sections for:
   - Entity Type Patterns (multi-typed, subject-only, object-only)
   - Relation Cardinality Patterns (1:1, 1:N, N:1, diversity metrics)
   - Frequent Structural Patterns (configurable count, sort toggle)

### Visual Design Updates (2025-12)
- Modern minimalist aesthetic inspired by Anthropic/OpenAI design language
- Card-based layout with subtle shadows and 12px border radius
- Three-tier entity frequency classification with color-coded badges
- Elegant stat cards without gradient accent bars
- Fixed position Visualise and Back-to-Top buttons

## Error Handling

The script includes comprehensive error handling:
- JSON validation (ensures root is array)
- Template loading verification
- File I/O error management
- UTF-8 encoding enforcement
- Graceful exit with error reporting to stderr

## Claude Code Integration

### Permissions Configuration
Located in `.claude/settings.local.json`:
- WebSearch enabled
- Python3 execution allowed with pattern matching
- Git restore operations permitted

### Development Environment
- VS Code configuration supports Python/conda environments
- No external linting/testing frameworks configured
- Self-contained project with minimal external dependencies

## Recent Updates (2025-12)

### Visual Redesign
- Implemented modern, minimalist design aesthetic
- Updated color palette to professional standards
- Enhanced typography with improved spacing and contrast
- Streamlined card designs with refined shadows

### UI/UX Improvements
- Changed entity type badges to rounded rectangles
- Removed gradient accent bars from cards
- Added configurable pattern display count and sort toggle
- Fixed pattern filtering functionality
- Export options unselected by default

### Network Visualization Enhancements
- Added hop distance control for exploring node neighborhoods
- Implemented node clustering by entity type
- Added keyboard shortcuts for common actions
- Improved label toggle with dropdown menu
- Enhanced search functionality within network view