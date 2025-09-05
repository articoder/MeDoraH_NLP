# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a text mining project focused on relation extraction analysis and visualization. The project generates interactive HTML dashboards from JSON data containing extracted semantic triples (subject-relation-object) from text sources, specifically from interview transcripts.

## Core Architecture

### Main Components
- **`generate_report.py`**: Core report generation script (Version 2.2) with sophisticated analytics engine and enhanced entity categorization
- **`generate_report_modern.py`**: Simplified version (Version 2.0) with streamlined template integration
- **`template.html.j2`**: Self-contained Jinja2 template with embedded CSS/JS, responsive design, and interactive filtering
- **`template_modern.html.j2`**: Modern design variant with updated color scheme and typography
- **`extracted_data.json`**: Input data containing speaker turn objects with semantic triple extractions
- **`report_light.html`**: Generated HTML dashboard output

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

**Standard Version (v2.2 - Enhanced Analytics)**
```bash
python3 generate_report.py --input extracted_data.json --output report_light.html
python3 generate_report.py -i <input_file.json> -o <output_file.html>
```

**Modern Version (v2.0 - Streamlined)**
```bash
python3 generate_report_modern.py --input extracted_data.json --output report_modern.html
python3 generate_report_modern.py -i <input_file.json> -o <output_file.html>
```

### Common Development Tasks
```bash
# Quick test with existing data (standard version)
python3 generate_report.py -i extracted_data.json -o test_output.html

# Quick test with modern version
python3 generate_report_modern.py -i extracted_data.json -o test_modern.html

# Validate JSON structure
python3 -c "import json; data=json.load(open('extracted_data.json')); print(f'Valid JSON with {len(data)} turns')"
```

### Dependencies Management
Required Python version: 3.12+

Core dependencies:
```bash
pip install jinja2
```

Standard library usage: `json`, `argparse`, `collections`, `sys`, `os`

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

### Standard Version (generate_report.py)
- `TEMPLATE_FILE = "template.html.j2"`: Template filename (must be in same directory)
- `PATTERN_RANKING_COUNT = 150`: Number of top/bottom patterns to analyze
- `DIVERSE_RELATION_COUNT = 20`: Number of most diverse relations to display

### Modern Version (generate_report_modern.py)
- `TEMPLATE_FILE = "template_modern.html.j2"`: Modern template variant
- `PATTERN_RANKING_COUNT = 150`: Number of top/bottom patterns to analyze
- `DIVERSE_RELATION_COUNT = 20`: Number of most diverse relations to display

### Version Information
- **Standard version**: 2.2 (generate_report.py:1) - Enhanced with entity categorization
- **Modern version**: 2.0 (generate_report_modern.py:1) - Streamlined analytics

### File Organization
- Templates must be co-located with respective scripts in same directory
- Output files generated with UTF-8 encoding
- Multiple output variants supported (professional, enhanced, modern, etc.)

### Key Differences Between Versions
- **Standard (v2.2)**: Advanced entity frequency categorization (high/medium/low), enhanced template data structure
- **Modern (v2.0)**: Simplified analytics pipeline, unified entity type processing, modern design aesthetics

## Template Features

### Interactive Capabilities
- Real-time filtering by entity types, relations, and structural patterns
- Text search across entity names
- Collapsible analytics sections
- CSV export functionality for entity types and structural patterns
- Responsive design with sticky navigation

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