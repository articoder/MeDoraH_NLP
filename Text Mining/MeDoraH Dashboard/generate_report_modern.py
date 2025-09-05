# generate_report.py (Version 2.0)
import json
import argparse
from jinja2 import Environment, FileSystemLoader
import sys
import os
from collections import Counter, defaultdict

# --- Constants ---
TEMPLATE_FILE = "template_modern.html.j2"
PATTERN_RANKING_COUNT = 150
DIVERSE_RELATION_COUNT = 20


def generate_html_report(json_path: str, output_path: str) -> None:
    """
    Parses JSON, performs frequency analysis on entity types and structural
    patterns, and generates a rich, interactive HTML report.
    """
    print("[*] Starting report generation...")
    print(f"    - Input JSON: {json_path}")
    print(f"    - Output HTML: {output_path}")

    try:
        # 1. Setup Jinja2 Environment
        script_dir = os.path.dirname(os.path.abspath(__file__))
        env = Environment(loader=FileSystemLoader(script_dir), autoescape=True)
        template = env.get_template(TEMPLATE_FILE)
        print(f"[*] Successfully loaded template: '{TEMPLATE_FILE}'")

        # 2. Load JSON Data
        with open(json_path, 'r', encoding='utf-8') as f:
            speaker_turns_data = json.load(f)
        if not isinstance(speaker_turns_data, list):
            raise TypeError("The root of the JSON must be a list of speaker turns.")
        print(f"[*] Successfully parsed JSON data. Found {len(speaker_turns_data)} speaker turns.")

        # 3. Perform All Analyses
        entity_type_counts = Counter()
        structural_pattern_counts = Counter()
        entity_utterance_tracker = defaultdict(set)
        multi_type_entities = defaultdict(set)
        all_subject_types = set()
        all_object_types = set()
        relation_domain = defaultdict(set)
        relation_range = defaultdict(set)
        subj_rel_to_obj = defaultdict(set)
        obj_rel_to_subj = defaultdict(set)
        # Frequency of each relation across all extractions
        relation_frequency_map = Counter()

        # ▼▼▼ NEW GLOBAL STATS ▼▼▼
        total_extractions = 0
        unique_entity_names = set()
        unique_relations = set()
        # ▲▲▲ END NEW STATS ▲▲▲

        for i, turn in enumerate(speaker_turns_data):
            turn_id = (turn.get('speaker_name', ''), turn.get('utterance_order', i))
            
            # Add a turn-level extraction count for convenience in the template
            turn['extraction_count'] = len(turn.get("extractions", []))
            total_extractions += turn['extraction_count']

            for extraction in turn.get("extractions", []):
                subj = extraction.get("subject_entity", {})
                rel = extraction.get("relation", {})
                obj = extraction.get("object_entity", {})

                subj_name = subj.get("name")
                subj_type = subj.get("entity_type")
                rel_form = rel.get("semantic_form")
                obj_name = obj.get("name")
                obj_type = obj.get("entity_type")
                
                if rel_form:
                    unique_relations.add(rel_form)
                    relation_frequency_map.update([rel_form])

                if subj_type:
                    entity_type_counts.update([subj_type])
                    entity_utterance_tracker[subj_type].add(turn_id)
                    all_subject_types.add(subj_type)
                    if subj_name:
                        multi_type_entities[subj_name].add(subj_type)
                        unique_entity_names.add(subj_name)

                if obj_type:
                    entity_type_counts.update([obj_type])
                    entity_utterance_tracker[obj_type].add(turn_id)
                    all_object_types.add(obj_type)
                    if obj_name:
                        multi_type_entities[obj_name].add(obj_type)
                        unique_entity_names.add(obj_name)


                if subj_type and rel_form and obj_type:
                    pattern = (subj_type, rel_form, obj_type)
                    structural_pattern_counts.update([pattern])
                    relation_domain[rel_form].add(subj_type)
                    relation_range[rel_form].add(obj_type)
                    subj_rel_to_obj[(subj_type, rel_form)].add(obj_type)
                    obj_rel_to_subj[(obj_type, rel_form)].add(subj_type)

        # 4. Prepare Data for Template
        all_entity_types = []
        for entity_name, total_count in entity_type_counts.items():
            utterance_count = len(entity_utterance_tracker.get(entity_name, set()))
            all_entity_types.append({
                "name": entity_name,
                "count": total_count,
                "utterance_count": utterance_count
            })
        all_entity_types.sort(key=lambda x: x["count"], reverse=True)
        print(f"[*] Counted {len(all_entity_types)} unique entity types.")

        # ▼▼▼ NEW: Categorize entity types by utterance frequency ▼▼▼
        entity_types_high_freq = []
        entity_types_medium_freq = []
        entity_types_low_freq = []
        for etype in all_entity_types:
            if etype['utterance_count'] > 3:
                entity_types_high_freq.append(etype)
            elif etype['utterance_count'] >= 2:
                entity_types_medium_freq.append(etype)
            else:
                entity_types_low_freq.append(etype)
        print(f"[*] Categorized entity types: {len(entity_types_high_freq)} High, {len(entity_types_medium_freq)} Medium, {len(entity_types_low_freq)} Low frequency.")
        # ▲▲▲ END NEW CATEGORIZATION ▲▲▲
        
        entity_utterance_counts_map = {item['name']: item['utterance_count'] for item in all_entity_types}
        entity_total_counts_map = {item['name']: item['count'] for item in all_entity_types}

        all_sorted_patterns = structural_pattern_counts.most_common()
        most_frequent_patterns = all_sorted_patterns[:PATTERN_RANKING_COUNT]
        least_frequent_patterns = list(reversed(all_sorted_patterns[-PATTERN_RANKING_COUNT:]))
        print(f"[*] Analyzed {len(all_sorted_patterns)} unique structural patterns.")
        
        print("[*] Computing advanced statistics...")
        final_multi_typed = {name: sorted(list(types)) for name, types in multi_type_entities.items() if len(types) > 1}
        subject_only_types = sorted(list(all_subject_types - all_object_types))
        object_only_types = sorted(list(all_object_types - all_subject_types))
        one_to_one_relations = defaultdict(list)
        one_to_many_relations = set()
        many_to_one_relations = set()
        
        for subj, rel, obj in structural_pattern_counts.keys():
            if subj == obj:
                one_to_one_relations[rel].append((subj, obj))
        
        for (subj, rel), objs in subj_rel_to_obj.items():
            if len(objs) > 1:
                one_to_many_relations.add(rel)
        
        for (obj, rel), subjs in obj_rel_to_subj.items():
            if len(subjs) > 1:
                many_to_one_relations.add(rel)

        relation_diversity = []
        all_rels = relation_domain.keys() | relation_range.keys()
        for rel in all_rels:
            domain_size = len(relation_domain.get(rel, []))
            range_size = len(relation_range.get(rel, []))
            relation_diversity.append({
                'rel': rel,
                'domain_size': domain_size,
                'range_size': range_size,
                'total_diversity': domain_size + range_size
            })
        
        relation_diversity.sort(key=lambda x: (x['total_diversity'], x['domain_size'], x['range_size']), reverse=True)
        top_diverse_relations = relation_diversity[:DIVERSE_RELATION_COUNT]

        # Build sorted lists by relation frequency for cardinality sections
        one_to_one_relations_sorted = sorted(
            one_to_one_relations.items(),
            key=lambda item: relation_frequency_map.get(item[0], 0),
            reverse=True
        )
        one_to_many_relations_sorted = sorted(
            list(one_to_many_relations),
            key=lambda rel: relation_frequency_map.get(rel, 0),
            reverse=True
        )
        many_to_one_relations_sorted = sorted(
            list(many_to_one_relations),
            key=lambda rel: relation_frequency_map.get(rel, 0),
            reverse=True
        )
        
        # ▼▼▼ NEW GLOBAL STATS DICTIONARY ▼▼▼
        global_stats = {
            "total_extractions": total_extractions,
            "total_speaker_turns": len(speaker_turns_data),
            "unique_entity_types": len(all_entity_types),
            "unique_entity_names": len(unique_entity_names),
            "unique_relations": len(unique_relations)
        }
        print(f"[*] Global stats computed: {global_stats}")
        # ▲▲▲ END NEW STATS DICTIONARY ▲▲▲
        
        print("[*] Advanced statistics computed successfully.")

        # 5. Render Template
        html_content = template.render(
            report_title="Relation Extraction Dashboard", # Renamed for clarity
            global_stats=global_stats,
            speaker_turns=speaker_turns_data,
            all_entity_types=all_entity_types,
            # Pass the categorized lists to the template
            entity_types_high_freq=entity_types_high_freq,
            entity_types_medium_freq=entity_types_medium_freq,
            entity_types_low_freq=entity_types_low_freq,
            entity_utterance_counts_map=entity_utterance_counts_map,
            entity_total_counts_map=entity_total_counts_map,
            most_frequent_patterns=most_frequent_patterns,
            least_frequent_patterns=least_frequent_patterns,
            # Provide full pattern list for CSV export in template
            all_structural_patterns=all_sorted_patterns,
            multi_typed_entities=final_multi_typed,
            subject_only_types=subject_only_types,
            object_only_types=object_only_types,
            # Cardinality relations with frequency-based sorting
            one_to_one_relations_sorted=one_to_one_relations_sorted,
            one_to_many_relations_sorted=one_to_many_relations_sorted,
            many_to_one_relations_sorted=many_to_one_relations_sorted,
            relation_frequency_map=dict(relation_frequency_map),
            top_diverse_relations=top_diverse_relations
        )
        print("[*] HTML content rendered successfully.")

        # 6. Write Output
        with open(output_path, 'w', encoding='utf-8') as f:
            f.write(html_content)
        print(f"\n[SUCCESS] Report generation complete. Output saved to: {output_path}")

    except Exception as e:
        print(f"[ERROR] An unexpected error occurred: {e}", file=sys.stderr)
        sys.exit(1)


def main():
    """Main function to handle command-line arguments."""
    parser = argparse.ArgumentParser(
        description="Generates a beautiful, self-contained HTML report from relation extraction JSON data.",
        formatter_class=argparse.RawTextHelpFormatter
    )
    parser.add_argument("--input", "-i", required=True, help="Path to the input JSON file.", metavar="PATH")
    parser.add_argument("--output", "-o", required=True, help="Path to save the generated HTML report.", metavar="PATH")
    args = parser.parse_args()
    generate_html_report(args.input, args.output)

if __name__ == "__main__":
    main()
