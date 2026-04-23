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
