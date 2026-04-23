# fkcoding-note — 全栈架构设计文档

> 单体全栈架构 · Cloudflare 免费套餐部署 · 无前后端分离

---

## 一、项目定位

fkcoding-note 是一个面向开发者的**编程教程创作与知识管理平台**，支持树状层级教程系列、Markdown 富文本创作、统计可视化等生产级功能。整个应用运行在 Cloudflare 免费套餐上，零月费，全球 CDN 加速。

---

## 二、技术选型

### 核心框架

| 层级 | 技术 | 选择理由 |
|------|------|----------|
| 全栈框架 | **Hono.js** (JSX 模式) | 原生支持 Cloudflare Workers，内置路由、中间件、JSX 渲染，单文件即完整应用 |
| 模板渲染 | **Hono JSX** (服务端渲染) | 无需构建步骤，Worker 直接输出 HTML，无客户端 bundle |
| 数据库 | **Cloudflare D1** (SQLite) | 免费 500MB，Workers 原生集成，无需外部数据库连接 |
| 缓存/会话 | **Cloudflare KV** | 存储用户 Session、配置、搜索缓存 |
| ORM | **Drizzle ORM** | 轻量级，完全支持 D1，类型安全，零运行时依赖 |
| 客户端交互 | **Alpine.js** + **htmx** | 无需构建工具，CDN 引入，渐进增强，与 SSR 完美配合 |
| MD 渲染 | **marked.js** + **highlight.js** | 客户端 Markdown 预览实时渲染 |
| MD 编辑 | **CodeMirror 6** | 轻量代码编辑器，支持 Markdown 语法高亮 |
| 样式 | **原生 CSS** + CSS 变量 | 无需构建，直接内联或静态文件，Worker 直接 serve |
| 部署工具 | **Wrangler CLI** | Cloudflare 官方工具链，本地开发 + 一键部署 |
| CI/CD | **GitHub Actions** | push 触发自动 wrangler deploy |

### 为什么不前后端分离？

- **Workers 天然支持 SSR**：Hono.js 在 Workers 中直接渲染 HTML 响应，无需额外 CDN 托管前端静态资源（虽然 Pages 也免费，但额外引入了构建复杂度）
- **无构建步骤**：Alpine.js + htmx 通过 CDN 引入，CodeMirror 同理，整个项目 `wrangler deploy` 即完成
- **更低延迟**：数据查询和 HTML 渲染在同一个 Worker 中完成，无 API 往返
- **更简单的认证**：Session 存 KV，无需 JWT + CORS 等前后端分离带来的额外复杂度

---

## 三、目录结构

```
fkcoding-note/
├── src/
│   ├── index.ts              # 入口：Hono app 实例，挂载所有路由
│   ├── db/
│   │   ├── schema.ts         # Drizzle ORM Schema 定义
│   │   └── migrations/       # D1 迁移 SQL 文件
│   ├── routes/
│   │   ├── auth.ts           # 登录/登出/注册路由
│   │   ├── dashboard.ts      # 总览页路由
│   │   ├── series.ts         # 教程系列 CRUD 路由
│   │   ├── articles.ts       # 文章 CRUD + 编辑器路由
│   │   ├── notes.ts          # 快速笔记路由
│   │   ├── stats.ts          # 统计页路由
│   │   └── tags.ts           # 标签管理路由
│   ├── components/           # Hono JSX 服务端组件
│   │   ├── Layout.tsx        # 主布局（侧边栏 + 顶栏）
│   │   ├── Sidebar.tsx       # 树状导航侧边栏
│   │   ├── ArticleTree.tsx   # 教程系列树组件
│   │   ├── Editor.tsx        # Markdown 编辑器页面
│   │   ├── StatCharts.tsx    # 统计图表页（htmx 片段）
│   │   └── ui/               # 基础 UI 组件
│   │       ├── Button.tsx
│   │       ├── Badge.tsx
│   │       └── Modal.tsx
│   ├── middleware/
│   │   ├── auth.ts           # Session 验证中间件
│   │   └── logger.ts         # 请求日志
│   ├── lib/
│   │   ├── session.ts        # KV Session 管理
│   │   ├── markdown.ts       # 服务端 Markdown 工具函数
│   │   └── stats.ts          # 统计数据聚合逻辑
│   └── assets/
│       ├── app.css           # 全局样式（Worker serve 静态文件）
│       └── app.js            # 客户端 JS（Alpine 初始化等）
├── drizzle.config.ts         # Drizzle 配置
├── wrangler.toml             # Cloudflare Worker 配置
├── package.json
└── tsconfig.json
```

---

## 四、数据库设计（D1 / SQLite）

### Schema 总览

```typescript
// src/db/schema.ts
import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core';

// 用户表
export const users = sqliteTable('users', {
  id: text('id').primaryKey(),           // nanoid
  username: text('username').notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  createdAt: integer('created_at').notNull(), // Unix timestamp
});

// 教程系列表（支持无限层级树）
export const series = sqliteTable('series', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id),
  parentId: text('parent_id'),            // null = 顶级系列
  title: text('title').notNull(),
  description: text('description'),
  icon: text('icon'),                     // emoji 或 icon key
  sortOrder: integer('sort_order').default(0),
  createdAt: integer('created_at').notNull(),
  updatedAt: integer('updated_at').notNull(),
});

// 文章表
export const articles = sqliteTable('articles', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id),
  seriesId: text('series_id').references(() => series.id),
  title: text('title').notNull(),
  content: text('content').notNull().default(''), // 原始 Markdown
  summary: text('summary'),
  status: text('status').notNull().default('draft'), // draft | published
  sortOrder: integer('sort_order').default(0),
  wordCount: integer('word_count').default(0),
  readingMinutes: integer('reading_minutes').default(0),
  createdAt: integer('created_at').notNull(),
  updatedAt: integer('updated_at').notNull(),
  publishedAt: integer('published_at'),
});

// 标签表
export const tags = sqliteTable('tags', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id),
  name: text('name').notNull(),
  color: text('color').default('gray'),
});

// 文章-标签关联
export const articleTags = sqliteTable('article_tags', {
  articleId: text('article_id').references(() => articles.id),
  tagId: text('tag_id').references(() => tags.id),
});

// 快速笔记
export const notes = sqliteTable('notes', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id),
  content: text('content').notNull(),
  createdAt: integer('created_at').notNull(),
  updatedAt: integer('updated_at').notNull(),
});

// 文章修改历史（保留最近 20 版）
export const articleHistory = sqliteTable('article_history', {
  id: text('id').primaryKey(),
  articleId: text('article_id').references(() => articles.id),
  content: text('content').notNull(),
  savedAt: integer('saved_at').notNull(),
});

// 每日写作记录（热力图数据）
export const writingLogs = sqliteTable('writing_logs', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id),
  date: text('date').notNull(),          // YYYY-MM-DD
  articleCount: integer('article_count').default(0),
  wordCount: integer('word_count').default(0),
});
```

---

## 五、路由设计

### 页面路由（SSR 返回完整 HTML）

| Method | Path | 说明 |
|--------|------|------|
| GET | `/` | 重定向到 `/dashboard` |
| GET | `/login` | 登录页 |
| POST | `/login` | 处理登录，写 KV Session |
| POST | `/logout` | 清除 Session |
| GET | `/dashboard` | 总览仪表盘 |
| GET | `/series` | 教程系列列表 |
| GET | `/series/new` | 新建系列页 |
| GET | `/series/:id` | 系列详情 + 文章树 |
| GET | `/articles/new` | 新建文章（编辑器） |
| GET | `/articles/:id/edit` | 编辑文章（编辑器） |
| GET | `/notes` | 笔记列表 |
| GET | `/stats` | 统计页 |
| GET | `/tags` | 标签管理 |

### htmx 片段路由（返回 HTML 片段，局部更新）

| Method | Path | 说明 |
|--------|------|------|
| POST | `/articles` | 创建文章，返回重定向或树节点 HTML |
| PUT | `/articles/:id` | 保存文章（自动保存触发） |
| DELETE | `/articles/:id` | 删除文章 |
| POST | `/articles/:id/publish` | 发布文章 |
| PUT | `/series/:id/reorder` | 拖拽排序，更新 sortOrder |
| POST | `/series` | 创建系列，返回树节点 HTML 片段 |
| DELETE | `/series/:id` | 删除系列 |
| GET | `/htmx/tree/:seriesId` | 返回展开的子节点 HTML |
| GET | `/htmx/stats/heatmap` | 返回热力图数据片段 |
| POST | `/htmx/notes` | 创建笔记，返回笔记卡片 HTML |
| GET | `/htmx/search` | 搜索结果片段 |

---

## 六、核心模块实现要点

### 6.1 认证（KV Session）

```typescript
// src/lib/session.ts
const SESSION_TTL = 60 * 60 * 24 * 7; // 7天

export async function createSession(kv: KVNamespace, userId: string) {
  const sessionId = crypto.randomUUID();
  await kv.put(`session:${sessionId}`, userId, { expirationTtl: SESSION_TTL });
  return sessionId;
}

export async function getSession(kv: KVNamespace, sessionId: string) {
  return kv.get(`session:${sessionId}`);
}
```

Cookie 使用 `HttpOnly; Secure; SameSite=Strict`，无需 JWT。

### 6.2 自动保存（htmx + debounce）

编辑器页面使用 htmx `hx-trigger="input changed delay:1500ms"` 触发 PUT 请求，Worker 更新 D1 中的 content 字段并返回"已保存"状态文本片段。同时写入 `article_history` 表保留历史版本。

### 6.3 教程树（递归 JSX）

```typescript
// src/components/ArticleTree.tsx
async function SeriesNode({ node, depth }: { node: SeriesWithChildren, depth: number }) {
  return (
    <li style={`padding-left: ${depth * 14}px`}>
      <div class="tree-item" hx-get={`/htmx/tree/${node.id}`} hx-swap="outerHTML">
        {node.title}
      </div>
      {node.children && (
        <ul>{node.children.map(child => <SeriesNode node={child} depth={depth + 1} />)}</ul>
      )}
    </li>
  );
}
```

D1 使用递归 CTE 查询完整树：

```sql
WITH RECURSIVE tree AS (
  SELECT * FROM series WHERE parent_id IS NULL AND user_id = ?
  UNION ALL
  SELECT s.* FROM series s JOIN tree t ON s.parent_id = t.id
)
SELECT * FROM tree ORDER BY sort_order;
```

### 6.4 统计聚合

写作热力图通过 `writing_logs` 表按日期分组聚合，在 `/stats` 路由中一次性查询近 365 天数据，在服务端渲染为 SVG 热力图格子，无需客户端 JS 计算。

### 6.5 Markdown 编辑器客户端

编辑器页面通过 CDN 加载 CodeMirror 6 和 marked.js，Alpine.js 管理编辑/预览/双栏状态切换，实时渲染预览面板。编辑器状态（内容）通过 htmx 自动提交到 Worker，完全无需自定义 fetch 代码。

---

## 七、Cloudflare 配置

### wrangler.toml

```toml
name = "fkcoding-note"
main = "src/index.ts"
compatibility_date = "2024-01-01"
compatibility_flags = ["nodejs_compat"]

[[d1_databases]]
binding = "DB"
database_name = "fkcoding-note-db"
database_id = "your-d1-database-id"

[[kv_namespaces]]
binding = "KV"
id = "your-kv-namespace-id"

[assets]
directory = "./src/assets"
binding = "ASSETS"
```

### 环境变量（wrangler secret）

```bash
wrangler secret put AUTH_SECRET      # 密码哈希盐值
wrangler secret put ADMIN_USERNAME   # 初始管理员账号
```

---

## 八、CI/CD 流程

```yaml
# .github/workflows/deploy.yml
name: Deploy to Cloudflare Workers

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
      - run: npm ci
      - run: npx wrangler d1 migrations apply fkcoding-note-db --remote
        env:
          CLOUDFLARE_API_TOKEN: ${{ secrets.CF_API_TOKEN }}
      - run: npx wrangler deploy
        env:
          CLOUDFLARE_API_TOKEN: ${{ secrets.CF_API_TOKEN }}
```

---

## 九、Cloudflare 免费套餐限制与应对

| 资源 | 免费限额 | 预估用量 | 应对策略 |
|------|----------|----------|----------|
| Workers 请求 | 10万/天 | ~1000/天（个人用） | 完全足够，无需优化 |
| Workers CPU | 10ms/请求 | ~3ms（SSR） | Hono.js 极轻量，无压力 |
| D1 读操作 | 500万行/天 | ~5000行/天 | 完全足够 |
| D1 写操作 | 10万行/天 | ~500行/天 | 完全足够 |
| D1 存储 | 500MB | ~50MB（文本） | 足够数年使用 |
| KV 读 | 10万/天 | ~2000/天 | 完全足够 |
| KV 写 | 1000/天 | ~100/天 | 完全足够 |
| KV 存储 | 1GB | ~1MB（Session） | 完全足够 |

---

## 十、本地开发

```bash
# 安装依赖
npm install

# 初始化本地 D1 数据库
npx wrangler d1 create fkcoding-note-db
npx wrangler d1 migrations apply fkcoding-note-db

# 本地开发（模拟 D1 + KV）
npx wrangler dev

# 生成 Drizzle 迁移
npx drizzle-kit generate

# 部署到 Cloudflare
npx wrangler deploy
```

---

## 十一、package.json 关键依赖

```json
{
  "dependencies": {
    "hono": "^4.4.0",
    "drizzle-orm": "^0.31.0",
    "nanoid": "^5.0.0"
  },
  "devDependencies": {
    "wrangler": "^3.60.0",
    "drizzle-kit": "^0.22.0",
    "@cloudflare/workers-types": "^4.0.0",
    "typescript": "^5.4.0"
  }
}
```

客户端库均通过 CDN 在 HTML 模板中引入（不打包进 Worker）：

```html
<!-- 仅在需要编辑器的页面引入 -->
<script src="https://cdn.jsdelivr.net/npm/alpinejs@3/dist/cdn.min.js" defer></script>
<script src="https://unpkg.com/htmx.org@1.9.12/dist/htmx.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/marked/marked.min.js"></script>
```

---

## 十二、架构总结

```
浏览器
  │  HTTP 请求
  ▼
Cloudflare Edge Network（全球 CDN）
  │
  ▼
Cloudflare Worker（Hono.js 单体应用）
  ├── 路由匹配
  ├── Session 验证（读 KV）
  ├── 数据查询（Drizzle → D1）
  ├── 业务逻辑处理
  └── JSX 渲染 → 返回完整 HTML（或 htmx 片段）
        │
        ├── 静态资源（CSS/JS）← Worker Assets 直接 serve
        └── 客户端增强：Alpine.js + htmx + CodeMirror（CDN）
```

整个应用是一个 **Hono.js Worker**，无构建步骤（除 TypeScript 编译），无 API 层，无客户端 bundle，从代码到上线只需 `wrangler deploy` 一条命令。
