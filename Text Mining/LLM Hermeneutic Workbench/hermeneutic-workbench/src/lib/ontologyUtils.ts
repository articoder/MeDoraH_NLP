/**
 * Ontology Utilities
 * Helper functions for color mapping and class hierarchy logic
 */

// Color constants for Top-level Classes
export const ONTOLOGY_COLORS = {
    Actor: '#3931F9',
    Event: '#FDD650',
    Artefact: '#10A37F',
    ConceptualItem: '#6D4EA1',
    SpatialEntity: '#8DAB99',
    TemporalEntity: '#8DAB99',
    Property: '#888887',
    Unspecified: '#C75D10'
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
    'ConceptualItem': 'ConceptualItem',

    // Spatial & Temporal
    'SpatialEntity': 'SpatialEntity',
    'TemporalEntity': 'TemporalEntity',

    // Property
    'RoleOrPosition': 'Property',
    'Qualification': 'Property',
    'Property': 'Property'
};

/**
 * Get the color for a given ontology class name based on its hierarchy
 * @param className The name of the ontology class (e.g. "Person", "Software")
 * @returns The hex color code string
 */
export function getOntologyColor(className: string | undefined | null): string {
    if (!className) return ONTOLOGY_COLORS.Unspecified;

    // Normalize string: strip < > if present (e.g. "<entity>")
    const cleanName = className.replace(/[<>]/g, '');

    // Look up parent category
    const parentCategory = CLASS_HIERARCHY[cleanName];

    // Return mapped color or fallback to Unspecified
    return parentCategory ? ONTOLOGY_COLORS[parentCategory] : ONTOLOGY_COLORS.Unspecified;
}
