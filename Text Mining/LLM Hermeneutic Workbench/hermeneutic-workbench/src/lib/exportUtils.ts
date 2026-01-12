/**
 * Export Utilities - Functions for exporting data to CSV/JSON files
 */
import type { EntityTypeInfo, StructuralPattern, RelationDiversity, SpeakerTurn } from '../types/data';

// Pattern Analytics export data structure
export interface PatternAnalyticsExport {
    structuralPatterns: StructuralPattern[];
    multiTypedEntities: Record<string, string[]>;
    subjectOnlyTypes: string[];
    objectOnlyTypes: string[];
    topDiverseRelations: RelationDiversity[];
    exportedAt: string;
}

// Triple export data structure
export interface TripleExport {
    subject: {
        name: string;
        type: string;
    };
    relation: {
        surface_form: string;
        semantic_form: string;
    };
    object: {
        name: string;
        type: string;
    };
    evidence_text: string;
    speaker_name: string;
    utterance_order: number;
}

/**
 * Generate a timestamped filename
 */
function generateFilename(prefix: string, extension: string): string {
    const now = new Date();
    const timestamp = now.toISOString().replace(/[:.]/g, '-').slice(0, 19);
    return `${prefix}_${timestamp}.${extension}`;
}

/**
 * Trigger a file download in the browser
 */
function downloadFile(content: string, filename: string, mimeType: string): void {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}

/**
 * Export Entity Types to CSV
 * Columns: Entity Type, Count, Utterance Count
 */
export function exportEntityTypesCSV(entityTypes: EntityTypeInfo[]): void {
    if (entityTypes.length === 0) {
        console.warn('[Export] No entity types to export');
        return;
    }

    // CSV header
    const header = 'Entity Type,Count,Utterance Count\n';

    // CSV rows - escape commas and quotes in entity type names
    const rows = entityTypes.map(et => {
        const name = et.name.includes(',') || et.name.includes('"')
            ? `"${et.name.replace(/"/g, '""')}"`
            : et.name;
        return `${name},${et.count},${et.utterance_count}`;
    }).join('\n');

    const csvContent = header + rows;
    const filename = generateFilename('entity_types', 'csv');
    downloadFile(csvContent, filename, 'text/csv;charset=utf-8');

    console.log(`[Export] Entity Types CSV exported: ${filename}`);
}

/**
 * Export Pattern Analytics to JSON
 * Includes: structural patterns, multi-typed entities, subject/object only types, relation diversity
 */
export function exportPatternAnalyticsJSON(
    structuralPatterns: StructuralPattern[],
    multiTypedEntities: Record<string, string[]>,
    subjectOnlyTypes: string[],
    objectOnlyTypes: string[],
    topDiverseRelations: RelationDiversity[]
): void {
    const exportData: PatternAnalyticsExport = {
        structuralPatterns,
        multiTypedEntities,
        subjectOnlyTypes,
        objectOnlyTypes,
        topDiverseRelations,
        exportedAt: new Date().toISOString()
    };

    const jsonContent = JSON.stringify(exportData, null, 2);
    const filename = generateFilename('pattern_analytics', 'json');
    downloadFile(jsonContent, filename, 'application/json');

    console.log(`[Export] Pattern Analytics JSON exported: ${filename}`);
}

/**
 * Export Filtered Triples to JSON
 * Extracts all extractions from filtered speaker turns into a flat array of triples
 */
export function exportFilteredTriplesJSON(filteredTurns: SpeakerTurn[]): void {
    const triples: TripleExport[] = [];

    for (const turn of filteredTurns) {
        for (const extraction of turn.extractions) {
            triples.push({
                subject: {
                    name: extraction.subject_entity.name,
                    type: extraction.subject_entity.entity_type
                },
                relation: {
                    surface_form: extraction.relation.surface_form,
                    semantic_form: extraction.relation.semantic_form
                },
                object: {
                    name: extraction.object_entity.name,
                    type: extraction.object_entity.entity_type
                },
                evidence_text: extraction.evidence_text,
                speaker_name: turn.speaker_name,
                utterance_order: turn.utterance_order
            });
        }
    }

    if (triples.length === 0) {
        console.warn('[Export] No triples to export (filtered result is empty)');
        return;
    }

    const exportData = {
        triples,
        totalCount: triples.length,
        exportedAt: new Date().toISOString()
    };

    const jsonContent = JSON.stringify(exportData, null, 2);
    const filename = generateFilename('filtered_triples', 'json');
    downloadFile(jsonContent, filename, 'application/json');

    console.log(`[Export] Filtered Triples JSON exported: ${filename} (${triples.length} triples)`);
}
