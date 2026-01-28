/**
 * LLM Hermeneutic Workbench - Main Application
 * Supports both Bottom-up Extraction and Ontology Population data sources
 */
import { useMemo } from 'react';
import { useDataStore } from './stores/useDataStore';
import { useOntologyStore } from './stores/useOntologyStore';
import { useFilterStore } from './stores/useFilterStore';
import { useOntologyFilterStore } from './stores/useOntologyFilterStore';
import { useUIStore } from './stores/useUIStore';
import { AppBar } from './components/AppBar';
import { GlobalSummary } from './components/GlobalSummary';
import { OntologyGlobalSummary } from './components/OntologyGlobalSummary';
import { ExtractionCard } from './components/ExtractionCard';
import { OntologyExtractionCard } from './components/OntologyExtractionCard';
import { Sidebar } from './components/Sidebar';
import { NetworkModal } from './components/NetworkModal';
import type { SpeakerTurn } from './types/data';
import type { OntologySpeakerTurn } from './types/ontologyPopulation';

// Import styles - app.css must be first (contains @import for fonts)
import './styles/app.css';
import './styles/design-tokens.css';
import './styles/components.css';
import './styles/network-modal.css';

function App() {
  // Bottom-up Extraction data
  const {
    speakerTurns: bottomUpTurns,
    isLoading: isBottomUpLoading,
    error: bottomUpError,
    entityTypes
  } = useDataStore();

  // Ontology Population data
  const {
    speakerTurns: ontologyTurns,
    isLoading: isOntologyLoading,
    error: ontologyError,
  } = useOntologyStore();

  const {
    activeTypeFilters,
    activePatternFilter,
    activeRelationFilter,
    searchTerm
  } = useFilterStore();

  const {
    activeClassFilters,
    activePropertyFilters,
    activeClaimTypeFilters,
    activeCertaintyFilters,
    activeMappingStatusFilter
  } = useOntologyFilterStore();

  // Get active view from UI store - enables seamless switching between modes
  const { activeView } = useUIStore();

  const isLoading = isBottomUpLoading || isOntologyLoading;
  const error = bottomUpError || ontologyError;

  // Create a fast lookup for entity frequency colors (for bottom-up data)
  const entityUtteranceCounts = useMemo(() => {
    return entityTypes.reduce((acc, curr) => {
      acc[curr.name] = curr.utterance_count;
      return acc;
    }, {} as Record<string, number>);
  }, [entityTypes]);

  // Filter bottom-up speaker turns based on active filters
  const filteredBottomUpTurns = useMemo(() => {
    if (activeView !== 'bottom-up') return [];

    return bottomUpTurns.map(turn => {
      const filteredExtractions = turn.extractions.filter(extraction => {
        // Type filter (case-insensitive for robustness)
        if (activeTypeFilters.size > 0) {
          const subjType = extraction.subject_entity.entity_type;
          const objType = extraction.object_entity.entity_type;
          const hasMatchingType = activeTypeFilters.has(subjType) || activeTypeFilters.has(objType);
          if (!hasMatchingType) return false;
        }

        // Pattern filter
        if (activePatternFilter) {
          const matchesPattern =
            extraction.subject_entity.entity_type === activePatternFilter.subject_type &&
            extraction.relation.semantic_form === activePatternFilter.relation &&
            extraction.object_entity.entity_type === activePatternFilter.object_type;
          if (!matchesPattern) return false;
        }

        // Relation filter
        if (activeRelationFilter) {
          if (extraction.relation.semantic_form !== activeRelationFilter) return false;
        }

        // Search term filter
        if (searchTerm) {
          const searchLower = searchTerm.toLowerCase();
          const matchesSearch =
            extraction.evidence_text.toLowerCase().includes(searchLower) ||
            extraction.subject_entity.name.toLowerCase().includes(searchLower) ||
            extraction.object_entity.name.toLowerCase().includes(searchLower) ||
            extraction.relation.semantic_form.toLowerCase().includes(searchLower) ||
            extraction.relation.surface_form.toLowerCase().includes(searchLower);
          if (!matchesSearch) return false;
        }

        return true;
      });

      return { ...turn, extractions: filteredExtractions };
    }).filter(turn => turn.extractions.length > 0);
  }, [bottomUpTurns, activeTypeFilters, activePatternFilter, activeRelationFilter, searchTerm, activeView]);

  // Filter ontology speaker turns based on all ontology-specific filters
  const filteredOntologyTurns = useMemo(() => {
    if (activeView !== 'ontology') return [];

    return ontologyTurns.map(turn => {
      const filteredExtractions = turn.extractions.filter(extraction => {
        // Class filter
        if (activeClassFilters.size > 0) {
          const subjClass = extraction.subject.ontology_mapping.class;
          const objClass = extraction.object.ontology_mapping.class;
          const hasMatchingClass =
            (subjClass && activeClassFilters.has(subjClass)) ||
            (objClass && activeClassFilters.has(objClass));
          if (!hasMatchingClass) return false;
        }

        // Property filter
        if (activePropertyFilters.size > 0) {
          const prop = extraction.relation.ontology_mapping.property;
          if (!prop || !activePropertyFilters.has(prop)) return false;
        }

        // Claim type filter
        if (activeClaimTypeFilters.size > 0) {
          const claimTypes = extraction.epistemic_stance.claim_type.map(ct => ct.class);
          const hasMatchingClaimType = claimTypes.some(ct => activeClaimTypeFilters.has(ct));
          if (!hasMatchingClaimType) return false;
        }

        // Certainty level filter
        if (activeCertaintyFilters.size > 0) {
          const certainty = extraction.epistemic_stance.certainty_level.class;
          if (!certainty || !activeCertaintyFilters.has(certainty)) return false;
        }

        // Mapping status filter
        if (activeMappingStatusFilter) {
          const subjStatus = extraction.subject.ontology_mapping.mapping_status;
          const objStatus = extraction.object.ontology_mapping.mapping_status;
          const relStatus = extraction.relation.ontology_mapping.mapping_status;
          const hasMatchingStatus =
            subjStatus === activeMappingStatusFilter ||
            objStatus === activeMappingStatusFilter ||
            relStatus === activeMappingStatusFilter;
          if (!hasMatchingStatus) return false;
        }

        // Search term filter
        if (searchTerm) {
          const searchLower = searchTerm.toLowerCase();
          const matchesSearch =
            extraction.subject.canonical_name.toLowerCase().includes(searchLower) ||
            extraction.object.canonical_name.toLowerCase().includes(searchLower) ||
            extraction.relation.surface_form.toLowerCase().includes(searchLower) ||
            extraction.provenance.evidence_text.toLowerCase().includes(searchLower) ||
            (extraction.relation.ontology_mapping.property?.toLowerCase().includes(searchLower) ?? false);
          if (!matchesSearch) return false;
        }

        return true;
      });

      return { ...turn, extractions: filteredExtractions };
    }).filter(turn => turn.extractions.length > 0);
  }, [ontologyTurns, activeClassFilters, activePropertyFilters, activeClaimTypeFilters, activeCertaintyFilters, activeMappingStatusFilter, searchTerm, activeView]);

  // For compatibility with existing components, use bottom-up filtered turns
  const filteredTurns = filteredBottomUpTurns;

  return (
    <>
      <AppBar />

      <div className="container">
        <main className="two-column-layout">
          <div className="main-content-column">
            {activeView === 'bottom-up' && <GlobalSummary filteredTurns={filteredBottomUpTurns} />}
            {activeView === 'ontology' && <OntologyGlobalSummary filteredTurns={filteredOntologyTurns} />}

            {isLoading && (
              <div className="loading-state">
                <p>Loading data...</p>
              </div>
            )}

            {error && (
              <div className="error-state">
                <p>Error: {error}</p>
              </div>
            )}

            {!activeView && !isLoading && (
              <div className="welcome-state">
                <h2>Welcome to LLM Hermeneutic Workbench</h2>
                <p>Use "Bottom-up Extraction" or "Ontology Population" buttons to load a dataset.</p>
              </div>
            )}

            {/* Render Bottom-up Extraction cards */}
            {activeView === 'bottom-up' && filteredBottomUpTurns.map((turn: SpeakerTurn, idx: number) => (
              <div
                key={`${turn.speaker_name}-${turn.utterance_order}-${idx}`}
                className="speaker-turn"
              >
                <div className="turn-header">
                  <span className="turn-speaker-name">{turn.speaker_name}</span>
                  <span className="turn-meta">
                    {turn.role} | Utterance #{turn.utterance_order} | {turn.extractions.length} Extractions
                  </span>
                </div>
                <ExtractionCard
                  extractions={turn.extractions}
                  speakerName={turn.speaker_name}
                  utteranceOrder={turn.utterance_order}
                  entityUtteranceCounts={entityUtteranceCounts}
                />
              </div>
            ))}

            {/* Render Ontology Population cards */}
            {activeView === 'ontology' && filteredOntologyTurns.map((turn: OntologySpeakerTurn, idx: number) => (
              <div
                key={`ontology-${turn.speaker_name}-${turn.utterance_order}-${idx}`}
                className="speaker-turn"
              >
                <div className="turn-header">
                  <span className="turn-speaker-name">{turn.speaker_name}</span>
                  <span className="turn-meta">
                    {turn.role} | Utterance #{turn.utterance_order} | {turn.extractions.length} Ontology Extractions
                  </span>
                </div>
                <OntologyExtractionCard
                  extractions={turn.extractions}
                  speakerName={turn.speaker_name}
                  utteranceOrder={turn.utterance_order}
                />
              </div>
            ))}

            {activeView && (
              (activeView === 'bottom-up' && filteredBottomUpTurns.length === 0) ||
              (activeView === 'ontology' && filteredOntologyTurns.length === 0)
            ) && !isLoading && (
                <div className="empty-state">
                  <p>No extractions match the current filters.</p>
                </div>
              )}
          </div>

          <Sidebar filteredTurns={filteredTurns} />
        </main>
      </div>

      <NetworkModal turns={filteredTurns} />
    </>
  );
}

export default App;
