import { Hono } from 'hono';
import { Layout } from '../components/Layout';
import { html } from 'hono/html';
import { drizzle } from 'drizzle-orm/d1';
import { articles, series } from '../db/schema';
import { nanoid } from 'nanoid';
import { eq } from 'drizzle-orm';

const articlesApp = new Hono<{ Bindings: { DB: D1Database }; Variables: { userId: string } }>();

// 递归组件：渲染编辑器左侧简单的系列与文章树
const EditorTree = (props: { allSeries: any[]; allArticles: any[]; parentId: string | null; depth: number; activeArticleId?: string }) => {
  const { allSeries, allArticles, parentId, depth, activeArticleId } = props;
  
  const currentSeries = allSeries
    .filter(s => s.parentId === parentId)
    .sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));
    
  return html`
    ${currentSeries.map(s => html`
      <div class="et-item ${depth === 0 ? 'et-ch' : 'et-gc'}" onclick="this.nextElementSibling.style.display = this.nextElementSibling.style.display === 'none' ? 'block' : 'none'">
        <svg class="et-icon" viewBox="0 0 10 10" fill="none" style="transform: rotate(90deg);"><path d="M2 4l3 3 3-3" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/></svg>
        ${s.title}
      </div>
      <div>
        ${allArticles.filter(a => a.seriesId === s.id).map(a => html`
          <a href="/articles/edit/${a.id}" style="text-decoration:none">
            <div class="et-item et-gc ${a.id === activeArticleId ? 'active' : ''}" style="padding-left: ${26 + depth * 10}px">
              <div class="et-dot"></div>
              ${a.title}
            </div>
          </a>
        `)}
        ${EditorTree({ allSeries, allArticles, parentId: s.id, depth: depth + 1, activeArticleId })}
      </div>
    `)}
  `;
};

articlesApp.get('/new', async (c) => {
  const db = drizzle(c.env.DB);
  const userId = c.get('userId');
  
  // 生成一个新的文章 ID 预占位
  const newArticleId = nanoid();
  
  const allSeries = await db.select().from(series).where(eq(series.userId, userId));
  const allArticles = await db.select().from(articles).where(eq(articles.userId, userId));
  const draftArticles = allArticles.filter(a => !a.seriesId);

  return c.html(
    <Layout title="编辑器" current="editor">
      <div id="page-editor" class="page" style={{ height: 'calc(100vh - var(--topbar-h))', padding: '0' }}>
        <div class="editor-shell" style={{ height: '100%' }}>
          {/* Left tree */}
          <div class="etree">
            <div class="etree-head">
              <div class="etree-series-name">全部内容</div>
            </div>
            <div class="etree-body">
              ${EditorTree({ allSeries, allArticles, parentId: null, depth: 0, activeArticleId: newArticleId })}
              
              <div class="et-item et-ch" style="margin-top:10px">
                <svg class="et-icon" viewBox="0 0 10 10" fill="none"><path d="M2 4l3 3 3-3" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/></svg>
                未分类草稿
              </div>
              <div>
                <div class="et-item et-gc active">
                  <div class="et-dot"></div>
                  新文章
                </div>
                ${draftArticles.map(a => html`
                  <a href="/articles/edit/${a.id}" style="text-decoration:none">
                    <div class="et-item et-gc">
                      <div class="et-dot"></div>
                      ${a.title}
                    </div>
                  </a>
                `)}
              </div>
            </div>
          </div>

          {/* Editor main */}
          <div class="editor-main">
            <div class="editor-topbar">
              <div class="editor-doc-name" x-data="{ title: '新文章' }" x-text="document.getElementById('md-input') ? (document.getElementById('md-input').value.match(/^#\\s+(.*)/m) ? document.getElementById('md-input').value.match(/^#\\s+(.*)/m)[1] : '新文章') : '新文章'">新文章</div>
              <div class="status-saved" id="save-status"><div class="status-dot"></div>尚未保存</div>
              <button class="btn btn-primary" style={{ fontSize: '11px', padding: '4px 10px' }} hx-post={`/articles/${newArticleId}/publish`} hx-swap="none">发布</button>
            </div>

            <div class="editor-tabs">
              <div class="etab active" onclick="switchEditorMode('edit',this)">编辑</div>
              <div class="etab" onclick="switchEditorMode('preview',this)">预览</div>
              <div class="etab" onclick="switchEditorMode('split',this)">双栏</div>
            </div>

            <div class="toolbar">
              <select class="tb-sel" onchange="if(this.value){insertMarkdown(this.value); this.value=''}">
                <option value="">段落格式</option>
                <option value="# ">标题 1</option>
                <option value="## ">标题 2</option>
                <option value="### ">标题 3</option>
              </select>
              <div class="tb-sep"></div>
              <button class="tb" title="加粗" onclick="insertMarkdown('**', '**')"><b>B</b></button>
              <button class="tb" title="斜体" onclick="insertMarkdown('*', '*')"><i>I</i></button>
              <button class="tb" title="删除线" onclick="insertMarkdown('~~', '~~')"><s>S</s></button>
              <button class="tb" title="行内代码" style={{ fontFamily: 'var(--font-mono)', fontSize: '11px' }} onclick="insertMarkdown('`', '`')">`</button>
              <div class="tb-sep"></div>
              <button class="tb" title="链接" onclick="insertMarkdown('[', '](url)')">
                <svg width="13" height="13" viewBox="0 0 13 13" fill="none"><path d="M5 8.5l3-3" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/><path d="M3.5 6l-1 1a2.5 2.5 0 003.5 3.5l1-1" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/><path d="M6.5 7l1-1a2.5 2.5 0 00-3.5-3.5l-1 1" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/></svg>
              </button>
              <button class="tb" title="图片" onclick="insertMarkdown('![', '](image-url)')">
                <svg width="13" height="13" viewBox="0 0 13 13" fill="none"><rect x="1.5" y="2.5" width="10" height="8" rx="1.5" stroke="currentColor" stroke-width="1.2"/><circle cx="4.5" cy="5.5" r="1" fill="currentColor"/><path d="M1.5 8.5l3-3 2.5 2.5 2-1.5 2 2.5" stroke="currentColor" stroke-width="1.1" stroke-linecap="round" stroke-linejoin="round"/></svg>
              </button>
              <div class="tb-sep"></div>
              <button class="tb" title="无序列表" onclick="insertMarkdown('- ')">
                <svg width="13" height="13" viewBox="0 0 13 13" fill="currentColor"><circle cx="2.5" cy="4" r="1"/><circle cx="2.5" cy="7" r="1"/><circle cx="2.5" cy="10" r="1"/><rect x="5" y="3.25" width="6.5" height="1.5" rx="0.75"/><rect x="5" y="6.25" width="5" height="1.5" rx="0.75"/><rect x="5" y="9.25" width="6" height="1.5" rx="0.75"/></svg>
              </button>
              <button class="tb" title="代码块" style={{ fontSize: '10px', fontFamily: 'var(--font-mono)' }} onclick="insertMarkdown('\n```\n', '\n```\n')">&lt;/&gt;</button>
              <button class="tb" title="引用" onclick="insertMarkdown('> ')">
                <svg width="13" height="13" viewBox="0 0 13 13" fill="currentColor"><rect x="1.5" y="2.5" width="2" height="8" rx="1"/><rect x="4.5" y="4" width="7.5" height="1.4" rx="0.7"/><rect x="4.5" y="6.8" width="6" height="1.4" rx="0.7"/></svg>
              </button>
            </div>

            {/* Split editor */}
            <div class="editor-split" id="editor-area">
              <div class="ed-pane" id="ed-write" style={{ flex: '1' }}>
                <div class="pane-label">Markdown</div>
                <textarea class="ed-textarea" spellcheck={false} id="md-input" name="content" x-data="{ content: '# 新文章\\n\\n开始你的创作...' }" x-model="content" hx-put={`/articles/${newArticleId}`} hx-trigger="keyup changed delay:1500ms" hx-target="#save-status" hx-swap="innerHTML" oninput="updatePreview(this.value)"></textarea>
              </div>
              <div class="prev-pane" id="ed-preview" style={{ flex: '0', display: 'none' }}>
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
              <div class="meta-lbl">标签</div>
              <div class="meta-tag-wrap">
                <span class="meta-tag meta-add">+ 添加</span>
              </div>
            </div>
            <div class="meta-sec">
              <div class="meta-lbl">字数</div>
              <div class="meta-num" id="meta-word-count">0</div>
            </div>
            <div class="meta-sec">
              <div class="meta-lbl">阅读时间</div>
              <div class="meta-num" id="meta-read-time">约 0 分钟</div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
});

// 编辑已有文章
articlesApp.get('/edit/:id', async (c) => {
  const db = drizzle(c.env.DB);
  const userId = c.get('userId');
  const articleId = c.req.param('id');

  const article = await db.select().from(articles).where(eq(articles.id, articleId)).get();
  
  if (!article || article.userId !== userId) {
    return c.text('Article not found or unauthorized', 404);
  }

  const allSeries = await db.select().from(series).where(eq(series.userId, userId));
  const allArticles = await db.select().from(articles).where(eq(articles.userId, userId));
  const draftArticles = allArticles.filter(a => !a.seriesId);

  return c.html(
    <Layout title="编辑文章" current="editor">
      <div id="page-editor" class="page" style={{ height: 'calc(100vh - var(--topbar-h))', padding: '0' }}>
        <div class="editor-shell" style={{ height: '100%' }}>
          {/* Left tree */}
          <div class="etree">
            <div class="etree-head">
              <div class="etree-series-name">全部内容</div>
            </div>
            <div class="etree-body">
              ${EditorTree({ allSeries, allArticles, parentId: null, depth: 0, activeArticleId: articleId })}
              
              <div class="et-item et-ch" style="margin-top:10px">
                <svg class="et-icon" viewBox="0 0 10 10" fill="none"><path d="M2 4l3 3 3-3" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/></svg>
                未分类草稿
              </div>
              <div>
                ${draftArticles.map(a => html`
                  <a href="/articles/edit/${a.id}" style="text-decoration:none">
                    <div class="et-item et-gc ${a.id === articleId ? 'active' : ''}">
                      <div class="et-dot"></div>
                      ${a.title}
                    </div>
                  </a>
                `)}
              </div>
            </div>
          </div>

          {/* Editor main */}
          <div class="editor-main">
            <div class="editor-topbar">
              <div class="editor-doc-name" x-data={`{ title: '${article.title.replace(/'/g, "\\'")}' }`} x-text="document.getElementById('md-input') ? (document.getElementById('md-input').value.match(/^#\\s+(.*)/m) ? document.getElementById('md-input').value.match(/^#\\s+(.*)/m)[1] : title) : title">{article.title}</div>
              <div class="status-saved" id="save-status"><div class="status-dot"></div>已保存</div>
              <button class="btn btn-primary" style={{ fontSize: '11px', padding: '4px 10px' }} hx-post={`/articles/${articleId}/publish`} hx-swap="none">发布</button>
            </div>

            <div class="editor-tabs">
              <div class="etab active" onclick="switchEditorMode('edit',this)">编辑</div>
              <div class="etab" onclick="switchEditorMode('preview',this)">预览</div>
              <div class="etab" onclick="switchEditorMode('split',this)">双栏</div>
            </div>

            <div class="toolbar">
              <select class="tb-sel" onchange="if(this.value){insertMarkdown(this.value); this.value=''}">
                <option value="">段落格式</option>
                <option value="# ">标题 1</option>
                <option value="## ">标题 2</option>
                <option value="### ">标题 3</option>
              </select>
              <div class="tb-sep"></div>
              <button class="tb" title="加粗" onclick="insertMarkdown('**', '**')"><b>B</b></button>
              <button class="tb" title="斜体" onclick="insertMarkdown('*', '*')"><i>I</i></button>
              <button class="tb" title="删除线" onclick="insertMarkdown('~~', '~~')"><s>S</s></button>
              <button class="tb" title="行内代码" style={{ fontFamily: 'var(--font-mono)', fontSize: '11px' }} onclick="insertMarkdown('`', '`')">`</button>
              <div class="tb-sep"></div>
              <button class="tb" title="链接" onclick="insertMarkdown('[', '](url)')">
                <svg width="13" height="13" viewBox="0 0 13 13" fill="none"><path d="M5 8.5l3-3" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/><path d="M3.5 6l-1 1a2.5 2.5 0 003.5 3.5l1-1" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/><path d="M6.5 7l1-1a2.5 2.5 0 00-3.5-3.5l-1 1" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/></svg>
              </button>
              <button class="tb" title="图片" onclick="insertMarkdown('![', '](image-url)')">
                <svg width="13" height="13" viewBox="0 0 13 13" fill="none"><rect x="1.5" y="2.5" width="10" height="8" rx="1.5" stroke="currentColor" stroke-width="1.2"/><circle cx="4.5" cy="5.5" r="1" fill="currentColor"/><path d="M1.5 8.5l3-3 2.5 2.5 2-1.5 2 2.5" stroke="currentColor" stroke-width="1.1" stroke-linecap="round" stroke-linejoin="round"/></svg>
              </button>
              <div class="tb-sep"></div>
              <button class="tb" title="无序列表" onclick="insertMarkdown('- ')">
                <svg width="13" height="13" viewBox="0 0 13 13" fill="currentColor"><circle cx="2.5" cy="4" r="1"/><circle cx="2.5" cy="7" r="1"/><circle cx="2.5" cy="10" r="1"/><rect x="5" y="3.25" width="6.5" height="1.5" rx="0.75"/><rect x="5" y="6.25" width="5" height="1.5" rx="0.75"/><rect x="5" y="9.25" width="6" height="1.5" rx="0.75"/></svg>
              </button>
              <button class="tb" title="代码块" style={{ fontSize: '10px', fontFamily: 'var(--font-mono)' }} onclick="insertMarkdown('\n```\n', '\n```\n')">&lt;/&gt;</button>
              <button class="tb" title="引用" onclick="insertMarkdown('> ')">
                <svg width="13" height="13" viewBox="0 0 13 13" fill="currentColor"><rect x="1.5" y="2.5" width="2" height="8" rx="1"/><rect x="4.5" y="4" width="7.5" height="1.4" rx="0.7"/><rect x="4.5" y="6.8" width="6" height="1.4" rx="0.7"/></svg>
              </button>
            </div>

            {/* Split editor */}
            <div class="editor-split" id="editor-area">
              <div class="ed-pane" id="ed-write" style={{ flex: '1' }}>
                <div class="pane-label">Markdown</div>
                <textarea class="ed-textarea" spellcheck={false} id="md-input" name="content" x-data={`{ content: \`${article.content.replace(/`/g, '\\`')}\` }`} x-model="content" hx-put={`/articles/${article.id}`} hx-trigger="keyup changed delay:1500ms" hx-target="#save-status" hx-swap="innerHTML" oninput="updatePreview(this.value)"></textarea>
              </div>
              <div class="prev-pane" id="ed-preview" style={{ flex: '0', display: 'none' }}>
                <div class="pane-label">预览</div>
                <div class="prev-body" id="preview-content"></div>
              </div>
            </div>
          </div>

          {/* Meta panel */}
          <div class="meta-pane">
            <div class="meta-sec">
              <div class="meta-lbl">状态</div>
              <div class="meta-val" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div class="status-dot" style={article.status === 'published' ? 'background:var(--green)' : ''}></div>
                {article.status === 'published' ? '已发布' : '草稿'}
              </div>
            </div>
            <div class="meta-sec">
              <div class="meta-lbl">标签</div>
              <div class="meta-tag-wrap">
                <span class="meta-tag meta-add">+ 添加</span>
              </div>
            </div>
            <div class="meta-sec">
              <div class="meta-lbl">字数</div>
              <div class="meta-num" id="meta-word-count">{article.wordCount}</div>
            </div>
            <div class="meta-sec">
              <div class="meta-lbl">阅读时间</div>
              <div class="meta-num" id="meta-read-time">约 {Math.max(1, Math.ceil((article.wordCount || 0) / 300))} 分钟</div>
            </div>
            <div class="meta-sec">
              <div class="meta-lbl">修改时间</div>
              <div class="meta-val" style={{ fontSize: '11px', fontFamily: 'var(--font-mono)' }}>
                {new Date(article.updatedAt).toLocaleString('zh-CN')}
              </div>
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
