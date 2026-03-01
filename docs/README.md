# JESS.PU 个人站点产品需求与设计规划 (PRD & UI Wireframes)

本目录包含了基于“Build in Public (公开构建)”和“无密码认证”理念的个人独立站全套需求与交互线稿。
文档经过统一梳理，确保前端多栏排版（Bento Box / Two-Column）与底层 CMS 架构（Payload CMS）的高效解耦。

## 目录索引 (Index)

### 1. 全局架构与底层引擎
*   **`cms_architecture_specs.md`**：内容管理系统 (CMS) 架构说明。定义了“万物皆 Content”的底层表结构，如何通过一张大表支撑不同的专题，并包含评论/审核的统一管理模型。
*   **`subscribe_auth_specs.md`**：订阅与用户体系说明。抛弃传统密码，实行“邮箱 + OTP 验证码”的静默登录体系。
*   **`subscribe_auth_ui_wireframe.md`**：订阅页与免密认证弹窗交互线稿。包含打赏入口、微信二维码以及邮件订阅转化卡片。

### 2. 核心大盘
*   **`home_product_specs.md`**：首页需求说明。作为站点的总枢纽，采用高信息密度的数字仪表盘展示个人价值观。
*   **`home_ui_wireframe.md`**：首页 UI 交互线稿。采用大胆的 **Bento Box (便当盒)** 风格拼图式排版，收口四大核心能力。

### 3. 共创板块
*   **`open_lab_product_specs.md`**：公开实验室 (Open Lab) 需求说明。全站最具特色的互动模块，采用 `Idea (大灵感) -> Feature (具体功能点)` 的双层架构。
*   **`open_lab_ui_wireframe.md`**：公开实验室 UI 交互线稿。强调左侧 Builder 过程展示与右侧用户共创的“双轨并行”。

### 4. 核心内容专题 (Content Pillars)
*   **`ai_experiments_product_specs.md`** / **`ai_experiments_ui_wireframe.md`**：AI 创造与实验专题。采用双栏布局，核心亮点为“结论前置 (Takeaways)”，展示硬核实战复盘与工作流。
*   **`business_analysis_product_specs.md`** / **`business_analysis_ui_wireframe.md`**：商业分析专题。纯粹的观点阅读场，偏向严谨的投研研报排版，主打“核心论点 (Key Argument)”外显。
*   **`my_story_product_specs.md`** / **`my_story_ui_wireframe.md`**：我的故事专题。展示个人数字花园与生活记录，强调图文并茂的“碎碎念 (Snippet)”感性排版。

### 5. 详情消费页
*   **`post_detail_product_specs.md`**：文章详情页需求说明。承载单篇内容的消费，主推向 B站、小红书等外部社媒的流量回流与打赏转化。

---
**核心全局交互规范**：
在详情页、Open Lab 讨论区、专题侧边栏等高优曝光位，均植入轻量级的 `[ ☕️ 打赏 / Buy me a coffee ]` 入口，点击后统一弹出或跳转至 `/subscribe` 里的打赏卡片，以最顺滑的方式承接用户赞赏意愿。

11. **`technical_architecture_specs.md`**
    - 技术架构与数据流向设计说明。详细规定了 Next.js + Payload CMS 的表结构字段（Contents, Ideas, Features, Users, Votes）以及 SSR、OTP 登录、防并发点赞等关键业务的数据流向图。
