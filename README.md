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

## 📦 部署到 Cloudflare Pages

最简单的部署方式是直接在 Cloudflare 控制台中关联 GitHub 仓库，无需配置任何 CI/CD 密钥。

1. 登录 [Cloudflare 控制台](https://dash.cloudflare.com/)，进入 **Workers & Pages** -> **Overview**
2. 点击 **Create (创建)** -> **Pages** -> **Connect to Git (连接到 Git)**
3. 选择你的 GitHub 账号和 `fkcoding-note` 仓库，点击 **Begin setup (开始设置)**
4. **配置构建设置：**
   - **Framework preset (框架预设)**: 选择 `None`
   - **Build command (构建命令)**: 输入 `npm run build`
   - **Build output directory (构建输出目录)**: 输入 `dist`
5. 点击 **Save and Deploy (保存并部署)**。
   - *(注：第一次部署可能会提示缺少数据库，先不要管它)*
6. **绑定 D1 数据库和 KV：**
   - 在部署完成后，进入项目的 **Settings (设置)** -> **Functions (函数)** 页面。
   - 向下滚动找到 **D1 database bindings**，点击 **Add binding**：
     - **Variable name (变量名称)**: 输入 `DB`
     - **D1 database**: 选择你之前创建的 `fkcoding-note` 数据库。
   - 继续向下滚动找到 **KV namespace bindings**，点击 **Add binding**：
     - **Variable name (变量名称)**: 输入 `KV`
     - **KV namespace**: 选择你创建的 KV 命名空间。
7. **重新部署以生效：**
   - 回到 **Deployments (部署)** 选项卡，点击刚才那次部署右侧的三点菜单，选择 **Retry deployment (重试部署)**。
   - 以后每次推送到 `main` 分支，Cloudflare 都会自动重新部署并应用这些绑定。

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
