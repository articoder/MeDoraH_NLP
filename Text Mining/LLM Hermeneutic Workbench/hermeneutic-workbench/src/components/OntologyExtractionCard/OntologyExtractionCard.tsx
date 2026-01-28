/**
 * OntologyExtractionCard Component - Modern OpenAI-inspired Design
 * Clean, minimal, with color-coded certainty and inline epistemic stance
 */
import { useState } from 'react';
import type { OntologyExtraction, MappingStatus } from '../../types/ontologyPopulation';
import './OntologyExtractionCard.css';

interface OntologyExtractionCardProps {
    extractions: OntologyExtraction[];
    speakerName: string;
    utteranceOrder: number;
}

interface MappingBadgeProps {
    status: MappingStatus;
    label: string;
}

import { getOntologyColor } from '../../lib/ontologyUtils';

function MappingBadge({ status, label }: MappingBadgeProps) {
    const badgeColor = getOntologyColor(label);

    return (
        <span
            className={`mapping-badge mapping-${status}`}
            style={{ backgroundColor: badgeColor }}
        >
            {label}
        </span>
    );
}

function getCertaintyClass(level: string): string {
    const classes: Record<string, string> = {
        certain: 'certainty-certain',
        probable: 'certainty-probable',
        possible: 'certainty-possible',
        uncertain: 'certainty-uncertain',
        unspecified: 'certainty-unspecified'
    };
    return classes[level] || 'certainty-unspecified';
}

function formatLabel(text: string): string {
    return text.replace(/_/g, ' ');
}

interface SingleExtractionProps {
    extraction: OntologyExtraction;
}

function SingleExtraction({ extraction }: SingleExtractionProps) {
    const [reasoningExpanded, setReasoningExpanded] = useState(false);

    const subjectClass = extraction.subject.ontology_mapping.class || 'Unknown';
    const objectClass = extraction.object.ontology_mapping.class || 'Unknown';
    const relationProperty = extraction.relation.ontology_mapping.property || extraction.relation.surface_form;

    const subjectStatus = extraction.subject.ontology_mapping.mapping_status as MappingStatus;
    const objectStatus = extraction.object.ontology_mapping.mapping_status as MappingStatus;

    const claimTypes = extraction.epistemic_stance.claim_type.map(ct => ct.class);
    const certaintyLevel = extraction.epistemic_stance.certainty_level.class || 'unspecified';
    const temporalGrounding = extraction.epistemic_stance.temporal_grounding.class || 'unspecified';

    return (
        <div className="ontology-extraction">


            {/* Triple Visualization */}
            <div className="ontology-triple">
                <div className="entity-box">
                    <span className="entity-name">{extraction.subject.canonical_name}</span>
                    <MappingBadge status={subjectStatus} label={subjectClass} />
                </div>

                <div className="relation-connector">
                    <span className="surface-text-inline">"{extraction.relation.surface_form}"</span>
                    <span className="relation-arrow">→</span>
                    <span className="relation-property">
                        {extraction.relation.is_negated && <span className="negation-indicator">¬</span>}
                        {relationProperty}
                    </span>
                </div>

                <div className="entity-box">
                    <span className="entity-name">{extraction.object.canonical_name}</span>
                    <MappingBadge status={objectStatus} label={objectClass} />
                </div>
            </div>

            {/* Epistemic Stance - Inline Row */}
            <div className="epistemic-row">
                {claimTypes.map((ct, i) => (
                    <span key={i} className="epistemic-item">
                        <span className="epistemic-value">{formatLabel(ct)}</span>
                    </span>
                ))}
                <span className="epistemic-separator">·</span>
                <span className="epistemic-item">
                    <span className={`epistemic-value ${getCertaintyClass(certaintyLevel)}`}>
                        {formatLabel(certaintyLevel)}
                    </span>
                </span>
                <span className="epistemic-separator">·</span>
                <span className="epistemic-separator">·</span>
                <span className="epistemic-item" title="Temporal Grounding">
                    <span className="epistemic-icon">🕒</span>
                    <span className="epistemic-value">{formatLabel(temporalGrounding)}</span>
                </span>
                {extraction.epistemic_stance.attribution_type && (
                    <>
                        <span className="epistemic-separator">·</span>
                        <span className="epistemic-item" title="Attribution">
                            <span className="epistemic-icon">💬</span>
                            <span className="epistemic-value">{formatLabel(extraction.epistemic_stance.attribution_type)}</span>
                        </span>
                    </>
                )}
            </div>

            {/* Provenance Section */}
            <div className="provenance-section">
                <p className="evidence-quote">"{extraction.provenance.evidence_text}"</p>
                <div className="source-ids">
                    <span className="source-label">Source:</span>
                    {extraction.provenance.evidence_sentence_ids.map((id, i) => (
                        <span key={i} className="source-id-tag">{id}</span>
                    ))}
                    <span className="source-separator">|</span>
                    <span className="extraction-id-footer">ID: {extraction.extraction_id}</span>
                </div>
            </div>

            {/* Reasoning Section - Accordion */}
            <div className="reasoning-section">
                <button
                    className="reasoning-toggle"
                    onClick={() => setReasoningExpanded(!reasoningExpanded)}
                >
                    <span className={`toggle-chevron ${reasoningExpanded ? 'expanded' : ''}`}>›</span>
                    <span>{reasoningExpanded ? 'Hide LLM Reasoning' : 'Show LLM Reasoning'}</span>
                </button>
                {reasoningExpanded && (
                    <div className="reasoning-content">
                        <div className="reasoning-item">
                            <span className="reasoning-label">Subject/Object</span>
                            <span className="reasoning-text">{extraction.reasons.sub_obj_classes}</span>
                        </div>
                        <div className="reasoning-item">
                            <span className="reasoning-label">Relation</span>
                            <span className="reasoning-text">{extraction.reasons.relation}</span>
                        </div>
                        <div className="reasoning-item">
                            <span className="reasoning-label">Epistemic</span>
                            <span className="reasoning-text">{extraction.reasons.epistemic_stance}</span>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

export function OntologyExtractionCard({ extractions }: OntologyExtractionCardProps) {
    if (extractions.length === 0) {
        return (
            <div className="ontology-card empty-state">
                <p>No ontology extractions found for this utterance.</p>
            </div>
        );
    }

    return (
        <>
            {extractions.map((extraction, index) => (
                <div key={extraction.extraction_id || index} className="ontology-card">
                    <SingleExtraction extraction={extraction} />
                </div>
            ))}
        </>
    );
}
