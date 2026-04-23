# fkcoding-note

一个面向开发者的**编程教程创作与知识管理平台**。支持树状层级教程系列、Markdown 富文本创作、统计可视化等生产级功能。

整个应用基于单体全栈架构设计，可直接部署在 Cloudflare 免费套餐上，零月费，全球 CDN 加速。无前后端分离，无复杂构建步骤。

## 🛠 技术栈

- **全栈框架**: [Hono.js](https://hono.dev/) (JSX 模式，服务端渲染)
- **数据库**: [Cloudflare D1](https://developers.cloudflare.com/d1/) (Serverless SQLite)
- **缓存/会话**: [Cloudflare KV](https://developers.cloudflare.com/kv/)
- **ORM**: [Drizzle ORM](https://orm.drizzle.team/)
- **前端交互**: [Alpine.js](https://alpinejs.dev/) + [htmx](https://htmx.org/) (CDN 引入，渐进增强)
- **Markdown 处理**: marked.js + highlight.js (客户端渲染预览)
- **代码编辑**: CodeMirror 6
- **样式**: 原生 CSS + CSS 变量

## 🚀 本地开发指南

### 1. 安装依赖

```bash
npm install
```

### 2. 初始化本地数据库

```bash
# 生成本地 D1 数据库文件
npm run db:generate

# 应用数据库迁移
npm run db:migrate
```

### 3. 启动本地开发服务器

```bash
npm run dev
```

本地服务器将启动在 `http://localhost:8787`。

## 📦 部署到 Cloudflare

1. 全局安装 wrangler 并登录：
   ```bash
   npm install -g wrangler
   wrangler login
   ```

2. 在 Cloudflare 面板或通过 CLI 创建 D1 数据库和 KV 命名空间：
   ```bash
   wrangler d1 create fkcoding-note-db
   wrangler kv:namespace create KV
   ```

3. 更新 `wrangler.toml` 中的 `database_id` 和 `id`：
   ```toml
   [[d1_databases]]
   binding = "DB"
   database_name = "fkcoding-note-db"
   database_id = "<your-d1-database-id>"

   [[kv_namespaces]]
   binding = "KV"
   id = "<your-kv-namespace-id>"
   ```

4. 将数据库结构部署到生产环境：
   ```bash
   wrangler d1 migrations apply fkcoding-note-db --remote
   ```

5. 一键部署 Worker：
   ```bash
   npm run deploy
   ```

## 📁 目录结构

```
fkcoding-note/
├── src/
│   ├── index.ts              # 入口：Hono app 实例
│   ├── db/
│   │   ├── schema.ts         # Drizzle ORM Schema
│   │   └── migrations/       # D1 迁移 SQL
│   ├── routes/               # 页面路由 (auth, dashboard, articles...)
│   ├── components/           # Hono JSX 服务端组件 (Layout, Sidebar...)
│   ├── middleware/           # 中间件 (auth...)
│   ├── lib/                  # 工具函数 (session...)
│   └── assets/               # 静态资源 (app.css, app.js)
├── drizzle.config.ts         # Drizzle 配置
├── wrangler.toml             # Cloudflare Worker 配置
├── package.json
└── tsconfig.json
```

## 📄 许可证

MIT License
