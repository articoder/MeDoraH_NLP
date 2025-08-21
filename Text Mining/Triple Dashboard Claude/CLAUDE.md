# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a text mining project focused on relation extraction analysis and visualization. The project generates interactive HTML dashboards from JSON data containing extracted semantic triples (subject-relation-object) from text sources.

## Core Components

- **`generate_report.py`**: Main script that processes relation extraction JSON data and generates interactive HTML reports
- **`template.html.j2`**: Jinja2 HTML template for rendering the dashboard with embedded CSS/JavaScript
- **`extracted_data.json`**: Input data containing speaker turns with extracted semantic triples
- **`report_light.html`**: Generated output HTML dashboard (example output)

## Development Commands

### Generate HTML Report
```bash
python3 generate_report.py --input extracted_data.json --output report_light.html
```

### Required Dependencies
The project uses Python 3.12+ with the following key dependencies:
- `jinja2`: Template rendering engine
- Standard library modules: `json`, `argparse`, `collections`

Install dependencies:
```bash
pip install jinja2
```

## Data Structure

The input JSON follows this structure:
- Root: Array of speaker turns
- Each turn contains:
  - `speaker_name`: Name of the speaker
  - `role`: Speaker's role (e.g., "Interviewee")
  - `utterance_order`: Sequence number
  - `extractions`: Array of semantic triples with:
    - `subject_entity`: {name, entity_type}
    - `relation`: {surface_form, semantic_form}
    - `object_entity`: {name, entity_type}
    - `evidence_sources` and `evidence_text`

## Analysis Features

The report generator performs comprehensive analysis including:
- Entity type frequency analysis (categorized by utterance frequency: high >3, medium 2-3, low <2)
- Structural pattern analysis (subject_type → relation → object_type)
- Relation domain/range analysis
- Multi-typed entity detection
- Subject-only and object-only entity type identification
- Cardinality analysis (one-to-one, one-to-many, many-to-one relations)

## Template Configuration

Key constants in `generate_report.py`:
- `PATTERN_RANKING_COUNT = 150`: Number of top/bottom patterns to display
- `DIVERSE_RELATION_COUNT = 20`: Number of most diverse relations to show

## File Naming

- Input files should contain relation extraction data in the expected JSON format
- Output HTML files are self-contained with embedded CSS and JavaScript
- The template file must be named `template.html.j2` and located in the same directory as the script