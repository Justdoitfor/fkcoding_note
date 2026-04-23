import { Hono } from 'hono';
import dashboard from './routes/dashboard';
import series from './routes/series';
import articles from './routes/articles';
import stats from './routes/stats';
import auth from './routes/auth';

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

// Mount Routes
app.route('/dashboard', dashboard);
app.route('/series', series);
app.route('/articles', articles);
app.route('/stats', stats);

export default app;
