import { Hono } from 'hono';
import { setCookie, deleteCookie } from 'hono/cookie';
import { createSession, deleteSession } from '../lib/session';
import { drizzle } from 'drizzle-orm/d1';
import { users } from '../db/schema';
import { eq } from 'drizzle-orm';

const auth = new Hono<{ Bindings: { KV: KVNamespace; DB: D1Database } }>();

auth.get('/login', (c) => {
  return c.html(`
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <title>Login - fkcoding-note</title>
  <link rel="stylesheet" href="/assets/app.css">
  <style>
    body { display: flex; align-items: center; justify-content: center; height: 100vh; background: var(--bg); }
    .login-box { background: var(--surface); padding: 30px; border-radius: var(--radius-lg); box-shadow: var(--shadow-md); width: 320px; }
    .login-title { font-size: 20px; font-weight: 500; margin-bottom: 20px; text-align: center; }
    .login-input { width: 100%; padding: 10px; margin-bottom: 15px; border: 1px solid var(--border2); border-radius: var(--radius); }
    .login-btn { width: 100%; padding: 10px; background: var(--text); color: #fff; border: none; border-radius: var(--radius); cursor: pointer; }
  </style>
</head>
<body>
  <form class="login-box" method="POST" action="/login">
    <div class="login-title">fkcoding-note</div>
    <input type="text" name="username" class="login-input" placeholder="Username" required>
    <input type="password" name="password" class="login-input" placeholder="Password" required>
    <button type="submit" class="login-btn">Login</button>
  </form>
</body>
</html>
  `);
});

auth.post('/login', async (c) => {
  const body = await c.req.parseBody();
  // Simplified auth for MVP, in real app check against DB
  if (body.username === 'admin' && body.password === 'admin') {
    try {
      const db = drizzle(c.env.DB);
      const existingUser = await db.select().from(users).where(eq(users.id, 'admin-id')).get();
      if (!existingUser) {
        await db.insert(users).values({
          id: 'admin-id',
          username: 'admin',
          passwordHash: 'admin',
          createdAt: Date.now(),
        });
      }
      const sessionId = await createSession(c.env.KV, 'admin-id');
      const isHttps = new URL(c.req.url).protocol === 'https:';
      setCookie(c, 'session', sessionId, { httpOnly: true, secure: isHttps, sameSite: 'Strict' });
      return c.redirect('/dashboard');
    } catch (err) {
      console.error("Login error:", err);
      return c.text("Server Error: please check Cloudflare Pages Settings -> Bindings and ensure both 'KV' and 'DB' are bound, and D1 migrations have been applied.", 500);
    }
  }
  return c.redirect('/login?error=1');
});

auth.post('/logout', async (c) => {
  // @ts-ignore
  const sessionId = c.req.cookie('session');
  if (sessionId) {
    await deleteSession(c.env.KV, sessionId);
    deleteCookie(c, 'session');
  }
  return c.redirect('/login');
});

export default auth;
