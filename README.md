# JESS.PU 首版实现（Next.js + Payload CMS + PostgreSQL）

本仓库已从 PRD 文档升级为可运行的端到端首版工程，覆盖：
- 前台页面：`/`、`/lab`、`/lab/idea/[slug]`、`/ai-experience`、`/analysis`、`/story`、`/subscribe`
- 后台管理：Payload 原生 `/admin`
- 公开 API：OTP、订阅、赞助名单、Open Lab、评论、内容流
- 数据库：PostgreSQL（Payload v3 + `@payloadcms/db-postgres`）
- 对象存储：Cloudflare R2（`@payloadcms/storage-s3`）
- 邮件：Resend（OTP）

## 快速启动

1. 安装依赖
```bash
npm install
```

2. 配置环境变量
```bash
cp .env.example .env
```

3. 启动开发环境
```bash
npm run dev
```

4. 初始化示例数据（可选）
```bash
npm run seed
```

## 常用命令

```bash
npm run dev          # 本地开发
npm run build        # 生产构建
npm run start        # 生产启动
npm run lint         # ESLint
npm run typecheck    # TypeScript 校验
npm run test         # Vitest 单测
npm run payload      # Payload CLI
npm run payload:types
npm run payload:importmap
```

## 部署说明（Railway）

- 已包含 `Dockerfile` 与 `railway.json`
- 在 Railway 中同时挂载应用服务 + PostgreSQL 服务
- 配置以下关键环境变量：
  - `DATABASE_URL`
  - `PAYLOAD_SECRET`
  - `SESSION_SECRET`
  - `RESEND_API_KEY`
  - `RESEND_FROM_EMAIL`
  - `R2_ACCOUNT_ID`
  - `R2_ACCESS_KEY_ID`
  - `R2_SECRET_ACCESS_KEY`
  - `R2_BUCKET`
  - `R2_ENDPOINT`
  - `R2_PUBLIC_URL`

## 文档

产品与设计文档仍保留在 `docs/`，可继续作为迭代基线使用。
