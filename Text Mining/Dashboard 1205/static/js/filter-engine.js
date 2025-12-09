/**
 * Filter Engine
 * Handles filtering logic for semantic triples and network data
 * Depends on: window.rawTripleData (injected from Jinja2 template)
 */

/**
 * FilterTracker Class
 * Manages filter state and provides filtered data
 */
class FilterTracker {
    constructor() {
        this.typeFilters = new Set();
        this.patternFilter = null;
        this.relationFilter = null;
        this.searchTerm = '';
        this.hopDistance = 0; // Default to 0 hops (exact)
    }

    /**
     * Update all filters at once
     */
    updateFilters(typeFilters, patternFilter, relationFilter, searchTerm) {
        this.typeFilters = new Set(typeFilters);
        this.patternFilter = patternFilter;
        this.relationFilter = relationFilter;
        this.searchTerm = searchTerm;
    }

    /**
     * Set the hop distance for network expansion
     */
    setHopDistance(hops) {
        this.hopDistance = hops;
        console.log('🔗 Hop distance set to:', hops);
    }

    /**
     * Build adjacency graph from triples for hop calculations
     * @param {Array} triples - Array of extraction objects
     * @returns {Map} - Adjacency graph as Map of Sets
     */
    buildAdjacencyGraph(triples) {
        const graph = new Map();
        triples.forEach(triple => {
            const subjName = triple.subject_entity.name;
            const objName = triple.object_entity.name;

            // Add both directions for undirected graph
            if (!graph.has(subjName)) graph.set(subjName, new Set());
            if (!graph.has(objName)) graph.set(objName, new Set());

            graph.get(subjName).add(objName);
            graph.get(objName).add(subjName);
        });
        return graph;
    }

    /**
     * Get nodes within specified hop distance from seed nodes using BFS
     * @param {Array} seedNodes - Starting node names
     * @param {number} hops - Number of hops to expand
     * @param {Array} allTriples - All triples for graph construction
     * @returns {Set} - Set of node names within hop distance
     */
    getNodesWithinHops(seedNodes, hops, allTriples) {
        if (hops === 0) return new Set(seedNodes);

        const nodeGraph = this.buildAdjacencyGraph(allTriples);
        const result = new Set(seedNodes);
        let currentLevel = new Set(seedNodes);

        for (let i = 0; i < hops; i++) {
            const nextLevel = new Set();
            for (const nodeId of currentLevel) {
                const neighbors = nodeGraph.get(nodeId) || new Set();
                neighbors.forEach(neighbor => {
                    if (!result.has(neighbor)) {
                        nextLevel.add(neighbor);
                        result.add(neighbor);
                    }
                });
            }
            currentLevel = nextLevel;
            if (currentLevel.size === 0) break;
        }

        return result;
    }

    /**
     * Check if any filters are currently active
     * @returns {boolean} - True if any filter is active
     */
    hasActiveFilters() {
        return this.typeFilters.size > 0 ||
            this.relationFilter !== null ||
            this.patternFilter !== null ||
            this.searchTerm !== '';
    }

    /**
     * Clear all filters
     */
    clearAllFilters() {
        this.typeFilters.clear();
        this.patternFilter = null;
        this.relationFilter = null;
        this.searchTerm = '';
        this.hopDistance = 0;
    }

    /**
     * Get filtered data based on current filter state
     * @returns {Array} - Array of filtered extraction objects
     */
    getFilteredData() {
        console.log('Getting filtered data...');
        console.log('Current filters:', {
            typeFilters: Array.from(this.typeFilters),
            patternFilter: this.patternFilter,
            relationFilter: this.relationFilter,
            searchTerm: this.searchTerm,
            hopDistance: this.hopDistance
        });

        if (!window.rawTripleData || !Array.isArray(window.rawTripleData)) {
            console.error('Raw triple data not available or invalid');
            return [];
        }

        // First, collect all triples to build the complete graph
        const allTriples = [];
        const allExtractions = [];

        window.rawTripleData.forEach(turn => {
            if (!turn.extractions || !Array.isArray(turn.extractions)) {
                console.warn('Turn missing extractions:', turn);
                return;
            }

            turn.extractions.forEach(extraction => {
                // Validate extraction structure
                if (!extraction.subject_entity || !extraction.object_entity || !extraction.relation) {
                    console.warn('Invalid extraction structure:', extraction);
                    return;
                }

                allExtractions.push(extraction);
            });
        });

        // Find seed nodes that match the primary filters (no hop expansion yet)
        const seedNodes = new Set();

        allExtractions.forEach(extraction => {
            let matchesFilter = false;

            // Search filter
            if (this.searchTerm) {
                const term = this.searchTerm;
                const subjName = (extraction.subject_entity.name || '').toLowerCase();
                const objName = (extraction.object_entity.name || '').toLowerCase();
                const subjType = (extraction.subject_entity.entity_type || '').toLowerCase();
                const objType = (extraction.object_entity.entity_type || '').toLowerCase();
                const relSemantic = (extraction.relation.semantic_form || '').toLowerCase();
                const relSurface = (extraction.relation.surface_form || '').toLowerCase();
                const evidenceText = (extraction.evidence_text || '').toLowerCase();
                const evidenceSources = Array.isArray(extraction.evidence_sources)
                    ? extraction.evidence_sources.map(s => String(s).toLowerCase())
                    : [];

                const matchesSearch =
                    subjName.includes(term) ||
                    objName.includes(term) ||
                    subjType.includes(term) ||
                    objType.includes(term) ||
                    relSemantic.includes(term) ||
                    relSurface.includes(term) ||
                    evidenceText.includes(term) ||
                    evidenceSources.some(s => s.includes(term));

                if (matchesSearch) {
                    matchesFilter = true;
                    seedNodes.add(extraction.subject_entity.name);
                    seedNodes.add(extraction.object_entity.name);
                }
            }

            // Type filters
            if (this.typeFilters.size > 0) {
                if (this.typeFilters.has(extraction.subject_entity.entity_type) ||
                    this.typeFilters.has(extraction.object_entity.entity_type)) {
                    matchesFilter = true;
                    if (this.typeFilters.has(extraction.subject_entity.entity_type)) {
                        seedNodes.add(extraction.subject_entity.name);
                    }
                    if (this.typeFilters.has(extraction.object_entity.entity_type)) {
                        seedNodes.add(extraction.object_entity.name);
                    }
                }
            }

            // Relation filter
            if (this.relationFilter) {
                if (extraction.relation.semantic_form === this.relationFilter) {
                    matchesFilter = true;
                    seedNodes.add(extraction.subject_entity.name);
                    seedNodes.add(extraction.object_entity.name);
                }
            }

            // Pattern filter
            if (this.patternFilter) {
                if (extraction.subject_entity.entity_type === this.patternFilter.s_type &&
                    extraction.relation.semantic_form === this.patternFilter.r_form &&
                    extraction.object_entity.entity_type === this.patternFilter.o_type) {
                    matchesFilter = true;
                    seedNodes.add(extraction.subject_entity.name);
                    seedNodes.add(extraction.object_entity.name);
                }
            }

            // If no specific filters are applied, include all
            if (this.typeFilters.size === 0 && !this.relationFilter && !this.patternFilter && !this.searchTerm) {
                matchesFilter = true;
                seedNodes.add(extraction.subject_entity.name);
                seedNodes.add(extraction.object_entity.name);
            }
        });

        // Apply hop distance to expand the node set
        const targetNodes = this.getNodesWithinHops(Array.from(seedNodes), this.hopDistance, allExtractions);
        console.log(`🔗 Expanded from ${seedNodes.size} seed nodes to ${targetNodes.size} target nodes with ${this.hopDistance} hops`);

        // Now filter triples to include only those involving target nodes
        allExtractions.forEach(extraction => {
            if (targetNodes.has(extraction.subject_entity.name) || targetNodes.has(extraction.object_entity.name)) {
                allTriples.push(extraction);
            }
        });

        console.log('Filtered data result:', allTriples.length, 'triples');
        return allTriples;
    }
}

// Export to global scope
if (typeof window !== 'undefined') {
    window.FilterTracker = FilterTracker;
}
