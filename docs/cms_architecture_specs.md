# 内容管理系统 (CMS Architecture) 架构与需求说明

## 1. 系统定位与核心诉求
作为整个站点的底层引擎，CMS 需要统一支撑前台所有的专题模块（AI 创造、商业分析、我的故事）。
它不仅仅是一个简单的“博客后台”，而是一个**全媒体内容集散中心**与**社区交互管理台**。
*   **统一存储，多元展示**：所有内容（不论是文章、视频、Repo 还是简短的碎碎念）统一存在一张大表里，通过标签和属性控制前端不同专题的渲染。
*   **富交互管理**：除了发内容，还要能方便地管理用户的评论、点赞和 Open Lab 里的需求流转。
*   **引流优先**：支持站内原生排版的同时，原生支持向 B站、小红书、YouTube 等外部平台的强导流。

---

## 2. 核心数据集合设计 (Collections)
基于 Payload CMS（或类似的 Headless CMS），系统应包含以下核心集合 (Collections)：

### 2.1 统一内容大表 (`Contents`)
所有在前台流转的信息（文章、视频、播客）都存在这里。
*   `title` (标题): 必需。
*   `type` (媒体类型枚举): `article` | `video` | `podcast` | `repo` | `snippet`(短动态)。
*   `category` (所属专题): `ai-experiments` | `business-analysis` | `my-story`。
*   `tags` (二级标签): 数组，如 `[Vibe Coding]`, `[Prompt]`, `[$TCEHY]`, `[Vlog]`。
*   **【专题专属字段 (Conditional Fields)】**：根据 `category` 的不同，后台动态显示不同的字段，确保填写的结构化：
    *   如果是 `ai-experiments`: 显示 `takeaways` (核心干货提炼)。
    *   如果是 `business-analysis`: 显示 `keyArgument` (核心论点) 和 `framework` (分析框架)。
    *   如果是 `my-story`: 显示 `coverImage` (大封面图) 和 `snippet` (感性碎碎念)。
*   `externalLink` (外部跳转链接): 若配置，前端点击卡片或按钮将直接跳出（B站/小红书等）。
*   `body` (站内富文本): 选用块级编辑器 (Block Editor) 支持 Markdown、代码高亮、多媒体嵌入。
*   `status`: `draft` | `published`。
*   `publishedAt`: 发布时间。

### 2.2 评论与互动大表 (`Comments`)
统一管理全站所有的 UGC (用户生成内容)。
*   `content` (富文本/Markdown): 用户评论的内容。
*   `author`: 关联 `Users` 集合（已登录），或简单的 `guestName` (游客昵称) + `guestEmail`。
*   `targetType` (评论目标类型): `content` (文章/视频评论) | `idea` (Open Lab 大灵感评论) | `feature` (Open Lab 具体功能评论)。
*   `targetId`: 关联到具体的 `Contents`, `Ideas`, 或 `Features` 的 ID。
*   `status` (审核状态): `pending` (待审核) | `approved` (已通过，前端可见) | `rejected` (拒绝)。
*   `upvotes`: 点赞数统计。

### 2.3 实验室流转引擎 (`Ideas` & `Features`)
(详见 `open_lab_product_specs.md`)
*   `Ideas`: 管理大概念。字段包括标题、痛点描述、所处阶段 (`pending` -> `in-progress` -> `launched`)、总票数、Builder 的研发日志 (Timeline 数组)。
*   `Features`: 挂载在特定 `Idea` 下的具体功能点。包含提议内容、票数、Builder 回复。

### 2.4 投票防刷记录 (`Votes`)
用于记录用户的每一次点赞（文章点赞、Idea 点赞、Feature 点赞、评论点赞）。
*   `targetType` & `targetId`: 投票对象。
*   `userIdentifier`: 登录用户的 ID 或未登录用户的设备指纹/IP Hash（防刷票）。

---

## 3. CMS 后台管理体验 (Admin UI)

### 3.1 仪表盘 (Dashboard)
*   进入 CMS 第一眼看到的是“待办事项”：
    *   X 条待审核的新评论。
    *   X 个新提交的 Open Lab Idea。
    *   X 个票数超过阈值亟待评估的 Feature。

### 3.2 内容发布体验 (Content Authoring)
*   **按需显示**：在创建新 `Content` 时，选择 `商业分析` 分类后，页面自动弹出 `核心论点` 输入框；选择 `我的故事` 后，自动要求上传 `封面大图`。
*   **快捷外链**：提供一键抓取外部链接 Meta 信息的能力（未来优化方向，输入 B 站链接自动补全标题和封面）。

### 3.3 审核与互动工作流 (Moderation)
*   提供一个专门的“互动中心 (Engagement)”视图。
*   管理员可以批量勾选 `approved` 评论。
*   可以在后台直接以 `[Admin/Builder]` 身份回复评论，前端会带有专属高亮徽章展示。
