# ==============================================================================
#  Advanced Embedding Visualization and Parameter Assessment Framework
#
#  Version: 4.0 (Final)
#  Description:
#  This script provides a comprehensive, publication-ready workflow for clustering
#  high-dimensional embeddings. It features a sophisticated, interpretable
#  method for 2D hyperparameter optimization of HDBSCAN using visual analytics,
#  and generates high-quality, annotated static images for academic use.
# ==============================================================================

import pandas as pd
import numpy as np
import hdbscan
import umap.umap_ as umap
import plotly.graph_objects as go
from plotly.subplots import make_subplots
import plotly.io as pio
from sklearn.preprocessing import StandardScaler
from collections import Counter
import re
import warnings
import time
from datetime import datetime
from html import escape
from tqdm.auto import tqdm
from typing import List, Dict

# --- Configuration ---
# Configure renderer to automatically open plots in a new browser tab for interactive exploration.
# Note: This does not affect static image generation.
pio.renderers.default = "browser"


class EmbeddingVisualizer:
    """
    Core class for embedding processing, clustering, and visualization.
    """
    def __init__(self, parquet_path: str = None, random_state: int = 42):
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

    def reduce_dimensions(self, n_neighbors: int = 15, n_components: int =30, min_dist: float = 0.1, metric: str = "cosine") -> 'EmbeddingVisualizer':
        """Apply UMAP dimensionality reduction."""
        print(f"\nReducing {self.X.shape[0]:,} embeddings from {self.X.shape[1]}D to 2D...")
        start_time = time.time()
        self.reducer = umap.UMAP(
            n_neighbors=n_neighbors, min_dist=min_dist, metric=metric,
            n_components=n_components, init="spectral", random_state=self.random_state,
            n_jobs=-1, low_memory=self.n_samples > 100000
        )
        self.XY = self.reducer.fit_transform(self.X)
        self.df["x"], self.df["y"] = self.XY[:, 0], self.XY[:, 1]
        scaler = StandardScaler()
        self.XY_normalized = scaler.fit_transform(self.XY)
        self.df["x_norm"], self.df["y_norm"] = self.XY_normalized[:, 0], self.XY_normalized[:, 1]
        print(f"✓ UMAP completed in {time.time() - start_time:.1f} seconds.")
        return self

    def cluster_embeddings(self, min_cluster_size: int, min_samples: int) -> 'EmbeddingVisualizer':
        """Apply HDBSCAN clustering with final chosen parameters."""
        print(f"\nClustering with final parameters: min_cluster_size={min_cluster_size}, min_samples={min_samples}...")
        start_time = time.time()
        self.clusterer = hdbscan.HDBSCAN(
            min_cluster_size=min_cluster_size, min_samples=min_samples,
            metric="euclidean", cluster_selection_method="eom",
            prediction_data=True, core_dist_n_jobs=-1
        )
        self.clusterer.fit(self.XY_normalized)
        self.df["cluster"] = self.clusterer.labels_
        self.df["probability"] = self.clusterer.probabilities_
        self.n_clusters = len(set(self.clusterer.labels_)) - (1 if -1 in self.clusterer.labels_ else 0)
        self.n_noise = sum(self.df["cluster"] == -1)
        print(f"✓ Found {self.n_clusters} clusters with {self.n_noise:,} noise points in {time.time() - start_time:.1f} seconds.")
        return self

    def create_beautiful_visualization(self, output_path: str = "final_cluster_visualization.html"):
        """Creates a final, multi-layered, interactive visualization using WebGL."""
        # This is a placeholder for the user's original, detailed visualization function.
        # To keep the script focused, its implementation is omitted here, but in a real
        # scenario, this would generate the final scatter plot.
        print(f"\nPlaceholder: Would generate beautiful visualization at '{output_path}'.")
        pass


def assess_2d_parameters(
    base_visualizer: EmbeddingVisualizer,
    mcs_values: List[int],
    ms_values: List[int]
) -> pd.DataFrame:
    """
    Assesses HDBSCAN parameters across a 2D grid of min_cluster_size and min_samples.
    """
    print("\n🚀 Starting 2D parameter assessment (Grid Search)...")
    results = []
    param_grid = []
    for mcs in mcs_values:
        for ms in ms_values:
            if ms <= mcs:
                param_grid.append((mcs, ms))

    for mcs, ms in tqdm(param_grid, desc="Assessing (mcs, ms) pairs"):
        clusterer = hdbscan.HDBSCAN(
            min_cluster_size=mcs, min_samples=ms, gen_min_span_tree=True,
            metric="euclidean", core_dist_n_jobs=-1
        ).fit(base_visualizer.XY_normalized)

        n_clusters = len(set(clusterer.labels_)) - (1 if -1 in clusterer.labels_ else 0)
        noise_ratio = np.sum(clusterer.labels_ == -1) / len(base_visualizer.df)
        try:
            dbcv_score = clusterer.relative_validity_
        except Exception:
            dbcv_score = np.nan
        results.append({
            'min_cluster_size': mcs, 'min_samples': ms,
            'n_clusters': n_clusters, 'noise_ratio': noise_ratio,
            'dbcv_score': dbcv_score
        })
    print("✓ 2D Assessment complete.")
    return pd.DataFrame(results)


def export_single_heatmap(
    pivot_df: pd.DataFrame,
    main_title: str,
    colorbar_title: str,
    colorscale: str,
    chosen_params: Dict[str, int],
    filename: str,
    scale: int = 3
):
    """
    Generates and saves a single, high-quality, publication-ready heatmap PNG.
    """
    print(f"🖼️  Generating single high-quality PNG: {filename}")
    fig = go.Figure(data=go.Heatmap(
        z=pivot_df.values, x=pivot_df.columns, y=pivot_df.index,
        colorscale=colorscale, colorbar_title=colorbar_title,
        text=pivot_df.round(3), texttemplate="%{text}", textfont={"size": 12}
    ))
    mcs, ms = chosen_params['min_cluster_size'], chosen_params['min_samples']
    fig.add_shape(
        type="rect", xref="x", yref="y",
        x0=mcs - (pivot_df.columns[1] - pivot_df.columns[0]) / 2,
        x1=mcs + (pivot_df.columns[1] - pivot_df.columns[0]) / 2,
        y0=ms - (pivot_df.index[1] - pivot_df.index[0]) / 2,
        y1=ms + (pivot_df.index[1] - pivot_df.index[0]) / 2,
        line=dict(color="Red", width=3), fillcolor="rgba(0,0,0,0)"
    )
    fig.update_layout(
        title_text=f'<b>{main_title}</b>',
        xaxis_title='min_cluster_size', yaxis_title='min_samples',
        height=700, width=800, template='plotly_white',
        font=dict(family="Arial, sans-serif", size=18, color="black"),
        title_font_size=24, yaxis_autorange="reversed"
    )
    try:
        fig.write_image(filename, scale=scale)
        print(f"✓ Successfully saved image to {filename}")
    except Exception as e:
        print(f"❌ Error saving image: {e}. Please ensure 'kaleido' is installed: pip install kaleido")


if __name__ == "__main__":
    # ==========================================================================
    #  1. CONFIGURATION: Please edit this section
    # ==========================================================================
    # Path to your Parquet file containing embeddings
    PARQUET_PATH = "/Users/jiajiezhang/Downloads/Clustering_Embeddings/predicate_embeddings.parquet"

    # Define the search space for the hyperparameters
    # More values will result in a more detailed map but longer computation time.
    MCS_SEARCH_SPACE = [20, 30, 40, 50, 60, 70, 80, 90, 100, 110, 120, 130, 140, 150, 160]
    MS_SEARCH_SPACE = [10, 15, 20, 25, 30, 35, 40, 45, 50, 55, 60, 65, 70, 75, 80]

    try:
        # ======================================================================
        #  2. ASSESSMENT: Load data and run the 2D parameter assessment
        # ======================================================================
        base_viz = EmbeddingVisualizer(PARQUET_PATH)
        # base_viz.reduce_dimensions(n_components=30, min_dist=0.1)
        base_viz.reduce_dimensions(n_neighbors=100, n_components=50, min_dist=0.1)
        assessment_2d_df = assess_2d_parameters(base_viz, MCS_SEARCH_SPACE, MS_SEARCH_SPACE)

        # ======================================================================
        #  3. DECISION SUPPORT: Print top results to aid decision-making
        # ======================================================================
        print("\n--- Top 5 parameter combinations by Cluster Quality (DBCV) ---")
        # Drop NaN values for fair comparison and get the top 5
        top_5_params = assessment_2d_df.dropna(subset=['dbcv_score']).sort_values('dbcv_score', ascending=False).head(5)
        print(top_5_params.to_string())

        # ======================================================================
        #  4. DECISION & EXPORT: Automatically select the best and export visuals
        # ======================================================================
        if not top_5_params.empty:
            best_params_row = top_5_params.iloc[0]
            chosen_parameters = {
                'min_cluster_size': int(best_params_row['min_cluster_size']),
                'min_samples': int(best_params_row['min_samples'])
            }
            print(f"\n✅ Automatically chosen parameters for export: {chosen_parameters}")

            # Pivot the data once for all exports
            df_clusters = assessment_2d_df.pivot(index='min_samples', columns='min_cluster_size', values='n_clusters')
            df_noise = assessment_2d_df.pivot(index='min_samples', columns='min_cluster_size', values='noise_ratio')
            df_dbcv = assessment_2d_df.pivot(index='min_samples', columns='min_cluster_size', values='dbcv_score')

            # Call the export function three times to generate separate PNGs
            export_single_heatmap(
                pivot_df=df_clusters, main_title='Assessment: Number of Clusters', colorbar_title='Count',
                colorscale='Viridis', chosen_params=chosen_parameters, filename='assessment_1_clusters.png'
            )
            export_single_heatmap(
                pivot_df=df_noise, main_title='Assessment: Noise Ratio', colorbar_title='Ratio (%)',
                colorscale='Cividis_r', chosen_params=chosen_parameters, filename='assessment_2_noise.png'
            )
            export_single_heatmap(
                pivot_df=df_dbcv, main_title='Assessment: Cluster Quality (DBCV)', colorbar_title='DBCV Score',
                colorscale='Plasma', chosen_params=chosen_parameters, filename='assessment_3_quality.png'
            )

            # ==================================================================
            #  5. FINAL STEP (Optional): Run final clustering and create reports
            # ==================================================================
            # Now, you can use the chosen parameters to run the final, detailed analysis
            base_viz.cluster_embeddings(
                min_cluster_size=chosen_parameters['min_cluster_size'],
                min_samples=chosen_parameters['min_samples']
            )
            base_viz.create_beautiful_visualization() # And other report generation
            print("\nWorkflow complete. Static assessment images have been saved.")

        else:
            print("\n⚠️ No valid clustering results found to make a decision.")

    except FileNotFoundError:
        print(f"\n❌ ERROR: Parquet file not found at '{PARQUET_PATH}'")
    except Exception as e:
        print(f"\n❌ An unexpected error occurred: {e}")
        import traceback
        traceback.print_exc()