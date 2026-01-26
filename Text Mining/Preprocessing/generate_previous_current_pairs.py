#!/usr/bin/env python3
"""
Generate Previous-Current Utterance Pairs from Sentence-Level JSON.

This script reads a sentence-level transcript JSON file and produces
multiple "Previous-current pair - N" JSON files, where each pair contains:
- previous_utterances: The interviewer + interviewee pair from the previous turn (null for pair 1)
- current_utterance: The current interviewer + interviewee pair

Each pair consists of 1 Interviewer utterance followed by 1 Interviewee utterance.
"""

import json
import os
import sys
from pathlib import Path


def generate_previous_current_pairs(input_file: str, output_dir: str = None) -> int:
    """
    Generate previous-current utterance pair files from a sentence-level JSON.
    
    Args:
        input_file: Path to input sentence-level JSON file
        output_dir: Directory to save output files (defaults to input file's directory)
    
    Returns:
        Number of pair files generated
    """
    input_path = Path(input_file)
    
    if output_dir is None:
        output_dir = input_path.parent / "Previous_Current_Pairs"
    else:
        output_dir = Path(output_dir)
    
    # Create output directory if it doesn't exist
    output_dir.mkdir(parents=True, exist_ok=True)
    
    # Read input JSON
    with open(input_path, 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    # Group utterances into pairs (Interviewer + Interviewee)
    pairs = []
    i = 0
    while i < len(data) - 1:
        interviewer = data[i]
        interviewee = data[i + 1]
        
        # Validate the expected pattern (Interviewer followed by Interviewee)
        if interviewer.get('role') == 'Interviewer' and interviewee.get('role') == 'Interviewee':
            pairs.append([interviewer, interviewee])
            i += 2
        else:
            # If the pattern doesn't match, just move forward by 1
            # This handles cases where the transcript may have consecutive same-role utterances
            print(f"Warning: Unexpected pattern at index {i}. Expected Interviewer+Interviewee pair.")
            i += 1
    
    # Generate previous-current pair files
    pair_count = 0
    for idx, current_pair in enumerate(pairs):
        pair_number = idx + 1
        
        # Determine previous_utterances
        if idx == 0:
            previous_utterances = None
        else:
            previous_utterances = pairs[idx - 1]
        
        # Create the output structure
        output_data = {
            "previous_utterances": previous_utterances,
            "current_utterance": current_pair
        }
        
        # Write to file
        output_file = output_dir / f"Previous-current pair - {pair_number}.json"
        with open(output_file, 'w', encoding='utf-8') as f:
            json.dump(output_data, f, indent=2, ensure_ascii=False)
        
        pair_count += 1
    
    print(f"✓ Generated {pair_count} previous-current pair files")
    print(f"✓ Output directory: {output_dir}")
    
    return pair_count


def main():
    if len(sys.argv) < 2:
        # Default to the Judy Malloy sentences file
        input_file = "Segmented_Transcript_JSON/Julianne Nyhan_Judy Malloy_sentences.json"
    else:
        input_file = sys.argv[1]
    
    output_dir = sys.argv[2] if len(sys.argv) > 2 else None
    
    generate_previous_current_pairs(input_file, output_dir)


if __name__ == "__main__":
    main()
