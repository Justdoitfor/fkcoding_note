import { Hono } from 'hono';
import { drizzle } from 'drizzle-orm/d1';
import { notes } from '../db/schema';
import { nanoid } from 'nanoid';

const notesApp = new Hono<{ Bindings: { DB: D1Database }; Variables: { userId: string } }>();

notesApp.post('/', async (c) => {
  const db = drizzle(c.env.DB);
  const userId = c.get('userId');
  const body = await c.req.parseBody();
  const content = (body.content as string) || '';

  if (!content.trim()) {
    return c.text('Content is required', 400);
  }

  await db.insert(notes).values({
    id: nanoid(),
    userId,
    content,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  });

  return c.text('Created');
});

export default notesApp;
