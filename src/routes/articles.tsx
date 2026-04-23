import { Hono } from 'hono';
import { Layout } from '../components/Layout';
import { html } from 'hono/html';
import { drizzle } from 'drizzle-orm/d1';
import { articles as articlesTable, series as seriesTable } from '../db/schema';
import { eq, desc, asc } from 'drizzle-orm';
import { nanoid } from 'nanoid';

const articles = new Hono<{ Bindings: { DB: D1Database }; Variables: { userId: string } }>();

articles.get('/new', async (c) => {
  const db = drizzle(c.env.DB);
  const userId = c.get('userId');
  const id = nanoid();
  const now = Math.floor(Date.now() / 1000);

  await db.insert(articlesTable).values({
    id,
    userId,
    title: '无标题文章',
    content: '# 无标题文章\n\n开始你的创作...',
    status: 'draft',
    createdAt: now,
    updatedAt: now,
  });

  return c.redirect(`/articles/edit/${id}`);
});

articles.get('/:id', async (c) => {
  const db = drizzle(c.env.DB);
  const userId = c.get('userId');
  const id = c.req.param('id');
  const article = await db.select().from(articlesTable).where(eq(articlesTable.id, id)).get();

  if (!article) return c.text('Not Found', 404);

  return c.html(
    <Layout title={article.title} current="editor">
      <div id="page-reader" style={{ display: 'flex', height: 'calc(100vh - var(--topbar-h))', background: 'var(--surface)' }}>
        <div class="prev-body" style={{ flex: 1, overflowY: 'auto', padding: '40px', maxWidth: '800px', margin: '0 auto' }}>
          <div style={{ marginBottom: '20px', borderBottom: '1px solid var(--border)', paddingBottom: '20px' }}>
            <h1 style={{ fontSize: '28px', marginBottom: '10px' }}>{article.title}</h1>
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center', color: 'var(--text3)', fontSize: '13px' }}>
              <a href={`/articles/edit/${article.id}`} class="btn btn-sm" style={{ padding: '4px 12px', border: '1px solid var(--border)', textDecoration: 'none' }}>进入编辑模式</a>
              <span>最后更新：{new Date(article.updatedAt * 1000).toLocaleString('zh-CN')}</span>
            </div>
          </div>
          <div 
            id="reader-content"
            x-data={`{ content: ${JSON.stringify(article.content)} }`}
            x-init="setTimeout(() => { if(window.marked) document.getElementById('reader-content').innerHTML = marked.parse(content); }, 50);"
          >
            加载中...
          </div>
        </div>
      </div>
    </Layout>
  );
});

articles.get('/edit/:id', async (c) => {
  const db = drizzle(c.env.DB);
  const userId = c.get('userId');
  const id = c.req.param('id');

  const article = await db.select().from(articlesTable).where(eq(articlesTable.id, id)).get();
  if (!article) return c.text('Not Found', 404);

  const allSeries = await db.select().from(seriesTable).where(eq(seriesTable.userId, userId)).orderBy(asc(seriesTable.sortOrder));
  const allArticles = await db.select().from(articlesTable).where(eq(articlesTable.userId, userId)).orderBy(desc(articlesTable.updatedAt));

  return c.html(
    <Layout title="编辑器" current="editor">
      <div id="page-editor" style={{ height: 'calc(100vh - var(--topbar-h))' }}>
        <div class="editor-shell" style={{ height: '100%' }}>
          {/* Left tree */}
          <div class="etree">
            <div class="etree-head">
              <div class="etree-series-name">全部内容</div>
            </div>
            <div class="etree-body" style={{ padding: '10px', fontSize: '11px', color: 'var(--text3)' }}>
              请在左侧主菜单使用“教程系列”管理分类
            </div>
          </div>

          {/* Editor main */}
          <div class="editor-main">
            <div class="editor-topbar">
              <input 
                class="editor-doc-name" 
                value={article.title}
                style={{ background: 'transparent', border: 'none', color: 'inherit', fontSize: 'inherit', fontWeight: 'inherit', flex: 1, outline: 'none' }}
                hx-put={`/articles/${article.id}/title`}
                hx-trigger="keyup changed delay:1s"
                name="title"
              />
              <div class="status-saved" id="save-status"><div class="status-dot"></div>已加载</div>
              <a href={`/articles/${article.id}`} class="btn btn-sm" style={{ padding: '4px 10px', textDecoration: 'none' }}>退出编辑</a>
              <button class="btn btn-sm" style={{ padding: '4px 10px' }} onclick="document.getElementById('page-editor').requestFullscreen()">全屏</button>
              <button class="btn btn-primary btn-sm" style={{ padding: '4px 10px' }} onclick="openPublishModal()">发布</button>
            </div>

            <div class="editor-tabs">
              <div class="etab active" onclick="switchEditorMode('edit',this)">编辑</div>
              <div class="etab" onclick="switchEditorMode('preview',this)">预览</div>
              <div class="etab" onclick="switchEditorMode('split',this)">双栏</div>
            </div>

            <div class="toolbar">
              <select class="tb-sel">
                <option>正文</option>
                <option>标题 1</option>
              </select>
              <div class="tb-sep"></div>
              <button class="tb on" title="加粗"><b>B</b></button>
              <button class="tb" title="斜体"><i>I</i></button>
              <button class="tb" title="删除线"><s>S</s></button>
              <button class="tb" title="行内代码" style={{ fontFamily: 'var(--font-mono)', fontSize: '11px' }}>`</button>
            </div>

            {/* Split editor */}
            <div class="editor-split" id="editor-area">
              <div class="ed-pane" id="ed-write">
                <div class="pane-label">Markdown</div>
                <textarea 
                  class="ed-textarea" 
                  spellcheck={false} 
                  id="md-input" 
                  name="content"
                  x-data={`{ content: ${JSON.stringify(article.content).replace(/</g, '\\u003c')} }`} 
                  x-model="content" 
                  hx-put={`/articles/${article.id}`} 
                  hx-trigger="keyup changed delay:1500ms"
                  hx-target="#save-status"
                  hx-swap="innerHTML"
                  oninput="if(window.updatePreview) window.updatePreview(this.value)"
                ></textarea>
              </div>
              <div class="prev-pane" id="ed-preview">
                <div class="pane-label">预览</div>
                <div class="prev-body" id="preview-content">
                </div>
              </div>
            </div>
            <script dangerouslySetInnerHTML={{__html: `
              setTimeout(() => {
                const mdInput = document.getElementById('md-input');
                if (mdInput && window.updatePreview) {
                  window.updatePreview(mdInput.value);
                }
              }, 100);
            `}}></script>
          </div>

          {/* Meta panel */}
          <div class="meta-pane">
            <div class="meta-sec">
              <div class="meta-lbl">状态</div>
              <div class="meta-val" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><div class="status-dot"></div>{article.status === 'draft' ? '草稿' : '已发布'}</div>
            </div>
            <div class="meta-sec">
              <div class="meta-lbl">所属系列</div>
              <div class="meta-link">{article.seriesId ? '已分类' : '未分类'}</div>
            </div>
            <div class="meta-sec">
              <div class="meta-lbl">目录</div>
              <div id="toc-container">
                <div style={{ color: 'var(--text3)', fontSize: '12px', padding: '4px 0' }}>暂无目录</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
});

articles.put('/:id', async (c) => {
  const db = drizzle(c.env.DB);
  const id = c.req.param('id');
  const body = await c.req.parseBody();
  
  const content = String(body.content || '');
  const wordCount = content.replace(/\\s+/g, '').length;
  
  await db.update(articlesTable)
    .set({ 
      content,
      wordCount,
      updatedAt: Math.floor(Date.now() / 1000)
    })
    .where(eq(articlesTable.id, id));
    
  const timeStr = new Date().toLocaleTimeString('zh-CN', { hour12: false });
  return c.html(`<div class="status-dot"></div>已保存于 ${timeStr}`);
});

articles.put('/:id/title', async (c) => {
  const db = drizzle(c.env.DB);
  const id = c.req.param('id');
  const body = await c.req.parseBody();
  
  await db.update(articlesTable)
    .set({ 
      title: String(body.title || '无标题'),
      updatedAt: Math.floor(Date.now() / 1000)
    })
    .where(eq(articlesTable.id, id));
    
  const timeStr = new Date().toLocaleTimeString('zh-CN', { hour12: false });
  return c.html(`<div class="status-dot"></div>已保存于 ${timeStr}`);
});

export default articles;
