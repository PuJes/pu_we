# JESS.PU 个人站点 UI/UX 设计规范 (V5 Clean & Grand)

## 一、 核心定位与视觉概念 (Core Vision)

**“简洁无垠，大气磅礴” (Clean & Grand)**

在坚决摒弃了厚重的深色背景与繁杂的刻板“黑客风”之后，我们采用了极其纯净的**现代主义艺术画廊 (Modernist Gallery)** 风格。
通过近乎极致的“留白 (Negative Space)”与“巨型字体 (Oversized Typography)”的张力对比，在不用任何黑色背景块的前提下，依然能实现“大开大合”的高阶质感。它看起来应该像是一本极其精美的纸质高级独立杂志或建筑图册。

### 设计关键词 (Keywords)
*   **Breathing Room (绝对的呼吸感)**：用超大的内边距 (Padding) 代替背景色来划分区域。
*   **Monochrome Elegance (优雅单色)**：除了极其克制的单一品牌点缀色外，90% 的页面由纯白、极浅灰与碳黑文字组成。
*   **Typographic Tension (排版张力)**：让文字本身成为最大的装饰，用极其巨大的首屏标题镇住整个气场。

---

## 二、 版式架构体系 (Layout Architecture)

### 2.1 The Grand Bento (首页超级白盒网格)
*   继承了 Bento Box 的分块逻辑，但在全浅色下呈现。
*   **无缝衔接**：整个网页底色为极浅的冷灰 `#F9FAFB`。网格内的卡片为纯白 `#FFFFFF`。
*   **卡片边缘处理**：抛弃刺眼的粗黑线，采用极细的 `1px solid #E5E7EB` (Tailwind 的 `gray-200`)，或者在底部添加几乎察觉不到的弥散阴影 `box-shadow: 0 4px 24px -4px rgba(0,0,0,0.03)`，让纯白卡片在浅灰底上优雅地浮起，就像纸张叠在一起。

### 2.2 跨页面的版式对齐
无论是两栏布局的文章详情，还是 Open Lab 讨论区，都必须遵守统一的左对齐网格基准线。视觉引导线清晰，绝不拖泥带水。

---

## 三、 设计 Token 系统 (Design Tokens)

V5 版本是对系统调色板的彻底“净化”。**严禁使用任何形式的大面积纯黑、纯深灰色块做容器背景。**

### 3.1 Color Tokens (极简调色板)
*   `--bg-body-base`: `#F8F9FA` 或 `#F3F4F6` (最底层的画布，带来极其轻微的光影对比)。
*   `--bg-card-surface`: `#FFFFFF` (所有的内容模块、Bento 卡片永远是纯白色)。
*   `--border-subtle`: `#E5E7EB` (用于所有的卡片边框、内容分割线，保证隐形而不争抢注意力)。
*   `--text-primary`: `#111827` (碳黑，而非死黑 `#000`，使长时间阅读不觉刺眼)。
*   `--text-secondary`: `#6B7280` (中灰，用于副标题、日期、辅助类元信息)。
*   `--brand-accent`: 视您的偏好定（例如冷静克制的深空蓝 `#1D4ED8` ），只允许出现在最重要的 CTA 按钮或文本悬停高亮上。

### 3.2 告别异构，走向和谐统一
*   **AI 板块**：不再是黑客终端！而是一张纯白卡片，通过使用带有代码片段的精美插图，或仅仅通过等宽字体排版来暗示其属性。
*   **商业板块**：纯净的白纸黑字布局。
*   无论哪个板块，基础容器的质感 (白底+细边框) 保持绝对的一致。

---

## 四、 排印层次 (Typography System)

在色彩被极其克制的情况下，“大字”和有品位的字体选择是体现“大气”的唯一途径。

### 4.1 超大无衬线标题 (Oversized Clean Display)
*   全站的主标题 (H1)、关键数字指标，均采用几何感明确的现代无衬线体（推荐 `Inter Tight`, `Space Grotesk`, 或直接使用系统 UI 字体 `system-ui` 黑体）。
*   尺寸要求“突破常规”：Hero 区域的标题可以是 `clamp(3.5rem, 8vw, 7rem)`。要让用户一进网页，首先被巨大的文字构成所震撼。
*   字重(Font-Weight)：采用 `600` (Semibold) 或更重，形成扎实的块状感。

### 4.2 段落与正文 (Body & Detail)
*   干净清晰的 `Inter` 或 `SF Pro`。
*   为了防止文字显得拥挤，统一使用 `leading-relaxed` (1.625 行高) 甚至 `leading-loose` (2 行高)，进一步烘托空灵感。

---

## 五、 组件与微交互 (Components & Motion)

### 5.1 极简按钮 (Ghost & Monolithic Buttons)
*   **Primary CTA (主要按钮)**：纯黑底色 (`#111827`)，纯白文字。四角圆润但不过度 (`rounded-lg` 或完全的胶囊 `rounded-full`)。这可能是全站唯一合法的纯黑“大色块”，正因为稀少所以极具引导性。
*   **Secondary CTA (次要按钮 / 打赏入)**：完全融入背景的白底按钮，仅靠 `1px` 细框和极轻微的 `gray-50` 悬浮反馈界定。

### 5.2 微交互原则 (Fluid & Breathable Motion)
*   动画需要像丝绸一样滑润顺畅。
*   **Hover 滑动**：当鼠标掠过卡片时，不要加重边框线条，而是微微增大阴影（如提升到 `shadow-md`）并配合极致平滑的 Y 轴上浮 `-2px`，转场时长 `duration-300 ease-out`。
*   **页面切换**：优雅的整体淡入 (Fade-in)。

---

## 工程师执行要点 (Checklist for Dev)

1.  **清空 `tailwind.config.js` 中的暗黑相关定制**，不需要 `darkMode`。
2.  全页面的 `<body>` 使用 `bg-gray-50`，所有 Bento 卡片组件一律使用 `bg-white shadow-sm border border-gray-200 rounded-2xl` 的基准组合。
3.  确保 H1 到 H3 都配有对应的 `tracking-tight` (紧凑字间距) 设置，这能让巨型标题看起来更加干练大气。
