# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a relation extraction analysis dashboard that processes JSON data containing speaker turns and extractions, then generates interactive HTML reports. The project analyzes entity types, structural patterns, and relationships from conversation transcripts or interviews.

## Core Architecture

### Main Components

1. **Report Generator** (`generate_report.py`) - Main script that processes JSON data and generates HTML reports
   - Takes JSON input with speaker turns and relation extractions
   - Performs statistical analysis on entity types, relations, and structural patterns
   - Uses Jinja2 templating to generate interactive HTML dashboard
   - Two versions exist: v2.0 and v2.2 (latest)

2. **HTML Template** (`template.html.j2`) - Jinja2 template for the dashboard
   - Self-contained HTML with embedded CSS and JavaScript
   - Interactive filtering and search functionality
   - Responsive design with collapsible sections
   - Export capabilities for CSV and JSON data

3. **Data Files**
   - `extracted_data.json` - Main input data with speaker turns and relation extractions
   - `Top 150 Most Frequent Structural Pattern.txt` - Analysis output file

### Data Structure

The JSON input follows this structure:
- Array of speaker turns, each containing:
  - `speaker_name`, `role`, `utterance_order`
  - `extractions` array with subject-relation-object triples
  - Each extraction has `subject_entity`, `relation`, `object_entity`, `evidence_sources`, `evidence_text`

## Development Commands

### Running the Report Generator

```bash
# Generate HTML report from JSON data
python generate_report.py --input extracted_data.json --output report.html

# Using short flags
python generate_report.py -i extracted_data.json -o report.html
```

### Dependencies

The project requires:
- Python 3.x
- Jinja2 (for templating)
- Standard library: json, argparse, collections, sys, os

Install dependencies:
```bash
pip install jinja2
```

## Key Features

### Analytics Capabilities
- Entity type frequency analysis with utterance-based categorization (high/medium/low frequency)
- Structural pattern analysis (most/least frequent patterns)
- Multi-typed entity detection
- Relation cardinality analysis (one-to-one, one-to-many, many-to-one)
- Subject-only and object-only entity type identification

### Interactive Dashboard Features
- Real-time filtering by entity types, relations, and patterns
- Text search across entity names
- Collapsible sections for better organization
- Export functionality (CSV for entity data, JSON for specialized analyses)
- Responsive design for different screen sizes

## File Organization

- Main script: `generate_report.py` (use latest version 2.2)
- Template: `template.html.j2`
- Input data: `extracted_data.json`
- Generated outputs: `report_*.html` files

## Constants and Configuration

Key configuration constants in `generate_report.py`:
- `PATTERN_RANKING_COUNT = 150` - Number of top/bottom patterns to analyze
- `DIVERSE_RELATION_COUNT = 20` - Number of diverse relations to show
- `TEMPLATE_FILE = "template.html.j2"` - Template filename

Entity frequency categorization thresholds:
- High frequency: > 3 utterances
- Medium frequency: 2-3 utterances  
- Low frequency: 1 utterance