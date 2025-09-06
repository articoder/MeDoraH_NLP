# Agents.md

This file provides guidance to OpenAI Codex agents when working with code in this repository.

## Project Overview

This is a text mining project focused on relation extraction analysis and visualization. The project generates interactive HTML dashboards from JSON data containing extracted semantic triples (subject-relation-object) from text sources, specifically from interview transcripts.

## Core Architecture

### Main Components
- **`generate_report_modern.py`**: Primary report generation script (Version 2.0) with streamlined template integration and network visualization
- **`semantic_triple_analysis.py`**: Advanced analytics script for comprehensive semantic triple analysis, network topology, and scientific visualization using pandas, networkx, and pyvis
- **`template_modern.html.j2`**: Self-contained Jinja2 template with embedded CSS/JS, responsive design, interactive filtering, and network visualization modal
- **`template_modern_fixed.html.j2`**: Stable template variant with resolved JavaScript issues
- **`template_modern_backup.html.j2`**: Backup template version
- **`extracted_data.json`**: Input data containing speaker turn objects with semantic triple extractions
- **Generated HTML reports**: Various output files (network reports, debug versions, etc.)

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

**Combined installation:**
```bash
pip install jinja2 pandas numpy networkx matplotlib seaborn pyvis
```

Standard library usage: `json`, `argparse`, `collections`, `sys`, `os`, `warnings`, `typing`

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

### Analytics Output Structure
The template receives comprehensive analysis data including:
- `global_stats`: Aggregated metrics across all extractions
- `all_entity_types`: Sorted entity types with frequency and utterance counts
- Pattern analysis: Most/least frequent structural patterns
- Advanced analytics: Multi-typed entities, cardinality patterns, domain/range diversity

## Configuration Constants

### Primary Version (generate_report_modern.py)
- `TEMPLATE_FILE = "template_modern.html.j2"`: Primary template with network visualization
- `PATTERN_RANKING_COUNT = 150`: Number of top/bottom patterns to analyze
- `DIVERSE_RELATION_COUNT = 20`: Number of most diverse relations to display

### Analytics Version (semantic_triple_analysis.py)
- Uses `extracted_data.json` as default input
- Generates comprehensive statistical analysis and network visualizations
- Creates multiple output formats (HTML, network graphs, statistical plots)

### Version Information
- **Primary version**: 2.0 (generate_report_modern.py:1) - Streamlined analytics with network visualization
- **Analytics version**: Advanced (semantic_triple_analysis.py:1) - Scientific analysis and visualization

### File Organization
- Templates must be co-located with respective scripts in same directory
- Output files generated with UTF-8 encoding
- Multiple output variants supported (professional, enhanced, modern, etc.)

### Key Differences Between Components
- **Primary (v2.0)**: Streamlined HTML report generation with network visualization modal, modern design aesthetics
- **Analytics (Advanced)**: Comprehensive statistical analysis, network topology metrics, scientific visualizations using pandas/networkx/matplotlib

## Template Features

### Interactive Capabilities
- Real-time filtering by entity types, relations, and structural patterns
- Text search across entity names
- Collapsible analytics sections
- CSV export functionality for entity types and structural patterns
- Responsive design with sticky navigation
- **Network visualization modal** with interactive graph display (integrated 2025-01)

### Visual Design System

**Standard Template (template.html.j2)**
- CSS custom properties for consistent theming
- Three-tier entity frequency classification (high >3, medium 2-3, low <2 utterances)
- Color-coded badges and interactive elements
- Professional typography using Inter and Source Code Pro fonts

**Modern Template (template_modern.html.j2)**
- Updated color palette with warm background (#FDFCF9) and modern accent colors
- Enhanced typography with improved spacing and contrast
- Streamlined visual hierarchy with updated CSS variables
- Modern card-based design with subtle shadows and rounded corners
- **Network visualization integration**: vis.js-powered interactive graphs in modal overlay
  - Visualise button in app bar for network graph access
  - Full-screen modal with responsive network container
  - Filter synchronization between dashboard and network view
  - Node coloring by entity type, edge labeling with relations
  - Physics simulation with user interaction controls

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

## Recent Updates (2025-01)

### Network Visualization Integration
Successfully integrated interactive network visualization functionality into the modern template:

**Technical Implementation:**
- **vis.js Library**: CDN-loaded network visualization library with fallback support
- **JavaScript Architecture**: Three-class modular system:
  - `FilterTracker`: Synchronizes dashboard filters with network data
  - `NetworkRenderer`: Handles vis.js network creation and rendering
  - `ModalManager`: Controls modal display and network generation timing
- **Data Processing**: Real-time conversion of semantic triples to network graph format
- **Container Management**: Automatic dimension validation and fallback sizing for proper rendering

**User Interface:**
- **Visualise Button**: Located in app bar (top-right) for easy access
- **Full-Screen Modal**: 96% viewport coverage with responsive design
- **Filter Integration**: Network respects all active dashboard filters (entity types, relations, patterns, search)
- **Interactive Features**: Node tooltips, edge labels, physics simulation, zoom/pan controls

**Resolved Issues:**
- Fixed "Cannot access uninitialized variable" JavaScript errors
- Improved modal timing and container dimension handling  
- Enhanced error handling with user-friendly feedback
- Stabilized network rendering with proper resize sequences

**Files Modified:**
- `template_modern.html.j2`: Added network visualization UI components and JavaScript classes
- Maintained backward compatibility with existing dashboard functionality

**Usage:**
```bash
python3 generate_report_modern.py -i extracted_data.json -o network_report.html
# Click "Visualise" button in generated report to access network view
```