/**
 * Relation Pattern Definitions
 * Based on MeDoraH ontology relation inventory
 * 
 * This file defines the 11 top-level relation patterns and their specializations,
 * used to group ontology properties in a hierarchical display.
 */

export interface RelationPatternDef {
    patternName: string;
    displayName: string;
    domainCategory: string;
    rangeCategory: string;
    specializations: string[];
}

/**
 * Complete relation patterns inventory
 * Based on the MeDoraH ontology documentation
 */
export const RELATION_PATTERNS: RelationPatternDef[] = [
    // 1. Actor → Actor: hasSocioInstitutionalRelationWith
    {
        patternName: 'hasSocioInstitutionalRelationWith',
        displayName: 'Actor → Actor',
        domainCategory: 'Actor',
        rangeCategory: 'Actor',
        specializations: [
            'hasEmploymentAt',
            'studiedAt',
            'hasEducationIn',
            'founded',
            'collaboratedWith',
            'mentorsOrSupervises',
            'influences',
            'providesResource',
            'chairOf',
            'represents',
            'affiliatedWith',
            'mergedWith'
        ]
    },
    // 2. Actor → Artefact: createsItem
    {
        patternName: 'createsItem',
        displayName: 'Actor → Artefact',
        domainCategory: 'Actor',
        rangeCategory: 'Artefact',
        specializations: [
            'authorsWork',
            'publishesWork',
            'developsTech',
            'createsArtefact',
            'uses',
            'usesTechnology',
            'usesCorpusOrResource',
            'projectUse'
        ]
    },
    // 3. Actor → ConceptualItem: engagesWithConcept
    {
        patternName: 'engagesWithConcept',
        displayName: 'Actor → ConceptualItem',
        domainCategory: 'Actor',
        rangeCategory: 'ConceptualItem',
        specializations: [
            'workInField',
            'studiesField',
            'coinsOrDefinesTerm'
        ]
    },
    // 4. Actor → Event: engagesIn
    {
        patternName: 'engagesIn',
        displayName: 'Actor → Event',
        domainCategory: 'Actor',
        rangeCategory: 'Event',
        specializations: [
            'participatesIn',
            'organises',
            'presentedAt',
            'funds'
        ]
    },
    // 5. Actor → Property: hasProperty
    {
        patternName: 'hasProperty',
        displayName: 'Actor → Property',
        domainCategory: 'Actor',
        rangeCategory: 'Property',
        specializations: [
            'hasRoleOrPosition',
            'hasQualification'
        ]
    },
    // 6. Event → SpatialEntity|Organisation: takesPlaceAt
    {
        patternName: 'takesPlaceAt',
        displayName: 'Event → Place',
        domainCategory: 'Event',
        rangeCategory: 'SpatialEntity',
        specializations: [
            'takesPlaceAt'
        ]
    },
    // 7. Event → TemporalEntity: hasTimeExtent
    {
        patternName: 'hasTimeExtent',
        displayName: 'Event → Time',
        domainCategory: 'Event',
        rangeCategory: 'TemporalEntity',
        specializations: [
            'hasTimeExtent'
        ]
    },
    // 8. Entity → Entity: dependency
    {
        patternName: 'dependency',
        displayName: 'Entity → Entity',
        domainCategory: 'Artefact',
        rangeCategory: 'Artefact',
        specializations: [
            'isPartOf',
            'conceptuallyInfluences',
            'runsOn'
        ]
    },
    // 9. Artefact → ConceptualItem: about
    {
        patternName: 'about',
        displayName: 'Artefact → Concept',
        domainCategory: 'Artefact',
        rangeCategory: 'ConceptualItem',
        specializations: [
            'hasTopic',
            'implementsConcept'
        ]
    },
    // 10. Actor → SpatialEntity: hasResidence
    {
        patternName: 'hasResidence',
        displayName: 'Actor → Place',
        domainCategory: 'Actor',
        rangeCategory: 'SpatialEntity',
        specializations: [
            'residesIn',
            'grewUpIn',
            'workedIn',
            'locatedIn'
        ]
    }
];

/**
 * Get the parent pattern name for a given relation
 * @param relationName The name of the relation (e.g., "hasEmploymentAt")
 * @returns The parent pattern name or null if unclassified
 */
export function getPatternForRelation(relationName: string): string | null {
    // First check if the relationName IS a top-level pattern
    const asPattern = RELATION_PATTERNS.find(p => p.patternName === relationName);
    if (asPattern) {
        return asPattern.patternName;
    }

    // Then check if it's a specialization
    for (const pattern of RELATION_PATTERNS) {
        if (pattern.specializations.includes(relationName)) {
            return pattern.patternName;
        }
    }

    return null; // Unclassified
}

/**
 * Get the pattern definition for a given pattern name
 */
export function getPatternDef(patternName: string): RelationPatternDef | undefined {
    return RELATION_PATTERNS.find(p => p.patternName === patternName);
}

/**
 * Get all relation names that belong to a pattern
 */
export function getRelationsForPattern(patternName: string): string[] {
    const pattern = RELATION_PATTERNS.find(p => p.patternName === patternName);
    return pattern ? [pattern.patternName, ...pattern.specializations] : [];
}
