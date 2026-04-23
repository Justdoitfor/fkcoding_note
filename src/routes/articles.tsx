import { Hono } from 'hono';
import { Layout } from '../components/Layout';
import { html } from 'hono/html';
import { drizzle } from 'drizzle-orm/d1';
import { articles } from '../db/schema';
import { nanoid } from 'nanoid';
import { eq } from 'drizzle-orm';

const articlesApp = new Hono<{ Bindings: { DB: D1Database }; Variables: { userId: string } }>();

articlesApp.get('/new', async (c) => {
  // 生成一个新的文章 ID 预占位
  const newArticleId = nanoid();

  return c.html(
    <Layout title="编辑器" current="editor">
      <div id="page-editor" style={{ height: 'calc(100vh - var(--topbar-h))' }}>
        <div class="editor-shell" style={{ height: '100%' }}>
          {/* Left tree */}
          <div class="etree">
            <div class="etree-head">
              <div class="etree-series-name">无系列 (草稿)</div>
            </div>
            <div class="etree-body">
              <div class="et-item et-gc active">
                <div class="et-dot"></div>
                新文章
              </div>
            </div>
          </div>

          {/* Editor main */}
          <div class="editor-main">
            <div class="editor-topbar">
              <div class="editor-doc-name">新文章</div>
              <div class="status-saved" id="save-status"><div class="status-dot"></div>尚未保存</div>
              <button class="btn btn-primary" style={{ fontSize: '11px', padding: '4px 10px' }} hx-post={`/articles/${newArticleId}/publish`} hx-swap="none">发布</button>
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
                <textarea class="ed-textarea" spellcheck={false} id="md-input" name="content" x-data="{ content: '# 新文章\\n\\n开始你的创作...' }" x-model="content" hx-put={`/articles/${newArticleId}`} hx-trigger="keyup changed delay:1500ms" hx-target="#save-status" hx-swap="innerHTML"></textarea>
              </div>
              <div class="prev-pane" id="ed-preview">
                <div class="pane-label">预览</div>
                <div class="prev-body" id="preview-content">
                  <h1>新文章</h1>
                  <p>开始你的创作...</p>
                </div>
              </div>
            </div>
          </div>

          {/* Meta panel */}
          <div class="meta-pane">
            <div class="meta-sec">
              <div class="meta-lbl">状态</div>
              <div class="meta-val" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><div class="status-dot"></div>草稿</div>
            </div>
            <div class="meta-sec">
              <div class="meta-lbl">字数</div>
              <div class="meta-num">0</div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
});

// htmx 接口：自动保存文章
articlesApp.put('/:id', async (c) => {
  const db = drizzle(c.env.DB);
  const userId = c.get('userId');
  const articleId = c.req.param('id');
  const body = await c.req.parseBody();
  const content = body.content as string || '';

  // 简单的提取标题和字数
  const titleMatch = content.match(/^#\s+(.*)/m);
  const title = titleMatch ? titleMatch[1].trim() : '无标题文章';
  const wordCount = content.replace(/\s+/g, '').length;

  const existing = await db.select().from(articles).where(eq(articles.id, articleId)).get();

  if (existing) {
    // 更新
    await db.update(articles)
      .set({ content, title, wordCount, updatedAt: Date.now() })
      .where(eq(articles.id, articleId));
  } else {
    // 插入新文章
    await db.insert(articles).values({
      id: articleId,
      userId,
      title,
      content,
      wordCount,
      createdAt: Date.now(),
      updatedAt: Date.now()
    });
  }

  const timeStr = new Date().toLocaleTimeString('zh-CN', { hour12: false });
  return c.html(`<div class="status-dot"></div>已保存于 ${timeStr}`);
});

// htmx 接口：发布文章
articlesApp.post('/:id/publish', async (c) => {
  const db = drizzle(c.env.DB);
  const articleId = c.req.param('id');
  
  await db.update(articles)
    .set({ status: 'published', publishedAt: Date.now() })
    .where(eq(articles.id, articleId));
    
  return c.text('Published');
});

export default articlesApp;
