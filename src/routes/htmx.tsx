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
  const activeArticleId = currentUrl.split('/').pop() || '';

  const allSeries = await db.select().from(series).where(eq(series.userId, userId));
  const allArticles = await db.select().from(articles).where(eq(articles.userId, userId));

  const tree = buildTree(allSeries, null);

  const renderNode = (node: any, depth: number) => {
    const nextId = `t-${node.id}`;
    const depthClass = `depth${clampDepth(depth)}`;
    const nodeArticles = allArticles.filter((a) => a.seriesId === node.id).sort((a,b) => (a.sortOrder || 0) - (b.sortOrder || 0));
    const hasChildren = (node.children && node.children.length > 0) || nodeArticles.length > 0;
    const icon = node.icon || (hasChildren ? '📁' : '📄');

    return html`
      <div class="tree-row ${depthClass}" onclick="toggleTree('${nextId}')">
        <svg class="tree-chev open" id="${nextId}-chev" viewBox="0 0 10 10" fill="none"><path d="M3 2l4 3-4 3" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/></svg>
        <span style="margin-right:4px">${icon}</span> <span style="flex:1;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${node.title}</span>
        <div class="tree-actions">
          <button class="tree-act" onclick="event.stopPropagation();window.location.href='/articles/new'" title="新建">+</button>
          <button class="tree-act" onclick="event.stopPropagation();toast('请在教程系列页面编辑','info')" title="编辑">✎</button>
        </div>
      </div>
      <div id="${nextId}" class="collapsible" style="max-height:${depth === 0 ? '500px' : '300px'}">
        ${node.children?.map((child: any) => renderNode(child, depth + 1))}
        ${nodeArticles.map(
            (a) => html`
              <a href="/articles/${a.id}" style="text-decoration:none">
                <div class="tree-row depth3 ${a.id === activeArticleId ? 'active' : ''}" oncontextmenu="showCtx(event, '${a.id}')">
                  <div class="tree-dot"></div> <span style="white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${a.title}</span>
                </div>
              </a>
            `,
          )}
      </div>
    `;
  };

  const unclassifiedArticles = allArticles.filter((a) => !a.seriesId).sort((a,b) => (a.sortOrder || 0) - (b.sortOrder || 0));

  return c.html(html`
    ${tree.map((node) => renderNode(node, 0))}
    
    ${unclassifiedArticles.length > 0 ? html`
      <div class="tree-row depth1" onclick="toggleTree('t-unclassified')">
        <svg class="tree-chev open" id="t-unclassified-chev" viewBox="0 0 10 10" fill="none"><path d="M3 2l4 3-4 3" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/></svg>
        <span style="margin-right:4px">📝</span> <span style="flex:1;color:var(--t3)">未分类草稿</span>
      </div>
      <div id="t-unclassified" class="collapsible" style="max-height:500px">
        ${unclassifiedArticles.map(
          (a) => html`
            <a href="/articles/${a.id}" style="text-decoration:none">
              <div class="tree-row depth2 ${a.id === activeArticleId ? 'active' : ''}" oncontextmenu="showCtx(event, '${a.id}')">
                <div class="tree-dot"></div> <span style="white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${a.title}</span>
              </div>
            </a>
          `,
        )}
      </div>
    ` : ''}
  `);
});

export default htmxApp;
