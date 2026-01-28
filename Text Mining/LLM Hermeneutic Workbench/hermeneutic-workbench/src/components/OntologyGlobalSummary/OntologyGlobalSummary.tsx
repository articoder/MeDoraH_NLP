/**
 * OntologyGlobalSummary Component - Statistics overview for Ontology Population view
 * Shows: Total Extractions, Speaker Turns, Mapped/Unmapped, Unique Entities
 */
import { useMemo } from 'react';
import { useOntologyStore } from '../../stores/useOntologyStore';
import { useOntologyFilterStore } from '../../stores/useOntologyFilterStore';
import { useFilterStore } from '../../stores/useFilterStore';
import { AnimatedNumber } from '../AnimatedNumber';
import type { OntologySpeakerTurn } from '../../types/ontologyPopulation';
import '../GlobalSummary/GlobalSummary.css';

interface OntologyGlobalSummaryProps {
    filteredTurns: OntologySpeakerTurn[];
}

export function OntologyGlobalSummary({ filteredTurns }: OntologyGlobalSummaryProps) {
    const { globalStats } = useOntologyStore();
    const { searchTerm, setSearchTerm } = useFilterStore();
    const {
        activeClassFilters,
        activePropertyFilters,
        activeClaimTypeFilters,
        activeCertaintyFilters,
        activeMappingStatusFilter,
        clearAllFilters,
        hasActiveFilters: hasOntologyFilters
    } = useOntologyFilterStore();

    // Compute filtered statistics from filteredTurns
    const filteredStats = useMemo(() => {
        let totalExtractions = 0;
        let mappedCount = 0;
        let unmappedCount = 0;
        const entityNames = new Set<string>();

        filteredTurns.forEach(turn => {
            turn.extractions.forEach(extraction => {
                totalExtractions++;

                // Count mapped/unmapped based on subject, object, and relation
                const subjStatus = extraction.subject.ontology_mapping.mapping_status;
                const objStatus = extraction.object.ontology_mapping.mapping_status;
                const relStatus = extraction.relation.ontology_mapping.mapping_status;

                // Consider extraction mapped if all three are mapped
                if (subjStatus === 'mapped' && objStatus === 'mapped' && relStatus === 'mapped') {
                    mappedCount++;
                } else {
                    unmappedCount++;
                }

                // Collect unique entity names
                entityNames.add(extraction.subject.canonical_name);
                entityNames.add(extraction.object.canonical_name);
            });
        });

        return {
            total_extractions: totalExtractions,
            total_speaker_turns: filteredTurns.length,
            mapped_count: mappedCount,
            unmapped_count: unmappedCount,
            unique_entities: entityNames.size
        };
    }, [filteredTurns]);

    // Return null if no ontology data loaded
    if (!globalStats) {
        return null;
    }

    // Check if any filters are active (ontology filters or search term)
    const isFiltered = hasOntologyFilters() || searchTerm !== '';

    // Convert active filters to arrays for rendering
    const activeClassFiltersArray = Array.from(activeClassFilters);
    const activePropertyFiltersArray = Array.from(activePropertyFilters);
    const activeClaimTypeFiltersArray = Array.from(activeClaimTypeFilters);
    const activeCertaintyFiltersArray = Array.from(activeCertaintyFilters);

    return (
        <div className={`global-summary-wrapper ${isFiltered ? 'has-filters' : ''}`}>
            {/* Filter Status Section - Only visible when filters are active */}
            {isFiltered && (
                <div className="filter-status-section">
                    <div className="filter-status-content">
                        {/* Class Filters */}
                        {activeClassFiltersArray.length > 0 && (
                            <div className="filter-group">
                                <span className="filter-group-label">Classes:</span>
                                <div className="filter-badges">
                                    {activeClassFiltersArray.map(className => (
                                        <span
                                            key={className}
                                            className="entity-type-badge badge-freq-high"
                                        >
                                            {className}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Property Filters */}
                        {activePropertyFiltersArray.length > 0 && (
                            <div className="filter-group">
                                <span className="filter-group-label">Properties:</span>
                                <div className="filter-badges">
                                    {activePropertyFiltersArray.map(prop => (
                                        <span
                                            key={prop}
                                            className="entity-type-badge badge-freq-medium"
                                        >
                                            {prop}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Claim Type Filters */}
                        {activeClaimTypeFiltersArray.length > 0 && (
                            <div className="filter-group">
                                <span className="filter-group-label">Claim Types:</span>
                                <div className="filter-badges">
                                    {activeClaimTypeFiltersArray.map(ct => (
                                        <span
                                            key={ct}
                                            className="entity-type-badge badge-freq-low"
                                        >
                                            {ct.replace(/_/g, ' ')}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Certainty Filters */}
                        {activeCertaintyFiltersArray.length > 0 && (
                            <div className="filter-group">
                                <span className="filter-group-label">Certainty:</span>
                                <div className="filter-badges">
                                    {activeCertaintyFiltersArray.map(level => (
                                        <span
                                            key={level}
                                            className="entity-type-badge badge-freq-low"
                                        >
                                            {level}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Mapping Status Filter */}
                        {activeMappingStatusFilter && (
                            <div className="filter-group">
                                <span className="filter-group-label">Mapping:</span>
                                <span className="entity-type-badge badge-freq-medium">
                                    {activeMappingStatusFilter}
                                </span>
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
                        onClick={() => { clearAllFilters(); setSearchTerm(''); }}
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
                        <AnimatedNumber value={filteredStats.total_extractions} />
                    </div>
                    <div className="label">Total Extractions</div>
                </div>
                <div className="stat-item">
                    <div className="value">
                        <AnimatedNumber value={filteredStats.total_speaker_turns} />
                    </div>
                    <div className="label">Speaker Turns</div>
                </div>
                <div className="stat-item">
                    <div className="value">
                        <AnimatedNumber value={filteredStats.mapped_count} />
                    </div>
                    <div className="label">Mapped</div>
                </div>
                <div className="stat-item">
                    <div className="value">
                        <AnimatedNumber value={filteredStats.unmapped_count} />
                    </div>
                    <div className="label">Unmapped</div>
                </div>
                <div className="stat-item">
                    <div className="value">
                        <AnimatedNumber value={filteredStats.unique_entities} />
                    </div>
                    <div className="label">Unique Entities</div>
                </div>
            </div>
        </div>
    );
}
