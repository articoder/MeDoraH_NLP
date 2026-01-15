---
name: vis-network
description: Work with vis-network graph visualization in the NetworkModal component. Use when modifying "graph visualization", "network view", "node/edge rendering", or "physics settings".
---

# vis-network Graph Visualization

## Purpose

This skill explains how to work with the vis-network library integration in the NetworkModal component for knowledge graph visualization.

## When to Use

- User wants to modify "graph visualization"
- User asks about "network view" or "knowledge graph"
- User needs to change "node rendering" or "edge styling"
- User wants to modify "physics settings" or "layout"
- User asks about "graph export" functionality

## Instructions

### Key Files

| File | Purpose |
|------|---------|
| `src/components/NetworkModal/NetworkModal.tsx` | Main component |
| `src/components/NetworkModal/NetworkModal.css` | Graph styling |
| `src/styles/network-modal.css` | Additional network styles |

### Library Imports

```typescript
import { Network, DataSet } from 'vis-network/standalone';
```

### Network Initialization Pattern

```typescript
// Create datasets
const nodes = new DataSet<Node>([
    { id: 1, label: 'Entity Name', group: 'Person' },
    { id: 2, label: 'Another Entity', group: 'Organization' },
]);

const edges = new DataSet<Edge>([
    { from: 1, to: 2, label: 'works_at' },
]);

// Create network
const container = document.getElementById('network-container');
const network = new Network(container, { nodes, edges }, options);
```

### Standard Options Configuration

```typescript
const options: Options = {
    physics: {
        enabled: true,
        solver: 'forceAtlas2Based',
        forceAtlas2Based: {
            gravitationalConstant: -50,
            centralGravity: 0.01,
            springLength: 100,
            springConstant: 0.08,
        },
        stabilization: {
            iterations: 100,
        },
    },
    nodes: {
        shape: 'dot',
        size: 20,
        font: {
            size: 14,
            face: 'Inter',
        },
        borderWidth: 2,
    },
    edges: {
        arrows: { to: { enabled: true, scaleFactor: 0.5 } },
        font: {
            size: 12,
            align: 'middle',
        },
        smooth: {
            type: 'continuous',
        },
    },
    interaction: {
        hover: true,
        tooltipDelay: 200,
    },
};
```

### Node Grouping (by Entity Type)

```typescript
const groups = {
    Person: { color: { background: '#3B82F6', border: '#2563EB' } },
    Organization: { color: { background: '#F59E0B', border: '#D97706' } },
    Concept: { color: { background: '#10B981', border: '#059669' } },
};

const options = {
    groups: groups,
    // ...other options
};
```

### Common Network Methods

```typescript
// Fit all nodes in view
network.fit();

// Focus on specific node
network.focus(nodeId, { scale: 1.5, animation: true });

// Toggle physics
network.setOptions({ physics: { enabled: !currentPhysicsState } });

// Get selected nodes
const selectedNodes = network.getSelectedNodes();

// Export as canvas image
const canvas = network.canvas.frame.canvas;
const dataUrl = canvas.toDataURL('image/png');
```

### Building Graph from Extractions

```typescript
function buildGraphData(turns: SpeakerTurn[]) {
    const nodesMap = new Map<string, Node>();
    const edgesList: Edge[] = [];
    
    turns.forEach(turn => {
        turn.extractions.forEach(extraction => {
            const { subject_entity, relation, object_entity } = extraction;
            
            // Add subject node
            if (!nodesMap.has(subject_entity.name)) {
                nodesMap.set(subject_entity.name, {
                    id: subject_entity.name,
                    label: subject_entity.name,
                    group: subject_entity.entity_type,
                });
            }
            
            // Add object node
            if (!nodesMap.has(object_entity.name)) {
                nodesMap.set(object_entity.name, {
                    id: object_entity.name,
                    label: object_entity.name,
                    group: object_entity.entity_type,
                });
            }
            
            // Add edge
            edgesList.push({
                from: subject_entity.name,
                to: object_entity.name,
                label: relation.semantic_form,
            });
        });
    });
    
    return {
        nodes: new DataSet(Array.from(nodesMap.values())),
        edges: new DataSet(edgesList),
    };
}
```

## Common Pitfalls

1. **Container not ready**: Initialize network in `useEffect` after DOM mount
2. **Memory leaks**: Call `network.destroy()` on component unmount
3. **Performance with large graphs**: Limit nodes or use clustering
4. **Physics never stabilizes**: Set `stabilization.iterations` limit

## Verification

1. Graph renders with nodes and edges visible
2. Dragging nodes works smoothly
3. Physics simulation stabilizes
4. Console shows `[NetworkModal] Network initialized successfully`
5. Export produces valid PNG image
