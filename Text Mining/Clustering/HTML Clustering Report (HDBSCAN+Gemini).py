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
    Combines UMAP dimensionality reduction with HDBSCAN clustering. Features
    multi-layered interactive WebGL visualizations and automatic cluster
    characterization using sophisticated multi-word phrase extraction and
    WordNet-based hypernym analysis to identify core semantic concepts.
    Generates interactive HTML hierarchy reports for deep cluster analysis.
    """
    def __init__(self, parquet_path=None, random_state=42):
        self.random_state = random_state
        if parquet_path:
            self.df = pd.read_parquet(parquet_path)
            # --- Defensive Check: Ensure required columns exist ---
            required_cols = ['predicate_embedding', 'predicate_text', 'subject_text', 'object_text', 'source_file']
            if not all(col in self.df.columns for col in required_cols):
                raise ValueError(f"Parquet file must contain the following columns: {required_cols}. "
                                 f"Found columns: {self.df.columns.tolist()}")
            self.X = np.vstack(self.df["predicate_embedding"].values)
            self.n_samples = len(self.df)
            print(f"Loaded {self.n_samples:,} embeddings from {parquet_path}")
        else:
            # Allows creating an instance without loading data, useful for helper functions
            self.df = pd.DataFrame()
            self.X = np.array([])
            self.n_samples = 0
            
        # --- NEW: Stopword list for filtering semantically poor verbs ---
        self.verb_stopwords = {
            'be', 'am', 'is', 'are', 'was', 'were', 'been', 'being',
            'have', 'has', 'had', 'having',
            'do', 'does', 'did', 'doing',
            'can', 'could', 'will', 'would', 'shall', 'should', 'may', 'might', 'must'
        }


        # Performance thresholds
        self.WEBGL_RECOMMENDED_THRESHOLD = 1000
        self.WEBGL_MAX_COMFORTABLE = 100000
        self.SAMPLING_THRESHOLD = 500000
        if self.n_samples > 0:
            if self.n_samples > self.WEBGL_RECOMMENDED_THRESHOLD:
                print(f"✓ WebGL rendering enabled for optimal performance")
            if self.n_samples > self.WEBGL_MAX_COMFORTABLE:
                warnings.warn(
                    f"Dataset has {self.n_samples:,} points. Consider using sampling for better performance.",
                    UserWarning
                )

    def reduce_dimensions(self, n_neighbors: int = 15, n_components: int =30, min_dist=0.1, metric="cosine"):
        """Apply UMAP dimensionality reduction with optimized parameters."""
        print(f"Reducing {self.X.shape[0]:,} embeddings from {self.X.shape[1]}D to 2D...")
        start_time = time.time()
        self.reducer = umap.UMAP(
            n_neighbors=n_neighbors,
            min_dist=min_dist,
            metric=metric,
            n_components=n_components,
            init="spectral",
            random_state=self.random_state,
            n_jobs=-1,
            low_memory=self.n_samples > 100000
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
            min_cluster_size=min_cluster_size,
            min_samples=min_samples,
            metric="euclidean",
            cluster_selection_method="eom",
            prediction_data=True,
            core_dist_n_jobs=-1
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

    def _get_verb_hypernyms(self, phrases):
        """
        Helper to extract meaningful verbs from phrases and find their WordNet hypernyms
        based on their most common sense.
        """
        verbs = set()
        for phrase in phrases:
            words = nltk.word_tokenize(phrase)
            for word in words:
                # 1. Filter out stopwords
                if word.lower() in self.verb_stopwords:
                    continue
                # 2. Check if the word exists in WordNet as a verb
                if wordnet.synsets(word, pos=wordnet.VERB):
                    verbs.add(word)

        hypernyms = set()
        for verb in verbs:
            synsets = wordnet.synsets(verb, pos=wordnet.VERB)
            # 3. Use only the first, most common synset if it exists
            if synsets:
                most_common_synset = synsets[0]
                for hyper in most_common_synset.hypernyms():
                    hypernyms.add(hyper.lemmas()[0].name().replace('_', ' '))
        return sorted(list(hypernyms))

    def extract_cluster_keywords(self, n_keywords=9, ngram_range=(2, 6), n_samples_to_show=35):
        """
        Extracts representative phrases, WordNet hypernyms, and unique sample triples for each cluster.
        """
        self.cluster_descriptions = {}
        print(f"Extracting phrases, hypernyms, and samples for each cluster...")
        start_time = time.time()

        for cluster_id in sorted(self.df['cluster'].unique()):
            if cluster_id == -1:
                continue

            cluster_df = self.df[self.df['cluster'] == cluster_id]
            
            # --- Phrase Extraction Logic ---
            phrase_counts = Counter()
            for text in cluster_df['predicate_text'].values:
                clean_text = text.lower().strip()
                words = clean_text.split()
                for n in range(ngram_range[0], min(ngram_range[1] + 1, len(words) + 1)):
                    for i in range(len(words) - n + 1):
                        phrase = tuple(words[i:i+n])
                        phrase_counts[phrase] += 1
            scored_phrases = [
                (" ".join(phrase), count * (len(phrase)**2))
                for phrase, count in phrase_counts.items() if count > 1
            ]
            scored_phrases.sort(key=lambda x: x[1], reverse=True)
            top_keywords = []
            for phrase, score in scored_phrases:
                if not any(phrase in selected_phrase for selected_phrase in top_keywords):
                    top_keywords.append(phrase)
                if len(top_keywords) >= n_keywords:
                    break
            if not top_keywords:
                word_counts = Counter(w for t in cluster_df['predicate_text'].values for w in t.lower().strip().split())
                top_keywords = [word for word, count in word_counts.most_common(n_keywords)]
            
            # --- WordNet Hypernym Extraction (using the improved method) ---
            hypernyms = self._get_verb_hypernyms(top_keywords)

            # --- Unique Sample Triple Extraction ---
            top_samples_pool = cluster_df.sort_values(by='probability', ascending=False).head(200)
            unique_triples = {}
            for row in top_samples_pool.itertuples():
                triple_key = (row.subject_text, row.predicate_text, row.object_text)
                if triple_key not in unique_triples:
                    unique_triples[triple_key] = row._asdict()

            final_sample_list = list(unique_triples.values())[:n_samples_to_show]

            self.cluster_descriptions[cluster_id] = {
                'keywords': top_keywords,
                'hypernyms': hypernyms,
                'size': len(cluster_df),
                'top_phrases_with_score': scored_phrases[:20],
                'sample_rows': final_sample_list
            }

        elapsed = time.time() - start_time
        print(f"✓ Phrase, hypernym, and sample extraction completed in {elapsed:.1f} seconds.")
        return self.cluster_descriptions

    def generate_cluster_colors(self):
        """Generate visually distinct colors for clusters using HSV color space."""
        n_colors_needed = self.n_clusters
        colors = []
        for i in range(n_colors_needed):
            hue = i / n_colors_needed
            saturation = 0.7 + (i % 3) * 0.1
            value = 0.8 + (i % 2) * 0.1
            rgb = colorsys.hsv_to_rgb(hue, saturation, value)
            hex_color = '#%02x%02x%02x' % tuple(int(c * 255) for c in rgb)
            colors.append(hex_color)
        unique_clusters = sorted([c for c in self.df["cluster"].unique() if c != -1])
        self.color_map = {cluster: colors[i] for i, cluster in enumerate(unique_clusters)}
        self.color_map[-1] = '#cccccc'
        return self

    def format_hover_text(self, text, max_length=150):
        """Format text for better readability in hover tooltips."""
        text = ' '.join(text.split())
        if len(text) <= max_length:
            return text
        truncated = text[:max_length].rsplit(' ', 1)[0]
        return truncated + "..."

    def prepare_webgl_data(self, df_subset=None):
        """Prepare data optimized for WebGL rendering with improved hover text."""
        if df_subset is None:
            df_subset = self.df
        hover_texts = []
        for _, row in df_subset.iterrows():
            formatted_text = self.format_hover_text(row["predicate_text"], max_length=200)
            hover_text = (
                f"<b>Cluster {row['cluster']}</b><br>"
                f"<b>Confidence:</b> {row['probability']:.3f}<br>"
                f"<b>Outlier Score:</b> {row['outlier_score']:.3f}<br>"
                f"<b>Source:</b> {row['source_file']}<br>"
                f"<b>Index:</b> {row.name}<br>"
                f"<hr>"
                f"<b>Text:</b><br><i>{formatted_text}</i>"
            )
            hover_texts.append(hover_text)
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
                            f.write(f"{' ' * level}└─ Node {int(node)} (size: {int(size)})\n")
                            if node in parent_children:
                                for child in parent_children[node]:
                                    print_hierarchy_to_file(child, level + 1)
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
                if 'keywords' in desc: f.write(f"Top Phrases: {'; '.join(desc['keywords'])}\n")
                if 'hypernyms' in desc and desc['hypernyms']: f.write(f"WordNet Hypernyms: {'; '.join(desc['hypernyms'])}\n")
                f.write("\n")
        print(f"✓ Hierarchical clustering text report saved to: {output_path}")

    def export_hierarchical_report_html(self, output_path="hierarchical_report.html"):
        """
        Exports a beautiful, interactive HTML report with expandable sample lists and WordNet hypernyms.
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
body {{ font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, "Noto Sans", sans-serif; line-height: 1.6; color: #333; background-color: #f8f9fa; margin: 0; padding: 20px; }}
.container {{ max-width: 1200px; margin: auto; background: #fff; padding: 30px; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.08); }}
h1, h2, h3 {{ color: #0056b3; border-bottom: 2px solid #e9ecef; padding-bottom: 10px; }}
h1 {{ font-size: 2.2em; text-align: center; }}
h2 {{ font-size: 1.8em; margin-top: 40px; }}
h3 {{ font-size: 1.4em; }}
.stats-grid {{ display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 20px; margin-bottom: 30px; }}
.stat-card {{ background: #f8f9fa; padding: 20px; border-radius: 8px; border-left: 5px solid #007bff; text-align: center; }}
.stat-card .value {{ font-size: 2.5em; font-weight: bold; color: #0056b3; }}
.stat-card .label {{ font-size: 1em; color: #6c757d; }}
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
.tree .toggle {{ font-family: monospace; font-size: 1.2em; margin-right: 8px; width: 20px; text-align: center; color: #6c757d; }}
.tree .node-details {{ font-size: 0.95em; }}
.tree .node-id {{ font-weight: bold; color: #0056b3; }}
.tree .node-size {{ color: #28a745; }}
.tree .node-lambda {{ color: #dc3545; }}
.tree .final-cluster-node {{ font-weight: bold; border: 1px solid; padding: 2px 6px; border-radius: 4px; text-decoration: none; }}
.tree .node-keywords {{ color: #555; font-style: italic; margin-left: 10px; font-size: 0.9em; }}
.tree ul.collapsed {{ display: none; }}
#cluster-details .cluster-card {{ border: 1px solid #dee2e6; border-radius: 8px; margin-bottom: 20px; padding: 20px; box-shadow: 0 2px 5px rgba(0,0,0,0.05); }}
#cluster-details h3 {{ border-left: 5px solid; padding-left: 15px; margin-top: 0; }}
.cluster-section {{ margin-top: 15px; }}
.cluster-section-title {{ font-weight: bold; margin-bottom: 8px; color: #343a40; }}
.keywords span, .hypernyms span {{ background-color: #e9ecef; padding: 3px 8px; border-radius: 4px; margin-right: 5px; margin-bottom: 5px; display: inline-block; font-family: monospace; }}
.hypernyms span {{ background-color: #d4edda; color: #155724; }}
.samples-container {{ margin-top: 15px; }}
.sample-item {{ background: #f8f9fa; border: 1px solid #e9ecef; padding: 15px; border-radius: 6px; margin-bottom: 10px; }}
.sample-item.sample-item-hidden {{ display: none; }}
.sample-triple {{ display: flex; align-items: center; gap: 10px; margin-bottom: 10px; font-size: 1.05em; flex-wrap: wrap; }}
.sample-triple .part {{ padding: 5px 10px; border-radius: 5px; }}
.sample-triple .subject, .sample-triple .object {{ background-color: #d1ecf1; color: #0c5460; font-weight: bold; }}
.sample-triple .predicate {{ background-color: #f8d7da; color: #721c24; font-style: italic; }}
.sample-triple .arrow {{ color: #6c757d; font-weight: bold; }}
.sample-meta {{ display: flex; flex-wrap: wrap; gap: 15px; font-size: 0.85em; margin-top: 10px; border-top: 1px solid #e9ecef; padding-top: 10px; }}
.sample-meta span {{ background-color: #e0e0e0; padding: 2px 8px; border-radius: 10px; }}
.sample-meta .meta-label {{ font-weight: bold; color: #555; }}
.toggle-samples-btn {{ background-color: #007bff; color: white; border: none; padding: 8px 15px; border-radius: 5px; cursor: pointer; font-size: 0.9em; margin-top: 10px; transition: background-color 0.2s; }}
.toggle-samples-btn:hover {{ background-color: #0056b3; }}
</style>
</head>
<body>
<div class="container">
<h1>Hierarchical Clustering Report</h1>
<p style="text-align:center; color: #6c757d;">Generated: {datetime_now}</p>
<h2>Overall Statistics</h2>
<div class="stats-grid">
<div class="stat-card"><div class="value">{n_samples:,}</div><div class="label">Total Embeddings</div></div>
<div class="stat-card"><div class="value">{n_clusters}</div><div class="label">Clusters Found</div></div>
<div class="stat-card" style="border-color: #ffc107;"><div class="value">{n_noise:,}</div><div class="label">Noise Points ({noise_ratio:.1%})</div></div>
</div>
<h2>Cluster Hierarchy</h2>
<div class="tree-container">
<p>Tree view of the cluster hierarchy. Nodes with size = 1 are hidden. Click [+] to expand/collapse branches. The tree is horizontally scrollable.</p>
<div class="tree" id="hierarchy-tree">{hierarchy_html}</div>
</div>
<h2>Cluster Details</h2>
<div id="cluster-details">{clusters_html}</div>
</div>
<script>
// Handles hierarchy tree expansion/collapse
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

// Handles sample list expansion/collapse
document.addEventListener('click', function(e) {{
    if (e.target.classList.contains('toggle-samples-btn')) {{
        const container = e.target.closest('.cluster-card').querySelector('.samples-container');
        const allSampleItems = container.querySelectorAll('.sample-item');
        
        for (let i = 10; i < allSampleItems.length; i++) {{
            allSampleItems[i].classList.toggle('sample-item-hidden');
        }}

        const isCurrentlyExpanded = e.target.dataset.state === 'expanded';
        if (isCurrentlyExpanded) {{
            const moreCount = allSampleItems.length - 10;
            e.target.textContent = 'Show more (' + moreCount + ')';
            e.target.dataset.state = 'collapsed';
        }} else {{
            e.target.textContent = 'Collapse';
            e.target.dataset.state = 'expanded';
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
                if node in node_sizes_direct:
                    size = node_sizes_direct[node]
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
                node_content_html += f'<span class="toggle">{ "[+]" if has_visible_children else " " }</span>'
                node_content_html += '<span class="node-details">'
                node_content_html += f'<span class="node-id">Node {int(node)}</span>'
                node_content_html += f' | <span class="node-size">Size: {int(size)}</span>'
                node_content_html += f' | <span class="node-lambda">λ: {lambda_val:.4f}</span>'
                if final_cluster_label is not None:
                    color = self.color_map.get(final_cluster_label, '#6c757d')
                    node_content_html += f' &rarr; <a href="#cluster-{final_cluster_label}" class="final-cluster-node" style="border-color:{color}; color:{color};">Cluster {final_cluster_label}</a>'
                    keywords = self.cluster_descriptions.get(final_cluster_label, {}).get('keywords', [])
                    if keywords:
                        keywords_preview = ", ".join(keywords[:2])
                        node_content_html += f'<span class="node-keywords"><i>- {escape(keywords_preview)}...</i></span>'
                node_content_html += '</span></div>'
                html += node_content_html
                if has_visible_children:
                    child_html = "".join(build_hierarchy_html(child, level + 1) for child in parent_children[node])
                    if child_html: html += f'<ul class="collapsed">{child_html}</ul>'
                html += "</li>"
                return html

            root_nodes = sorted(list(set(parent_children.keys()) - set(tree_df['child'])), reverse=True)
            hierarchy_html = "<ul>" + "".join(build_hierarchy_html(root) for root in root_nodes) + "</ul>"

        clusters_html = ""
        sorted_clusters = sorted(self.df[self.df["cluster"] != -1]["cluster"].unique())
        for cid in sorted_clusters:
            desc = self.cluster_descriptions.get(cid, {})
            data = self.df[self.df["cluster"] == cid]
            color = self.color_map.get(cid, '#6c757d')

            keywords_html = "".join(f'<span>{escape(kw)}</span>' for kw in desc.get('keywords', []))
            
            hypernyms_html = ""
            if desc.get('hypernyms'):
                hypernyms_html = "".join(f'<span>{escape(hn)}</span>' for hn in desc['hypernyms'])
                hypernyms_html = f'''
<div class="cluster-section">
    <div class="cluster-section-title">WordNet Hypernyms</div>
    <div class="hypernyms">{hypernyms_html}</div>
</div>'''

            samples_html = '<div class="samples-container">'
            unique_samples = desc.get('sample_rows', [])
            
            for i, row in enumerate(unique_samples):
                hidden_class = 'sample-item-hidden' if i >= 10 else ''
                subject = escape(str(row.get('subject_text', 'N/A')))
                predicate = escape(str(row.get('predicate_text', 'N/A')))
                object_text = escape(str(row.get('object_text', 'N/A')))

                samples_html += f"""
<div class="sample-item {hidden_class}">
    <div class="sample-triple">
        <span class="part subject">{subject}</span><span class="arrow">&rarr;</span>
        <span class="part predicate">"{predicate}"</span><span class="arrow">&rarr;</span>
        <span class="part object">{object_text}</span>
    </div>
    <div class="sample-meta">
        <span><span class="meta-label">Source:</span> {escape(str(row.get('source_file', 'N/A')))}</span>
        <span><span class="meta-label">Index:</span> {row.get('Index', 'N/A')}</span>
        <span><span class="meta-label">Confidence:</span> {row.get('probability', 0.0):.3f}</span>
        <span><span class="meta-label">Outlier Score:</span> {row.get('outlier_score', 0.0):.3f}</span>
    </div>
</div>"""
            samples_html += '</div>'
            
            if len(unique_samples) > 10:
                more_count = len(unique_samples) - 10
                samples_html += f'<button class="toggle-samples-btn" data-state="collapsed">Show more ({more_count})</button>'

            clusters_html += f"""
<div class="cluster-card" id="cluster-{cid}">
    <h3 style="border-color: {color};">Cluster {cid}</h3>
    <p><b>Size:</b> {desc.get('size', 0):,} | <b>Avg. Confidence:</b> {data['probability'].mean():.3f}</p>
    <div class="cluster-section">
        <div class="cluster-section-title">Top Phrases</div>
        <div class="keywords">{keywords_html}</div>
    </div>
    {hypernyms_html}
    <div class="cluster-section">
        <div class="cluster-section-title">Unique Sample Triples (Top by Confidence)</div>
        {samples_html}
    </div>
</div>"""
        final_html = html_template.format(
            datetime_now=datetime.now().strftime('%Y-%m-%d %H:%M:%S'),
            n_samples=self.n_samples,
            n_clusters=self.n_clusters,
            n_noise=self.n_noise,
            noise_ratio=self.n_noise / self.n_samples if self.n_samples > 0 else 0,
            hierarchy_html=hierarchy_html,
            clusters_html=clusters_html
        )

        with open(output_path, 'w', encoding='utf-8') as f:
            f.write(final_html)
        print(f"✓ Interactive English HTML report saved to: {output_path}")

    def create_interactive_cluster_report(self, output_path="cluster_analysis_report.html"):
        """Creates an interactive HTML report with cluster analysis."""
        print(f"Creating interactive cluster report...")
        if not hasattr(self, 'color_map'): self.generate_cluster_colors()
        if not hasattr(self, 'cluster_descriptions'): self.extract_cluster_keywords()
        fig = make_subplots(rows=2, cols=2,
                            subplot_titles=("Cluster Size Distribution", "Cluster Confidence Distribution",
                                            "Outlier Score by Cluster", "Source File Distribution"),
                            specs=[[{"type": "bar"}, {"type": "box"}],
                                   [{"type": "violin"}, {"type": "bar"}]])
        cluster_sizes = self.df["cluster"].value_counts().sort_index()
        fig.add_trace(go.Bar(
            x=[f"C{i}" if i != -1 else "Noise" for i in cluster_sizes.index],
            y=cluster_sizes.values, text=cluster_sizes.values, textposition='auto',
            marker_color=[self.color_map.get(i, '#cccccc') for i in cluster_sizes.index]
        ), row=1, col=1)
        for cid in sorted(self.df["cluster"].unique()):
            if cid == -1: continue
            cluster_data = self.df[self.df["cluster"] == cid]
            fig.add_trace(go.Box(y=cluster_data["probability"], name=f"C{cid}",
                                 marker_color=self.color_map[cid], showlegend=False), row=1, col=2)
            fig.add_trace(go.Violin(y=cluster_data["outlier_score"], name=f"C{cid}",
                                    marker_color=self.color_map[cid], showlegend=False), row=2, col=1)
        top_sources = self.df["source_file"].value_counts().head(10)
        fig.add_trace(go.Bar(y=top_sources.index[::-1], x=top_sources.values[::-1], orientation='h',
                             marker_color='lightblue'), row=2, col=2)

        fig.update_layout(title_text="Cluster Analysis Report", height=1000, showlegend=False)
        fig.write_html(output_path, auto_open=True)
        print(f"✓ Interactive report saved to: {output_path}")
        return fig

    def create_beautiful_visualization(self, output_path="enhanced_clustering.html"):
        """Creates a multi-layered, interactive visualization using WebGL."""
        print("Creating WebGL-accelerated visualization...")
        start_time = time.time()
        if not hasattr(self, 'color_map'): self.generate_cluster_colors()
        if not hasattr(self, 'cluster_descriptions'): self.extract_cluster_keywords()
        fig = make_subplots(rows=1, cols=2, column_widths=[0.7, 0.3],
                            specs=[[{"type": "scattergl"}, {"type": "bar"}]])
        for cluster_id in sorted(self.df["cluster"].unique()):
            cluster_df = self.df[self.df["cluster"] == cluster_id]
            hover_texts = self.prepare_webgl_data(cluster_df)
            if cluster_id == -1:
                name = "Noise"
                marker_dict = dict(size=3, color='#cccccc', symbol='x', opacity=0.3)
            else:
                desc = self.cluster_descriptions.get(cluster_id, {})
                kw = desc.get('keywords', [])
                name = f"C{cluster_id}: {', '.join(kw)[:40]}..."
                marker_dict = dict(size=6, color=self.color_map[cluster_id], opacity=0.8, line=dict(width=0))

            fig.add_trace(go.Scattergl(
                x=cluster_df["x_norm"], y=cluster_df["y_norm"], mode="markers",
                name=name, marker=marker_dict, text=hover_texts,
                hovertemplate="%{text}<extra></extra>",
                showlegend=bool(cluster_id != -1)
            ), row=1, col=1)
        cluster_counts = self.df["cluster"].value_counts().sort_index()
        fig.add_trace(go.Bar(
            x=[f"C{i}" if i != -1 else "Noise" for i in cluster_counts.index],
            y=cluster_counts.values, marker_color=[self.color_map[i] for i in cluster_counts.index],
            text=cluster_counts.values, textposition='auto', showlegend=False
        ), row=1, col=2)
        fig.update_layout(title_text=f"WebGL-Enhanced Embedding Visualization ({self.n_clusters} clusters)",
                          plot_bgcolor='rgba(240, 240, 240, 0.3)', paper_bgcolor='white',
                          height=800, width=1600, hovermode='closest',
                          legend=dict(yanchor="top", y=0.99, xanchor="left", x=1.01))
        fig.update_yaxes(scaleanchor="x", scaleratio=1, row=1, col=1)

        config = {'scrollZoom': True, 'displaylogo': False}
        fig.write_html(output_path, auto_open=True, config=config)
        elapsed = time.time() - start_time
        print(f"✓ Visualization created in {elapsed:.1f} seconds. Output: {output_path}")
        return fig

def setup_nltk():
    """Downloads necessary NLTK data.
    This function handles the one-time setup for WordNet and the POS tagger.
    """
    try:
        nltk.data.find('corpora/wordnet.zip')
    except nltk.downloader.DownloadError:
        print("Downloading WordNet corpus (one-time setup)...")
        nltk.download('wordnet')
        print("✓ WordNet downloaded.")
    try:
        nltk.data.find('taggers/averaged_perceptron_tagger.zip')
    except nltk.downloader.DownloadError:
        print("Downloading POS tagger (one-time setup)...")
        nltk.download('averaged_perceptron_tagger')
        print("✓ POS tagger downloaded.")
    try:
        nltk.data.find('tokenizers/punkt.zip')
    except nltk.downloader.DownloadError:
        print("Downloading Punkt tokenizer (one-time setup)...")
        nltk.download('punkt')
        print("✓ Punkt tokenizer downloaded.")


def visualize_embeddings(parquet_path, min_cluster_size, min_samples,
                         export_hierarchy_text=True,
                         export_hierarchy_html=True,
                         create_report=True):
    """Complete pipeline for beautiful embedding visualization with WebGL."""
    viz = EmbeddingVisualizer(parquet_path)
    viz.reduce_dimensions(n_neighbors=100, n_components=50, min_dist=0.1)
    viz.cluster_embeddings(min_cluster_size=min_cluster_size, min_samples=min_samples)
    viz.create_beautiful_visualization("enhanced_clustering.html")
    if export_hierarchy_text:
        viz.export_hierarchical_clustering_results("hierarchical_clustering_results.txt")
    if export_hierarchy_html:
        viz.export_hierarchical_report_html("hierarchical_report.html")

    if create_report:
        viz.create_interactive_cluster_report("cluster_analysis_report.html")
    return viz

if __name__ == "__main__":
    # --- One-time NLTK Setup ---
    setup_nltk()

    # IMPORTANT: Replace this with the actual path to your Parquet file.
    PARQUET = "/Users/jiajiezhang/Downloads/Clustering_Embeddings/predicate_embeddings.parquet"
    try:
        print("\n=== Step 1: Parameter Optimization (Skipped, using fixed values) ===")
        # For demonstration, we'll use fixed parameters.
        # You can re-enable optimization if needed.
        # optimal_params = optimize_clustering_parameters(PARQUET, target_clusters_range=(100, 120))
        
        print("\n=== Step 2: Creating Final Visualizations with Fixed Parameters ===")
        viz = visualize_embeddings(
            PARQUET,
            min_cluster_size=70,
            min_samples=35,
            export_hierarchy_text=False,
            export_hierarchy_html=True,
            create_report=False
        )
        
        # *** DIAGNOSTIC CHECK: Verify DataFrame columns are available for reports ***
        print("\n=== DIAGNOSTIC CHECK: DataFrame Columns ===")
        print("The script requires ['subject_text', 'predicate_text', 'object_text', 'source_file'] for full reporting.")
        print("The following columns were found in your Parquet file:")
        print(viz.df.columns.tolist())
        print("==========================================")
        print("\n=== Analysis Complete ===")
        
    except FileNotFoundError:
        print("\nERROR: Parquet file not found.")
        print(f"Please update the 'PARQUET' variable in the '__main__' block to the correct path.")
        print(f"Current path: '{PARQUET}'")
    except ValueError as e:
        print(f"\nERROR: A data requirement was not met. {e}")
    except Exception as e:
        print(f"\nAn unexpected error occurred: {e}")