# MeDoraH NLP Toolkit

A comprehensive suite of text mining and knowledge graph construction tools developed as part of the **MeDoraH Project** — enabling researchers to transform unstructured historical narratives into structured, semantically-rich knowledge representations.

---

## ✦ Overview

This repository houses the natural language processing pipeline and visualisation toolkit for the MeDoraH project. Our goal is to bridge the gap between raw interview transcripts, archival materials, and formal ontological representations — facilitating both computational analysis and humanistic interpretation.

---

## 🛠 Core Components

### LLM Hermeneutic Workbench

A cross-platform desktop application for interactive semantic analysis and knowledge extraction. Pre-compiled binaries are available for **macOS**, **Windows**, and **Linux**.

The workbench enables researchers to:

- **Bottom-up Extraction** — Explore entity mentions, relations, and semantic claims extracted via large language models
- **Ontology Population** — Map extracted triples onto formal MeDoraH ontology classes and properties
- **Network Visualisation** — Inspect knowledge graphs with interactive, physics-enabled layouts
- **Multi-source Analysis** — Compare and aggregate findings across multiple interview transcripts

> **Download:** See [Releases](../../releases) for the latest builds.

---

### Preprocessing

A Python-based pipeline for preparing interview transcripts and archival materials for downstream analysis:

- **Segmentation** — Split lengthy transcripts into semantically coherent utterance-level segments
- **Sentence Boundary Detection** — Robust handling of conversational speech patterns
- **Pair Generation** — Create context-aware previous/current segment pairs for LLM prompting

---

### Ontology Visualiser

Interactive HTML-based visualisations of the MeDoraH ontology structure:

- **Class Hierarchy Exploration** — Navigate the six top-level domains: Actor, Event, Artefact, ConceptualItem, SpatialEntity, and TemporalEntity
- **Property Documentation** — Browse relation definitions, domains, ranges, and specialisation hierarchies
- **Visual Mapping Reference** — Colour-coded representations aligned with the workbench interface

---

### Clustering

Semantic clustering tools for grouping related claims and predicates:

- **HDBSCAN + SpanBERT** — Density-based clustering of predicate embeddings
- **WordNet Integration** — Enhance cluster interpretability with lexical semantics
- **Assessment Visualisations** — Evaluate cluster quality via silhouette scores, noise analysis, and Pareto-optimal configurations
- **Report Generation** — Produce HTML reports summarising cluster distributions and representative samples

---

## 📂 Repository Structure

```
MeDoraH_NLP/
├── Text Mining/
│   ├── LLM Hermeneutic Workbench/   # Sample data & templates
│   ├── Preprocessing/                # Transcript preparation scripts
│   ├── Ontology Visualiser/          # Interactive ontology diagrams
│   ├── Clustering/                   # Claim and predicate clustering
│   ├── Network Analysis/             # Graph analytics
│   └── Historical Entity Layer/      # Entity extraction experiments
├── Workflows/                        # KG construction pipelines
└── Omeka Front End/                  # Digital archive integration
```

---

## 🚀 Getting Started

### LLM Hermeneutic Workbench

Download the appropriate installer for your operating system from the [Releases](../../releases) page:

| Platform | Format |
|----------|--------|
| macOS    | `.dmg` |
| Windows  | `.msi` |
| Linux    | `.AppImage` |

90: Sample data files are provided in `Text Mining/LLM Hermeneutic Workbench/` for testing and demonstration.
91: 
92: For step-by-step installation instructions, please refer to the [Installation Guide](Text%20Mining/LLM%20Hermeneutic%20Workbench/UseInstruction/README.md).


### Preprocessing Scripts

```bash
cd "Text Mining/Preprocessing"
python transform_utterance_to_sentences.py
```

---

## 📖 Documentation

- [Ontology Documentation](Text%20Mining/Ontology%20Visualiser/MeDoraH%20Ontology%20Documentation%20V0.2%20Short.md)
- [KG Construction Workflows](Workflows/README.md)

---

## 🤝 Contributing

This repository is part of an ongoing research project. For collaboration enquiries, please contact the MeDoraH team.

---

<p align="center">
  <em>Bridging computational methods and humanistic inquiry</em>
</p>
