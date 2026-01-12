/**
 * Network Visualization Module
 * Contains NetworkRenderer and ModalManager classes for vis.js network visualization
 * Depends on: vis.js library, FilterTracker class
 */

/**
 * NetworkRenderer Class
 * Handles vis.js network creation, rendering, and interaction
 */
class NetworkRenderer {
    constructor(containerId) {
        this.containerId = containerId;
        this.network = null;
        this.nodes = null;
        this.edges = null;
        this.physicsEnabled = true;
        this.nodeLabelsEnabled = true;
        this.edgeLabelsEnabled = false;
        this.clustered = false;
        this.clusterLevel = 0;
        this.lastRenderedData = null; // Cache for incremental updates

        // Modern color palette with high contrast
        this.colorPalette = ['#E69F00', '#56B4E9', '#009E73', '#F0E442', '#0072B2', '#D55E00', '#CC79A7', '#999999'];

        // Shape palette for accessibility (color + shape redundancy)  
        this.shapePalette = ['dot', 'square', 'triangle', 'diamond', 'star', 'triangleDown', 'hexagon', 'ellipse'];
    }

    // Helper methods for adaptive styling
    calculateNodeSize(degree, totalNodes) {
        // Logarithmic scaling to prevent super-nodes from becoming too large
        const minSize = 10;
        const maxSize = totalNodes > 300 ? 22 : 28;
        const scaleFactor = totalNodes > 300 ? 3 : 4;
        return Math.max(minSize, Math.min(maxSize, minSize + scaleFactor * Math.sqrt(degree)));
    }

    calculateEdgeWidth(weight) {
        return Math.max(1, Math.min(4, weight * 1.5));
    }

    getDrawThreshold(nodeCount) {
        // Dynamic label threshold based on node count
        if (nodeCount <= 50) return 0.5;
        if (nodeCount <= 150) return 0.7;
        if (nodeCount <= 300) return 0.9;
        return 1.2;
    }

    shouldShowEdgeLabels(nodeCount) {
        return this.edgeLabelsEnabled && nodeCount <= 100;
    }

    getSmoothSettings(nodeCount, edgeCount) {
        // Performance optimization: disable smooth edges for large networks
        if (nodeCount > 300 || edgeCount > 500) {
            return { enabled: false };
        }
        return { type: 'continuous', forceDirection: 'none' };
    }

    getAdaptiveOptions(nodeCount, edgeCount) {
        const isLargeNetwork = nodeCount > 300 || edgeCount > 600;
        const isMediumNetwork = nodeCount > 150 || edgeCount > 300;

        let physicsOptions;
        if (nodeCount <= 150) {
            // Small networks: BarnesHut with maximum readability
            physicsOptions = {
                enabled: this.physicsEnabled,
                barnesHut: {
                    gravitationalConstant: -30000,
                    springLength: 400,
                    springConstant: 0.02,
                    damping: 0.15,
                    avoidOverlap: 1.0
                },
                timestep: 0.5,
                stabilization: {
                    enabled: true,
                    iterations: Math.min(500, nodeCount * 5),
                    fit: true
                }
            };
        } else if (isMediumNetwork) {
            // Medium networks: ForceAtlas2Based with maximum separation
            physicsOptions = {
                enabled: this.physicsEnabled,
                forceAtlas2Based: {
                    gravitationalConstant: -200,
                    centralGravity: 0.005,
                    springLength: 350,
                    springConstant: 0.02,
                    damping: 0.15,
                    avoidOverlap: 1.0
                },
                timestep: 0.5,
                stabilization: {
                    enabled: true,
                    iterations: Math.max(200, Math.min(500, nodeCount * 2)),
                    fit: true
                }
            };
        } else {
            // Large networks: optimized ForceAtlas2Based for clarity
            physicsOptions = {
                enabled: this.physicsEnabled,
                forceAtlas2Based: {
                    gravitationalConstant: -150,
                    centralGravity: 0.005,
                    springLength: 280,
                    springConstant: 0.03,
                    damping: 0.2,
                    avoidOverlap: 0.9
                },
                timestep: 0.5,
                stabilization: {
                    enabled: true,
                    iterations: Math.min(300, nodeCount),
                    fit: true
                }
            };
        }

        return {
            nodes: {
                font: {
                    size: 14,
                    color: '#2D3748',
                    face: 'PT Sans Narrow'
                },
                borderWidth: 1.5,
                borderWidthSelected: 3,
                shadow: true
            },
            edges: {
                font: {
                    size: isLargeNetwork ? 8 : 10,
                    color: '#4A5568',
                    align: 'middle',
                    face: 'PT Sans Narrow'
                },
                smooth: this.getSmoothSettings(nodeCount, edgeCount)
            },
            physics: physicsOptions,
            interaction: {
                hover: true,
                hoverConnectedEdges: true,
                selectConnectedEdges: true,
                tooltipDelay: isLargeNetwork ? 300 : 200,
                hideEdgesOnDrag: isLargeNetwork,
                hideEdgesOnZoom: isLargeNetwork,
                navigationButtons: true,
                keyboard: true
            },
            layout: {
                improvedLayout: !isLargeNetwork
            }
        };
    }

    updateLegend(typeArray, colorMap, shapeMap) {
        const legendEl = document.getElementById('network-legend');
        if (!legendEl) return;

        legendEl.innerHTML = '';
        typeArray.slice(0, 6).forEach(type => {
            const item = document.createElement('div');
            item.className = 'network-legend-item';
            item.innerHTML = `
                <div class="network-legend-color" style="background-color: ${colorMap[type]}; border-radius: 50%;"></div>
                <span style="font-family: 'PT Sans Narrow', sans-serif;">${type}</span>
            `;
            legendEl.appendChild(item);
        });

        if (typeArray.length > 6) {
            const moreItem = document.createElement('div');
            moreItem.className = 'network-legend-item';
            moreItem.innerHTML = `<span style="font-family: 'PT Sans Narrow', sans-serif;">+${typeArray.length - 6} more types</span>`;
            legendEl.appendChild(moreItem);
        }

        legendEl.style.display = 'flex';
    }

    setupNetworkEvents() {
        if (!this.network) return;

        // Enhanced node selection with neighborhood highlighting
        this.network.on('selectNode', (params) => {
            if (params.nodes.length > 0) {
                this.highlightNeighborhood(params.nodes[0]);
            }
        });

        this.network.on('deselectNode', () => {
            this.resetHighlight();
        });

        // Stabilization progress
        this.network.on('stabilizationProgress', (params) => {
            const progress = Math.round((params.iterations / params.total) * 100);
            const loadingEl = document.getElementById('network-loading');
            if (loadingEl && loadingEl.style.display !== 'none') {
                const progressText = loadingEl.querySelector('p');
                if (progressText) {
                    progressText.textContent = `Optimizing layout... ${progress}%`;
                }
            }
        });

        // Zoom-based label visibility
        this.network.on('zoom', (params) => {
            this.updateLabelsVisibility(params.scale);
        });

        // Performance: hide edges during drag on large networks
        if (this.nodes && this.nodes.length > 300) {
            this.network.on('dragStart', () => {
                this.edges.update(this.edges.map(edge => ({ ...edge, hidden: true })));
            });

            this.network.on('dragEnd', () => {
                this.edges.update(this.edges.map(edge => ({ ...edge, hidden: false })));
            });
        }
    }

    highlightNeighborhood(nodeId) {
        const connectedNodes = this.network.getConnectedNodes(nodeId);
        const connectedEdges = this.network.getConnectedEdges(nodeId);

        // Dim non-connected elements
        const allNodes = this.nodes.get();
        const allEdges = this.edges.get();

        const updates = allNodes.map(node => {
            if (node.id === nodeId || connectedNodes.includes(node.id)) {
                return { ...node, opacity: 1.0 };
            } else {
                return { ...node, opacity: 0.1 };
            }
        });

        const edgeUpdates = allEdges.map(edge => {
            if (connectedEdges.includes(edge.id)) {
                return { ...edge, opacity: 1.0 };
            } else {
                return { ...edge, opacity: 0.1 };
            }
        });

        this.nodes.update(updates);
        this.edges.update(edgeUpdates);
    }

    resetHighlight() {
        const allNodes = this.nodes.get().map(node => ({ ...node, opacity: 1.0 }));
        const allEdges = this.edges.get().map(edge => ({ ...edge, opacity: 1.0 }));

        this.nodes.update(allNodes);
        this.edges.update(allEdges);
    }

    updateLabelsVisibility(scale) {
        const showLabels = scale > 0.8;
        const showEdgeLabels = scale > 1.2;

        if (showLabels !== this.nodeLabelsEnabled) {
            this.toggleNodeLabels(showLabels);
        }
    }

    // Control methods for interactive buttons
    togglePhysics() {
        this.physicsEnabled = !this.physicsEnabled;
        if (this.network) {
            this.network.setOptions({ physics: { enabled: this.physicsEnabled } });
            const btn = document.getElementById('physics-toggle');
            if (btn) {
                btn.classList.toggle('active', this.physicsEnabled);
            }
        }
    }

    toggleNodeLabels(forceState = null) {
        this.nodeLabelsEnabled = forceState !== null ? forceState : !this.nodeLabelsEnabled;
        if (this.network && this.nodes) {
            const updates = this.nodes.get().map(node => ({
                ...node,
                label: this.nodeLabelsEnabled ? node.title.split('\\n')[0].replace('Entity: ', '') : ''
            }));
            this.nodes.update(updates);

            const btn = document.getElementById('toggle-node-labels');
            if (btn) {
                btn.classList.toggle('active', this.nodeLabelsEnabled);
            }
        }
    }

    toggleEdgeLabels(forceState = null) {
        this.edgeLabelsEnabled = forceState !== null ? forceState : !this.edgeLabelsEnabled;
        if (this.network && this.edges) {
            const updates = this.edges.get().map(edge => ({
                ...edge,
                label: this.edgeLabelsEnabled ? edge.title.split('\\n')[0].replace('Relation: ', '') : ''
            }));
            this.edges.update(updates);

            const btn = document.getElementById('toggle-edge-labels');
            if (btn) {
                btn.classList.toggle('active', this.edgeLabelsEnabled);
            }
        }
    }

    fitNetwork() {
        if (this.network) {
            this.network.fit({
                animation: {
                    duration: 1000,
                    easingFunction: 'easeInOutQuad'
                }
            });
        }
    }

    toggleClustering() {
        if (!this.network || !this.nodes) return;

        this.clustered = !this.clustered;
        const btn = document.getElementById('cluster-toggle');
        if (btn) {
            btn.classList.toggle('active', this.clustered);
        }

        if (this.clustered) {
            this.clusterLevel = (this.clusterLevel + 1) % 3; // Cycle through cluster levels
            this.applyClustering();
        } else {
            this.clusterLevel = 0;
            this.network.setData({ nodes: this.nodes, edges: this.edges });
        }
    }

    applyClustering() {
        if (!this.network) return;

        const nodeData = this.nodes.get();

        switch (this.clusterLevel) {
            case 1:
                this.clusterByType(nodeData);
                break;
            case 2:
                this.clusterByHubSize(nodeData);
                break;
            default:
                // Level 0: no clustering, already handled in toggleClustering
                break;
        }

        // Update button text to show current clustering level
        const btn = document.getElementById('cluster-toggle');
        if (btn) {
            const levelNames = ['Off', 'By Type', 'By Hubs'];
            btn.textContent = `Cluster: ${levelNames[this.clusterLevel]}`;
        }
    }

    clusterByType(nodeData) {
        const typeGroups = {};

        nodeData.forEach(node => {
            const type = node.title.split('\\n')[1].replace('Type: ', '');
            if (!typeGroups[type]) {
                typeGroups[type] = [];
            }
            typeGroups[type].push(node.id);
        });

        // Cluster each type group
        Object.entries(typeGroups).forEach(([type, nodeIds]) => {
            if (nodeIds.length > 3) { // Only cluster if more than 3 nodes
                const clusterOptions = {
                    joinCondition: (childOptions) => {
                        return nodeIds.includes(childOptions.id);
                    },
                    clusterNodeProperties: {
                        id: `cluster_type_${type}`,
                        label: `${type} (${nodeIds.length})`,
                        color: '#E8E8E8',
                        shape: 'database',
                        size: Math.min(50, 20 + nodeIds.length * 2),
                        font: { size: 14, face: 'PT Sans Narrow' }
                    }
                };
                this.network.cluster(clusterOptions);
            }
        });
    }

    clusterByHubSize(nodeData) {
        // Sort nodes by degree (connection count) and cluster high-degree nodes
        const sortedNodes = nodeData.sort((a, b) => {
            const degreeA = this.getNodeDegree(a.id);
            const degreeB = this.getNodeDegree(b.id);
            return degreeB - degreeA;
        });

        const averageDegree = sortedNodes.reduce((sum, node) => sum + this.getNodeDegree(node.id), 0) / sortedNodes.length;
        const highDegreeNodes = sortedNodes.filter(node => this.getNodeDegree(node.id) > averageDegree * 2);

        if (highDegreeNodes.length > 4) {
            // Group high-degree nodes into clusters of 4-6
            const clusterSize = 5;
            for (let i = 0; i < highDegreeNodes.length; i += clusterSize) {
                const clusterNodes = highDegreeNodes.slice(i, i + clusterSize);
                if (clusterNodes.length >= 3) {
                    const clusterOptions = {
                        joinCondition: (childOptions) => {
                            return clusterNodes.some(node => node.id === childOptions.id);
                        },
                        clusterNodeProperties: {
                            id: `cluster_hub_${i / clusterSize}`,
                            label: `Hubs (${clusterNodes.length})`,
                            color: '#FFB366',
                            shape: 'star',
                            size: Math.min(60, 30 + clusterNodes.length * 3),
                            font: { size: 16, face: 'PT Sans Narrow' }
                        }
                    };
                    this.network.cluster(clusterOptions);
                }
            }
        }
    }

    getNodeDegree(nodeId) {
        if (!this.edges) return 0;
        const edgeData = this.edges.get();
        return edgeData.filter(edge => edge.from === nodeId || edge.to === nodeId).length;
    }

    // Search and focus functionality
    searchAndFocus(searchTerm) {
        if (!this.network || !this.nodes || !searchTerm) {
            this.resetHighlight();
            return;
        }

        const nodeData = this.nodes.get();
        const matchingNodes = nodeData.filter(node =>
            node.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (node.label && node.label.toLowerCase().includes(searchTerm.toLowerCase()))
        );

        if (matchingNodes.length > 0) {
            // Focus on the first matching node
            const targetNode = matchingNodes[0];
            this.network.focus(targetNode.id, {
                scale: 1.5,
                offset: { x: 0, y: 0 },
                animation: {
                    duration: 1000,
                    easingFunction: 'easeInOutQuad'
                }
            });

            // Select the node
            this.network.selectNodes([targetNode.id]);
            this.highlightNeighborhood(targetNode.id);

            // Update search input appearance to show success
            const searchInput = document.getElementById('network-search');
            if (searchInput) {
                searchInput.style.borderColor = '#009E73';
                setTimeout(() => {
                    searchInput.style.borderColor = '';
                }, 2000);
            }
        } else {
            // No matches found - show feedback
            const searchInput = document.getElementById('network-search');
            if (searchInput) {
                searchInput.style.borderColor = '#D55E00';
                setTimeout(() => {
                    searchInput.style.borderColor = '';
                }, 2000);
            }
        }
    }

    clearSearch() {
        this.resetHighlight();
        if (this.network) {
            this.network.unselectAll();
        }
    }

    // Incremental update method for better performance when filters change
    updateData(newTriples) {
        if (!this.network || !this.nodes || !this.edges) {
            // Fallback to full re-render if no existing network
            this.renderNetwork(newTriples);
            return;
        }

        console.log('🔄 Performing incremental update with', newTriples.length, 'triples');

        // For large datasets, use incremental approach
        if (newTriples.length > 300 && this.lastRenderedData && this.lastRenderedData.length > 300) {
            const isSimilarData = this.compareTriplesData(this.lastRenderedData, newTriples);
            if (isSimilarData > 0.8) { // 80% similarity threshold
                this.performIncrementalUpdate(newTriples);
                return;
            }
        }

        // For smaller datasets or significant changes, full re-render
        this.renderNetwork(newTriples);
    }

    compareTriplesData(oldTriples, newTriples) {
        if (!oldTriples || oldTriples.length === 0) return 0;

        const oldKeys = new Set(oldTriples.map(t => `${t.subject_entity.name}|${t.relation.semantic_form}|${t.object_entity.name}`));
        const newKeys = new Set(newTriples.map(t => `${t.subject_entity.name}|${t.relation.semantic_form}|${t.object_entity.name}`));

        const intersection = new Set([...oldKeys].filter(x => newKeys.has(x)));
        const union = new Set([...oldKeys, ...newKeys]);

        return intersection.size / union.size; // Jaccard similarity
    }

    performIncrementalUpdate(newTriples) {
        // This is a simplified incremental update - in practice, you would
        // compute the difference and only add/remove changed nodes/edges
        console.log('📊 Performing smart incremental update');

        // For now, we'll do a controlled re-render with preserved positions
        const positions = this.network.getPositions();
        this.renderNetwork(newTriples);

        // Restore positions after a brief delay
        setTimeout(() => {
            if (this.network && positions) {
                this.network.setPositions(positions);
            }
        }, 100);
    }

    // Export functionality
    exportToPNG() {
        if (!this.network) {
            console.error('No network available for export');
            return;
        }

        try {
            const canvas = this.network.canvas.frame.canvas;
            const link = document.createElement('a');
            link.download = `network-visualization-${new Date().toISOString().slice(0, 10)}.png`;
            link.href = canvas.toDataURL('image/png');
            link.click();
            console.log('✅ PNG export completed');
        } catch (error) {
            console.error('❌ PNG export failed:', error);
            this.showExportError('PNG export failed. Please try again.');
        }
    }

    exportToJSON() {
        if (!this.nodes || !this.edges) {
            console.error('No network data available for export');
            return;
        }

        try {
            const exportData = {
                metadata: {
                    title: 'Network Visualization Data',
                    exported: new Date().toISOString(),
                    nodeCount: this.nodes.length,
                    edgeCount: this.edges.length
                },
                nodes: this.nodes.get(),
                edges: this.edges.get(),
                options: this.getExportableOptions()
            };

            const dataStr = JSON.stringify(exportData, null, 2);
            const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);
            const link = document.createElement('a');
            link.setAttribute('href', dataUri);
            link.setAttribute('download', `network-data-${new Date().toISOString().slice(0, 10)}.json`);
            link.click();
            console.log('✅ JSON export completed');
        } catch (error) {
            console.error('❌ JSON export failed:', error);
            this.showExportError('JSON export failed. Please try again.');
        }
    }

    exportToCSV() {
        if (!this.edges) {
            console.error('No edge data available for export');
            return;
        }

        try {
            const csvHeaders = ['from', 'to', 'label', 'weight', 'type'];
            const edgeData = this.edges.get();

            const csvRows = edgeData.map(edge => [
                `"${edge.from || ''}"`,
                `"${edge.to || ''}"`,
                `"${edge.label || ''}"`,
                edge.weight || 1,
                'directed'
            ]);

            const csvContent = [
                csvHeaders.join(','),
                ...csvRows.map(row => row.join(','))
            ].join('\\n');

            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
            const link = document.createElement('a');
            const url = URL.createObjectURL(blob);
            link.setAttribute('href', url);
            link.setAttribute('download', `network-edges-${new Date().toISOString().slice(0, 10)}.csv`);
            link.click();
            URL.revokeObjectURL(url);
            console.log('✅ CSV export completed');
        } catch (error) {
            console.error('❌ CSV export failed:', error);
            this.showExportError('CSV export failed. Please try again.');
        }
    }

    getExportableOptions() {
        return {
            physics: { enabled: this.physicsEnabled },
            labels: {
                nodeLabels: this.nodeLabelsEnabled,
                edgeLabels: this.edgeLabelsEnabled
            },
            clustering: { enabled: this.clustered, level: this.clusterLevel }
        };
    }

    showExportError(message) {
        const container = document.getElementById(this.containerId);
        if (container) {
            const errorDiv = document.createElement('div');
            errorDiv.className = 'export-error-message';
            errorDiv.style.cssText = 'position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); background: #ff6b6b; color: white; padding: 10px 20px; border-radius: 6px; z-index: 1000;';
            errorDiv.textContent = message;
            container.appendChild(errorDiv);

            setTimeout(() => {
                if (errorDiv.parentNode) {
                    errorDiv.parentNode.removeChild(errorDiv);
                }
            }, 3000);
        }
    }

    renderNetwork(triples) {
        console.log('🎨 renderNetwork called with', triples.length, 'triples');

        // Store data for incremental updates
        this.lastRenderedData = triples;

        const container = document.getElementById(this.containerId);
        if (!container) {
            console.error('❌ Network container not found:', this.containerId);
            return;
        }

        console.log('📦 Container found, clearing existing network');

        // Clear existing network
        if (this.network) {
            this.network.destroy();
            this.network = null;
        }

        // Clear container
        container.innerHTML = '';

        // Check and fix container dimensions
        console.log('📏 Checking container dimensions:', {
            offsetWidth: container.offsetWidth,
            offsetHeight: container.offsetHeight,
            clientWidth: container.clientWidth,
            clientHeight: container.clientHeight
        });

        if (container.offsetWidth === 0 || container.offsetHeight === 0) {
            console.warn('⚠️ Container has zero dimensions, applying fallback sizing');

            // Force container styling
            container.style.display = 'block';
            container.style.width = '100%';
            container.style.height = '500px';
            container.style.minHeight = '500px';
            container.style.position = 'relative';

            // Wait for styling to take effect, then process
            setTimeout(() => {
                console.log('✅ After force sizing:', {
                    offsetWidth: container.offsetWidth,
                    offsetHeight: container.offsetHeight
                });
                this.processAndRenderNetwork(triples, container);
            }, 200);
        } else {
            // Container has proper dimensions, proceed immediately
            this.processAndRenderNetwork(triples, container);
        }
    }

    processAndRenderNetwork(triples, container) {
        console.log('📊 Processing triple data...');

        try {
            // Initialize data structures
            const nodes = new Map();
            const edgeMap = new Map(); // For aggregating duplicate edges
            const entityTypes = new Set();

            // Process each triple with edge aggregation
            triples.forEach(triple => {
                const subjName = triple.subject_entity.name;
                const subjType = triple.subject_entity.entity_type;
                const objName = triple.object_entity.name;
                const objType = triple.object_entity.entity_type;
                const relation = triple.relation.semantic_form;

                entityTypes.add(subjType);
                entityTypes.add(objType);

                // Add subject node
                if (!nodes.has(subjName)) {
                    nodes.set(subjName, {
                        id: subjName,
                        label: subjName,
                        type: subjType,
                        degree: 0
                    });
                }
                nodes.get(subjName).degree++;

                // Add object node
                if (!nodes.has(objName)) {
                    nodes.set(objName, {
                        id: objName,
                        label: objName,
                        type: objType,
                        degree: 0
                    });
                }
                nodes.get(objName).degree++;

                // Aggregate edges by (from, to, relation) combination
                const edgeKey = `${subjName}|${objName}|${relation}`;
                if (edgeMap.has(edgeKey)) {
                    const existingEdge = edgeMap.get(edgeKey);
                    existingEdge.weight++;
                    existingEdge.evidences.push(triple.evidence_text.substring(0, 100));
                    existingEdge.surfaceForms.add(triple.relation.surface_form);
                } else {
                    edgeMap.set(edgeKey, {
                        from: subjName,
                        to: objName,
                        label: relation,
                        weight: 1,
                        evidences: [triple.evidence_text.substring(0, 100)],
                        surfaceForms: new Set([triple.relation.surface_form]),
                        title: `Relation: ${relation}\\nSurface Form: "${triple.relation.surface_form}"\\nEvidence: "${triple.evidence_text.substring(0, 100)}..."`
                    });
                }
            });

            // Convert aggregated edges to array
            const edges = Array.from(edgeMap.values()).map(edge => ({
                ...edge,
                label: edge.weight > 1 ? `${edge.label} (×${edge.weight})` : edge.label,
                title: edge.weight > 1 ?
                    `Relation: ${edge.label}\\nOccurrences: ${edge.weight}\\nSurface Forms: ${Array.from(edge.surfaceForms).join(', ')}\\nSample Evidence: "${edge.evidences[0]}..."` :
                    edge.title,
                surfaceForms: undefined, // Clean up for vis.js
                evidences: undefined // Clean up for vis.js
            }));

            // Create color mapping for entity types (all nodes use circle shape)
            const typeArray = Array.from(entityTypes).sort();
            const colorMap = {};
            typeArray.forEach((type, index) => {
                const paletteIndex = index % this.colorPalette.length;
                colorMap[type] = this.colorPalette[paletteIndex];
            });

            // Generate legend
            this.updateLegend(typeArray, colorMap, null);

            // Convert to vis.js format with enhanced styling
            const visNodes = Array.from(nodes.values()).map(node => {
                const size = this.calculateNodeSize(node.degree, nodes.size);
                return {
                    id: node.id,
                    label: this.nodeLabelsEnabled ? node.label : '',
                    title: `Entity: ${node.label}\\nType: ${node.type}\\nConnections: ${node.degree}`,
                    color: {
                        background: colorMap[node.type] || '#999999',
                        border: '#333333',
                        highlight: {
                            background: '#FFE066',
                            border: '#5951f6ff'
                        },
                        hover: {
                            background: '#FFE066',
                            border: '#5951f6ff'
                        }
                    },
                    shape: 'dot',
                    size: size,
                    font: {
                        size: Math.max(10, Math.min(16, size / 2)),
                        color: '#1D2029',
                        face: 'PT Sans Narrow'
                    },
                    borderWidth: 1.5,
                    borderWidthSelected: 3,
                    shadow: {
                        enabled: true,
                        color: 'rgba(95, 99, 104, 0.15)',
                        size: 5,
                        x: 2,
                        y: 2
                    },
                    scaling: {
                        label: {
                            enabled: this.nodeLabelsEnabled,
                            drawThreshold: this.getDrawThreshold(nodes.size),
                            maxVisible: Math.max(20, Math.min(100, nodes.size / 2))
                        }
                    }
                };
            });

            const visEdges = edges.map((edge, index) => {
                const width = this.calculateEdgeWidth(edge.weight || 1);
                return {
                    id: `edge_${index}`,
                    from: edge.from,
                    to: edge.to,
                    label: this.shouldShowEdgeLabels(nodes.size) ? edge.label : '',
                    title: edge.title,
                    arrows: { to: { enabled: true, scaleFactor: 0.8 } },
                    color: {
                        color: '#C5C5C580',
                        highlight: '#5951f6ff',
                        hover: '#5951f6ff',
                        opacity: 0.7
                    },
                    width: width,
                    selectionWidth: width + 2,
                    hoverWidth: width + 1,
                    font: {
                        size: Math.max(8, Math.min(12, 14 - Math.log10(nodes.size))),
                        color: '#5F6368',
                        face: 'PT Sans Narrow',
                        align: 'middle'
                    },
                    smooth: this.getSmoothSettings(nodes.size, edges.length)
                };
            });

            console.log('🎨 Creating vis.Network with', visNodes.length, 'nodes and', visEdges.length, 'edges');

            // Validate data
            if (visNodes.length === 0) {
                console.error('❌ No nodes to display');
                container.innerHTML = '<div style="display: flex; justify-content: center; align-items: center; height: 100%; color: #999; font-size: 1.2rem;">No entities found to visualize</div>';
                return;
            }

            // Adaptive network options based on size
            const options = this.getAdaptiveOptions(nodes.size, visEdges.length);

            // Store data references for later manipulation
            this.nodes = new vis.DataSet(visNodes);
            this.edges = new vis.DataSet(visEdges);

            // Create the network with stored datasets
            const data = { nodes: this.nodes, edges: this.edges };
            this.network = new vis.Network(container, data, options);

            // Setup event handlers for enhanced interaction
            this.setupNetworkEvents();
            console.log('✅ Network created successfully');

            // Update info panel
            const infoPanel = document.getElementById('network-info');
            const statsSpan = document.getElementById('filtered-stats');
            if (infoPanel && statsSpan) {
                statsSpan.textContent = `${visNodes.length} entities, ${visEdges.length} relationships`;
                infoPanel.style.display = 'block';
                console.log('✅ Info panel updated');
            }

            // Enhanced resize sequence
            setTimeout(() => {
                if (this.network) {
                    console.log('🔄 First resize pass...');
                    this.network.redraw();
                    this.network.fit();
                    console.log('✅ First resize completed');
                }
            }, 100);

            // Secondary resize after stabilization
            setTimeout(() => {
                if (this.network) {
                    console.log('🔄 Second resize pass...');
                    this.network.redraw();
                    this.network.fit();
                    console.log('✅ Final resize completed');
                }
            }, 500);

            // After stabilization, keep physics based on physicsEnabled setting
            this.network.on("stabilizationIterationsDone", () => {
                console.log('✅ Network stabilization completed');
                // Keep physics running if it was enabled by default
                if (this.physicsEnabled) {
                    console.log('🔄 Physics remains enabled');
                } else {
                    this.network.setOptions({ physics: false });
                }
                setTimeout(() => {
                    if (this.network) {
                        this.network.fit();
                        console.log('✅ Post-stabilization fit completed');
                    }
                }, 100);
            });

        } catch (error) {
            console.error('❌ Network creation failed:', error);
            console.error('Error stack:', error.stack);
            container.innerHTML = `
                <div style="display: flex; justify-content: center; align-items: center; height: 100%; color: #ff6b6b; font-size: 1.2rem; flex-direction: column; padding: 20px;">
                    <div>❌ Network creation failed</div>
                    <div style="font-size: 0.9rem; margin-top: 10px; text-align: center;">Error: ${error.message}</div>
                    <div style="font-size: 0.8rem; margin-top: 10px; color: #999;">Check browser console for details</div>
                </div>
            `;
        }
    }

    regenerateNetwork() {
        console.log('🔄 Regenerating network with updated filters and settings...');

        if (window.networkComponents && window.networkComponents.filterTracker) {
            // Get current filtered data from FilterTracker
            const filteredTriples = window.networkComponents.filterTracker.getFilteredData(window.allTriples);
            console.log(`🎯 Regenerating network with ${filteredTriples.length} filtered triples`);

            // Re-render network with new data
            this.renderNetwork(filteredTriples);
        } else {
            console.warn('⚠️ FilterTracker not available, using original data');
            if (this.lastRenderedData) {
                this.renderNetwork(this.lastRenderedData);
            }
        }
    }
}

/**
 * ModalManager Class
 * Handles network visualization modal display and controls
 */
class ModalManager {
    constructor(modalId, closeId, triggerId) {
        this.modal = document.getElementById(modalId);
        this.closeBtn = document.getElementById(closeId);
        this.triggerBtn = document.getElementById(triggerId);
        this.loadingEl = document.getElementById('network-loading');

        this.setupEventListeners();
    }

    setupEventListeners() {
        if (this.triggerBtn) {
            this.triggerBtn.addEventListener('click', (e) => {
                e.preventDefault();
                console.log('Visualise button clicked');
                this.show();
            });
        }

        if (this.closeBtn) {
            this.closeBtn.addEventListener('click', () => this.hide());
        }

        if (this.modal) {
            this.modal.addEventListener('click', (e) => {
                if (e.target === this.modal) {
                    this.hide();
                }
            });
        }

        // Setup network control buttons
        this.setupControlButtons();

        // ESC key to close and keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.isVisible()) {
                this.hide();
            }

            // Keyboard shortcuts when modal is visible
            if (this.isVisible()) {
                switch (e.key.toLowerCase()) {
                    case 'p':
                        if (window.networkComponents && window.networkComponents.networkRenderer) {
                            window.networkComponents.networkRenderer.togglePhysics();
                        }
                        e.preventDefault();
                        break;
                    case 'l':
                        if (window.networkComponents && window.networkComponents.networkRenderer) {
                            // Toggle node labels by default
                            window.networkComponents.networkRenderer.toggleNodeLabels();
                            const nodeLabelsBtn = document.getElementById('toggle-node-labels');
                            if (nodeLabelsBtn) {
                                nodeLabelsBtn.classList.toggle('active');
                            }
                        }
                        e.preventDefault();
                        break;
                    case 'f':
                        if (window.networkComponents && window.networkComponents.networkRenderer) {
                            window.networkComponents.networkRenderer.fitNetwork();
                        }
                        e.preventDefault();
                        break;
                    case 'c':
                        if (window.networkComponents && window.networkComponents.networkRenderer) {
                            window.networkComponents.networkRenderer.toggleClustering();
                        }
                        e.preventDefault();
                        break;
                }
            }
        });
    }

    setupControlButtons() {
        const physicsBtn = document.getElementById('physics-toggle');
        const fitBtn = document.getElementById('fit-network');
        const clusterBtn = document.getElementById('cluster-toggle');
        const searchInput = document.getElementById('network-search');
        const exportBtn = document.getElementById('export-btn');
        const exportMenu = document.getElementById('export-menu');

        // Labels dropdown elements
        const labelsBtn = document.getElementById('labels-btn');
        const labelsMenu = document.getElementById('labels-menu');
        const nodeLabelsBtn = document.getElementById('toggle-node-labels');
        const edgeLabelsBtn = document.getElementById('toggle-edge-labels');

        // Hops dropdown elements
        const hopsBtn = document.getElementById('hops-btn');
        const hopsMenu = document.getElementById('hops-menu');
        const hops0Btn = document.getElementById('hops-0');
        const hops1Btn = document.getElementById('hops-1');
        const hops2Btn = document.getElementById('hops-2');

        if (physicsBtn) {
            physicsBtn.addEventListener('click', () => {
                if (window.networkComponents && window.networkComponents.networkRenderer) {
                    window.networkComponents.networkRenderer.togglePhysics();
                }
            });
        }

        // Labels dropdown functionality
        if (labelsBtn && labelsMenu) {
            labelsBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                labelsMenu.classList.toggle('show');
                // Close hops menu if open
                if (hopsMenu) hopsMenu.classList.remove('show');
            });

            // Close dropdown when clicking outside
            document.addEventListener('click', () => {
                labelsMenu.classList.remove('show');
            });

            // Node labels toggle
            if (nodeLabelsBtn) {
                nodeLabelsBtn.addEventListener('click', () => {
                    if (window.networkComponents && window.networkComponents.networkRenderer) {
                        window.networkComponents.networkRenderer.toggleNodeLabels();
                        nodeLabelsBtn.classList.toggle('active');
                    }
                    labelsMenu.classList.remove('show');
                });
            }

            // Edge labels toggle
            if (edgeLabelsBtn) {
                edgeLabelsBtn.addEventListener('click', () => {
                    if (window.networkComponents && window.networkComponents.networkRenderer) {
                        window.networkComponents.networkRenderer.toggleEdgeLabels();
                        edgeLabelsBtn.classList.toggle('active');
                    }
                    labelsMenu.classList.remove('show');
                });
            }
        }

        // Hops dropdown functionality
        if (hopsBtn && hopsMenu) {
            hopsBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                hopsMenu.classList.toggle('show');
                // Close labels menu if open
                if (labelsMenu) labelsMenu.classList.remove('show');
            });

            // Close dropdown when clicking outside
            document.addEventListener('click', () => {
                hopsMenu.classList.remove('show');
            });

            // Hops selection handlers
            [hops0Btn, hops1Btn, hops2Btn].forEach(btn => {
                if (btn) {
                    btn.addEventListener('click', () => {
                        const hopDistance = parseInt(btn.dataset.hops);

                        // Update FilterTracker
                        if (window.networkComponents && window.networkComponents.filterTracker) {
                            window.networkComponents.filterTracker.setHopDistance(hopDistance);
                        }

                        // Update button states
                        [hops0Btn, hops1Btn, hops2Btn].forEach(b => b?.classList.remove('active'));
                        btn.classList.add('active');

                        // Update button text
                        const hopsText = hopDistance === 0 ? '0' : `+${hopDistance}`;
                        hopsBtn.textContent = `Hops: ${hopsText} ▼`;

                        // Regenerate network with new hop distance
                        if (window.networkComponents && window.networkComponents.networkRenderer) {
                            window.networkComponents.networkRenderer.regenerateNetwork();
                        }

                        hopsMenu.classList.remove('show');
                    });
                }
            });
        }

        if (fitBtn) {
            fitBtn.addEventListener('click', () => {
                if (window.networkComponents && window.networkComponents.networkRenderer) {
                    window.networkComponents.networkRenderer.fitNetwork();
                }
            });
        }

        if (clusterBtn) {
            clusterBtn.addEventListener('click', () => {
                if (window.networkComponents && window.networkComponents.networkRenderer) {
                    window.networkComponents.networkRenderer.toggleClustering();
                }
            });
        }

        if (searchInput) {
            let searchTimeout;
            searchInput.addEventListener('input', (e) => {
                clearTimeout(searchTimeout);
                const searchTerm = e.target.value.trim();

                if (searchTerm) {
                    searchTimeout = setTimeout(() => {
                        if (window.networkComponents && window.networkComponents.networkRenderer) {
                            window.networkComponents.networkRenderer.searchAndFocus(searchTerm);
                        }
                    }, 300); // Debounce search
                } else {
                    if (window.networkComponents && window.networkComponents.networkRenderer) {
                        window.networkComponents.networkRenderer.clearSearch();
                    }
                }
            });

            searchInput.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    const searchTerm = e.target.value.trim();
                    if (searchTerm && window.networkComponents && window.networkComponents.networkRenderer) {
                        window.networkComponents.networkRenderer.searchAndFocus(searchTerm);
                    }
                }
            });
        }

        // Export dropdown functionality
        if (exportBtn && exportMenu) {
            exportBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                exportMenu.classList.toggle('show');
            });

            // Close dropdown when clicking outside
            document.addEventListener('click', () => {
                exportMenu.classList.remove('show');
            });

            // Export button handlers
            document.getElementById('export-png')?.addEventListener('click', () => {
                if (window.networkComponents && window.networkComponents.networkRenderer) {
                    window.networkComponents.networkRenderer.exportToPNG();
                }
                exportMenu.classList.remove('show');
            });

            document.getElementById('export-json')?.addEventListener('click', () => {
                if (window.networkComponents && window.networkComponents.networkRenderer) {
                    window.networkComponents.networkRenderer.exportToJSON();
                }
                exportMenu.classList.remove('show');
            });

            document.getElementById('export-csv')?.addEventListener('click', () => {
                if (window.networkComponents && window.networkComponents.networkRenderer) {
                    window.networkComponents.networkRenderer.exportToCSV();
                }
                exportMenu.classList.remove('show');
            });
        }
    }

    show() {
        if (this.modal) {
            console.log('Showing modal...');
            this.modal.style.display = 'block';
            document.body.style.overflow = 'hidden';

            // Show loading first
            this.showLoading();

            // Wait for modal to be fully rendered and visible before creating network
            setTimeout(() => {
                console.log('Modal should be visible now, generating network...');
                this.generateNetwork();
            }, 800); // Further increased delay to ensure proper modal rendering
        }
    }

    generateNetwork() {
        console.log('🎨 generateNetwork called');
        try {
            console.log('vis object available:', typeof vis !== 'undefined');
            console.log('vis version:', vis?.version || 'unknown');

            if (typeof vis === 'undefined') {
                throw new Error('vis.js library not loaded');
            }

            const filteredTriples = window.networkComponents.filterTracker.getFilteredData();
            console.log('📊 Filtered triples:', filteredTriples.length);

            if (filteredTriples.length === 0) {
                console.log('⚠️ No data matches filters');
                this.hideLoading();
                const container = document.getElementById('network-graph');
                if (container) {
                    container.innerHTML = '<div style="display: flex; justify-content: center; align-items: center; height: 100%; color: #999; font-size: 1.2rem;">No data matches current filters</div>';
                }
                return;
            }

            // Add container validation before network creation
            const container = document.getElementById('network-graph');
            if (!container) {
                throw new Error('Network container not found');
            }

            console.log('📏 Container validation before network creation:', {
                found: !!container,
                dimensions: `${container.offsetWidth}x${container.offsetHeight}`,
                visible: container.offsetParent !== null,
                display: getComputedStyle(container).display
            });

            console.log('🎨 Rendering network with', filteredTriples.length, 'triples');
            window.networkComponents.networkRenderer.renderNetwork(filteredTriples);
            this.hideLoading();
            console.log('✅ Network generation completed successfully');

        } catch (error) {
            console.error('❌ Error generating network:', error);
            console.error('Full error details:', {
                message: error.message,
                stack: error.stack,
                name: error.name
            });
            this.hideLoading();
            const container = document.getElementById('network-graph');
            if (container) {
                container.innerHTML = '<div style="display: flex; justify-content: center; align-items: center; height: 100%; color: #ff6b6b; font-size: 1.2rem; flex-direction: column; padding: 20px;"><div>❌ Network Error</div><div style="font-size: 0.9rem; margin-top: 10px; text-align: center;">Error: ' + error.message + '</div><div style="font-size: 0.8rem; margin-top: 10px; color: #999;">Check browser console for details</div></div>';
            }
        }
    }

    hide() {
        if (this.modal) {
            this.modal.style.display = 'none';
            document.body.style.overflow = 'auto';
        }
    }

    isVisible() {
        return this.modal && this.modal.style.display === 'block';
    }

    showLoading() {
        if (this.loadingEl) {
            this.loadingEl.style.display = 'block';
        }
    }

    hideLoading() {
        if (this.loadingEl) {
            this.loadingEl.style.display = 'none';
        }
    }
}

/**
 * Initialize network visualization components after vis.js loads
 */
function initializeNetworkComponents() {
    console.log('Initializing network components...');
    console.log('vis available:', typeof vis !== 'undefined');

    if (typeof vis === 'undefined') {
        console.error('vis.js not loaded, retrying in 500ms...');
        setTimeout(initializeNetworkComponents, 500);
        return;
    }

    window.networkComponents = {
        filterTracker: new FilterTracker(),
        networkRenderer: new NetworkRenderer('network-graph'),
        modalManager: new ModalManager('network-modal', 'network-modal-close', 'visualise-btn')
    };

    console.log('Network components initialized successfully');
}

// Export to global scope
if (typeof window !== 'undefined') {
    window.NetworkRenderer = NetworkRenderer;
    window.ModalManager = ModalManager;
    window.initializeNetworkComponents = initializeNetworkComponents;
}
