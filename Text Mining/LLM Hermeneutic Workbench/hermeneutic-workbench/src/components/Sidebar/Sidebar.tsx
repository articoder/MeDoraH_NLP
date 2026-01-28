/**
 * Sidebar Component - Entity type filters and pattern analytics
 * Supports both Bottom-up Extraction and Ontology Population modes
 */
import { useDataStore } from '../../stores/useDataStore';
import { useOntologyStore } from '../../stores/useOntologyStore';
import { useFilterStore } from '../../stores/useFilterStore';
import { useOntologyFilterStore } from '../../stores/useOntologyFilterStore';
import { useUIStore } from '../../stores/useUIStore';
import { useExportStore } from '../../stores/useExportStore';
import {
    exportEntityTypesCSV,
    exportPatternAnalyticsJSON,
    exportFilteredTriplesJSON
} from '../../lib/exportUtils';
import { getOntologyColor, getOntologyCategory, OntologyCategory } from '../../lib/ontologyUtils';
import AnimatedPanel from '../AnimatedPanel/AnimatedPanel';
import type { SpeakerTurn } from '../../types/data';
import './Sidebar.css';

function getFrequencyClass(utteranceCount: number): string {
    if (utteranceCount > 3) return 'badge-freq-high';
    if (utteranceCount >= 2) return 'badge-freq-medium';
    return 'badge-freq-low';
}

interface SidebarProps {
    filteredTurns: SpeakerTurn[];
}

export function Sidebar({ filteredTurns }: SidebarProps) {
    const {
        entityTypes,
        entityTypesHighFreq,
        entityTypesMediumFreq,
        entityTypesLowFreq,
        structuralPatterns,
        multiTypedEntities,
        subjectOnlyTypes,
        objectOnlyTypes,
        topDiverseRelations
    } = useDataStore();

    const {
        activeTypeFilters,
        toggleTypeFilter,
        activePatternFilter,
        setPatternFilter,
        activeRelationFilter,
        setRelationFilter
    } = useFilterStore();

    // Ontology data and filters
    const {
        ontologyClasses,
        ontologyProperties,
        claimTypeDistribution,
        certaintyLevelDistribution
    } = useOntologyStore();

    const {
        activeClassFilters,
        toggleClassFilter,
        activePropertyFilters,
        togglePropertyFilter,
        activeClaimTypeFilters,
        toggleClaimTypeFilter,
        activeCertaintyFilters,
        toggleCertaintyFilter,
        activeMappingStatusFilter,
        setMappingStatusFilter
    } = useOntologyFilterStore();

    const {
        activeView,
        patternsDisplayCount,
        setPatternsDisplayCount,
        patternsSortOrder,
        togglePatternsSortOrder,
        collapsedSections,
        toggleSection,
        showExportPanel,
        showAdvancedFilter
    } = useUIStore();

    const {
        exportEntities,
        exportPatterns,
        exportTriples,
        toggleExportEntities,
        toggleExportPatterns,
        toggleExportTriples
    } = useExportStore();

    // Get displayed patterns based on count and sort order
    const displayedPatterns = [...structuralPatterns]
        .sort((a, b) => patternsSortOrder === 'desc' ? b.count - a.count : a.count - b.count)
        .slice(0, patternsDisplayCount);

    const handlePatternClick = (pattern: typeof structuralPatterns[0]) => {
        if (
            activePatternFilter?.subject_type === pattern.subject_type &&
            activePatternFilter?.relation === pattern.relation &&
            activePatternFilter?.object_type === pattern.object_type
        ) {
            setPatternFilter(null);
        } else {
            setPatternFilter({
                subject_type: pattern.subject_type,
                relation: pattern.relation,
                object_type: pattern.object_type
            });
        }
    };

    const handleRelationClick = (relation: string) => {
        if (activeRelationFilter === relation) {
            setRelationFilter(null);
        } else {
            setRelationFilter(relation);
        }
    };

    const handleExport = () => {
        let exportCount = 0;

        if (exportEntities && entityTypes.length > 0) {
            exportEntityTypesCSV(entityTypes);
            exportCount++;
        }

        if (exportPatterns) {
            exportPatternAnalyticsJSON(
                structuralPatterns,
                multiTypedEntities,
                subjectOnlyTypes,
                objectOnlyTypes,
                topDiverseRelations
            );
            exportCount++;
        }

        if (exportTriples && filteredTurns.length > 0) {
            exportFilteredTriplesJSON(filteredTurns);
            exportCount++;
        }

        if (exportCount === 0) {
            console.log('[Export] No export options selected or no data available');
        } else {
            console.log(`[Export] Exported ${exportCount} file(s)`);
        }
    };


    return (
        <aside className="sidebar-column" id="sidebar">
            {/* Export Panel */}
            <AnimatedPanel isVisible={showExportPanel} className="sidebar-panel" id="export-panel">
                <h2>Export</h2>
                <div className="export-options-list">
                    <label className="export-option">
                        <input
                            type="checkbox"
                            id="export-option-entities"
                            checked={exportEntities}
                            onChange={toggleExportEntities}
                        />
                        <span>Entity Types CSV</span>
                    </label>
                    <label className="export-option">
                        <input
                            type="checkbox"
                            id="export-option-patterns"
                            checked={exportPatterns}
                            onChange={toggleExportPatterns}
                        />
                        <span>Pattern Analytics (Export All)</span>
                    </label>
                    <label className="export-option">
                        <input
                            type="checkbox"
                            id="export-option-triples"
                            checked={exportTriples}
                            onChange={toggleExportTriples}
                        />
                        <span>Filtered Triples (JSON)</span>
                    </label>
                </div>
                <button
                    className="export-csv-btn"
                    style={{ marginTop: 'var(--sp-4)' }}
                    onClick={handleExport}
                    disabled={!exportEntities && !exportPatterns && !exportTriples}
                >
                    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                        <polyline points="7 10 12 15 17 10" />
                        <line x1="12" y1="15" x2="12" y2="3" />
                    </svg>
                    Export Selected
                </button>
            </AnimatedPanel>

            {/* Bottom-up: Entity Types Filter Panel */}
            <AnimatedPanel
                isVisible={activeView === 'bottom-up' && showAdvancedFilter}
                className="sidebar-panel"
                id="filter-and-search-panel"
                delay={50}
            >
                <h2>Entity Types <span style={{ fontWeight: 400, fontSize: 'var(--fs-sm)', color: 'var(--fg-secondary)' }}>(Click to Filter)</span></h2>

                <div className="legend-container">
                    <div className="legend-item">
                        <div className="legend-color-box" style={{ backgroundColor: 'var(--accent)' }}></div>
                        <span>&gt; 3 Utterances</span>
                    </div>
                    <div className="legend-item">
                        <div className="legend-color-box" style={{ backgroundColor: 'var(--accent-secondary)' }}></div>
                        <span>2-3 Utterances</span>
                    </div>
                    <div className="legend-item">
                        <div className="legend-color-box" style={{ backgroundColor: 'var(--accent-tertiary)' }}></div>
                        <span>1 Utterance</span>
                    </div>
                </div>

                {entityTypesHighFreq.length > 0 && (
                    <div className="entity-type-section">
                        <h4>More than 3 Utterances ({entityTypesHighFreq.length})</h4>
                        <div className="badge-container">
                            {entityTypesHighFreq.map(type => (
                                <span
                                    key={type.name}
                                    className={`entity-type-badge filterable-badge badge-freq-high ${activeTypeFilters.has(type.name) ? 'selected' : ''}`}
                                    onClick={() => toggleTypeFilter(type.name)}
                                >
                                    {type.name} [{type.count}]
                                </span>
                            ))}
                        </div>
                    </div>
                )}

                {entityTypesMediumFreq.length > 0 && (
                    <div className="entity-type-section">
                        <h4>2-3 Utterances ({entityTypesMediumFreq.length})</h4>
                        <div className="badge-container">
                            {entityTypesMediumFreq.map(type => (
                                <span
                                    key={type.name}
                                    className={`entity-type-badge filterable-badge badge-freq-medium ${activeTypeFilters.has(type.name) ? 'selected' : ''}`}
                                    onClick={() => toggleTypeFilter(type.name)}
                                >
                                    {type.name} [{type.count}]
                                </span>
                            ))}
                        </div>
                    </div>
                )}

                {entityTypesLowFreq.length > 0 && (
                    <div className="entity-type-section">
                        <h4>1 Utterance ({entityTypesLowFreq.length})</h4>
                        <div className="badge-container">
                            {entityTypesLowFreq.map(type => (
                                <span
                                    key={type.name}
                                    className={`entity-type-badge filterable-badge badge-freq-low ${activeTypeFilters.has(type.name) ? 'selected' : ''}`}
                                    onClick={() => toggleTypeFilter(type.name)}
                                >
                                    {type.name} [{type.count}]
                                </span>
                            ))}
                        </div>
                    </div>
                )}
            </AnimatedPanel>

            {/* Ontology: Filter Panels - Using AnimatedPanel for smooth enter/exit */}
            {activeView === 'ontology' && (
                <>
                    {/* Ontology Classes Panel */}
                    <AnimatedPanel
                        isVisible={showAdvancedFilter}
                        className="sidebar-panel"
                        id="ontology-classes-panel"
                        delay={50}
                    >
                        <h2>Ontology Classes <span style={{ fontWeight: 400, fontSize: 'var(--fs-sm)', color: 'var(--fg-secondary)' }}>(Click to Filter)</span></h2>

                        {/* Hierarchy Sections */}
                        {(['Actor', 'Event', 'Artefact', 'ConceptualItem', 'SpatialEntity', 'TemporalEntity', 'Property', 'Unspecified'] as OntologyCategory[]).map(category => {
                            const categoryClasses = ontologyClasses.filter(c => getOntologyCategory(c.name) === category);
                            if (categoryClasses.length === 0) return null;

                            return (
                                <div className="entity-type-section" key={category}>
                                    <h4>{category} ({categoryClasses.length})</h4>
                                    <div className="badge-container">
                                        {categoryClasses.map(cls => (
                                            <span
                                                key={cls.name}
                                                className={`entity-type-badge filterable-badge ${activeClassFilters.has(cls.name) ? 'selected' : ''}`}
                                                style={{ color: getOntologyColor(cls.name) }}
                                                onClick={() => toggleClassFilter(cls.name)}
                                            >
                                                {cls.name} [{cls.count}]
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            );
                        })}


                    </AnimatedPanel>

                    {/* Ontology Properties Panel */}
                    <AnimatedPanel
                        isVisible={showAdvancedFilter}
                        className="sidebar-panel"
                        id="ontology-properties-panel"
                        delay={100}
                    >
                        <h2>Ontology Properties <span style={{ fontWeight: 400, fontSize: 'var(--fs-sm)', color: 'var(--fg-secondary)' }}>(Click to Filter)</span></h2>
                        <div className="badge-container">
                            {ontologyProperties.map(prop => (
                                <span
                                    key={prop.name}
                                    className={`entity-type-badge filterable-badge badge-freq-high ${activePropertyFilters.has(prop.name) ? 'selected' : ''}`}
                                    onClick={() => togglePropertyFilter(prop.name)}
                                >
                                    {prop.name} [{prop.count}]
                                </span>
                            ))}
                            {ontologyProperties.length === 0 && (
                                <span className="empty-state">No properties found.</span>
                            )}
                        </div>
                    </AnimatedPanel>

                    {/* Epistemic Stance Panel */}
                    <AnimatedPanel
                        isVisible={showAdvancedFilter}
                        className="sidebar-panel"
                        id="epistemic-panel"
                        delay={150}
                    >
                        <h2>Epistemic Stance <span style={{ fontWeight: 400, fontSize: 'var(--fs-sm)', color: 'var(--fg-secondary)' }}>(Click to Filter)</span></h2>

                        <div className="entity-type-section">
                            <h4>Claim Types ({claimTypeDistribution.length})</h4>
                            <div className="badge-container">
                                {claimTypeDistribution.map(ct => (
                                    <span
                                        key={ct.name}
                                        className={`entity-type-badge filterable-badge badge-freq-medium ${activeClaimTypeFilters.has(ct.name) ? 'selected' : ''}`}
                                        onClick={() => toggleClaimTypeFilter(ct.name)}
                                    >
                                        {ct.name.replace(/_/g, ' ')} [{ct.count}]
                                    </span>
                                ))}
                                {claimTypeDistribution.length === 0 && (
                                    <span className="empty-state">No claim types found.</span>
                                )}
                            </div>
                        </div>

                        <div className="entity-type-section">
                            <h4>Certainty Levels ({certaintyLevelDistribution.length})</h4>
                            <div className="badge-container">
                                {certaintyLevelDistribution.map(cl => (
                                    <span
                                        key={cl.level}
                                        className={`entity-type-badge filterable-badge badge-freq-low ${activeCertaintyFilters.has(cl.level) ? 'selected' : ''}`}
                                        onClick={() => toggleCertaintyFilter(cl.level)}
                                    >
                                        {cl.level} [{cl.count}]
                                    </span>
                                ))}
                                {certaintyLevelDistribution.length === 0 && (
                                    <span className="empty-state">No certainty levels found.</span>
                                )}
                            </div>
                        </div>
                    </AnimatedPanel>

                    {/* Mapping Status Panel */}
                    <AnimatedPanel
                        isVisible={showAdvancedFilter}
                        className="sidebar-panel"
                        id="mapping-status-panel"
                        delay={200}
                    >
                        <h2>Mapping Status <span style={{ fontWeight: 400, fontSize: 'var(--fs-sm)', color: 'var(--fg-secondary)' }}>(Click to Filter)</span></h2>
                        <div className="badge-container">
                            <span
                                className={`entity-type-badge filterable-badge badge-freq-high ${activeMappingStatusFilter === 'mapped' ? 'selected' : ''}`}
                                onClick={() => setMappingStatusFilter('mapped')}
                            >
                                ✓ Mapped
                            </span>
                            <span
                                className={`entity-type-badge filterable-badge badge-freq-low ${activeMappingStatusFilter === 'unmapped' ? 'selected' : ''}`}
                                onClick={() => setMappingStatusFilter('unmapped')}
                            >
                                ○ Unmapped
                            </span>
                            <span
                                className={`entity-type-badge filterable-badge badge-freq-medium ${activeMappingStatusFilter === 'uncertain' ? 'selected' : ''}`}
                                onClick={() => setMappingStatusFilter('uncertain')}
                            >
                                ? Uncertain
                            </span>
                        </div>
                    </AnimatedPanel>
                </>
            )}

            {/* Pattern Analytics Panel - Bottom-up only, controlled by Advanced Filter */}
            {activeView === 'bottom-up' && (
                <AnimatedPanel
                    isVisible={showAdvancedFilter}
                    id="analytics-panel"
                    delay={100}
                >
                    <h2>Pattern Analytics</h2>

                    {/* Entity Type Patterns */}
                    <div className={`summary-section collapsible ${collapsedSections.has('entity-patterns') ? 'collapsed' : ''}`}>
                        <div className="collapsible-header" onClick={() => toggleSection('entity-patterns')}>
                            <h3>Entity Type Patterns</h3>
                            <span className="chevron"></span>
                        </div>
                        <div className="collapsible-content">
                            <h4>Multi-Typed Entities ({Object.keys(multiTypedEntities).length} found)</h4>
                            <ul className="stats-list">
                                {Object.entries(multiTypedEntities).map(([name, types]) => (
                                    <li key={name}>
                                        <span>{name}</span>
                                        <div className="badge-container">
                                            {types.map(type => (
                                                <span key={type} className={`entity-type-badge ${getFrequencyClass(1)}`}>{type}</span>
                                            ))}
                                        </div>
                                    </li>
                                ))}
                                {Object.keys(multiTypedEntities).length === 0 && (
                                    <li className="empty-state">None found.</li>
                                )}
                            </ul>

                            <h4>Subject-Only Types ({subjectOnlyTypes.length})</h4>
                            <div className="badge-container">
                                {subjectOnlyTypes.map(type => (
                                    <span
                                        key={type}
                                        className={`entity-type-badge filterable-badge ${getFrequencyClass(1)}`}
                                        onClick={() => toggleTypeFilter(type)}
                                    >
                                        {type}
                                    </span>
                                ))}
                                {subjectOnlyTypes.length === 0 && <span className="empty-state">None found.</span>}
                            </div>

                            <h4>Object-Only Types ({objectOnlyTypes.length})</h4>
                            <div className="badge-container">
                                {objectOnlyTypes.map(type => (
                                    <span
                                        key={type}
                                        className={`entity-type-badge filterable-badge ${getFrequencyClass(1)}`}
                                        onClick={() => toggleTypeFilter(type)}
                                    >
                                        {type}
                                    </span>
                                ))}
                                {objectOnlyTypes.length === 0 && <span className="empty-state">None found.</span>}
                            </div>
                        </div>
                    </div>

                    {/* Relation Cardinality Patterns */}
                    <div className={`summary-section collapsible ${collapsedSections.has('relation-cardinality') ? 'collapsed' : ''}`}>
                        <div className="collapsible-header" onClick={() => toggleSection('relation-cardinality')}>
                            <h3>Relation Diversity</h3>
                            <span className="chevron"></span>
                        </div>
                        <div className="collapsible-content">
                            <h4>Top {topDiverseRelations.length} Relations by Domain/Range Diversity</h4>
                            <ul className="stats-list">
                                {topDiverseRelations.map(item => (
                                    <li key={item.relation}>
                                        <code
                                            className={`pattern-rel filterable-relation ${activeRelationFilter === item.relation ? 'selected' : ''}`}
                                            onClick={() => handleRelationClick(item.relation)}
                                        >
                                            {item.relation}
                                        </code>
                                        <span>{item.domain_size} Subj Type(s) / {item.range_size} Obj Type(s)</span>
                                    </li>
                                ))}
                                {topDiverseRelations.length === 0 && (
                                    <li className="empty-state">Not enough data to analyze diversity.</li>
                                )}
                            </ul>
                        </div>
                    </div>

                    {/* Frequent Structural Patterns */}
                    {structuralPatterns.length > 0 && (
                        <div className={`summary-section patterns-column collapsible ${collapsedSections.has('structural-patterns') ? 'collapsed' : ''}`}>
                            <div className="collapsible-header" onClick={() => toggleSection('structural-patterns')}>
                                <h3>Frequent Structural Patterns</h3>
                                <span className="chevron"></span>
                            </div>
                            <div className="collapsible-content">
                                <div className="patterns-controls">
                                    <label>
                                        Show:
                                        <select
                                            value={patternsDisplayCount}
                                            onChange={(e) => setPatternsDisplayCount(Number(e.target.value))}
                                        >
                                            <option value={10}>10</option>
                                            <option value={25}>25</option>
                                            <option value={50}>50</option>
                                            <option value={100}>100</option>
                                            <option value={150}>150</option>
                                        </select>
                                    </label>
                                    <label>
                                        Sort:
                                        <button className="network-control-btn" onClick={togglePatternsSortOrder}>
                                            {patternsSortOrder === 'desc' ? 'Descending ▼' : 'Ascending ▲'}
                                        </button>
                                    </label>
                                </div>
                                <ol className="patterns-list-single">
                                    {displayedPatterns.map((pattern, index) => {
                                        const isActive =
                                            activePatternFilter?.subject_type === pattern.subject_type &&
                                            activePatternFilter?.relation === pattern.relation &&
                                            activePatternFilter?.object_type === pattern.object_type;

                                        return (
                                            <li
                                                key={`${pattern.subject_type}-${pattern.relation}-${pattern.object_type}`}
                                                className={isActive ? 'active-filter' : ''}
                                                onClick={() => handlePatternClick(pattern)}
                                            >
                                                <span className="rank">{index + 1}.</span>
                                                <span className="pattern">
                                                    {pattern.subject_type} → <span className="pattern-rel">{pattern.relation}</span> → {pattern.object_type}
                                                </span>
                                                <span className="count">{pattern.count}</span>
                                            </li>
                                        );
                                    })}
                                </ol>
                            </div>
                        </div>
                    )}
                </AnimatedPanel>
            )}
        </aside>
    );
}
