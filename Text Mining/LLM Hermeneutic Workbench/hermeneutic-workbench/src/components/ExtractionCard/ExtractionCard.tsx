/**
 * ExtractionCard Component - Displays semantic triples with evidence
 */
import type { Extraction } from '../../types/data';
import './ExtractionCard.css';

interface ExtractionCardProps {
    extractions: Extraction[];
    speakerName: string;
    utteranceOrder: number;
    entityUtteranceCounts?: Record<string, number>;
}

interface SROTripleProps {
    extraction: Extraction;
    entityUtteranceCounts?: Record<string, number>;
}

function getFrequencyClass(utteranceCount: number): string {
    if (utteranceCount > 3) return 'badge-freq-high';
    if (utteranceCount >= 2) return 'badge-freq-medium';
    return 'badge-freq-low';
}

function SROTriple({ extraction, entityUtteranceCounts = {} }: SROTripleProps) {
    const subjUttCount = entityUtteranceCounts[extraction.subject_entity.entity_type] || 0;
    const objUttCount = entityUtteranceCounts[extraction.object_entity.entity_type] || 0;

    return (
        <div className="sro-triple">
            <div className="entity-box subject">
                <span className="entity-name">{extraction.subject_entity.name}</span>
                <span className={`entity-type-badge ${getFrequencyClass(subjUttCount)}`}>
                    {extraction.subject_entity.entity_type}
                </span>
            </div>
            <div className="relation-link">
                <span className="relation-semantic-form">{extraction.relation.semantic_form}</span>
                <span className="relation-arrow">→</span>
            </div>
            <div className="entity-box object">
                <span className="entity-name">{extraction.object_entity.name}</span>
                <span className={`entity-type-badge ${getFrequencyClass(objUttCount)}`}>
                    {extraction.object_entity.entity_type}
                </span>
            </div>
        </div>
    );
}

export function ExtractionCard({ extractions, entityUtteranceCounts = {} }: ExtractionCardProps) {
    if (extractions.length === 0) {
        return (
            <div className="extraction-card empty-state">
                <p>No extractions found for this utterance.</p>
            </div>
        );
    }

    // Group extractions by evidence text
    const groupedByEvidence = extractions.reduce((groups, extraction) => {
        const key = extraction.evidence_text;
        if (!groups[key]) {
            groups[key] = [];
        }
        groups[key].push(extraction);
        return groups;
    }, {} as Record<string, Extraction[]>);

    return (
        <>
            {Object.entries(groupedByEvidence).map(([evidenceText, groupExtractions], groupIndex) => (
                <div key={groupIndex} className="extraction-card">
                    {groupExtractions.map((extraction, index) => (
                        <div key={index}>
                            <SROTriple extraction={extraction} entityUtteranceCounts={entityUtteranceCounts} />
                            <div className="relation-details">
                                Surface Form: <code>"{extraction.relation.surface_form}"</code>
                            </div>
                            {index < groupExtractions.length - 1 && <hr className="triple-divider" />}
                        </div>
                    ))}

                    <div className="evidence-section">
                        <h3>Evidence Source</h3>
                        <blockquote className="evidence-text">{evidenceText}</blockquote>
                        {groupExtractions[0].evidence_sources && groupExtractions[0].evidence_sources.length > 0 && (
                            <div className="evidence-sources">
                                {groupExtractions[0].evidence_sources.map((source, i) => (
                                    <span key={i} className="evidence-id-tag">{source}</span>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            ))}
        </>
    );
}
