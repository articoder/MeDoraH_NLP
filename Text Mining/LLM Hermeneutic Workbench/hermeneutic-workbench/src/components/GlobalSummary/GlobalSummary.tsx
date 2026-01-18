/**
 * GlobalSummary Component - Statistics overview cards with animated numbers
 * Includes filter status display when filters are active
 */
import { useMemo } from 'react';
import { useDataStore } from '../../stores/useDataStore';
import { useFilterStore } from '../../stores/useFilterStore';
import { AnimatedNumber } from '../AnimatedNumber';
import type { SpeakerTurn } from '../../types/data';
import './GlobalSummary.css';

interface GlobalSummaryProps {
    filteredTurns: SpeakerTurn[];
}

/**
 * Get frequency-based CSS class for entity type badge coloring
 */
function getFrequencyClass(utteranceCount: number): string {
    if (utteranceCount > 3) return 'badge-freq-high';
    if (utteranceCount >= 2) return 'badge-freq-medium';
    return 'badge-freq-low';
}

export function GlobalSummary({ filteredTurns }: GlobalSummaryProps) {
    const { globalStats, entityTypes } = useDataStore();
    const {
        activeTypeFilters,
        activePatternFilter,
        activeRelationFilter,
        searchTerm,
        clearAllFilters,
        hasActiveFilters
    } = useFilterStore();

    // Create lookup for entity type utterance counts (for badge coloring)
    const entityUtteranceCounts = useMemo(() => {
        return entityTypes.reduce((acc, curr) => {
            acc[curr.name] = curr.utterance_count;
            return acc;
        }, {} as Record<string, number>);
    }, [entityTypes]);

    // Compute filtered statistics from filteredTurns
    const filteredStats = useMemo(() => {
        const totalExtractions = filteredTurns.reduce(
            (sum, turn) => sum + turn.extractions.length,
            0
        );
        const totalSpeakerTurns = filteredTurns.length;

        // Collect unique entity types, names, and relations
        const entityTypesSet = new Set<string>();
        const entityNames = new Set<string>();
        const relations = new Set<string>();

        filteredTurns.forEach(turn => {
            turn.extractions.forEach(extraction => {
                entityTypesSet.add(extraction.subject_entity.entity_type);
                entityTypesSet.add(extraction.object_entity.entity_type);
                entityNames.add(extraction.subject_entity.name);
                entityNames.add(extraction.object_entity.name);
                relations.add(extraction.relation.semantic_form);
            });
        });

        return {
            total_extractions: totalExtractions,
            total_speaker_turns: totalSpeakerTurns,
            unique_entity_types: entityTypesSet.size,
            unique_entity_names: entityNames.size,
            unique_relations: relations.size
        };
    }, [filteredTurns]);

    if (!globalStats) {
        return null;
    }

    // Use filtered stats when filters are active, otherwise use global stats
    const isFiltered = hasActiveFilters();
    const stats = isFiltered ? filteredStats : globalStats;

    // Convert active type filters to array for rendering
    const activeTypeFiltersArray = Array.from(activeTypeFilters);

    return (
        <div className={`global-summary-wrapper ${isFiltered ? 'has-filters' : ''}`}>
            {/* Filter Status Section - Only visible when filters are active */}
            {isFiltered && (
                <div className="filter-status-section">
                    <div className="filter-status-content">
                        {/* Entity Type Filters */}
                        {activeTypeFiltersArray.length > 0 && (
                            <div className="filter-group">
                                <span className="filter-group-label">Entity Types:</span>
                                <div className="filter-badges">
                                    {activeTypeFiltersArray.map(typeName => (
                                        <span
                                            key={typeName}
                                            className={`entity-type-badge ${getFrequencyClass(entityUtteranceCounts[typeName] || 1)}`}
                                        >
                                            {typeName}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Pattern Filter */}
                        {activePatternFilter && (
                            <div className="filter-group">
                                <span className="filter-group-label">Pattern:</span>
                                <span className="pattern-filter-display">
                                    {activePatternFilter.subject_type} →{' '}
                                    <span className="pattern-rel">{activePatternFilter.relation}</span> →{' '}
                                    {activePatternFilter.object_type}
                                </span>
                            </div>
                        )}

                        {/* Relation Filter */}
                        {activeRelationFilter && (
                            <div className="filter-group">
                                <span className="filter-group-label">Relation:</span>
                                <code className="relation-filter-display">{activeRelationFilter}</code>
                            </div>
                        )}

                        {/* Search Term */}
                        {searchTerm && (
                            <div className="filter-group">
                                <span className="filter-group-label">Search:</span>
                                <span className="search-term-display">"{searchTerm}"</span>
                            </div>
                        )}
                    </div>

                    <button
                        className="clear-filters-btn"
                        onClick={clearAllFilters}
                        title="Clear all filters"
                    >
                        <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2">
                            <line x1="18" y1="6" x2="6" y2="18" />
                            <line x1="6" y1="6" x2="18" y2="18" />
                        </svg>
                        Clear Filters
                    </button>
                </div>
            )}

            {/* Statistics Row */}
            <div className="global-summary-stats">
                <div className="stat-item">
                    <div className="value">
                        <AnimatedNumber value={stats.total_extractions} />
                    </div>
                    <div className="label">Total Extractions</div>
                </div>
                <div className="stat-item">
                    <div className="value">
                        <AnimatedNumber value={stats.total_speaker_turns} />
                    </div>
                    <div className="label">Speaker Turns</div>
                </div>
                <div className="stat-item">
                    <div className="value">
                        <AnimatedNumber value={stats.unique_entity_types} />
                    </div>
                    <div className="label">Entity Types</div>
                </div>
                <div className="stat-item">
                    <div className="value">
                        <AnimatedNumber value={stats.unique_entity_names} />
                    </div>
                    <div className="label">Unique Entities</div>
                </div>
                <div className="stat-item">
                    <div className="value">
                        <AnimatedNumber value={stats.unique_relations} />
                    </div>
                    <div className="label">Relations</div>
                </div>
            </div>
        </div>
    );
}
