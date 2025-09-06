class NetworkRenderer {
    constructor(containerId) {
        this.containerId = containerId;
        this.network = null;
        this.colorPalette = ['#E69F00', '#56B4E9', '#009E73', '#F0E442', '#0072B2', '#D55E00', '#CC79A7'];
    }
    
    renderNetwork(triples) {
        console.log('🎨 renderNetwork called with', triples.length, 'triples');
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
        
        // Validate and fix container dimensions
        this.ensureContainerDimensions(container).then(() => {
            this.createNetworkWithData(triples, container);
        });
    }
    
    async ensureContainerDimensions(container) {
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
            
            // Wait for styling to take effect
            await new Promise(resolve => {
                setTimeout(() => {
                    console.log('✅ After force sizing:', {
                        offsetWidth: container.offsetWidth,
                        offsetHeight: container.offsetHeight
                    });
                    resolve();
                }, 100);
            });
        }
    }
    
    createNetworkWithData(triples, container) {
        console.log('📊 Processing triple data...');
        
        try {
            // Initialize data structures
            const nodes = new Map();
            const edges = [];
            const entityTypes = new Set();
            
            // Process each triple
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
                
                // Add edge
                edges.push({
                    from: subjName,
                    to: objName,
                    label: relation,
                    title: `Relation: ${relation}\nSurface Form: "${triple.relation.surface_form}"\nEvidence: "${triple.evidence_text.substring(0, 100)}..."`,
                    arrows: 'to'
                });
            });
            
            // Create color mapping for entity types
            const typeArray = Array.from(entityTypes).sort();
            const colorMap = {};
            typeArray.forEach((type, index) => {
                colorMap[type] = this.colorPalette[index % this.colorPalette.length];
            });
            
            // Convert to vis.js format
            const visNodes = Array.from(nodes.values()).map(node => ({
                id: node.id,
                label: node.label,
                title: `Entity: ${node.label}\nType: ${node.type}\nConnections: ${node.degree}`,
                color: colorMap[node.type] || '#999999',
                size: Math.max(15, Math.min(30, node.degree * 3)),
                font: { size: 12 }
            }));
            
            const visEdges = edges.map(edge => ({
                ...edge,
                color: { color: '#C5C5C5', opacity: 0.7 },
                font: { size: 10 }
            }));
            
            console.log('🎨 Creating vis.Network with', visNodes.length, 'nodes and', visEdges.length, 'edges');
            
            // Validate data
            if (visNodes.length === 0) {
                console.error('❌ No nodes to display');
                container.innerHTML = '<div style="display: flex; justify-content: center; align-items: center; height: 100%; color: #999; font-size: 1.2rem;">No entities found to visualize</div>';
                return;
            }
            
            // Create vis.js datasets
            const data = {
                nodes: new vis.DataSet(visNodes),
                edges: new vis.DataSet(visEdges)
            };
            
            // Network options
            const options = {
                nodes: {
                    font: { size: 14, color: '#343434' },
                    borderWidth: 1.5,
                    borderWidthSelected: 2.5
                },
                edges: {
                    font: { size: 10, color: '#343434', align: 'middle' },
                    smooth: { type: 'continuous' }
                },
                physics: {
                    enabled: true,
                    barnesHut: {
                        gravitationalConstant: -8000,
                        springConstant: 0.04,
                        springLength: 250,
                        avoidOverlap: 0.1
                    },
                    stabilization: {
                        enabled: true,
                        iterations: 200,
                        fit: true
                    }
                },
                interaction: { 
                    hover: true, 
                    tooltipDelay: 200, 
                    navigationButtons: true, 
                    keyboard: true 
                }
            };
            
            // Create the network
            this.network = new vis.Network(container, data, options);
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
            
            // Disable physics after stabilization
            this.network.on("stabilizationIterationsDone", () => {
                console.log('✅ Network stabilization completed');
                this.network.setOptions({ physics: false });
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
            throw error;
        }
    }
}