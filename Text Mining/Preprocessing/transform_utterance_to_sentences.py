#!/usr/bin/env python3
"""
Transform utterance JSON to sentence-level JSON format.

This script reads a JSON file containing interview utterances and transforms it
by splitting each utterance into individual sentences with sentence IDs.

Input format:
{
    "speaker_name": "...",
    "role": "...",
    "utterance": "Full paragraph of text...",
    "order": 1
}

Output format:
{
    "speaker_name": "...",
    "role": "...",
    "utterance_order": 1,
    "sentences": [
        {"sentence": "First sentence.", "sentence_order": "1-1"},
        {"sentence": "Second sentence.", "sentence_order": "1-2"}
    ]
}
"""

import json
import re
import sys
from pathlib import Path


def split_into_sentences(text: str) -> list[str]:
    """
    Split text into sentences using regex-based approach.
    
    Handles common abbreviations, parenthetical references, and cases where
    there is no space after a period (common in transcript data).
    """
    # Pre-process: ensure there is a space after .!? if followed by a capital letter
    # but not if it's an abbreviation (handled later) or part of a decimal.
    # We do a more surgical fix for the specific pattern "word.Capital"
    text = re.sub(r'([.!?])([A-Z])', r'\1 \2', text)

    # First, protect abbreviations by adding a marker
    protected_text = text
    
    # Protect common patterns like "et al.", "e.g.", "i.e.", etc.
    protected_text = re.sub(r'\bet al\.', 'ET_AL_MARKER', protected_text)
    protected_text = re.sub(r'\be\.g\.', 'EG_MARKER', protected_text)
    protected_text = re.sub(r'\bi\.e\.', 'IE_MARKER', protected_text)
    protected_text = re.sub(r'\bcf\.', 'CF_MARKER', protected_text)
    
    # Protect Mr., Mrs., Dr., etc.
    protected_text = re.sub(r'\b(Mr|Mrs|Ms|Dr|Prof|Sr|Jr)\.\s', r'\1_DOT_MARKER ', protected_text)
    
    # Protect numbers with decimals
    protected_text = re.sub(r'(\d+)\.(\d+)', r'\1_DECIMAL_\2', protected_text)
    
    # Protect initials (single capital letter with period)
    protected_text = re.sub(r'\b([A-Z])\.(\s*[A-Z])', r'\1_INITIAL_\2', protected_text)
    
    # Protect parenthetical citations like (see, for example, Avram et al. 1967)
    # Using a simpler regex that doesn't nested parens since transcripts rarely have them
    def protect_parens(match):
        return match.group().replace('.', '_PAREN_DOT_')
        
    protected_text = re.sub(r'\([^)]+\)', protect_parens, protected_text)
    
    # Split on sentence-ending punctuation followed by space and capital or end of string
    sentence_pattern = r'(?<=[.!?])\s+(?=[A-Z"\'\(])'
    
    raw_sentences = re.split(sentence_pattern, protected_text)
    
    # Restore protected patterns
    sentences = []
    for sent in raw_sentences:
        restored = sent
        restored = restored.replace('ET_AL_MARKER', 'et al.')
        restored = restored.replace('EG_MARKER', 'e.g.')
        restored = restored.replace('IE_MARKER', 'i.e.')
        restored = restored.replace('CF_MARKER', 'cf.')
        restored = re.sub(r'(\w+)_DOT_MARKER', r'\1.', restored)
        restored = re.sub(r'(\d+)_DECIMAL_(\d+)', r'\1.\2', restored)
        restored = re.sub(r'([A-Z])_INITIAL_', r'\1.', restored)
        restored = restored.replace('_PAREN_DOT_', '.')
        
        # Clean up whitespace
        restored = restored.strip()
        if restored:
            sentences.append(restored)
    
    return sentences


def transform_utterance_to_sentences(input_file: str, output_file: str = None) -> None:
    """
    Transform utterance-level JSON to sentence-level JSON.
    
    Args:
        input_file: Path to input JSON file
        output_file: Path to output JSON file (defaults to input with _sentences suffix)
    """
    input_path = Path(input_file)
    
    if output_file is None:
        output_file = input_path.parent / f"{input_path.stem}_sentences{input_path.suffix}"
    
    # Read input JSON
    with open(input_path, 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    # Transform each utterance
    transformed_data = []
    
    for item in data:
        utterance_order = item['order']
        
        # Split utterance into sentences
        sentences = split_into_sentences(item['utterance'])
        
        # Create sentence objects with IDs
        sentence_objects = []
        for idx, sentence in enumerate(sentences, start=1):
            sentence_objects.append({
                'sentence': sentence,
                'sentence_order': f"{utterance_order}-{idx}"
            })
        
        # Create transformed item
        transformed_item = {
            'speaker_name': item['speaker_name'],
            'role': item['role'],
            'utterance_order': utterance_order,
            'sentences': sentence_objects
        }
        
        transformed_data.append(transformed_item)
    
    # Write output JSON
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(transformed_data, f, indent=2, ensure_ascii=False)
    
    print(f"✓ Transformed {len(data)} utterances")
    print(f"✓ Total sentences: {sum(len(item['sentences']) for item in transformed_data)}")
    print(f"✓ Output saved to: {output_file}")
    
    return transformed_data


def main():
    if len(sys.argv) < 2:
        # Default to the specified file if no arguments
        input_file = "Segmented_Transcript_JSON/Julianne Nyhan_Judy Malloy.json"
    else:
        input_file = sys.argv[1]
    
    output_file = sys.argv[2] if len(sys.argv) > 2 else None
    
    transform_utterance_to_sentences(input_file, output_file)


if __name__ == "__main__":
    main()
