/**
 * NetworkModal Component - Network visualization using vis-network
 */
import { useEffect, useRef } from 'react';
import { Network } from 'vis-network/standalone';
import { useDataStore } from '../../stores/useDataStore';
import { useUIStore } from '../../stores/useUIStore';
import type { SpeakerTurn, Extraction } from '../../types/data';
import './NetworkModal.css';

interface VisNode {
    id: string;
    label: string;
    group: string;
}

interface VisEdge {
    from: string;
    to: string;
    label: string;
}

interface NetworkModalProps {
    turns?: SpeakerTurn[];
}

export function NetworkModal({ turns }: NetworkModalProps) {
    const { isNetworkModalOpen, closeNetworkModal } = useUIStore();
    const { speakerTurns } = useDataStore();
    const networkContainer = useRef<HTMLDivElement>(null);
    const networkInstance = useRef<Network | null>(null);

    // Use passed turns or fallback to all speaker turns
    const activeTurns = turns || speakerTurns;

    // Calculate total extractions to determine if we have actual graph data
    const totalExtractions = activeTurns.reduce((sum, turn) => sum + turn.extractions.length, 0);
    const hasData = totalExtractions > 0;

    console.log('[NetworkModal] Data check:', {
        turnsCount: activeTurns.length,
        totalExtractions,
        hasData
    });

    useEffect(() => {
        // Early return if modal is not open or no data
        if (!isNetworkModalOpen || !hasData) {
            return;
        }

        // Use timeout to ensure DOM container is mounted
        const initTimeout = setTimeout(() => {
            if (!networkContainer.current) {
                console.log('[NetworkModal] Container not ready');
                return;
            }

            // Clean up previous network instance before creating new one
            if (networkInstance.current) {
                networkInstance.current.destroy();
                networkInstance.current = null;
            }

            // Build nodes and edges from extractions
            const nodesMap = new Map<string, VisNode>();
            const edgesArray: VisEdge[] = [];

            activeTurns.forEach((turn: SpeakerTurn) => {
                turn.extractions.forEach((extraction: Extraction) => {
                    const subjId = `${extraction.subject_entity.name}::${extraction.subject_entity.entity_type}`;
                    const objId = `${extraction.object_entity.name}::${extraction.object_entity.entity_type}`;

                    if (!nodesMap.has(subjId)) {
                        nodesMap.set(subjId, {
                            id: subjId,
                            label: extraction.subject_entity.name,
                            group: extraction.subject_entity.entity_type
                        });
                    }

                    if (!nodesMap.has(objId)) {
                        nodesMap.set(objId, {
                            id: objId,
                            label: extraction.object_entity.name,
                            group: extraction.object_entity.entity_type
                        });
                    }

                    edgesArray.push({
                        from: subjId,
                        to: objId,
                        label: extraction.relation.semantic_form
                    });
                });
            });

            const nodes = Array.from(nodesMap.values());
            console.log('[NetworkModal] Building graph with:', nodes.length, 'nodes and', edgesArray.length, 'edges');

            const options = {
                nodes: {
                    shape: 'dot',
                    size: 10,
                    font: { size: 10, face: 'Inter, sans-serif' },
                    borderWidth: 1
                },
                edges: {
                    arrows: { to: { enabled: true, scaleFactor: 0.5 } },
                    font: { size: 8, face: 'Inter, sans-serif', align: 'middle' as const },
                    smooth: { enabled: true, type: 'dynamic', roundness: 0.5 },
                    color: { opacity: 0.6 }
                },
                layout: {
                    improvedLayout: false,  // Disable for large graphs
                    randomSeed: 42
                },
                physics: {
                    enabled: true,
                    stabilization: {
                        enabled: true,
                        iterations: 35,
                        updateInterval: 20
                    },
                    barnesHut: {
                        gravitationalConstant: -3000,
                        centralGravity: 0.6,
                        springLength: 100,
                        springConstant: 0.05,
                        damping: 0.2
                    }
                },
                interaction: {
                    hover: true,
                    tooltipDelay: 200,
                    hideEdgesOnDrag: true,
                    hideEdgesOnZoom: true
                },
                groups: {
                    PERSON: { color: { background: '#E69F00', border: '#B87D00' } },
                    INSTITUTION: { color: { background: '#56B4E9', border: '#3A8FC4' } },
                    PROJECT: { color: { background: '#009E73', border: '#007A59' } },
                    TECHNOLOGY: { color: { background: '#F0E442', border: '#C4BA34' } },
                    FIELD: { color: { background: '#0072B2', border: '#005A8E' } },
                    JOURNAL: { color: { background: '#D55E00', border: '#A64A00' } },
                    CONCEPT: { color: { background: '#CC79A7', border: '#A65D87' } }
                }
            };

            try {
                networkInstance.current = new Network(
                    networkContainer.current,
                    { nodes, edges: edgesArray },
                    options
                );
                console.log('[NetworkModal] Network initialized successfully');
            } catch (err) {
                console.error('[NetworkModal] Error initializing network:', err);
            }
        }, 100); // Small delay to ensure DOM is ready

        // Cleanup function
        return () => {
            clearTimeout(initTimeout);
            if (networkInstance.current) {
                console.log('[NetworkModal] Cleaning up network instance');
                networkInstance.current.destroy();
                networkInstance.current = null;
            }
        };
    }, [isNetworkModalOpen, hasData, activeTurns]);

    // Don't render anything if modal is not open
    if (!isNetworkModalOpen) {
        return null;
    }

    return (
        <div className="network-modal-overlay" onClick={closeNetworkModal}>
            <div className="network-modal" onClick={(e) => e.stopPropagation()}>
                <div className="network-modal-header">
                    <h2>Knowledge Graph Visualization</h2>
                    <button className="network-modal-close" onClick={closeNetworkModal}>
                        ✕
                    </button>
                </div>
                <div className="network-modal-body">
                    {hasData ? (
                        <div ref={networkContainer} className="network-container" />
                    ) : (
                        <div className="network-empty-state">
                            <svg viewBox="0 0 24 24" width="64" height="64" fill="none" stroke="currentColor" strokeWidth="1.5">
                                <circle cx="12" cy="12" r="3" />
                                <circle cx="6" cy="6" r="2" />
                                <circle cx="18" cy="6" r="2" />
                                <circle cx="6" cy="18" r="2" />
                                <circle cx="18" cy="18" r="2" />
                                <line x1="9" y1="9" x2="7.5" y2="7.5" />
                                <line x1="15" y1="9" x2="16.5" y2="7.5" />
                                <line x1="9" y1="15" x2="7.5" y2="16.5" />
                                <line x1="15" y1="15" x2="16.5" y2="16.5" />
                            </svg>
                            <h3>No Data to Visualize</h3>
                            <p>Load a JSON file first using the "Open JSON" button to see the knowledge graph.</p>
                        </div>
                    )}
                </div>
                <div className="network-modal-legend">
                    <span className="legend-item"><span className="legend-dot" style={{ backgroundColor: '#E69F00' }} />PERSON</span>
                    <span className="legend-item"><span className="legend-dot" style={{ backgroundColor: '#56B4E9' }} />INSTITUTION</span>
                    <span className="legend-item"><span className="legend-dot" style={{ backgroundColor: '#009E73' }} />PROJECT</span>
                    <span className="legend-item"><span className="legend-dot" style={{ backgroundColor: '#F0E442' }} />TECHNOLOGY</span>
                    <span className="legend-item"><span className="legend-dot" style={{ backgroundColor: '#0072B2' }} />FIELD</span>
                    <span className="legend-item"><span className="legend-dot" style={{ backgroundColor: '#D55E00' }} />JOURNAL</span>
                </div>
            </div>
        </div>
    );
}
