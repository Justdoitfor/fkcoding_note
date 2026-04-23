import { Hono } from 'hono';
import { drizzle } from 'drizzle-orm/d1';
import { and, eq } from 'drizzle-orm';
import { html } from 'hono/html';
import { articles, series } from '../db/schema';

const htmxApp = new Hono<{ Bindings: { DB: D1Database }; Variables: { userId: string } }>();

function buildTree(items: any[], parentId: string | null = null): any[] {
  return items
    .filter((item) => item.parentId === parentId)
    .sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0))
    .map((item) => ({ ...item, children: buildTree(items, item.id) }));
}

function clampDepth(depth: number) {
  if (depth <= 0) return 1;
  if (depth === 1) return 2;
  return 3;
}

htmxApp.get('/sidebar-tree', async (c) => {
  const db = drizzle(c.env.DB);
  const userId = c.get('userId');

  const currentUrl = c.req.header('HX-Current-URL') || '';
  const currentPath = (() => {
    try {
      return new URL(currentUrl).pathname;
    } catch {
      return '';
    }
  })();
  const activeArticleId = currentPath.startsWith('/articles/edit/') ? currentPath.split('/').pop() : undefined;

  const allSeries = await db.select().from(series).where(eq(series.userId, userId));
  const allArticles = await db.select().from(articles).where(eq(articles.userId, userId));

  const tree = buildTree(allSeries, null);

  const renderNode = (node: any, depth: number) => {
    const nextId = `t-${node.id}`;
    const depthClass = `depth${clampDepth(depth)}`;
    const hasChildren = (node.children && node.children.length > 0) || allArticles.some((a) => a.seriesId === node.id);
    const icon = node.icon || (hasChildren ? '📁' : '📄');

    return html`
      <div class="tree-row ${depthClass}" onclick="toggleTree('${nextId}')" oncontextmenu="showCtx(event)">
        <svg class="tree-chev open" id="${nextId}-chev" viewBox="0 0 10 10" fill="none"><path d="M3 2l4 3-4 3" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/></svg>
        ${icon} ${node.title}
        <div class="tree-actions">
          <button class="tree-act" onclick="event.stopPropagation();openModal('newArticleModal')" title="新建">+</button>
          <button class="tree-act" onclick="event.stopPropagation();toast('重命名…','info')" title="重命名">✎</button>
        </div>
      </div>
      <div id="${nextId}" class="collapsible" style="max-height:${depth === 0 ? '300px' : '200px'}">
        ${node.children?.map((child: any) => renderNode(child, depth + 1))}
        ${allArticles
          .filter((a) => a.seriesId === node.id)
          .map(
            (a) => html`
              <a href="/articles/edit/${a.id}" style="text-decoration:none">
                <div class="tree-row depth3 ${a.id === activeArticleId ? 'active' : ''}" oncontextmenu="showCtx(event)">
                  <div class="tree-dot"></div> ${a.title}
                </div>
              </a>
            `,
          )}
      </div>
    `;
  };

  return c.html(html`${tree.map((node) => renderNode(node, 0))}`);
});

export default htmxApp;
