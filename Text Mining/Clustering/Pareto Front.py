# ==============================================================================
# 帕累托前沿交互式可视化
# ==============================================================================
#
# Revision Author: Gemini
# Date: 2025-06-29
#
# Description:
# 该脚本用于将 HDBSCAN 参数搜索产生的帕累托前沿结果进行可视化。
# 它读取原始评估结果和帕累托前沿解集，生成一个交互式的三维散点图（两个轴加一个颜色/尺寸维度），
# 清晰地展示了在三个目标之间的最优权衡：
#   1. Y轴: 聚类质量 (DBCV Score) - 越高越好
#   2. X轴: 噪声率 (Noise Ratio) - 越低越好
#   3. 颜色/尺寸: 簇数量 (Number of Clusters) - 越高通常意味着更细粒度的结果
#
# ==============================================================================

import os
import pandas as pd
import plotly.graph_objects as go

def visualize_pareto_front(
    all_results_path: str,
    pareto_front_path: str,
    output_dir: str
):
    """
    创建并保存帕累托前沿的交互式可视化图表。

    Args:
        all_results_path (str): 包含所有参数评估结果的 Parquet 文件路径。
        pareto_front_path (str): 仅包含帕累托前沿解的 Parquet 文件路径。
        output_dir (str): 保存输出图表（HTML 和 PNG）的目录。
    """
    print("🎨 开始创建帕累托前沿可视化图表...")

    # 1. 加载数据
    if not os.path.exists(all_results_path) or not os.path.exists(pareto_front_path):
        print(f"❌ 错误: 找不到输入文件。请确保 '{all_results_path}' 和 '{pareto_front_path}' 存在。")
        return
        
    df_all = pd.read_parquet(all_results_path)
    df_pareto = pd.read_parquet(pareto_front_path)
    print(f"✓ 已加载 {len(df_all)} 个全部评估点和 {len(df_pareto)} 个帕累托前沿点。")

    # 2. 创建图表对象
    fig = go.Figure()

    # 3. 添加背景散点 (所有被支配的点)
    fig.add_trace(go.Scatter(
        x=df_all['noise_ratio'],
        y=df_all['dbcv_score'],
        mode='markers',
        marker=dict(
            color='lightgrey',
            size=5,
            opacity=0.6
        ),
        name='被支配的解 (Dominated Solutions)',
        hoverinfo='none' # 背景点不需要悬停信息
    ))

    # 4. 添加前景散点 (帕累托前沿上的点)
    # 自定义悬停文本格式
    hover_text = [
        f"<b>DBCV Score</b>: {row['dbcv_score']:.4f}<br>"
        f"<b>Noise Ratio</b>: {row['noise_ratio']:.2%}<br>"
        f"<b>Num Clusters</b>: {row['n_clusters']}<br>"
        f"--------------------<br>"
        f"min_cluster_size: {row['min_cluster_size']}<br>"
        f"min_samples: {row['min_samples']}"
        for index, row in df_pareto.iterrows()
    ]

    fig.add_trace(go.Scatter(
        x=df_pareto['noise_ratio'],
        y=df_pareto['dbcv_score'],
        mode='markers',
        marker=dict(
            size=df_pareto['n_clusters'],  # 用簇数量控制大小
            sizemin=6,
            sizemode='area', # 'diameter' 或 'area'
            color=df_pareto['n_clusters'], # 用簇数量控制颜色
            colorscale='viridis', # 选择一个美观的色阶
            colorbar_title='簇的数量 (Num Clusters)',
            showscale=True,
            line=dict(width=1, color='DarkSlateGrey') # 给标记加边框，使其更突出
        ),
        name='帕累托最优解 (Pareto Front)',
        hovertext=hover_text,
        hoverinfo='text'
    ))

    # 5. 更新图表布局，使其更美观、信息更清晰
    fig.update_layout(
        title=dict(
            text='<b>HDBSCAN 参数的帕累托前沿分析</b>',
            font=dict(size=24),
            x=0.5
        ),
        xaxis_title='<b>噪声率 (越低越好) ➞</b>',
        yaxis_title='<b>DBCV 聚类质量分 (越高越好) ➞</b>',
        xaxis=dict(
            autorange='reversed', # X轴反转，因为噪声率越低越好
            tickformat='.0%', # X轴使用百分比格式
            gridcolor='lightgrey'
        ),
        yaxis=dict(
            gridcolor='lightgrey'
        ),
        font=dict(
            family="Arial, sans-serif",
            size=14,
            color="black"
        ),
        legend=dict(
            orientation="h",
            yanchor="bottom",
            y=1.02,
            xanchor="right",
            x=1
        ),
        template='plotly_white',
        width=1200,
        height=800
    )
    
    # 6. 保存图表
    html_path = os.path.join(output_dir, "pareto_front_visualization.html")
    png_path = os.path.join(output_dir, "pareto_front_visualization.png")
    
    fig.write_html(html_path)
    print(f"✓ 已将交互式图表保存至: {html_path}")
    
    try:
        fig.write_image(png_path, scale=2) # scale=2 提高图片分辨率
        print(f"✓ 已将静态图表保存至: {png_path}")
    except Exception as e:
        print(f"❌ 保存静态图片失败: {e}")
        print("   请确保已安装 'kaleido' (`pip install kaleido`)")
        
    fig.show()


if __name__ == '__main__':
    # --- 配置 ---
    # 这个目录应该包含上一步生成的 hdbscan_assessment_raw_results.parquet
    # 和 pareto_front_solutions.parquet 文件。
    ANALYSIS_DIR = "SPO_Clustering_Analysis"
    
    all_results_file = os.path.join(ANALYSIS_DIR, "hdbscan_assessment_raw_results.parquet")
    pareto_front_file = os.path.join(ANALYSIS_DIR, "pareto_front_solutions.parquet")
    
    # 运行可视化函数
    visualize_pareto_front(
        all_results_path=all_results_file,
        pareto_front_path=pareto_front_file,
        output_dir=ANALYSIS_DIR
    )