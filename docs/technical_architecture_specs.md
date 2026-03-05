# JESS.PU 个人站点技术架构与数据流向设计说明

## 1. 整体架构选型 (Tech Stack)
本站点采用现代化的 **Headless CMS + 边缘渲染** 架构，确保极致的 SEO 表现、极快的首屏加载速度以及高度灵活的后台管理体验。

*   **前端框架**: Next.js 14+ (App Router 模式)。全站优先使用 React Server Components (RSC) 进行服务端渲染，仅在交互区（如点赞、评论表单）使用 Client Components。
*   **样式方案**: Tailwind CSS (配合 CSS Modules/Vanilla Extract 辅助实现极客风 Bento Box 排版)。
*   **后端/Headless CMS**: Payload CMS (v3, 基于 Next.js 原生集成，无需独立部署 Node.js 服务)。
*   **数据库**: PostgreSQL 或 MongoDB (通过 Payload 官方 Adapter 接入)。
*   **无密码认证**: 采用 OTP (One-Time Password) / Magic Link 方案。依赖 Nodemailer 或 Resend 发送验证码邮件，使用 JWT 在 HTTP-Only Cookie 中维持会话状态。
*   **部署环境**: Vercel (前端 + Serverless Functions) 或自有服务器 (Docker 容器化统一部署)。

---

## 2. 后端数据结构详细设计 (Payload CMS Collections)

为了支撑前台复杂的业务流转，底层数据表不仅要存储内容，还需要处理状态机和关系映射。

### 2.1 内容大表 `Contents`
支撑所有单向宣发的内容（AI 实验、商业分析、我的故事、Vlog）。

| 字段名 | 类型 | 说明与约束 |
| :--- | :--- | :--- |
| `id` | String | 主键 (UUID/CUID) |
| `title` | String | 必填，主标题 |
| `slug` | String | 必填，唯一，用于生成 SEO 友好的 URL (例如 `my-first-vlog`) |
| `type` | Select | 媒体类型：`article`, `video`, `podcast`, `repo`, `snippet` |
| `category` | Select | 归属专题：`ai-experiments`, `business-analysis`, `my-story` |
| `tags` | Array<String> | 可选，自由输入或关联 Tags 表 |
| `takeaways` | Array/Text | **条件字段**：当 `category` 为 `ai-experiments` 时显示 |
| `keyArgument` | Text | **条件字段**：当 `category` 为 `business-analysis` 时显示 |
| `analysisFramework`| String | **条件字段**：当 `category` 为 `business-analysis` 时显示 |
| `coverImage` | Upload | **条件字段**：当 `category` 为 `my-story` 时必填或强推荐 |
| `externalLink` | Text (URL) | 若填写，前端列表页/详情页的“阅读”按钮将直接外跳 |
| `body` | RichText | 正文（支持 Markdown, 代码块等） |
| `status` | Select | `draft` (草稿) \| `published` (已发布) |
| `publishedAt` | Date | 发布时间，用于前端瀑布流排序 |

### 2.2 灵感引擎表 `Ideas` (Open Lab 核心)
存储宏大的产品痛点和生命周期状态。

| 字段名 | 类型 | 说明与约束 |
| :--- | :--- | :--- |
| `id` | String | 主键 |
| `title` | String | 必填，灵感标题 (例如“独立开发者订阅管理工具”) |
| `description`| Text | 痛点描述 |
| `status` | Select | 生命周期状态机：<br>`pending`(待共鸣) -> `discussing`(讨论中) -> `approved`(已立项) -> `in-progress`(研发中) -> `launched`(已交付) |
| `priorityScore`| Number | 后端定时计算/更新的热度分 (公式：基础分 + 投票数 * 权重) |
| `voteCount` | Number | 冗余字段，缓存当前总点赞数，提升读取性能 |
| `builderLogs` | Array<Block> | **核心**：开发进度快照流。包含：`date`, `content`(文本/图片), `version`(关联版本号) |

### 2.3 功能共创表 `Features` (子需求)
依附于特定的 `Idea`，由用户提出具体的落地功能建议。

| 字段名 | 类型 | 说明与约束 |
| :--- | :--- | :--- |
| `id` | String | 主键 |
| `idea` | Relationship | 必填，关联到 `Ideas` 表中的某个 ID |
| `author` | Relationship | 必填，关联到 `Users` 表 (提出该功能的极客) |
| `content` | Text | 必填，功能建议描述 (如“希望能接入 Stripe API”) |
| `voteCount` | Number | 缓存该功能的获赞数 |
| `builderReply`| Text | 选填，站长对该建议的明确回复 (如“安排在 v1.1”) |

### 2.4 用户中心表 `Users` (无密码体系)
管理订阅者和共创者身份。

| 字段名 | 类型 | 说明与约束 |
| :--- | :--- | :--- |
| `id` | String | 主键 |
| `email` | String | 必填，唯一索引 (系统将通过 OTP 验证该邮箱) |
| `nickname` | String | 选填，用户称呼，默认随机分配 (如 `Geek_0A4B`) |
| `role` | Select | `admin` (站长，拥有后台权限与前端专属高亮) \| `user` |
| `isSubscribed`| Boolean | 是否同意接收“内参周报”邮件，默认 false |
| `otpSecret` | String | 隐藏字段，临时存储下发的 6 位验证码，过期失效 |
| `otpExpiresAt`| Date | 隐藏字段，验证码过期时间 |

### 2.5 防刷票审计表 `Votes`
确保一人一票的核心基石。每次用户点击点赞，都会先查此表。

| 字段名 | 类型 | 说明与约束 |
| :--- | :--- | :--- |
| `id` | String | 主键 |
| `targetType` | Select | 投票对象类型：`idea` \| `feature` |
| `targetId` | String | 被投票的实体 ID |
| `userIdentifier`| String | 强验证：如果是登录用户，存 `User.id`；<br>弱验证(如未登录点赞)：存基于 IP + UserAgent 计算出的 Hash 值 |

---

## 3. 关键业务数据流向图 (Data Flow)

### 3.1 页面加载时的数据渲染 (SSR Flow)
以打开“商业分析专题 (`/analysis`)”为例：
1. **[Client]** 浏览器发起 GET 请求。
2. **[Next.js Server]** Server Component 接收到请求，直接在服务端调用 Payload 的 Local API：`payload.find({ collection: 'contents', where: { category: { equals: 'business-analysis' }, status: { equals: 'published' } } })`。
3. **[Next.js Server]** 拿到数据后，将数据注入到 Bento Box 卡片组件中，生成完整的 HTML HTML。
4. **[Client]** 浏览器接收到预渲染好的 HTML，瞬间完成首屏绘制（无需等待客户端 Fetch 请求）。

### 3.2 首次发帖与身份验证流 (OTP Auth Flow)
场景：未登录的访客在 Open Lab 某个 Idea 下面，想提出一个新 `Feature`。
1. **[Client]** 访客点击“提交建议”，前端发现本地无合法 Cookie，弹起 Auth Modal。
2. **[Client]** 访客填入邮箱 `test@gmail.com`，点击“获取验证码”。发起 POST `/api/auth/send-otp`。
3. **[Backend]** 检查 `Users` 表有无此邮箱；若无则创建 `pending` 状态的记录。生成 6 位随机码，更新 `otpSecret` 和 `otpExpiresAt`，调用 Resend 发送邮件。
4. **[Client]** 访客查收邮件，填入 6 位验证码，点击“确认并发布”。带着验证码和刚才的 Feature 文本发起 POST `/api/features/create-with-auth`。
5. **[Backend]** 校验验证码通过。
6. **[Backend]** 将该用户状态置为正式用户，签发 JWT 并写入 HTTP-Only Cookie。
7. **[Backend]** 在 `Features` 表中写入该条新功能建议，并将其 `author` 绑定为该用户。
8. **[Client]** 收到成功响应，自动关闭弹窗，刷新局部数据流，展示刚发布的建议。

### 3.3 异步点赞与高并发防护流 (Upvote Flow)
场景：用户在广场上点击“我也需要 (👍)”为某个 Idea 投票。
1. **[Client]** 拦截点击事件，按钮立刻执行“放大+数字+1”的乐观更新 (Optimistic UI) 动效，让用户感觉极度丝滑，同时静默发起 POST `/api/votes` 包含 `{ targetType: 'idea', targetId: '123' }`。
2. **[Backend]** 接口接收到请求，提取用户的 `userId` (如有 Cookie) 或计算 `IP+UA Hash`。
3. **[Backend Database]** 查询 `Votes` 表是否存在对应的 `(targetId, userIdentifier)` 组合。
4. **[Backend 分支 A：已存在]** 直接返回 409 或 200(但标识已投过)，不做任何变更。
5. **[Backend 分支 B：合法新票]**
    *   在 `Votes` 表中 `insert` 一条新记录。
    *   **核心性能优化**：不直接触发复杂的连表 count 查询，而是对 `Ideas` 表中的对应记录执行原子自增操作 `$inc: { voteCount: 1 }`。
6. **[Client]** 如果接口返回报错（比如提示已投过），撤销之前的乐观更新数字；如果成功，维持现状。

## 4. 部署与运维策略 (Deployment via Railway)

### 4.1 为什么选择 Railway + Docker？
本架构（Next.js + Payload CMS）非常适合使用 Railway 的容器化部署方案：
*   **一体化部署**：Payload v3 作为 Next.js 的路由集成，不需要拆分“前端服务器”和“后端管理台”。使用一个 `Dockerfile` 构建出一个 Next.js 镜像，即可同时包含前台页面和后台 CMS `/admin`。
*   **无缝衔接数据库**：Railway 提供开箱即用的 PostgreSQL (或 MongoDB) 插件，只需一键 Provision，将 `DATABASE_URI` 注入到应用的 Environment Variables 即可，免去了云数据库单独配置的烦恼。
*   **对象存储剥离**：既然部署在 Railway 这种无状态容器上（容器重启会导致本地文件丢失），**绝对不能把图片存入本地文件系统**。必须在 Payload 侧配置 S3 插件（如 AWS S3, Cloudflare R2, 或 Supabase R2），将 `coverImage` 等富媒体文件直接透传存储在对象存储中，使得 Railway 的容器成为完全“无状态 (Stateless)”的高可用节点。

### 4.2 扩展性评估 (Scalability & Modification)

本架构在设计之初就贯彻了“高内聚、低耦合”的原则，极易修改和扩展：

*   **新增内容板块（极易）**：
    所有内容数据都收敛在 `Contents` 集合中。如果未来你想增加一个“我的摄影展”板块，**不需要新建表**。只需要在 `category` 枚举中增加一个 `photography`，在前端路由 `/photography` 抓取这个分类的数据，并为其定制一种瀑布流的 UI 组件即可。数据层完全不动。
*   **修改表结构（自动化）**：
    如果需要在 `Ideas` 表里增加一个新字段（比如“预算估算”），只需在 Payload CMS 的 Schema (TypeScript) 里加一行代码，Payload 会在下次启动时自动进行 Database Migration（如果在 PostgreSQL 模式下）或者自动适应（MongoDB 模式下）。
*   **切换前端框架（解耦）**：
    虽然我们当前使用了 Next.js 与 Payload 同构部署，但 Payload 默认会为你生成一整套标准化的 REST / GraphQL API。如果你未来想用 React Native 开发一个手机 App，或者想用 Vue/Nuxt 重写前台页面，底层数据、用户系统和 CMS 都不需要动，直接调用现成的 API 即可。

### 4.3 澄清：Railway 数据持久化
关于 Railway 的数据存储，需要明确区分“数据库数据”和“媒体文件数据”：
*   **可以存储的数据 (PostgreSQL/MongoDB)**：文本内容、文章、评论、点赞数、用户表等结构化数据。你在 Railway 里一键开通的 Database 插件是**持久化**的，容器重启或重新部署都不会丢失数据。这部分完全交给 Railway 管理即可。
*   **不可以/不建议存储的数据 (Media/Images)**：你在后台上传的封面图、博客文章里的插图。在 Docker 容器内部，默认的文件系统是**临时**的（无状态）。如果你把图片传到容器的 `/public/media` 目录下，下一次你更新代码重新部署 Docker 镜像时，这些图片就会全部丢失。
*   **解决方案**：这也就是为什么需要接入 S3 对象存储（如 AWS S3、Cloudflare R2 或阿里云 OSS）。数据库（存文本）依然在 Railway，但当你上传一张图片时，Payload CMS 会自动把图片发到 S3，并在数据库里存一个 S3 的 URL。这样你的应用就变成了完美的无状态架构。
