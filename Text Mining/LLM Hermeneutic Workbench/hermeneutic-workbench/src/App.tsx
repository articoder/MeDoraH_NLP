/**
 * LLM Hermeneutic Workbench - Main Application
 */
import { useMemo } from 'react';
import { useDataStore } from './stores/useDataStore';
import { useFilterStore } from './stores/useFilterStore';
import { AppBar } from './components/AppBar';
import { GlobalSummary } from './components/GlobalSummary';
import { ExtractionCard } from './components/ExtractionCard';
import { Sidebar } from './components/Sidebar';
import { NetworkModal } from './components/NetworkModal';
import type { SpeakerTurn } from './types/data';

// Import styles - app.css must be first (contains @import for fonts)
import './styles/app.css';
import './styles/design-tokens.css';
import './styles/components.css';
import './styles/network-modal.css';

function App() {
  const { speakerTurns, isLoading, error, loadedFilePath, entityTypes } = useDataStore();
  const {
    activeTypeFilters,
    activePatternFilter,
    activeRelationFilter,
    searchTerm
  } = useFilterStore();

  // Create a fast lookup for entity frequency colors
  const entityUtteranceCounts = useMemo(() => {
    return entityTypes.reduce((acc, curr) => {
      acc[curr.name] = curr.utterance_count;
      return acc;
    }, {} as Record<string, number>);
  }, [entityTypes]);

  // Filter speaker turns based on active filters
  const filteredTurns = useMemo(() => {
    console.log('[App] Recalculating filters...', {
      activeTypeFilters: Array.from(activeTypeFilters),
      searchTerm
    });

    return speakerTurns.map(turn => {
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
  }, [speakerTurns, activeTypeFilters, activePatternFilter, activeRelationFilter, searchTerm]);

  return (
    <>
      <AppBar />

      <div className="container">
        <main className="two-column-layout">
          <div className="main-content-column">
            <GlobalSummary filteredTurns={filteredTurns} />

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

            {!loadedFilePath && !isLoading && (
              <div className="welcome-state">
                <h2>Welcome to LLM Hermeneutic Workbench</h2>
                <p>Click "Open JSON" in the toolbar to load a semantic triple dataset.</p>
              </div>
            )}

            {filteredTurns.map((turn: SpeakerTurn, idx: number) => (
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

            {loadedFilePath && filteredTurns.length === 0 && !isLoading && (
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
