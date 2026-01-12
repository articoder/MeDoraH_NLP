/**
 * GlobalSummary Component - Statistics overview cards with animated numbers
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

export function GlobalSummary({ filteredTurns }: GlobalSummaryProps) {
    const { globalStats } = useDataStore();
    const { hasActiveFilters } = useFilterStore();

    // Compute filtered statistics from filteredTurns
    const filteredStats = useMemo(() => {
        const totalExtractions = filteredTurns.reduce(
            (sum, turn) => sum + turn.extractions.length,
            0
        );
        const totalSpeakerTurns = filteredTurns.length;

        // Collect unique entity types, names, and relations
        const entityTypes = new Set<string>();
        const entityNames = new Set<string>();
        const relations = new Set<string>();

        filteredTurns.forEach(turn => {
            turn.extractions.forEach(extraction => {
                entityTypes.add(extraction.subject_entity.entity_type);
                entityTypes.add(extraction.object_entity.entity_type);
                entityNames.add(extraction.subject_entity.name);
                entityNames.add(extraction.object_entity.name);
                relations.add(extraction.relation.semantic_form);
            });
        });

        return {
            total_extractions: totalExtractions,
            total_speaker_turns: totalSpeakerTurns,
            unique_entity_types: entityTypes.size,
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

    return (
        <div className="global-summary-card">
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
    );
}
