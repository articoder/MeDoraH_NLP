# Agents.md

This file provides guidance to AI coding agents when working with code in this repository.

## Project Overview

This is a text mining project focused on semantic triple analysis and visualization. The project generates interactive HTML dashboards from JSON data containing extracted semantic triples (subject-relation-object) from text sources, primarily interview transcripts.

## Core Architecture

### Project Structure
```
Dashboard 1205/
├── generate_report_modern.py       # Python report generator with Jinja2
├── template_modern.html.j2         # Main template (~386 lines) with partials
├── templates/
│   └── partials/
│       ├── _navbar.html.j2         # Navigation bar, search, filter status
│       ├── _global_summary.html.j2 # Statistics summary card
│       ├── _sidebar.html.j2        # Export, entity filters, pattern analytics
│       └── _network_modal.html.j2  # Network visualization modal
├── static/
│   ├── css/
│   │   ├── design-tokens.css       # CSS variables, colors, typography
│   │   ├── components.css          # UI component styles
│   │   └── network-modal.css       # Network visualization styles
│   └── js/
│       ├── utils.js                # Animation, download helpers
│       ├── filter-engine.js        # FilterTracker class
│       ├── network-viz.js          # NetworkRenderer, ModalManager
│       └── main.js                 # Entry point, event handlers
└── *.json                          # Input data files
```

### Main Components
- **`generate_report_modern.py`**: Primary report generation script (Version 2.0) with Jinja2 partials support
- **`semantic_triple_analysis.py`**: Advanced analytics script for semantic triple analysis using pandas, networkx, and pyvis
- **`template_modern.html.j2`**: Modular Jinja2 template using includes for navbar, sidebar, global summary, and network modal

### Data Flow Architecture
1. **Input Processing**: JSON parsing with validation (must be array of speaker turns)
2. **Analytics Engine**: Multi-pass analysis computing entity frequency, structural patterns, cardinality analysis, and diversity metrics
3. **Template Rendering**: Jinja2 processing with partials support
4. **Output Generation**: Self-contained HTML with external CSS/JS files

## Development Commands

### Generate HTML Report
```bash
python3 generate_report_modern.py --input Combined_Interviews.json --output report.html
python3 generate_report_modern.py -i <input_file.json> -o <output_file.html>
```

### Common Development Tasks
```bash
# Quick test with report generator
python3 generate_report_modern.py -i extracted_data.json -o test.html

# Validate JSON structure
python3 -c "import json; data=json.load(open('extracted_data.json')); print(f'Valid JSON with {len(data)} turns')"

# Open generated report in browser (macOS)
open test.html
```

### Dependencies
Required Python version: 3.12+

**Core dependencies:**
```bash
pip install jinja2
```

**Advanced analytics dependencies:**
```bash
pip install pandas numpy networkx matplotlib seaborn pyvis
```

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
- `report_title`: Dashboard title string
- `global_stats`: Aggregated metrics (total_extractions, total_speaker_turns, unique_entity_types, unique_entity_names, unique_relations)
- `speaker_turns`: Full speaker turn data with extractions
- `all_entity_types`: Sorted entity types with frequency and utterance counts
- `entity_types_high_freq/medium_freq/low_freq`: Categorized entity types by utterance frequency
- `most_frequent_patterns`: Structural pattern rankings
- `multi_typed_entities`: Entities appearing as multiple types
- `one_to_one_relations_sorted/one_to_many_relations_sorted/many_to_one_relations_sorted`: Cardinality patterns

## Configuration Constants

### generate_report_modern.py
- `TEMPLATE_FILE = "template_modern.html.j2"`: Main template file
- `PATTERN_RANKING_COUNT = 150`: Number of top patterns to analyze
- `DIVERSE_RELATION_COUNT = 20`: Number of diverse relations to display

### Design System (design-tokens.css)
- **Background**: Clean white (`#FFFFFF`) with subtle secondary (`#F7F7F8`)
- **Typography**: Inter for body, PT Sans Narrow for UI elements, Source Code Pro for code
- **Accent Colors**: Primary (`#3A87FD`), Secondary (`#E07C3A`), Tertiary (`#5BB98C`)
- **Entity Badge Colors**: High frequency (blue), Medium (orange), Low (green/teal)

## JavaScript Architecture

### External JS Files (static/js/)
| File | Purpose |
|------|---------|
| `utils.js` | `animateNumber()`, `downloadCSV()`, `downloadJSON()`, DOM helpers. Exposed globally via `window`. |
| `filter-engine.js` | `FilterTracker` class with BFS graph traversal, multi-hop expansion. Exposed via `window.FilterTracker`. |
| `network-viz.js` | `NetworkRenderer` (~800 lines) for vis.js network, `ModalManager` (~300 lines) for modal controls. Exposed globally. |
| `main.js` | Entry point: navigation UI, filter state, `masterUpdate()`, pattern display controls. |

### Jinja2 Data Injection
A small inline `<script>` block remains in `template_modern.html.j2` for:
- `window.rawTripleData` from `{{ speaker_turns | tojson }}`
- Export functions using Jinja2 expressions (`{{ all_entity_types | tojson }}`)

## Template Features

### Interactive Capabilities
- **Real-time filtering**: Filter by entity types, relations, and structural patterns
- **Text search**: Search across entity names, evidence text, and metadata
- **Collapsible sections**: Analytics panels collapse/expand for cleaner interface
- **CSV/JSON export**: Export entity types, patterns, and filtered triples
- **Animated statistics**: Number counting animation on filter changes

### Network Visualization Modal
- **vis.js Integration**: CDN-loaded library with fallback support
- **Interactive Controls**: Physics toggle, node/edge labels, hop distance (0-2), clustering, node search
- **Export Options**: PNG image, JSON data, CSV edges
- **Keyboard Shortcuts**: P (physics), L (labels), F (fit), C (cluster)

### HTML Partials (templates/partials/)
| Partial | Content |
|---------|---------|
| `_navbar.html.j2` | App bar, View Layers dropdown, Statistics/Models/Ontology nav items, expandable search, filter status display |
| `_global_summary.html.j2` | 5 stat cards: Total Extractions, Speaker Turns, Unique Entities, Entity Types, Relations |
| `_sidebar.html.j2` | Export panel, Entity Types filter (3 frequency tiers), Pattern Analytics (multi-typed, cardinality, structural patterns) |
| `_network_modal.html.j2` | Full-screen modal with controls, legend, loading state, network container |

## Recent Updates (2025-12)

### Template Modularization
- Extracted CSS to `static/css/` (design-tokens, components, network-modal)
- Extracted JavaScript to `static/js/` (utils, filter-engine, network-viz, main)
- Created HTML partials in `templates/partials/`
- Reduced main template from ~4031 lines to ~386 lines (90% reduction)
- Updated `generate_report_modern.py` with partials directory support

### Visual Redesign
- Modern minimalist design aesthetic (Anthropic/OpenAI inspired)
- Card-based layout with subtle shadows and 12px border radius
- Three-tier entity frequency classification with color-coded badges
- Fixed position Visualise and Back-to-Top buttons

### UI/UX Improvements
- Expandable search bar in navigation
- Dynamic layer indicator next to title
- Configurable pattern display count and sort toggle
- Animated global summary statistics on filter changes