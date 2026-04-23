import { Hono } from 'hono';
import { Layout } from '../components/Layout';
import { html, raw } from 'hono/html';
import { drizzle } from 'drizzle-orm/d1';
import { series } from '../db/schema';
import { eq, isNull } from 'drizzle-orm';
import { nanoid } from 'nanoid';

const seriesApp = new Hono<{ Bindings: { DB: D1Database }; Variables: { userId: string } }>();

// 递归组件：渲染树状节点
const SeriesNode = (props: { node: any; depth: number }) => {
  const { node, depth } = props;
  const isFolder = node.children && node.children.length > 0;
  const icon = node.icon || (isFolder ? '📁' : '📄');
  const indentClass = depth === 0 ? 'root-row' : `ind${depth}`;
  const rowId = `s-${node.id}`;
  
  return html`
    <div class="stree-row ${indentClass}" onclick="toggleStree('${rowId}')" oncontextmenu="showCtx(event)">
      ${depth > 0 ? html`<span class="drag-handle">⠿</span>` : ''}
      ${isFolder || depth === 0 ? html`<svg class="strow-chev open" id="${rowId}-chev" viewBox="0 0 12 12" fill="none"><path d="M4 2l4 4-4 4" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/></svg>` : ''}
      <span class="strow-emoji" style="${depth > 0 ? 'font-size: 13px;' : ''}">${icon}</span>
      <div style="flex: 1">
        <div class="strow-title">${node.title}</div>
        ${node.description && depth === 0 ? html`<div class="strow-desc">${node.description}</div>` : ''}
      </div>
      <span class="strow-count">${isFolder ? node.children.length + ' 篇' : ''}</span>
      <div class="strow-acts">
        <button class="strow-act" title="新建子章节" onclick="event.stopPropagation();" hx-post="/series/${node.id}/child" hx-prompt="请输入子章节名称" hx-target="closest .stree-row" hx-swap="afterend">+</button>
        <button class="strow-act" title="编辑" onclick="event.stopPropagation();toast('编辑功能开发中','info')">✎</button>
        <button class="strow-act danger" title="删除" onclick="event.stopPropagation();openModal('deleteModal')">✕</button>
      </div>
    </div>
    ${isFolder ? html`<div id="${rowId}">${node.children.map((child: any) => SeriesNode({ node: child, depth: depth + 1 }))}</div>` : ''}
  `;
};

// 构建树结构的工具函数
function buildTree(items: any[], parentId: string | null = null): any[] {
  return items
    .filter(item => item.parentId === parentId)
    .sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0))
    .map(item => ({
      ...item,
      children: buildTree(items, item.id)
    }));
}

seriesApp.get('/', async (c) => {
  const db = drizzle(c.env.DB);
  const userId = c.get('userId');

  // 获取该用户所有的系列节点
  const allSeries = await db
    .select()
    .from(series)
    .where(eq(series.userId, userId));

  // 构建树状结构
  const tree = buildTree(allSeries, null);

  return c.html(
    <Layout title="教程系列" current="series">
      <div id="page-series" class="page">
        <div class="page-head" style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
          <div>
            <div class="page-title">教程系列</div>
            <div class="page-sub">{tree.length} 个顶级系列 · 树状层级管理</div>
          </div>
          <form hx-post="/series" hx-target="#series-tree-root" hx-swap="beforeend">
            <button class="btn btn-primary" type="button" onclick="const title = prompt('请输入新系列名称'); if(title) { const f = this.closest('form'); const i = document.createElement('input'); i.type='hidden'; i.name='title'; i.value=title; f.appendChild(i); f.requestSubmit(); }">
              <svg width="11" height="11" viewBox="0 0 12 12" fill="none"><path d="M6 1v10M1 6h10" stroke="white" stroke-width="1.5" stroke-linecap="round"/></svg>
              新建系列
            </button>
          </form>
        </div>

        <div class="series-tree-wrap">
          <div class="stree-block" id="series-tree-root">
            {tree.length === 0 ? <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text3)', fontSize: '13px' }}>还没有创建任何系列，点击右上角新建一个吧！</div> : null}
            {tree.map(node => SeriesNode({ node, depth: 0 }))}
          </div>
        </div>
      </div>
    </Layout>
  );
});

// htmx 接口：获取 Modal 里的系列列表
seriesApp.get('/modal-list', async (c) => {
  const db = drizzle(c.env.DB);
  const userId = c.get('userId');
  const allSeries = await db.select().from(series).where(eq(series.userId, userId));
  const tree = buildTree(allSeries, null);

  const renderModalNode = (node: any, depth: number): string => {
    const indent = depth === 0 ? '' : ` ind${depth}`;
    const paddingLeft = depth === 0 ? '12px' : `${12 + depth * 14}px`;
    const icon = node.icon || (node.children && node.children.length > 0 ? '📁' : '📄');
    
    let htmlStr = `<div class="stree-row${indent}" style="padding:9px 12px 9px ${paddingLeft};cursor:pointer" onclick="moveArticle('${node.id}')">`;
    if (depth === 0) {
      htmlStr += `<span style="font-size:14px;margin-right:6px">${icon}</span> ${node.title}</div>`;
    } else {
      htmlStr += `${icon} ${node.title}</div>`;
    }

    if (node.children) {
      for (const child of node.children) {
        htmlStr += renderModalNode(child, depth + 1);
      }
    }
    return htmlStr;
  };

  let listHtml = '';
  for (const node of tree) {
    listHtml += renderModalNode(node, 0);
  }

  return c.html(html`
    <div style="padding:0 10px 6px;font-size:11px;color:var(--t3)">选择目标系列/章节</div>
    <div style="border:1px solid var(--border);border-radius:7px;overflow:hidden;margin:0 6px">
      <div class="stree-row" style="padding:10px 12px;cursor:pointer" onclick="moveArticle('')">取消分类 (移出系列)</div>
      ${raw(listHtml)}
    </div>
  `);
});

// htmx 接口：创建顶级系列
seriesApp.post('/', async (c) => {
  const db = drizzle(c.env.DB);
  const userId = c.get('userId');
  const body = await c.req.parseBody();
  const title = body.title as string;

  if (!title) return c.text('Title is required', 400);

  const newSeries = {
    id: nanoid(),
    userId,
    parentId: null,
    title,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };

  await db.insert(series).values(newSeries);

  return c.html(SeriesNode({ node: newSeries, depth: 0 }));
});

// htmx 接口：创建子节点
seriesApp.post('/:parentId/child', async (c) => {
  const db = drizzle(c.env.DB);
  const userId = c.get('userId');
  const parentId = c.req.param('parentId');
  const title = c.req.header('HX-Prompt'); // 从 htmx 的 prompt 输入中获取

  if (!title) return c.text('Title is required', 400);

  // 简单计算一下深度的逻辑（实际应用中可能需要查库获取 parent 的 depth）
  // 这里暂时统一作为 depth 1 渲染返回，页面刷新后会由递归函数计算准确深度
  const newSeries = {
    id: nanoid(),
    userId,
    parentId,
    title,
    icon: '📄', // 默认子节点图标
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };

  await db.insert(series).values(newSeries);

  // 返回触发页面刷新，以重新渲染完整的树状结构
  c.header('HX-Refresh', 'true');
  return c.text('Created');
});

export default seriesApp;
