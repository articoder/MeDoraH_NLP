#!/usr/bin/env python3
"""
Semantic Triple Analysis and Visualization for Ontology Induction

This script performs comprehensive analysis and visualization of structured triples
extracted from oral history interviews, specifically from the "Computation and the
Humanities: Towards an Oral History of Digital Humanities" project.

The analysis facilitates ontology engineering by revealing:
- Entity type distributions
- Relation patterns
- Structural patterns (domain/range relationships)
- Network topology and centrality measures

Author: Expert Python Developer
Purpose: Ontology Induction from Interview Data
"""

import json
import pandas as pd
import numpy as np
import networkx as nx
import matplotlib.pyplot as plt
import matplotlib.cm as cm
import seaborn as sns
from collections import Counter, defaultdict
from typing import List, Dict, Tuple, Any
from pyvis.network import Network
import warnings

# Suppress warnings for cleaner output
warnings.filterwarnings('ignore')

# Configure matplotlib for better visualization
plt.style.use('seaborn-v0_8-darkgrid')
sns.set_palette("husl")


def load_data(filepath: str = 'extracted_data.json') -> pd.DataFrame:
    """
    Load and flatten the nested JSON data structure into a pandas DataFrame.
    
    This function reads the interview utterances and extracts all triples,
    creating a flat structure where each row represents a single triple.
    
    Args:
        filepath (str): Path to the input JSON file
        
    Returns:
        pd.DataFrame: Flattened DataFrame with columns for all triple components
    """
    print(f"Loading data from {filepath}...")
    
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            data = json.load(f)
    except FileNotFoundError:
        print(f"Error: File {filepath} not found.")
        return pd.DataFrame()
    except json.JSONDecodeError:
        print(f"Error: Invalid JSON in {filepath}.")
        return pd.DataFrame()
    
    # Flatten the nested structure
    flattened_data = []
    
    for utterance in data:
        speaker_name = utterance.get('speaker_name', 'Unknown')
        role = utterance.get('role', 'Unknown')
        utterance_order = utterance.get('utterance_order', 0)
        
        for extraction in utterance.get('extractions', []):
            # Extract subject information
            subject = extraction.get('subject_entity', {})
            subject_name = subject.get('name', 'Unknown')
            subject_type = subject.get('entity_type', 'Unknown')
            
            # Extract relation information
            relation = extraction.get('relation', {})
            relation_surface = relation.get('surface_form', 'Unknown')
            relation_semantic = relation.get('semantic_form', 'Unknown')
            
            # Extract object information
            object_entity = extraction.get('object_entity', {})
            object_name = object_entity.get('name', 'Unknown')
            object_type = object_entity.get('entity_type', 'Unknown')
            
            # Extract evidence
            evidence_sources = extraction.get('evidence_sources', [])
            evidence_text = extraction.get('evidence_text', '')
            
            flattened_data.append({
                'speaker_name': speaker_name,
                'role': role,
                'utterance_order': utterance_order,
                'subject_name': subject_name,
                'subject_type': subject_type,
                'relation_surface': relation_surface,
                'relation_semantic': relation_semantic,
                'object_name': object_name,
                'object_type': object_type,
                'evidence_sources': ', '.join(evidence_sources),
                'evidence_text': evidence_text
            })
    
    df = pd.DataFrame(flattened_data)
    print(f"Successfully loaded {len(df)} triples from {len(data)} utterances.")
    return df


def analyze_frequencies(df: pd.DataFrame) -> None:
    """
    Perform high-level aggregate statistics for candidate discovery.
    
    This analysis reveals:
    1. Entity type frequency distribution
    2. Relation frequency distribution
    3. Top 20 most frequent entities
    
    Args:
        df (pd.DataFrame): The flattened DataFrame of triples
    """
    print("\n" + "="*80)
    print("HIGH-LEVEL AGGREGATE STATISTICS")
    print("="*80)
    
    # Entity Type Frequency
    print("\n1. ENTITY TYPE FREQUENCY DISTRIBUTION:")
    print("-" * 40)
    
    # Combine subject and object types
    all_entity_types = pd.concat([df['subject_type'], df['object_type']])
    entity_type_freq = all_entity_types.value_counts()
    
    print(f"Total unique entity types: {len(entity_type_freq)}")
    print("\nTop 15 Entity Types:")
    for i, (entity_type, count) in enumerate(entity_type_freq.head(15).items(), 1):
        percentage = (count / len(all_entity_types)) * 100
        print(f"{i:2d}. {entity_type:<30} {count:5d} ({percentage:5.1f}%)")
    
    # Relation Frequency
    print("\n2. RELATION FREQUENCY DISTRIBUTION:")
    print("-" * 40)
    
    relation_freq = df['relation_semantic'].value_counts()
    print(f"Total unique relations: {len(relation_freq)}")
    print("\nTop 15 Relations:")
    for i, (relation, count) in enumerate(relation_freq.head(15).items(), 1):
        percentage = (count / len(df)) * 100
        print(f"{i:2d}. {relation:<30} {count:5d} ({percentage:5.1f}%)")
    
    # Top Entities
    print("\n3. TOP 20 MOST FREQUENT ENTITIES:")
    print("-" * 40)
    
    # Combine subject and object names
    all_entities = pd.concat([
        df[['subject_name', 'subject_type']].rename(columns={'subject_name': 'name', 'subject_type': 'type'}),
        df[['object_name', 'object_type']].rename(columns={'object_name': 'name', 'object_type': 'type'})
    ])
    
    entity_counts = all_entities.groupby('name').agg({
        'type': lambda x: x.mode()[0] if not x.empty else 'Unknown',  # Most common type
        'name': 'count'
    }).rename(columns={'name': 'count'}).sort_values('count', ascending=False)
    
    print(f"Total unique entities: {len(entity_counts)}")
    print("\nTop 20 Entities:")
    for i, (entity_name, row) in enumerate(entity_counts.head(20).iterrows(), 1):
        print(f"{i:2d}. {entity_name:<40} [{row['type']:<15}] Count: {row['count']:4d}")


def analyze_patterns(df: pd.DataFrame) -> None:
    """
    Analyze relational patterns for domain/range induction.
    
    This function identifies structural patterns in the form:
    (subject_type, relation, object_type)
    
    These patterns are crucial for understanding the implicit schema
    and potential ontological constraints.
    
    Args:
        df (pd.DataFrame): The flattened DataFrame of triples
    """
    print("\n" + "="*80)
    print("RELATIONAL PATTERN ANALYSIS")
    print("="*80)
    
    # Create structural patterns
    patterns = df.apply(lambda row: (
        row['subject_type'],
        row['relation_semantic'],
        row['object_type']
    ), axis=1)
    
    pattern_counts = Counter(patterns)
    
    print(f"\nTotal unique structural patterns: {len(pattern_counts)}")
    print("\nTop 25 Most Frequent Structural Patterns:")
    print("-" * 100)
    print(f"{'Rank':<5} {'Subject Type':<20} {'Relation':<30} {'Object Type':<20} {'Count':<10} {'%':<5}")
    print("-" * 100)
    
    total_patterns = sum(pattern_counts.values())
    for i, ((subj_type, rel, obj_type), count) in enumerate(pattern_counts.most_common(25), 1):
        percentage = (count / total_patterns) * 100
        print(f"{i:<5} {subj_type:<20} {rel:<30} {obj_type:<20} {count:<10} {percentage:5.1f}%")
    
    # Additional insights
    print("\n" + "-" * 40)
    print("PATTERN INSIGHTS:")
    print("-" * 40)
    
    # Relations with most diverse domain/range
    relation_diversity = defaultdict(lambda: {'subjects': set(), 'objects': set()})
    for (subj_type, rel, obj_type), count in pattern_counts.items():
        relation_diversity[rel]['subjects'].add(subj_type)
        relation_diversity[rel]['objects'].add(obj_type)
    
    print("\nRelations with Most Diverse Domain/Range:")
    diverse_relations = sorted(relation_diversity.items(), 
                              key=lambda x: len(x[1]['subjects']) + len(x[1]['objects']), 
                              reverse=True)[:10]
    
    for rel, types in diverse_relations:
        print(f"\n{rel}:")
        print(f"  Domain diversity: {len(types['subjects'])} unique subject types")
        print(f"  Range diversity:  {len(types['objects'])} unique object types")


def generate_static_graph(df: pd.DataFrame, output_file: str = 'knowledge_graph.png') -> nx.DiGraph:
    """
    Generate a high-quality static network visualization suitable for presentations.
    
    This function creates a carefully styled graph with:
    - Size proportional to degree centrality
    - Color-coding by entity type
    - Optimized layout for readability
    - Professional aesthetics
    
    Args:
        df (pd.DataFrame): The flattened DataFrame of triples
        output_file (str): Output filename for the static graph
        
    Returns:
        nx.DiGraph: The constructed network graph
    """
    print("\n" + "="*80)
    print("GENERATING STATIC NETWORK VISUALIZATION")
    print("="*80)
    
    # Create directed graph
    G = nx.DiGraph()
    
    # Build entity type mapping
    entity_types = {}
    
    # Add nodes and edges
    for _, row in df.iterrows():
        # Add nodes with their types
        G.add_node(row['subject_name'], entity_type=row['subject_type'])
        G.add_node(row['object_name'], entity_type=row['object_type'])
        entity_types[row['subject_name']] = row['subject_type']
        entity_types[row['object_name']] = row['object_type']
        
        # Add edge with relation as attribute
        G.add_edge(row['subject_name'], row['object_name'], 
                  relation=row['relation_semantic'])
    
    print(f"Graph statistics:")
    print(f"  Nodes: {G.number_of_nodes()}")
    print(f"  Edges: {G.number_of_edges()}")
    print(f"  Density: {nx.density(G):.4f}")
    
    # Calculate centrality measures
    degree_centrality = nx.degree_centrality(G)
    betweenness_centrality = nx.betweenness_centrality(G)
    
    # Filter nodes by degree for labeling (only label important nodes)
    degree_threshold = sorted(degree_centrality.values(), reverse=True)[min(50, len(G.nodes())//10)]
    nodes_to_label = {node for node, deg in degree_centrality.items() if deg >= degree_threshold}
    
    # Create figure with high DPI
    plt.figure(figsize=(25, 25), dpi=300)
    
    # Calculate layout with optimized parameters
    print("Computing optimized layout...")
    pos = nx.spring_layout(G, k=3/np.sqrt(G.number_of_nodes()), 
                          iterations=100, seed=42)
    
    # Prepare node properties
    node_sizes = [3000 * degree_centrality.get(node, 0.1) for node in G.nodes()]
    
    # Create color mapping for entity types
    unique_types = list(set(entity_types.values()))
    color_palette = cm.get_cmap('tab20' if len(unique_types) <= 20 else 'hsv')
    type_colors = {entity_type: color_palette(i/len(unique_types)) 
                  for i, entity_type in enumerate(unique_types)}
    node_colors = [type_colors.get(entity_types.get(node, 'Unknown'), 'gray') 
                  for node in G.nodes()]
    
    # Draw the graph
    nx.draw_networkx_nodes(G, pos, node_size=node_sizes, node_color=node_colors, 
                          alpha=0.8, linewidths=0.5, edgecolors='black')
    
    nx.draw_networkx_edges(G, pos, edge_color='gray', alpha=0.3, 
                          arrows=True, arrowsize=10, width=0.5)
    
    # Draw labels only for important nodes
    labels = {node: node for node in nodes_to_label}
    nx.draw_networkx_labels(G, pos, labels, font_size=8, font_weight='bold')
    
    # Create legend
    legend_elements = []
    for entity_type in sorted(unique_types):
        color = type_colors[entity_type]
        legend_elements.append(plt.Line2D([0], [0], marker='o', color='w', 
                                        markerfacecolor=color, markersize=15,
                                        label=entity_type))
    
    plt.legend(handles=legend_elements, loc='upper left', bbox_to_anchor=(1, 1),
              fontsize=12, title="Entity Types", title_fontsize=14)
    
    plt.title("Knowledge Graph: Oral History of Digital Humanities", 
             fontsize=24, fontweight='bold', pad=20)
    plt.axis('off')
    plt.tight_layout()
    
    # Save the figure
    print(f"Saving static graph to {output_file}...")
    plt.savefig(output_file, bbox_inches='tight', dpi=300)
    plt.close()
    
    # Print centrality analysis
    print("\nCENTRALITY ANALYSIS:")
    print("-" * 40)
    
    print("\nTop 10 Nodes by Degree Centrality:")
    for i, (node, centrality) in enumerate(sorted(degree_centrality.items(), 
                                                 key=lambda x: x[1], reverse=True)[:10], 1):
        print(f"{i:2d}. {node:<40} {centrality:.4f}")
    
    print("\nTop 10 Nodes by Betweenness Centrality:")
    for i, (node, centrality) in enumerate(sorted(betweenness_centrality.items(), 
                                                 key=lambda x: x[1], reverse=True)[:10], 1):
        print(f"{i:2d}. {node:<40} {centrality:.4f}")
    
    return G

def generate_interactive_graph(df: pd.DataFrame, output_file: str = 'knowledge_graph.html') -> None:
    """
    Generate a high-performance, interactive network visualization using Pyvis.
    
    This creates an HTML file with a highly-styled, interactive graph that allows:
    - Zooming and panning
    - Node inspection on hover
    - A collapsable, elegant filter menu for dynamic exploration
    - Lag-free interaction due to post-layout physics optimization.
    
    Args:
        df (pd.DataFrame): The flattened DataFrame of triples
        output_file (str): Output filename for the interactive graph
    """
    print("\n" + "="*80)
    print("GENERATING HIGH-PERFORMANCE INTERACTIVE NETWORK VISUALIZATION")
    print("="*80)
    
    # --- 1. Define Visual Theme and Palette ---
    background_color = '#F7F5F2'
    default_font_color = '#343434'
    edge_color = '#C5C5C5'
    custom_palette = ['#E69F00', '#56B4E9', '#009E73', '#F0E442', '#0072B2', '#D55E00', '#CC79A7']

    # --- 2. Create Pyvis Network with Built-in Filter and FULL VIEWPORT HEIGHT ---
    net = Network(height='100vh', width='100%', directed=True, 
                  bgcolor=background_color, font_color=default_font_color,
                  filter_menu=True) # <-- Use 100vh to fill the screen
    
    # --- 3. Prepare Node and Edge Data ---
    entity_info = defaultdict(lambda: {
        'type': 'Unknown',
        'degree': 0
    })
    
    # Collect entity statistics (degree and type)
    for _, row in df.iterrows():
        entity_info[row['subject_name']]['type'] = row['subject_type']
        entity_info[row['subject_name']]['degree'] += 1
        entity_info[row['object_name']]['type'] = row['object_type']
        entity_info[row['object_name']]['degree'] += 1
        
    # Create color mapping for entity types
    unique_types = sorted(list(set(info['type'] for info in entity_info.values())))
    color_map = {entity_type: custom_palette[i % len(custom_palette)]
                 for i, entity_type in enumerate(unique_types)}
    
    # --- 4. Add Nodes with 'group' attribute for filtering ---
    for entity, info in entity_info.items():
        degree = info['degree']
        entity_type = info['type']
        
        # The 'group' attribute is essential for the built-in filter
        net.add_node(entity, 
                     label=entity,
                     title=f"Entity: {entity}<br>Type: {entity_type}<br>Connections: {degree}",
                     value=degree, # 'value' controls the node size
                     color=color_map.get(entity_type, '#999999'),
                     group=entity_type) # <-- Assign group for filtering

    # Add edges
    for _, row in df.iterrows():
        evidence = row['evidence_text']
        evidence_snippet = (evidence[:75] + '...') if len(evidence) > 75 else evidence
        hover_title = f"Relation: {row['relation_semantic']}<br>Surface Form: '{row['relation_surface']}'<br>Evidence: '{evidence_snippet}'"
        net.add_edge(row['subject_name'], row['object_name'], 
                     title=hover_title,
                     label=row['relation_semantic'],
                     color={'color': edge_color, 'opacity': 0.7})
    
    # --- 5. Set Advanced Options for Physics and Interaction ---
    options = f'''
    {{
      "nodes": {{
        "font": {{ "size": 14, "color": "{default_font_color}" }},
        "borderWidth": 1.5,
        "borderWidthSelected": 2.5
      }},
      "edges": {{
        "font": {{ "size": 10, "color": "{default_font_color}", "align": "middle" }},
        "smooth": {{ "type": "continuous" }}
      }},
      "physics": {{
        "enabled": true,
        "barnesHut": {{
          "gravitationalConstant": -8000,
          "springConstant": 0.04,
          "springLength": 250,
          "avoidOverlap": 0.1
        }},
        "stabilization": {{
          "enabled": true,
          "iterations": 1000,
          "fit": true
        }}
      }},
      "interaction": {{ "hover": true, "tooltipDelay": 200, "navigationButtons": true, "keyboard": true }},
      "manipulation": {{ "enabled": false }}
    }}
    '''
    net.set_options(options)

    # Save the initial graph
    net.save_graph(output_file)

    # --- 6. Inject Custom CSS and JavaScript for UI/UX Enhancement ---
    with open(output_file, 'r+', encoding='utf-8') as f:
        html_content = f.read()

        injection = f'''
        <style>
            body {{ margin: 0; padding: 0; overflow: hidden; }}
            .vis-loading-screen {{ display: none !important; }}
            #custom-loading-bar-container {{
                position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%);
                width: 250px; height: 8px; background: transparent;
                border-radius: 4px; border: 1px solid #343434;
                overflow: hidden; display: none; z-index: 100;
            }}
            #custom-loading-bar {{
                width: 100%; height: 100%; background: #343434;
                transform: scaleX(0); transform-origin: left;
                animation: custom-loading-animation 1.8s ease-in-out infinite;
            }}
            @keyframes custom-loading-animation {{
                0%   {{ transform: scaleX(0); transform-origin: left; }}
                45%  {{ transform: scaleX(1); transform-origin: left; }}
                55%  {{ transform: scaleX(1); transform-origin: right; }}
                100% {{ transform: scaleX(0); transform-origin: right; }}
            }}
            .vis-configuration-wrapper {{
                position: absolute; top: 10px; right: 10px;
                background-color: rgba(247, 245, 242, 0.9);
                border: 1px solid #E0E0E0; border-radius: 8px; padding: 10px;
                box-shadow: 0 2px 10px rgba(0,0,0,0.1); z-index: 99;
                max-width: 300px; transition: all 0.3s ease-in-out;
                overflow: hidden;
            }}
            .vis-configuration-wrapper.collapsed {{
                width: 0; height: 0; padding: 0; border: none;
                overflow: hidden;
            }}
            .vis-configuration-wrapper select {{
                width: 120px !important; margin-right: 5px; padding: 5px;
                border-radius: 5px; border: 1px solid #D0D0D0;
                background-color: white; color: {default_font_color};
            }}
            .vis-configuration-wrapper button {{
                background-color: #1F1F22 !important; color: white !important;
                border: none !important; border-radius: 20px !important;
                padding: 8px 15px !important; margin: 5px 2px !important;
                cursor: pointer; transition: background-color 0.2s ease;
            }}
            .vis-configuration-wrapper button:hover {{ background-color: #333333 !important; }}
            #filter-toggle-container {{
                position: absolute; top: 10px; right: 10px;
                width: 40px; height: 40px;
                background-color: rgba(247, 245, 242, 0.9);
                border: 1px solid #E0E0E0; border-radius: 50%;
                display: flex; align-items: center; justify-content: center;
                cursor: pointer; z-index: 101; box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            }}
            #filter-toggle-arrow {{
                font-size: 20px; color: {default_font_color};
                transition: transform 0.3s ease;
            }}
            #filter-toggle-arrow.collapsed {{ transform: rotate(180deg); }}
        </style>

        <div id="custom-loading-bar-container"><div id="custom-loading-bar"></div></div>
        
        <div id="filter-toggle-container"><div id="filter-toggle-arrow">▼</div></div>

        <script type="text/javascript">
            document.addEventListener('DOMContentLoaded', function() {{
                var bar = document.getElementById('custom-loading-bar-container');
                var filterPanel = document.querySelector('.vis-configuration-wrapper');
                var toggleContainer = document.getElementById('filter-toggle-container');
                var toggleArrow = document.getElementById('filter-toggle-arrow');

                if (filterPanel && toggleContainer) {{
                    // Initially hide the filter panel and show the button
                    filterPanel.classList.add('collapsed');
                    toggleArrow.classList.add('collapsed');
                    toggleArrow.innerHTML = '☰'; // Filter icon (or hamburger)

                    toggleContainer.addEventListener('click', function() {{
                        filterPanel.classList.toggle('collapsed');
                        toggleArrow.classList.toggle('collapsed');
                        if (filterPanel.classList.contains('collapsed')) {{
                            toggleArrow.innerHTML = '☰'; // Filter icon
                        }} else {{
                            toggleArrow.innerHTML = '✕'; // Close 'X' icon
                        }}
                    }});
                }}

                if (typeof network !== 'undefined') {{
                    network.on("startStabilizing", function () {{ bar.style.display = 'block'; }});
                    network.on("stabilizationIterationsDone", function () {{
                        bar.style.display = 'none';
                        network.setOptions({{ physics: false }});
                    }});
                }}
            }});
        </script>
        '''
        # Slightly improved injection logic for better UI
        html_content = html_content.replace('</body>', f'{injection}\n</body>')
        f.seek(0)
        f.write(html_content)
        f.truncate()

    print(f"Successfully saved high-performance interactive graph to {output_file}")
    print(f"Interactive visualization saved! Open {output_file} in a web browser.")


def main():
    """
    Main execution function that orchestrates all analyses.
    """
    print("="*80)
    print("SEMANTIC TRIPLE ANALYSIS FOR ONTOLOGY INDUCTION")
    print("Oral History of Digital Humanities Project")
    print("="*80)
    
    # Load data
    df = load_data('extracted_data.json')
    
    if df.empty:
        print("No data loaded. Exiting.")
        return
    
    # Perform analyses
    analyze_frequencies(df)
    analyze_patterns(df)
    
    # Generate visualizations
    G = generate_static_graph(df)
    generate_interactive_graph(df)
    
    print("\n" + "="*80)
    print("ANALYSIS COMPLETE")
    print("="*80)
    print("\nGenerated outputs:")
    print("  1. knowledge_graph.png - High-resolution static visualization")
    print("  2. knowledge_graph.html - Interactive network visualization")
    print("\nThese visualizations reveal:")
    print("  - Entity type distributions and key entities")
    print("  - Relational patterns for domain/range constraints")
    print("  - Network topology showing central concepts")
    print("  - Structural patterns for ontology class/property candidates")


if __name__ == "__main__":
    main()