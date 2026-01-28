/**
 * Ontology Utilities
 * Helper functions for color mapping and class hierarchy logic
 */

// Color constants for Top-level Classes
// Inspired by Linear, Notion, Figma color systems - refined, harmonious tones
export const ONTOLOGY_COLORS = {
    Actor: '#364afeff',        // Indigo - trustworthy, professional (people/orgs)
    Event: '#F5A524',        // Amber - warm, dynamic (activities/happenings)
    Artefact: '#0EA77A',     // Teal - fresh, constructive (created things)
    ConceptualItem: '#a04beaff', // Violet - intellectual, creative (abstract ideas)
    SpatialEntity: '#64B5A0', // Sage - grounded, natural (places)
    TemporalEntity: '#7C8DB5', // Slate Blue - timeless, neutral (time concepts)
    Property: '#6B7280',     // Cool Gray - subtle, supporting (attributes)
    Unspecified: '#E07A5F'   // Terracotta - warm accent, attention-drawing (unknown)
} as const;

// Top-level category keys
export type OntologyCategory = keyof typeof ONTOLOGY_COLORS;

// Map each specific class to its Top-level Parent Key in ONTOLOGY_COLORS
// Based on the specific hierarchy provided
const CLASS_HIERARCHY: Record<string, OntologyCategory> = {
    // Actor
    'Person': 'Actor',
    'Organisation': 'Actor',
    'Group': 'Actor',
    'Actor': 'Actor',

    // Event
    'Project': 'Event',
    'CourseAndProgramme': 'Event',
    'Conference': 'Event',
    'EventSeries': 'Event',
    'Activity': 'Event',
    'Event': 'Event',

    // Artefact
    'Technology': 'Artefact',
    'Software': 'Artefact',
    'Hardware': 'Artefact',
    'Standard': 'Artefact',
    'Infrastructure': 'Artefact',
    'Work': 'Artefact',
    'InformationResource': 'Artefact',
    'Publication': 'Artefact',
    'Corpus': 'Artefact',
    'Database': 'Artefact',
    'Dataset': 'Artefact',
    'Website': 'Artefact',
    'Artefact': 'Artefact',

    // ConceptualItem
    'Theory': 'ConceptualItem',
    'Paradigm': 'ConceptualItem',
    'SchoolOfThought': 'ConceptualItem',
    'Definition': 'ConceptualItem',
    'Methodology': 'ConceptualItem',
    'Method': 'ConceptualItem',
    'Practice': 'ConceptualItem',
    'Technique': 'ConceptualItem',
    'Discipline': 'ConceptualItem',
    'AcademicDiscipline': 'ConceptualItem',
    'FieldOfStudy': 'ConceptualItem',
    'ResearchArea': 'ConceptualItem',
    'ConceptualFramework': 'ConceptualItem',
    'ConceptualItem': 'ConceptualItem',

    // Spatial & Temporal
    'SpatialEntity': 'SpatialEntity',
    'Place': 'SpatialEntity',
    'TemporalEntity': 'TemporalEntity',

    // Property
    'RoleOrPosition': 'Property',
    'Qualification': 'Property',
    'Property': 'Property'
};

/**
 * Get the top-level category for a given ontology class name
 * @param className The name of the ontology class
 * @returns The OntologyCategory key (e.g. 'Actor', 'Event')
 */
export function getOntologyCategory(className: string | undefined | null): OntologyCategory {
    if (!className) return 'Unspecified';

    // Normalize string: strip < > if present
    const cleanName = className.replace(/[<>]/g, '');

    // Look up parent category
    const parentCategory = CLASS_HIERARCHY[cleanName];

    return parentCategory || 'Unspecified';
}

/**
 * Get the color for a given ontology class name based on its hierarchy
 * @param className The name of the ontology class (e.g. "Person", "Software")
 * @returns The hex color code string
 */
export function getOntologyColor(className: string | undefined | null): string {
    const category = getOntologyCategory(className);
    return ONTOLOGY_COLORS[category];
}
