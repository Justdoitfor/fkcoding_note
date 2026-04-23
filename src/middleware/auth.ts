import { Context, Next } from 'hono';
import { getCookie } from 'hono/cookie';
import { getSession } from '../lib/session';

export async function authMiddleware(c: Context, next: Next) {
  const sessionId = getCookie(c, 'session');
  if (!sessionId) {
    return c.redirect('/login');
  }
  
  try {
    // @ts-ignore
    const userId = await getSession(c.env.KV, sessionId);
    if (!userId) {
      return c.redirect('/login');
    }

    c.set('userId', userId);
    await next();
  } catch (err) {
    // If KV is not properly bound or errors out
    console.error("Auth middleware error:", err);
    return c.redirect('/login');
  }
}
