# 关系抽取可视化 Dashboard 使用手册

本手册帮助你快速了解与使用“语义三元组（主语-关系-宾语）”可视化与分析 Dashboard。内容涵盖：如何打开与浏览、交互功能说明、常见问题

---

## 1. 这是什么？能做什么？

该 Dashboard 将访谈文本中的“语义三元组”（主语→关系→宾语）以可读、可筛选的方式展示，并提供网络图可视化，便于：
- 快速了解哪些实体类型更常见、出现于多少个话轮
- 观察常见的结构模式（例如：Person → uses → Tool）
- 从“语义网络”的视角探索实体之间的关系结构（节点=实体，边=关系）
- 基于搜索、类型、关系和结构模式进行交互过滤，并导出 CSV

数据来源：抽取后的 JSON（每个话轮内包含若干语义三元组），无需联网即可浏览基础页面；网络图模块通常需要联网加载可视化库。

---

## 2. 我会看到哪些模块？

打开 HTML 报告后，主要区域如下：
- 顶部应用栏
  - 标题（报告名）
  - 实体名称搜索框（直接输入关键词）
  - 右上角按钮：
    - Visualise：打开“网络可视化”全屏弹窗
    - Back to Top：返回页面顶部
- 全局统计卡片（摘要）
  - 提取总数、话轮数、唯一实体名数、实体类型数、关系数
- 左侧主区域
  - 逐个话轮（Speaker Turn）展示该轮的所有三元组
  - 每个三元组会显示：主语实体、关系（语义/表面形式）、宾语实体、证据文本等
- 右侧侧边栏（可在窄屏时移至上方）
  - 筛选与搜索状态提示区（显示当前过滤条件）
  - 实体类型统计与“可点击标签”
  - 结构模式（最常见/最不常见）列表，可点击其中一条作为过滤条件

---

## 3. 如何打开与浏览？
- 直接双击 HTML 文件，或在浏览器中“文件-打开”该 HTML
- 推荐浏览器：Chrome / Edge / Firefox（Safari 14+ 也可）
- 打开后即可离线浏览绝大部分内容；“网络可视化”功能通常需要联网（详见第 6 节）

快速上手建议：
1) 在搜索框输入感兴趣的实体名片段（支持任意大小写），页面会即时过滤
2) 在右侧“实体类型”点击一种或多种类型进行筛选
3) 点击右上“Visualise”进入网络视图，从全局关系结构的角度再观察一次

---

## 4. 常用交互操作

- 搜索：在顶部输入框输入实体名关键字
- 按实体类型筛选：点击右侧“Type”标签（可多选）
- 按关系筛选：在三元组卡片内点击关系标签或在侧栏选择
- 按结构模式筛选：在“Most/Least Frequent Patterns”列表中点击任意一行
- 清除所有筛选：点击“Clear All”按钮（显示在筛选状态条中）
- 导出 CSV：在相关统计区块点击“Export CSV”（若提供），或在网络视图中使用“Export”菜单导出 PNG/JSON/CSV（边列表）
- 返回顶部：点击“Back to Top”

---

## 5. 网络可视化（Visualise）

点击右上“Visualise”进入全屏弹窗网络视图：
- 搜索框：搜索节点名称
- Physics：启用/关闭物理布局（节点会自动分布/稳定）
- Labels：切换“节点/边”标签显示
- Hops：设置“扩展跳数”
  - 0：仅显示与当前筛选严格匹配的节点
  - +1 / +2：在匹配节点的基础上，向外扩展 1 或 2 跳以补充上下文
- Fit：自动缩放到合适视野
- Cluster：尝试对网络进行聚类 （功能尚未完成）
- Export：导出为 PNG 图片、JSON 数据或 CSV 边列表
- 交互提示：
  - 滚轮缩放，拖拽平移
  - 单击节点高亮邻居；再次单击空白处取消

注：网络视图依赖 vis.js（vis-network）库。当前模板从 CDN 加载该库；若无网络，网络视图可能无法正常生成（见第 6 节“离线使用”）。

---

## 6. 离线使用说明（重要）
- 仅浏览 HTML 的“文本与统计”部分：不需要联网
- 使用“网络可视化”模块：默认需要联网以加载 vis-network 库
- 字体（Inter / Source Code Pro / PT Sans Narrow）：无网时可能回退为系统字体，功能不受影响

如果必须在完全离线环境使用“网络可视化”，可让技术同事制作离线版（两种思路）：
1) 使用本地库文件，并修改 HTML 中的 `<script>` 引用，指向本地路径
   - 可用文件：`lib/vis-9.1.2/vis-network.min.js`
   - 可保持目录结构，将 HTML 与 `lib/` 文件夹一起打包与分发
2) 生成“完全自包含”的单文件（将依赖内联进 HTML）
   - 需技术处理：把 vis-network 脚本打包为内联 `<script>`，并去除外部 CDN 引用

不修改 HTML 的情况下，离线时仍可浏览页面主体；“Visualise”按钮可能提示加载失败或空白。

---

## 7. 文件清单（给日常使用者）
- 正常在线浏览：仅需该 HTML 文件
- 计划离线并使用网络图：建议同时打包以下目录（若 HTML 已改为本地引用）
  - `lib/vis-9.1.2/`（含 `vis-network.min.js`）
  - `lib/tom-select/`（若页面引用，用于下拉/选择交互）
- 字体资源（可选）：离线环境下若需保持一致的外观，可另外打包字体 `.woff2` 文件并在 HTML 中本地引用（否则回退系统字体即可）

---

## 8. 常见问题（FAQ）
- Q：页面能打开，但“Visualise”不工作或空白？
  - A：多数是离线或网络受限导致 vis-network 未从 CDN 加载。联网重试，或请技术同事将脚本改为本地引用（见第 6 节）。
- Q：筛选结果为空是正常的吗？
  - A：可能筛选条件过多。点击“Clear All”清除所有筛选再看；或检查关键词拼写。
- Q：导出的 CSV/PNG 在哪里？
  - A：网络视图的导出会触发浏览器下载，请在浏览器“下载”中查看。
- Q：页面字体与截图不一样？
  - A：离线/公司网络可能屏蔽谷歌字体，浏览器会用系统字体替代，不影响功能。
- Q：打开很慢、滚动或网络图卡顿？
  - A：数据量过大时属正常。可先使用筛选收缩范围；网络视图可关闭 Physics、降低标签、或减少 Hops。
- Q：双击 HTML 打不开？
  - A：换用 Chrome/Edge/Firefox；或右键“用其他应用打开”。若放在受限路径（如某些网盘虚拟盘），请先复制到本地磁盘。

---

## 9. 隐私与数据
- 报告 HTML 默认不连接外部服务器（除非加载外部 CDN 脚本/字体）。
- 若涉及敏感内容，建议在内网环境使用，并考虑制作为“完全自包含”单文件版本（见第 6 节）。

---

## 10. 术语速查

- 语义三元组（SRO）：Subject（主语实体）— Relation（关系）— Object（宾语实体）
- 实体类型：如 Person、Organization、Tool 等
- 结构模式：SubjectType → Relation → ObjectType 的模式统计
- 话轮（Speaker Turn）：一次发言，包含若干三元组

---

## 附录 A（技术同事）：如何重新生成报告

### A.1 环境要求
- Python 3.12+
- 基础依赖（仅生成报告）
  
  ```bash
  pip install jinja2
  ```
- 高级分析（可选）
  
  ```bash
  pip install pandas numpy networkx matplotlib seaborn pyvis
  ```

### A.2 主要脚本与模板
- 报告生成（主版本 v2.0）：`generate_report_modern.py`
  - 默认模板：`template_modern.html.j2`
  - 备用模板：`template_modern_fixed.html.j2`、`template_modern_backup.html.j2`
- 高级分析与可视化（可选）：`semantic_triple_analysis.py`
- 输入数据：`extracted_data.json`（或指定其他 JSON 文件）

模板与脚本需同目录放置（相对路径加载）。

### A.3 生成示例

```bash
python3 generate_report_modern.py --input extracted_data.json --output report_modern.html
# 或简写
python3 generate_report_modern.py -i extracted_data.json -o report_modern.html
```

生成完成后，用浏览器打开 `report_modern.html` 即可。

### A.4 输入数据结构（简化说明）

根为数组，每个元素表示一个话轮：

```json
{
  "speaker_name": "Alice",
  "role": "Interviewer",
  "utterance_order": 1,
  "extractions": [
    {
      "subject_entity": {"name": "X", "entity_type": "Person"},
      "relation": {"surface_form": "uses", "semantic_form": "uses"},
      "object_entity": {"name": "Y", "entity_type": "Tool"},
      "evidence_sources": ["turn_1_sentence_2"],
      "evidence_text": "...原文片段..."
    }
  ]
}
```

### A.5 常见参数/常量

- 模板文件：`TEMPLATE_FILE = "template_modern.html.j2"`
- 结构模式排名个数：`PATTERN_RANKING_COUNT = 150`
- 多样性展示阈值：`DIVERSE_RELATION_COUNT = 20`

### A.6 离线版网络图（技术改造建议）

- 将模板中对 vis-network 的 CDN 引用改为本地：
  - 引入 `lib/vis-9.1.2/vis-network.min.js`（已在仓库 `lib/` 中）
  - 确保生成的 HTML 与 `lib/` 目录一起分发
- 字体如需本地引用，可下载对应 `.woff2` 并以 `@font-face` 内联或本地路径引用

---

## 反馈与维护
- 如需新增统计项、导出格式或更严格的离线支持，请联系项目技术同事
- 建议在生成报告时保留一份输入 JSON 与所用脚本版本，便于复现与追踪

