import { Hono } from 'hono';
import dashboard from './routes/dashboard';
import series from './routes/series';
import articles from './routes/articles';
import stats from './routes/stats';
import auth from './routes/auth';
import notes from './routes/notes';
import htmx from './routes/htmx';
import { authMiddleware } from './middleware/auth';

type Bindings = {
  DB: D1Database;
  KV: KVNamespace;
};

type Variables = {
  userId: string;
};

const app = new Hono<{ Bindings: Bindings; Variables: Variables }>();

// 在 Cloudflare Pages 环境中，静态文件请求不应该被路由捕获
// 如果没有静态文件，才执行后续的 API / SSR 路由逻辑
// 这一行在 Pages 环境下通常不需要，因为 Cloudflare Pages 会在 Worker 前置拦截静态资源，但为了防止意外拦截：

// Auth Routes
app.route('/', auth);

// Redirect root to dashboard
app.get('/', (c) => c.redirect('/dashboard'));

// Emergency Database Init Route
app.get('/init', async (c) => {
  const statements = [
    `CREATE TABLE IF NOT EXISTS \`article_history\` (\`id\` text PRIMARY KEY NOT NULL, \`article_id\` text, \`content\` text NOT NULL, \`saved_at\` integer NOT NULL);`,
    `CREATE TABLE IF NOT EXISTS \`article_tags\` (\`article_id\` text, \`tag_id\` text);`,
    `CREATE TABLE IF NOT EXISTS \`articles\` (\`id\` text PRIMARY KEY NOT NULL, \`user_id\` text NOT NULL, \`series_id\` text, \`title\` text NOT NULL, \`content\` text DEFAULT '' NOT NULL, \`summary\` text, \`status\` text DEFAULT 'draft' NOT NULL, \`sort_order\` integer DEFAULT 0, \`word_count\` integer DEFAULT 0, \`reading_minutes\` integer DEFAULT 0, \`created_at\` integer NOT NULL, \`updated_at\` integer NOT NULL, \`published_at\` integer);`,
    `CREATE TABLE IF NOT EXISTS \`notes\` (\`id\` text PRIMARY KEY NOT NULL, \`user_id\` text NOT NULL, \`content\` text NOT NULL, \`created_at\` integer NOT NULL, \`updated_at\` integer NOT NULL);`,
    `CREATE TABLE IF NOT EXISTS \`series\` (\`id\` text PRIMARY KEY NOT NULL, \`user_id\` text NOT NULL, \`parent_id\` text, \`title\` text NOT NULL, \`description\` text, \`icon\` text, \`sort_order\` integer DEFAULT 0, \`created_at\` integer NOT NULL, \`updated_at\` integer NOT NULL);`,
    `CREATE TABLE IF NOT EXISTS \`tags\` (\`id\` text PRIMARY KEY NOT NULL, \`user_id\` text NOT NULL, \`name\` text NOT NULL, \`color\` text DEFAULT 'gray');`,
    `CREATE TABLE IF NOT EXISTS \`users\` (\`id\` text PRIMARY KEY NOT NULL, \`username\` text NOT NULL, \`password_hash\` text NOT NULL, \`created_at\` integer NOT NULL);`,
    `CREATE TABLE IF NOT EXISTS \`writing_logs\` (\`id\` text PRIMARY KEY NOT NULL, \`user_id\` text NOT NULL, \`date\` text NOT NULL, \`article_count\` integer DEFAULT 0, \`word_count\` integer DEFAULT 0);`
  ];
  
  try {
    for (const stmt of statements) {
      await c.env.DB.prepare(stmt).run();
    }
    return c.text('Database tables initialized successfully!');
  } catch (err: any) {
    return c.text('Init failed: ' + err.message, 500);
  }
});

app.use('/dashboard/*', authMiddleware);
app.use('/series/*', authMiddleware);
app.use('/articles/*', authMiddleware);
app.use('/stats/*', authMiddleware);
app.use('/notes/*', authMiddleware);
app.use('/htmx/*', authMiddleware);

// Mount Routes
app.route('/dashboard', dashboard);
app.route('/series', series);
app.route('/articles', articles);
app.route('/stats', stats);
app.route('/notes', notes);
app.route('/htmx', htmx);

export default app;
