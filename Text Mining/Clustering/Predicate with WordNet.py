import pandas as pd
import numpy as np
import hdbscan
import umap.umap_ as umap
import plotly.graph_objects as go
import plotly.express as px
from plotly.subplots import make_subplots
import plotly.io as pio
from sklearn.preprocessing import StandardScaler
from scipy.stats import gaussian_kde
from sklearn.decomposition import TruncatedSVD
import colorsys
from collections import Counter
import re
import warnings
import time
from datetime import datetime
import json
import copy
from html import escape

# --- NEW: NLTK for WordNet integration ---
import nltk
from nltk.corpus import wordnet

# Configure renderer for browser-based viewing
pio.renderers.default = "browser"

# Note: If you see sklearn warnings about 'force_all_finite',
# they're deprecation warnings that don't affect functionality.
# You can update scikit-learn to remove them: pip install -U scikit-learn

class EmbeddingVisualizer:
    """
    Advanced embedding visualization with beautiful, publication-quality plots.
    
    Combines UMAP dimensionality reduction with HDBSCAN clustering and creates
    multi-layered interactive visualizations with automatic cluster characterization,
    WordNet semantic analysis, and a fully navigable HTML report.
    """
    
    def __init__(self, parquet_path=None, random_state=42):
        self.random_state = random_state
        if parquet_path:
            self.df = pd.read_parquet(parquet_path)
            self.X = np.vstack(self.df["predicate_embedding"].values)
            self.n_samples = len(self.df)
            print(f"Loaded {self.n_samples:,} embeddings from {parquet_path}")
        else:
            self.df = pd.DataFrame()
            self.X = np.array([])
            self.n_samples = 0

        self.WEBGL_RECOMMENDED_THRESHOLD = 1000
        self.WEBGL_MAX_COMFORTABLE = 100000
        self.SAMPLING_THRESHOLD = 500000
        
        # --- ROBUST FIX: Ensure NLTK data is available by testing functionality ---
        self._ensure_nltk_data()

        if self.n_samples > 0:
            if self.n_samples > self.WEBGL_RECOMMENDED_THRESHOLD:
                print(f"✓ WebGL rendering enabled for optimal performance")
            
            if self.n_samples > self.WEBGL_MAX_COMFORTABLE:
                warnings.warn(
                    f"Dataset has {self.n_samples:,} points. Consider using sampling for better performance.",
                    UserWarning
                )

    # --- REFACTORED: More robust NLTK data check ---
    def _ensure_nltk_data(self):
        """
        Checks for and downloads required NLTK data packages by testing for their
        functionality directly, making it robust against path changes.
        """
        resources_to_check = {
            "wordnet": ("corpora/wordnet", "wordnet"),
            "punkt": ("tokenizers/punkt", "punkt"),
            "averaged_perceptron_tagger": ("taggers/averaged_perceptron_tagger", "averaged_perceptron_tagger")
        }
        
        for resource_name, (path, package_id) in resources_to_check.items():
            try:
                nltk.data.find(path)
            except LookupError:
                print(f"NLTK resource '{resource_name}' not found. Downloading package '{package_id}'...")
                nltk.download(package_id)
                print(f"✓ Download complete for '{package_id}'.")


    def reduce_dimensions(self, n_neighbors=15, min_dist=0.1, metric="cosine"):
        """Apply UMAP dimensionality reduction with optimized parameters."""
        print(f"Reducing {self.X.shape[0]:,} embeddings from {self.X.shape[1]}D to 2D...")
        start_time = time.time()
        self.reducer = umap.UMAP(
            n_neighbors=n_neighbors, min_dist=min_dist, metric=metric,
            n_components=2, init="spectral", random_state=self.random_state,
            n_jobs=-1, low_memory=self.n_samples > 100000
        )
        self.XY = self.reducer.fit_transform(self.X)
        self.df["x"], self.df["y"] = self.XY[:, 0], self.XY[:, 1]
        scaler = StandardScaler()
        self.XY_normalized = scaler.fit_transform(self.XY)
        self.df["x_norm"], self.df["y_norm"] = self.XY_normalized[:, 0], self.XY_normalized[:, 1]
        elapsed = time.time() - start_time
        print(f"✓ UMAP completed in {elapsed:.1f} seconds")
        return self
    
    def cluster_embeddings(self, min_cluster_size=10, min_samples=5):
        """Apply HDBSCAN clustering with soft clustering capabilities."""
        print("Clustering embeddings...")
        start_time = time.time()
        self.clusterer = hdbscan.HDBSCAN(
            min_cluster_size=min_cluster_size, min_samples=min_samples,
            metric="euclidean", cluster_selection_method="eom",
            prediction_data=True, core_dist_n_jobs=-1
        )
        self.clusterer.fit(self.XY_normalized)
        self.df["cluster"] = self.clusterer.labels_
        self.df["probability"] = self.clusterer.probabilities_
        self.df["outlier_score"] = self.clusterer.outlier_scores_
        self.n_clusters = len(set(self.clusterer.labels_)) - (1 if -1 in self.clusterer.labels_ else 0)
        self.n_noise = sum(self.df["cluster"] == -1)
        elapsed = time.time() - start_time
        print(f"✓ Found {self.n_clusters} clusters with {self.n_noise:,} noise points in {elapsed:.1f} seconds")
        return self

    def extract_cluster_keywords(self, n_terms=10, min_word_length=2):
        """Extract representative keywords and sample rows for each cluster."""
        self.cluster_descriptions = {}
        for cluster_id in sorted(self.df["cluster"].unique()):
            if cluster_id == -1: continue
            cluster_df = self.df[self.df["cluster"] == cluster_id]
            words = []
            for text in cluster_df["predicate_text"].values:
                cleaned = re.sub(r'[^\w\s\u4e00-\u9fa5]', ' ', text.lower())
                words.extend([w for w in cleaned.split() if len(w) > min_word_length and not w.isdigit()])
            
            word_counts = Counter(words)
            top_words = [word for word, _ in word_counts.most_common(n_terms)]
            sample_rows = cluster_df.sort_values(by='probability', ascending=False).head(5)
            
            self.cluster_descriptions[cluster_id] = {
                'keywords': top_words,
                'size': len(cluster_df),
                'top_words_with_freq': word_counts.most_common(20),
                'sample_rows': sample_rows.reset_index().to_dict('records')
            }
        return self

    def _extract_verb_hypernyms(self, keywords):
        """
        Identifies verbs in a list of keywords and finds their hypernyms using WordNet.
        
        Args:
            keywords (list): A list of keyword strings.

        Returns:
            dict: A dictionary mapping verbs to a list of their hypernyms.
                  e.g., {'run': ['move', 'travel'], 'eat': ['consume', 'ingest']}
        """
        hypernym_data = {}
        pos_tagged_words = nltk.pos_tag(keywords)
        
        verbs = [word for word, tag in pos_tagged_words if tag.startswith('VB')]
        
        for verb in verbs:
            verb_synsets = wordnet.synsets(verb, pos=wordnet.VERB)
            if not verb_synsets:
                continue
            
            first_synset = verb_synsets[0]
            hypernyms = first_synset.hypernyms()
            
            if hypernyms:
                hypernym_names = sorted(list(set(name for h in hypernyms for name in h.lemma_names())))
                hypernym_data[verb] = hypernym_names
                
        return hypernym_data

    def generate_cluster_colors(self):
        """Generate visually distinct colors for clusters."""
        n_colors_needed = self.n_clusters
        colors = []
        for i in range(n_colors_needed):
            hue = i / n_colors_needed
            saturation = 0.7 + (i % 3) * 0.1
            value = 0.8 + (i % 2) * 0.1
            rgb = colorsys.hsv_to_rgb(hue, saturation, value)
            colors.append('#%02x%02x%02x' % tuple(int(c * 255) for c in rgb))
        
        unique_clusters = sorted([c for c in self.df["cluster"].unique() if c != -1])
        self.color_map = {cluster: colors[i] for i, cluster in enumerate(unique_clusters)}
        self.color_map[-1] = '#cccccc'
        return self
    
    def format_hover_text(self, text, max_length=150):
        """Format text for better readability in hover tooltips."""
        text = ' '.join(text.split())
        return text if len(text) <= max_length else text[:max_length].rsplit(' ', 1)[0] + "..."
    
    def prepare_webgl_data(self, df_subset=None):
        """Prepare data optimized for WebGL rendering with improved hover text."""
        if df_subset is None: df_subset = self.df
        hover_texts = []
        for _, row in df_subset.iterrows():
            text = self.format_hover_text(row["predicate_text"], 200)
            hover_texts.append(
                f"<b>Cluster {row['cluster']}</b><br>"
                f"<b>Confidence:</b> {row['probability']:.3f}<br>"
                f"<b>Outlier Score:</b> {row['outlier_score']:.3f}<br>"
                f"<b>Source:</b> {row['source_file']}<br>"
                f"<b>Index:</b> {row.name}<br><hr>"
                f"<b>Text:</b><br><i>{text}</i>"
            )
        return hover_texts

    def export_hierarchical_clustering_results(self, output_path="hierarchical_clustering_results.txt"):
        """Export detailed hierarchical clustering results to a text file."""
        print(f"Exporting hierarchical clustering results to {output_path}...")
        if not hasattr(self, 'cluster_descriptions'): self.extract_cluster_keywords()
        
        with open(output_path, 'w', encoding='utf-8') as f:
            f.write("="*80 + "\nHIERARCHICAL CLUSTERING ANALYSIS REPORT\n" + f"Generated: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n" + "="*80 + "\n\n")
            f.write("OVERALL STATISTICS\n" + "-"*40 + "\n")
            f.write(f"Total embeddings: {self.n_samples:,}\n")
            f.write(f"Number of clusters: {self.n_clusters}\n")
            f.write(f"Noise points: {self.n_noise:,} ({self.n_noise/self.n_samples*100:.2f}%)\n\n")
            f.write("CLUSTER HIERARCHY (from Condensed Tree)\n" + "-"*40 + "\n")

            if hasattr(self.clusterer, 'condensed_tree_'):
                try:
                    tree_df = self.clusterer.condensed_tree_.to_pandas()
                    parent_children = tree_df.groupby('parent')['child'].apply(list).to_dict()
                    node_sizes = dict(zip(tree_df['child'], tree_df['child_size']))
                    root_nodes = sorted(list(set(parent_children.keys()) - set(tree_df['child'])), reverse=True)
                    def print_hierarchy_to_file(node, level=0):
                        size = node_sizes.get(node, sum(node_sizes.get(c, 1) for c in parent_children.get(node, [])))
                        if size > 1:
                            f.write(f"{'  ' * level}└─ Node {int(node)} (size: {int(size)})\n")
                            if node in parent_children:
                                for child in parent_children[node]: print_hierarchy_to_file(child, level + 1)
                    for root in root_nodes: print_hierarchy_to_file(root)
                except Exception as e:
                    f.write(f"Could not process cluster hierarchy. Reason: {e}\n")
            
            f.write("\n\nDETAILED CLUSTER INFORMATION\n" + "="*80 + "\n\n")
            for cid in sorted(self.df[self.df["cluster"] != -1]["cluster"].unique()):
                f.write(f"CLUSTER {cid}\n" + "-"*40 + "\n")
                data = self.df[self.df["cluster"] == cid]
                desc = self.cluster_descriptions.get(cid, {})
                f.write(f"Size: {len(data)} embeddings\n")
                f.write(f"Avg. Confidence: {data['probability'].mean():.3f}\n")
                if 'keywords' in desc: f.write(f"Top Keywords: {', '.join(desc['keywords'])}\n")
                f.write("\n")
        
        print(f"✓ Hierarchical clustering text report saved to: {output_path}")

    def export_hierarchical_report_html(self, output_path="hierarchical_report.html"):
        """
        Exports a beautiful, interactive HTML report with a navigation sidebar,
        cluster hierarchy, rich semantic triple display, and WordNet hypernym analysis.
        """
        print(f"Creating interactive HTML hierarchical report at {output_path}...")
        if not hasattr(self, 'cluster_descriptions'): self.extract_cluster_keywords()
        if not hasattr(self, 'color_map'): self.generate_cluster_colors()

        html_template = """
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Hierarchical Clustering Report</title>
            <style>
                :root {{
                    --primary-color: #0056b3; --primary-light: #007bff;
                    --secondary-color: #6c757d; --bg-color: #f8f9fa;
                    --content-bg: #ffffff; --border-color: #dee2e6;
                    --text-color: #212529; --sidebar-width: 280px;
                }}
                body {{ font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif; line-height: 1.6; color: var(--text-color); background-color: var(--bg-color); margin: 0; padding: 0; }}
                .sidebar {{ position: fixed; top: 0; left: 0; width: var(--sidebar-width); height: 100vh; background: var(--content-bg); border-right: 1px solid var(--border-color); padding: 20px; overflow-y: auto; box-shadow: 2px 0 10px rgba(0,0,0,0.05); }}
                .sidebar h3 {{ color: var(--primary-color); margin-top: 0; border-bottom: 2px solid var(--border-color); padding-bottom: 10px; }}
                .sidebar ul {{ list-style: none; padding: 0; }}
                .sidebar ul li a {{ color: var(--primary-color); text-decoration: none; display: block; padding: 8px 10px; border-radius: 5px; transition: background-color 0.2s; font-weight: 500; }}
                .sidebar ul li a:hover {{ background-color: #e9ecef; }}
                .sidebar ul .sub-menu {{ padding-left: 20px; font-size: 0.9em; }}
                .main-content {{ margin-left: var(--sidebar-width); padding: 30px 40px; }}
                .container {{ max-width: 1200px; margin: auto; }}
                h1, h2 {{ color: var(--primary-color); border-bottom: 2px solid #e9ecef; padding-bottom: 10px; }}
                h1 {{ font-size: 2.2em; text-align: center; }}
                h2 {{ font-size: 1.8em; margin-top: 40px; scroll-margin-top: 20px; }}
                h3 {{ font-size: 1.4em; }}
                .stats-grid {{ display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 20px; margin-bottom: 30px; }}
                .stat-card {{ background: #f8f9fa; padding: 20px; border-radius: 8px; border-left: 5px solid var(--primary-light); text-align: center; }}
                .stat-card .value {{ font-size: 2.5em; font-weight: bold; color: var(--primary-color); }}
                .stat-card .label {{ font-size: 1em; color: var(--secondary-color); }}
                .tree-container {{ background: #f8f9fa; padding: 20px; border-radius: 8px; margin-top: 20px; overflow-x: auto; }}
                .tree ul {{ list-style-type: none; padding-left: 20px; }}
                .tree li {{ position: relative; padding: 4px 0 4px 25px; }}
                .tree li::before, .tree li::after {{ content: ''; position: absolute; left: 0; }}
                .tree li::before {{ border-left: 1px solid #adb5bd; width: 1px; top: -8px; bottom: 8px; }}
                .tree li::after {{ border-top: 1px solid #adb5bd; width: 18px; top: 15px; }}
                .tree > ul > li:first-child::before {{ top: 15px; }}
                .tree li:last-child::before {{ height: 30px; bottom: auto; }}
                .tree .node-content {{ display: flex; align-items: center; cursor: pointer; border-radius: 5px; padding: 5px; transition: background-color 0.2s; white-space: nowrap; }}
                .tree .node-content:hover {{ background-color: #e9ecef; }}
                .tree .toggle {{ font-family: monospace; font-size: 1.2em; margin-right: 8px; width: 20px; text-align: center; color: var(--secondary-color); }}
                .tree .node-details {{ font-size: 0.95em; }}
                .tree .node-id {{ font-weight: bold; color: var(--primary-color); }}
                .tree .node-size {{ color: #28a745; }} .tree .node-lambda {{ color: #dc3545; }}
                .tree .final-cluster-node {{ font-weight: bold; border: 1px solid; padding: 2px 6px; border-radius: 4px; text-decoration: none; }}
                .tree .node-keywords {{ color: #555; font-style: italic; margin-left: 10px; font-size: 0.9em; }}
                .tree ul.collapsed {{ display: none; }}
                .cluster-card {{ border: 1px solid var(--border-color); border-radius: 8px; margin-bottom: 20px; padding: 20px; box-shadow: 0 2px 5px rgba(0,0,0,0.05); scroll-margin-top: 20px; }}
                #cluster-details h3, #wordnet-analysis h3 {{ border-left: 5px solid; padding-left: 15px; margin-top: 0; }}
                .keywords span {{ background-color: #e9ecef; color: #333; padding: 3px 8px; border-radius: 4px; margin: 2px; display: inline-block; font-family: monospace; }}
                .samples-container {{ margin-top: 15px; }}
                .sample-item {{ background: #f8f9fa; border: 1px solid #e9ecef; padding: 15px; border-radius: 6px; margin-bottom: 10px; }}
                .sample-triple {{ display: flex; align-items: center; flex-wrap: wrap; gap: 10px; font-size: 1.05em; }}
                .sample-triple .part {{ padding: 5px 10px; border-radius: 5px; }}
                .sample-triple .subject, .sample-triple .object {{ background-color: #d1ecf1; color: #0c5460; font-weight: bold; }}
                .sample-triple .predicate {{ background-color: #f8d7da; color: #721c24; font-style: italic; }}
                .sample-triple .arrow {{ color: var(--secondary-color); font-weight: bold; }}
                .sample-meta {{ display: flex; flex-wrap: wrap; gap: 15px; font-size: 0.85em; margin-top: 10px; border-top: 1px solid #e9ecef; padding-top: 10px; }}
                .sample-meta span {{ background-color: #e0e0e0; padding: 2px 8px; border-radius: 10px; }}
                .wordnet-card {{ border: 1px solid var(--border-color); border-radius: 8px; margin-bottom: 20px; padding: 20px; box-shadow: 0 2px 5px rgba(0,0,0,0.05); scroll-margin-top: 20px; }}
                .hypernym-item {{ margin-bottom: 15px; }}
                .hypernym-item .verb {{ font-weight: bold; font-size: 1.1em; color: var(--primary-color); }}
                .hypernym-list {{ list-style-type: '↪ '; padding-left: 25px; margin-top: 5px; }}
                .hypernym-list li {{ background-color: #e9ecef; color: #333; padding: 3px 8px; border-radius: 4px; margin: 3px; display: inline-block; }}
            </style>
        </head>
        <body>
            <nav class="sidebar">
                <h3>Report Navigation</h3>
                <ul>{toc_html}</ul>
            </nav>
            <main class="main-content">
                <div class="container">
                    <h1 id="title">Hierarchical Clustering Report</h1>
                    <p style="text-align:center; color: #6c757d;">Generated: {datetime_now}</p>
                    
                    <h2 id="stats">Overall Statistics</h2>
                    <div class="stats-grid">
                        <div class="stat-card"><div class="value">{n_samples:,}</div><div class="label">Total Embeddings</div></div>
                        <div class="stat-card"><div class="value">{n_clusters}</div><div class="label">Clusters Found</div></div>
                        <div class="stat-card" style="border-color: #ffc107;"><div class="value">{n_noise:,}</div><div class="label">Noise Points ({noise_ratio:.1%})</div></div>
                    </div>
                    
                    <h2 id="hierarchy">Cluster Hierarchy</h2>
                    <div class="tree-container">
                        <p>Tree view of the cluster hierarchy. Click [+] to expand/collapse. Horizontally scrollable.</p>
                        <div class="tree" id="hierarchy-tree">{hierarchy_html}</div>
                    </div>
                    
                    <h2 id="details">Cluster Details</h2>
                    <div id="cluster-details">{clusters_html}</div>
                    
                    <h2 id="wordnet">WordNet Hypernym Analysis</h2>
                    <p>Analysis of verbs found in cluster keywords. Hypernyms are more general concepts (e.g., 'move' is a hypernym of 'run').</p>
                    <div id="wordnet-analysis">{wordnet_html}</div>

                </div>
            </main>
            <script>
                document.getElementById('hierarchy-tree').addEventListener('click', function (e) {{
                    const target = e.target.closest('.node-content');
                    if (target) {{
                        const parentLi = target.parentElement;
                        const childUl = parentLi.querySelector('ul');
                        if (childUl) {{
                            childUl.classList.toggle('collapsed');
                            const toggle = target.querySelector('.toggle');
                            toggle.textContent = childUl.classList.contains('collapsed') ? '[+]' : '[-]';
                        }}
                    }}
                }});
            </script>
        </body>
        </html>
        """

        hierarchy_html = ""
        if hasattr(self.clusterer, 'condensed_tree_'):
            tree_df = self.clusterer.condensed_tree_.to_pandas()
            parent_children = tree_df.groupby('parent')['child'].apply(list).to_dict()
            node_data = tree_df.set_index('child').to_dict('index')
            cluster_id_to_node = {label: node for node, label in self.clusterer.prediction_data_.cluster_map.items()}
            node_sizes_direct = dict(zip(tree_df['child'], tree_df['child_size']))
            memoized_sizes = {}
            def get_node_size(node):
                if node in memoized_sizes: return memoized_sizes[node]
                size = node_sizes_direct.get(node)
                if size is not None:
                    memoized_sizes[node] = size
                    return size
                if node in parent_children:
                    size = sum(get_node_size(child) for child in parent_children[node])
                    memoized_sizes[node] = size
                    return size
                return 1

            def build_hierarchy_html(node, level=0):
                size = get_node_size(node)
                if size <= 1: return ""
                html = "<li>"
                is_parent = node in parent_children
                lambda_val = node_data.get(node, {}).get('lambda_val', 0)
                final_cluster_label = next((cid for cid, nid in cluster_id_to_node.items() if nid == node), None)
                node_content_html = f'<div class="node-content" data-node-id="{int(node)}">'
                has_visible_children = is_parent and any(get_node_size(child) > 1 for child in parent_children[node])
                node_content_html += f'<span class="toggle">{ "[-]" if has_visible_children else " " }</span>'
                node_content_html += '<span class="node-details">'
                node_content_html += f'<span class="node-id">Node {int(node)}</span> | <span class="node-size">Size: {int(size)}</span> | <span class="node-lambda">λ: {lambda_val:.4f}</span>'
                if final_cluster_label is not None:
                    color = self.color_map.get(final_cluster_label, '#6c757d')
                    node_content_html += f' &rarr; <a href="#cluster-{final_cluster_label}" class="final-cluster-node" style="border-color:{color}; color:{color};">Cluster {final_cluster_label}</a>'
                    keywords = self.cluster_descriptions.get(final_cluster_label, {}).get('keywords', [])
                    if keywords:
                        node_content_html += f'<span class="node-keywords"><i>- {escape(", ".join(keywords[:3]))}...</i></span>'
                node_content_html += '</span></div>'
                html += node_content_html
                if has_visible_children:
                    child_html = "".join(build_hierarchy_html(child, level + 1) for child in parent_children[node])
                    if child_html: html += f'<ul>{child_html}</ul>'
                html += "</li>"
                return html

            root_nodes = sorted(list(set(parent_children.keys()) - set(tree_df['child'])), reverse=True)
            hierarchy_html = "<ul>" + "".join(build_hierarchy_html(root) for root in root_nodes) + "</ul>"

        clusters_html = ""
        wordnet_html = ""
        toc_html = """
            <li><a href="#stats">Overall Statistics</a></li>
            <li><a href="#hierarchy">Cluster Hierarchy</a></li>
            <li><a href="#details">Cluster Details</a><ul class="sub-menu">
        """
        sorted_clusters = sorted([c for c in self.df["cluster"].unique() if c != -1])
        
        for cid in sorted_clusters:
            desc = self.cluster_descriptions.get(cid, {})
            data = self.df[self.df["cluster"] == cid]
            color = self.color_map.get(cid, '#6c757d')
            keywords = desc.get('keywords', [])

            keywords_html = "".join(f'<span>{escape(kw)}</span>' for kw in keywords)
            samples_html = '<div class="samples-container">'
            for row in desc.get('sample_rows', []):
                samples_html += f"""
                <div class="sample-item">
                    <div class="sample-triple">
                        <span class="part subject">{escape(str(row.get('subject_text', 'N/A')))}</span><span class="arrow">&rarr;</span>
                        <span class="part predicate">"{escape(str(row.get('predicate_text', 'N/A')))}"</span><span class="arrow">&rarr;</span>
                        <span class="part object">{escape(str(row.get('object_text', 'N/A')))}</span>
                    </div>
                    <div class="sample-meta">
                        <span><b>Source:</b> {escape(str(row.get('source_file', 'N/A')))}</span>
                        <span><b>Index:</b> {row.get('index', 'N/A')}</span>
                        <span><b>Confidence:</b> {row.get('probability', 0.0):.3f}</span>
                        <span><b>Outlier Score:</b> {row.get('outlier_score', 0.0):.3f}</span>
                    </div>
                </div>"""
            samples_html += '</div>'
            clusters_html += f"""
            <div class="cluster-card" id="cluster-{cid}">
                <h3 style="border-color: {color};">Cluster {cid}</h3>
                <p><b>Size:</b> {desc.get('size', 0):,} | <b>Avg. Confidence:</b> {data['probability'].mean():.3f}</p>
                <div class="keywords"><b>Keywords:</b> {keywords_html}</div>
                <div><b>Sample Triples (Top 5 by Confidence):</b>{samples_html}</div>
            </div>"""

            hypernym_data = self._extract_verb_hypernyms(keywords)
            if hypernym_data:
                wordnet_cluster_html = f'<div class="wordnet-card" id="wordnet-{cid}"><h3 style="border-color: {color};">Cluster {cid} Verbs</h3>'
                for verb, hypernyms in hypernym_data.items():
                    hypernym_list_items = "".join(f"<li>{escape(h)}</li>" for h in hypernyms)
                    wordnet_cluster_html += f"""
                    <div class="hypernym-item">
                        <span class="verb">{escape(verb)}</span>
                        <ul class="hypernym-list">{hypernym_list_items}</ul>
                    </div>"""
                wordnet_html += wordnet_cluster_html + '</div>'

            toc_html += f'<li><a href="#cluster-{cid}">Cluster {cid}</a></li>'
        
        toc_html += "</ul></li>"
        toc_html += '<li><a href="#wordnet">WordNet Analysis</a></li>'
        
        final_html = html_template.format(
            datetime_now=datetime.now().strftime('%Y-%m-%d %H:%M:%S'),
            n_samples=self.n_samples, n_clusters=self.n_clusters, n_noise=self.n_noise,
            noise_ratio=self.n_noise / self.n_samples if self.n_samples > 0 else 0,
            toc_html=toc_html, hierarchy_html=hierarchy_html,
            clusters_html=clusters_html, wordnet_html=wordnet_html
        )

        with open(output_path, 'w', encoding='utf-8') as f: f.write(final_html)
        print(f"✓ Interactive HTML report saved to: {output_path}")

    def create_interactive_cluster_report(self, output_path="cluster_analysis_report.html"):
        """Creates an interactive HTML report with cluster analysis."""
        print(f"Creating interactive cluster report...")
        if not hasattr(self, 'color_map'): self.generate_cluster_colors()
        if not hasattr(self, 'cluster_descriptions'): self.extract_cluster_keywords()
        fig = make_subplots(rows=2, cols=2,
            subplot_titles=("Cluster Size Distribution", "Cluster Confidence Distribution", "Outlier Score by Cluster", "Source File Distribution"),
            specs=[[{"type": "bar"}, {"type": "box"}], [{"type": "violin"}, {"type": "bar"}]])
        cluster_sizes = self.df["cluster"].value_counts().sort_index()
        fig.add_trace(go.Bar(x=[f"C{i}" if i != -1 else "Noise" for i in cluster_sizes.index], y=cluster_sizes.values, text=cluster_sizes.values, textposition='auto', marker_color=[self.color_map.get(i, '#cccccc') for i in cluster_sizes.index]), row=1, col=1)
        for cid in sorted(self.df["cluster"].unique()):
            if cid == -1: continue
            cluster_data = self.df[self.df["cluster"] == cid]
            fig.add_trace(go.Box(y=cluster_data["probability"], name=f"C{cid}", marker_color=self.color_map[cid], showlegend=False), row=1, col=2)
            fig.add_trace(go.Violin(y=cluster_data["outlier_score"], name=f"C{cid}", marker_color=self.color_map[cid], showlegend=False), row=2, col=1)
        top_sources = self.df["source_file"].value_counts().head(10)
        fig.add_trace(go.Bar(y=top_sources.index[::-1], x=top_sources.values[::-1], orientation='h', marker_color='lightblue'), row=2, col=2)
        fig.update_layout(title_text="Cluster Analysis Report", height=1000, showlegend=False)
        fig.write_html(output_path, auto_open=False)
        print(f"✓ Interactive report saved to: {output_path}")
        return fig

    def create_beautiful_visualization(self, output_path="enhanced_clustering.html"):
        """Creates a multi-layered, interactive visualization using WebGL."""
        print("Creating WebGL-accelerated visualization...")
        start_time = time.time()
        if not hasattr(self, 'color_map'): self.generate_cluster_colors()
        if not hasattr(self, 'cluster_descriptions'): self.extract_cluster_keywords()
        fig = make_subplots(rows=1, cols=2, column_widths=[0.7, 0.3], specs=[[{"type": "scattergl"}, {"type": "bar"}]])
        for cluster_id in sorted(self.df["cluster"].unique()):
            cluster_df = self.df[self.df["cluster"] == cluster_id]
            hover_texts = self.prepare_webgl_data(cluster_df)
            if cluster_id == -1:
                name, marker_dict = "Noise", dict(size=3, color='#cccccc', symbol='x', opacity=0.3)
            else:
                desc = self.cluster_descriptions.get(cluster_id, {})
                kw = desc.get('keywords', [])
                name = f"C{cluster_id}: {', '.join(kw)[:30]}..."
                marker_dict = dict(size=6, color=self.color_map[cluster_id], opacity=0.8, line=dict(width=0))
            fig.add_trace(go.Scattergl(x=cluster_df["x_norm"], y=cluster_df["y_norm"], mode="markers", name=name, marker=marker_dict, text=hover_texts, hovertemplate="%{text}<extra></extra>", showlegend=bool(cluster_id != -1)), row=1, col=1)
        cluster_counts = self.df["cluster"].value_counts().sort_index()
        fig.add_trace(go.Bar(x=[f"C{i}" if i != -1 else "Noise" for i in cluster_counts.index], y=cluster_counts.values, marker_color=[self.color_map[i] for i in cluster_counts.index], text=cluster_counts.values, textposition='auto', showlegend=False), row=1, col=2)
        fig.update_layout(title_text=f"WebGL-Enhanced Embedding Visualization ({self.n_clusters} clusters)", plot_bgcolor='rgba(240, 240, 240, 0.3)', paper_bgcolor='white', height=800, width=1600, hovermode='closest', legend=dict(yanchor="top", y=0.99, xanchor="left", x=1.01))
        fig.update_yaxes(scaleanchor="x", scaleratio=1, row=1, col=1)
        config = {'scrollZoom': True, 'displaylogo': False}
        fig.write_html(output_path, auto_open=False, config=config)
        elapsed = time.time() - start_time
        print(f"✓ Visualization created in {elapsed:.1f} seconds. Output: {output_path}")
        return fig

def optimize_clustering_parameters(parquet_path, target_clusters_range=(50, 100)):
    """Helper function to find optimal clustering parameters efficiently."""
    print("Finding optimal clustering parameters...")
    base_viz = EmbeddingVisualizer(parquet_path)
    base_viz.reduce_dimensions(n_neighbors=30, min_dist=0.1)
    param_results = []
    for min_cluster_size in [20, 30, 40, 50, 75, 100, 150, 200]:
        min_samples = max(5, min_cluster_size // 2)
        viz_test = EmbeddingVisualizer(parquet_path)
        viz_test.df = base_viz.df.copy()
        viz_test.X = base_viz.X
        viz_test.XY_normalized = base_viz.XY_normalized
        viz_test.n_samples = base_viz.n_samples
        viz_test.cluster_embeddings(min_cluster_size=min_cluster_size, min_samples=min_samples)
        result = {'min_cluster_size': min_cluster_size, 'min_samples': min_samples, 'n_clusters': viz_test.n_clusters, 'noise_ratio': viz_test.n_noise / len(viz_test.df)}
        param_results.append(result)
        print(f"Params: size={min_cluster_size}, samples={min_samples} -> Clusters: {result['n_clusters']}, Noise: {result['noise_ratio']:.1%}")
        if target_clusters_range[0] <= result['n_clusters'] <= target_clusters_range[1]:
            print(f"\n✓ Found good parameters within target range: {result}")
            return result
    best_params = min(param_results, key=lambda x: abs(x['n_clusters'] - sum(target_clusters_range)/2))
    print(f"\n✓ Best parameters found outside range: {best_params}")
    return best_params

def visualize_embeddings(parquet_path, min_cluster_size, min_samples,
                         export_hierarchy_text=True, 
                         export_hierarchy_html=True, 
                         create_report=True):
    """Complete pipeline for beautiful embedding visualization with WebGL."""
    viz = EmbeddingVisualizer(parquet_path)
    viz.reduce_dimensions(n_neighbors=30, min_dist=0.1)
    viz.cluster_embeddings(min_cluster_size=min_cluster_size, min_samples=min_samples)
    viz.extract_cluster_keywords()
    
    viz.create_beautiful_visualization("enhanced_clustering.html")
    
    if export_hierarchy_text:
        viz.export_hierarchical_clustering_results("hierarchical_clustering_results.txt")
    
    if export_hierarchy_html:
        viz.export_hierarchical_report_html("hierarchical_report.html")

    if create_report:
        viz.create_interactive_cluster_report("cluster_analysis_report.html")
    
    return viz

if __name__ == "__main__":
    # IMPORTANT: Replace this with the actual path to your Parquet file.
    PARQUET = "/Users/jiajiezhang/Downloads/Clustering_Embeddings/spanbert_predicate_embeddings.parquet"
    
    try:
        print("=== Step 1: Parameter Optimization ===")
        optimal_params = optimize_clustering_parameters(PARQUET, target_clusters_range=(80, 120))
        
        print("\n=== Step 2: Creating Final Visualizations with Optimal Parameters ===")
        viz = visualize_embeddings(
            PARQUET, 
            min_cluster_size=optimal_params['min_cluster_size'],
            min_samples=optimal_params['min_samples'],
            export_hierarchy_text=True,
            export_hierarchy_html=True,
            create_report=True
        )
        
        print("\n=== DIAGNOSTIC CHECK: DataFrame Columns ===")
        print("The script has access to the following columns in the DataFrame:")
        print(viz.df.columns.tolist())
        print("==========================================")
        print("\n=== Analysis Complete ===")
        print("All reports have been generated. Please check your output folder for:")
        print("- enhanced_clustering.html")
        print("- hierarchical_report.html")
        print("- cluster_analysis_report.html")
        print("- hierarchical_clustering_results.txt")
        
    except FileNotFoundError:
        print(f"\nERROR: Parquet file not found at '{PARQUET}'")
        print("Please update the 'PARQUET' variable in the '__main__' block to the correct path.")
    except Exception as e:
        print(f"\nAn unexpected error occurred: {e}")
        import traceback
        traceback.print_exc()