import { Hono } from 'hono';
import { Layout } from '../components/Layout';
import { html, raw } from 'hono/html';
import { drizzle } from 'drizzle-orm/d1';
import { articles, series, tags, articleTags, writingLogs, articleHistory } from '../db/schema';
import { nanoid } from 'nanoid';
import { and, eq, inArray } from 'drizzle-orm';

const articlesApp = new Hono<{ Bindings: { DB: D1Database }; Variables: { userId: string } }>();

// 递归组件：渲染编辑器左侧简单的系列与文章树
const EditorTree: (props: { allSeries: any[]; allArticles: any[]; parentId: string | null; depth: number; activeArticleId?: string }) => ReturnType<typeof html> = (props) => {
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

// 创建新文章 (来自弹窗)
articlesApp.post('/', async (c) => {
  const db = drizzle(c.env.DB);
  const userId = c.get('userId');
  const body = await c.req.parseBody();
  const title = (body.title as string) || '无标题文章';
  
  const articleId = nanoid();
  const now = Date.now();
  
  await db.insert(articles).values({
    id: articleId,
    userId,
    title,
    content: `# ${title}\n\n开始你的创作...`,
    wordCount: title.length,
    createdAt: now,
    updatedAt: now
  });
  
  c.header('HX-Redirect', `/articles/edit/${articleId}`);
  return c.text('Created');
});

// htmx 接口：搜索
articlesApp.get('/search', async (c) => {
  const db = drizzle(c.env.DB);
  const userId = c.get('userId');
  const q = c.req.query('q') || '';
  
  if (!q.trim()) return c.text('');
  
  const results = await db.select().from(articles).where(and(eq(articles.userId, userId))).limit(10);
  const filtered = results.filter(a => a.title.toLowerCase().includes(q.toLowerCase()));
  
  if (filtered.length === 0) {
    return c.html(`<div class="search-section">没有找到结果</div>`);
  }
  
  let htmlStr = `<div class="search-section">搜索结果</div>`;
  for (const a of filtered) {
    htmlStr += `
      <div class="search-item" onclick="window.location.href='/articles/edit/${a.id}';closeOverlay('searchOverlay')">
        <div class="search-item-icon" style="background:var(--ambg)">📄</div>
        <div style="flex:1"><div class="search-item-title">${a.title}</div></div>
        <span class="search-item-type">文章</span>
      </div>
    `;
  }
  
  return c.html(html`${raw(htmlStr)}`);
});

articlesApp.get('/new', async (c) => {
  const db = drizzle(c.env.DB);
  const userId = c.get('userId');
  
  // 生成一个新的文章 ID 预占位
  const newArticleId = nanoid();
  
  let allSeries: any[] = [];
  let allArticles: any[] = [];
  let draftArticles: any[] = [];
  
  try {
    allSeries = await db.select().from(series).where(eq(series.userId, userId));
    allArticles = await db.select().from(articles).where(eq(articles.userId, userId));
    draftArticles = allArticles.filter(a => !a.seriesId);
  } catch (err) {
    console.error("Editor tree fetch error:", err);
    // Ignore error, tree will just be empty if DB not ready
  }

  return c.html(
    <Layout title="编辑器" current="editor">
      <div id="page-editor" class="page" style={{ height: 'calc(100vh - var(--th))', padding: '0' }}>
        <div class="editor-wrap" style={{ height: '100%' }}>
          {/* Left tree */}
          <div class="etree">
            <div class="etree-head">
              <div class="etree-series-name">全部内容</div>
            </div>
            <div class="etree-body">
              {EditorTree({ allSeries, allArticles, parentId: null, depth: 0, activeArticleId: newArticleId })}
              
              <div class="et-item et-ch" style={{marginTop:'10px'}}>
                <svg class="et-icon" viewBox="0 0 10 10" fill="none"><path d="M2 4l3 3 3-3" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/></svg>
                未分类草稿
              </div>
              <div>
                <div class="et-item et-gc active">
                  <div class="et-dot"></div>
                  新文章
                </div>
                {draftArticles.map(a => (
                  <a href={`/articles/edit/${a.id}`} style={{textDecoration:'none'}}>
                    <div class="et-item et-gc">
                      <div class="et-dot"></div>
                      {a.title}
                    </div>
                  </a>
                ))}
              </div>
            </div>
          </div>

          {/* Editor main */}
          <div class="ed-main">
            <div class="ed-topbar">
              <div class="ed-title" x-data="{ title: '新文章' }" x-text="document.getElementById('md-input') ? (document.getElementById('md-input').value.match(/^#\\s+(.*)/m) ? document.getElementById('md-input').value.match(/^#\\s+(.*)/m)[1] : '新文章') : '新文章'">新文章</div>
              <div class="saved-state" id="save-status"><div class="saved-dot"></div>尚未保存</div>
              <button class="btn btn-sm" onclick="toast('新文章没有历史版本', 'info')">历史版本</button>
              <button class="btn btn-sm" onclick="document.getElementById('page-editor').requestFullscreen()">全屏</button>
              <button class="btn btn-sm btn-primary" onclick="openPublishModal()">发布</button>
            </div>

            <div class="ed-tabs">
              <div class="etab active" id="etab-edit" onclick="switchEdMode('edit')">编辑</div>
              <div class="etab" id="etab-prev" onclick="switchEdMode('prev')">预览</div>
              <div class="etab" id="etab-split" onclick="switchEdMode('split')">双栏</div>
            </div>

            <div class="toolbar">
              <select class="tb-sel" onchange="if(this.value){insertMarkdown(this.value); this.value=''}">
                <option value="">段落格式</option>
                <option value="# ">标题 1</option>
                <option value="## ">标题 2</option>
                <option value="### ">标题 3</option>
              </select>
              <div class="tb-sep"></div>
              <button class="tb on" title="加粗" onclick="insertMarkdown('**', '**')"><b>B</b></button>
              <button class="tb" title="斜体" onclick="insertMarkdown('*', '*')"><i>I</i></button>
              <button class="tb" title="删除线" onclick="insertMarkdown('~~', '~~')"><s>S</s></button>
              <button class="tb" title="行内代码" style={{ fontFamily: 'var(--fm)', fontSize: '11px' }} onclick="insertMarkdown('`', '`')">`</button>
              <div class="tb-sep"></div>
              <button class="tb" title="链接" onclick="insertMarkdown('[', '](url)')">
                <svg width="13" height="13" viewBox="0 0 13 13" fill="none"><path d="M4.5 8.5l4-4" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/><path d="M3 7l-1 1a2.5 2.5 0 003.5 3.5l1-1" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/><path d="M7 3l1-1a2.5 2.5 0 00-3.5-3.5l-1 1" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/></svg>
              </button>
              <button class="tb" title="图片" onclick="insertMarkdown('![', '](image-url)')">
                <svg width="13" height="13" viewBox="0 0 13 13" fill="none"><rect x="1.5" y="2.5" width="10" height="8" rx="1.5" stroke="currentColor" stroke-width="1.2"/><circle cx="4.5" cy="5.5" r="1" fill="currentColor"/><path d="M1.5 8.5l3-3 2.5 2.5 2-1.5 2 2.5" stroke="currentColor" stroke-width="1.1" stroke-linecap="round" stroke-linejoin="round"/></svg>
              </button>
              <div class="tb-sep"></div>
              <button class="tb" title="无序列表" onclick="insertMarkdown('- ')">
                <svg width="13" height="13" viewBox="0 0 13 13" fill="currentColor"><circle cx="2.5" cy="4.2" r="1"/><circle cx="2.5" cy="7" r="1"/><circle cx="2.5" cy="9.8" r="1"/><rect x="4.5" y="3.5" width="7" height="1.4" rx=".7"/><rect x="4.5" y="6.3" width="5" height="1.4" rx=".7"/><rect x="4.5" y="9.1" width="6" height="1.4" rx=".7"/></svg>
              </button>
              <button class="tb" title="代码块" style={{ fontSize: '10px', fontFamily: 'var(--fm)' }} onclick="insertMarkdown('\n```\n', '\n```\n')">&lt;/&gt;</button>
              <button class="tb" title="引用" onclick="insertMarkdown('> ')">
                <svg width="13" height="13" viewBox="0 0 13 13" fill="currentColor"><rect x="1.5" y="2.5" width="2" height="8" rx="1"/><rect x="4.5" y="4" width="7.5" height="1.4" rx="0.7"/><rect x="4.5" y="6.8" width="6" height="1.4" rx="0.7"/></svg>
              </button>
            </div>

            {/* Split editor */}
            <div class="ed-split" id="editor-area">
              <div class="ed-write" id="edWrite">
                <div class="pane-lbl">Markdown 源码</div>
                <textarea class="ed-textarea" spellcheck={false} id="md-input" name="content" x-data="{ content: '# 新文章\\n\\n开始你的创作...' }" x-model="content" hx-put={`/articles/${newArticleId}`} hx-trigger="keyup changed delay:1500ms" hx-target="#save-status" hx-swap="innerHTML" oninput="updatePreview(this.value)"></textarea>
              </div>
              <div class="ed-prev" id="edPrev" style={{ display: 'none' }}>
                <div class="pane-lbl">渲染预览</div>
                <div class="prev-body" id="preview-content">
                  <h1>新文章</h1>
                  <p>开始你的创作...</p>
                </div>
              </div>
            </div>
          </div>

          {/* Meta panel */}
          <div class="meta-pane">
            <div class="meta-s">
              <div class="meta-l">状态</div>
              <div class="meta-v" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><div class="status-dot"></div>草稿</div>
            </div>
            <div class="meta-s">
              <div class="meta-l">标签</div>
              <div class="meta-tag-wrap" id="article-tags-wrap">
                {/* 动态渲染文章标签（新建时为空） */}
                <span class="meta-tag meta-add-tag" onclick="const t=prompt('输入新标签名称 (逗号分隔多个)'); if(t) { htmx.ajax('POST', `/articles/${newArticleId}/tags`, {values:{tags:t}, target:'#article-tags-wrap', swap:'innerHTML'}); }">+ 添加</span>
              </div>
            </div>
            <div class="meta-s">
              <div class="meta-l">字数</div>
              <div class="meta-num" id="meta-word-count">0</div>
            </div>
            <div class="meta-s">
              <div class="meta-l">阅读时间</div>
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
      <div id="page-editor" class="page" style={{ height: 'calc(100vh - var(--th))', padding: '0' }}>
        <div class="editor-wrap" style={{ height: '100%' }}>
          {/* Left tree */}
          <div class="etree">
            <div class="etree-head">
              <div class="etree-series-name">全部内容</div>
            </div>
            <div class="etree-body">
              {EditorTree({ allSeries, allArticles, parentId: null, depth: 0, activeArticleId: articleId })}
              
              <div class="et-item et-ch" style={{marginTop:'10px'}}>
                <svg class="et-icon" viewBox="0 0 10 10" fill="none"><path d="M2 4l3 3 3-3" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/></svg>
                未分类草稿
              </div>
              <div>
                {draftArticles.map(a => (
                  <a href={`/articles/edit/${a.id}`} style={{textDecoration:'none'}}>
                    <div class={`et-item et-gc ${a.id === articleId ? 'active' : ''}`}>
                      <div class="et-dot"></div>
                      {a.title}
                    </div>
                  </a>
                ))}
              </div>
            </div>
          </div>

          {/* Editor main */}
          <div class="ed-main">
            <div class="ed-topbar">
              <div class="ed-title" x-data={`{ title: '${article.title.replace(/'/g, "\\'")}' }`} x-text="document.getElementById('md-input') ? (document.getElementById('md-input').value.match(/^#\\s+(.*)/m) ? document.getElementById('md-input').value.match(/^#\\s+(.*)/m)[1] : title) : title">{article.title}</div>
              <div class="saved-state" id="save-status"><div class="saved-dot"></div>已保存</div>
              <button class="btn btn-sm" onclick={`openHistoryModal('${article.id}')`}>历史版本</button>
              <button class="btn btn-sm" onclick="document.getElementById('page-editor').requestFullscreen()">全屏</button>
              <button class="btn btn-sm btn-primary" onclick="openPublishModal()">发布</button>
            </div>

            <div class="ed-tabs">
              <div class="etab active" id="etab-edit" onclick="switchEdMode('edit')">编辑</div>
              <div class="etab" id="etab-prev" onclick="switchEdMode('prev')">预览</div>
              <div class="etab" id="etab-split" onclick="switchEdMode('split')">双栏</div>
            </div>

            <div class="toolbar">
              <select class="tb-sel" onchange="if(this.value){insertMarkdown(this.value); this.value=''}">
                <option value="">段落格式</option>
                <option value="# ">标题 1</option>
                <option value="## ">标题 2</option>
                <option value="### ">标题 3</option>
              </select>
              <div class="tb-sep"></div>
              <button class="tb on" title="加粗" onclick="insertMarkdown('**', '**')"><b>B</b></button>
              <button class="tb" title="斜体" onclick="insertMarkdown('*', '*')"><i>I</i></button>
              <button class="tb" title="删除线" onclick="insertMarkdown('~~', '~~')"><s>S</s></button>
              <button class="tb" title="行内代码" style={{ fontFamily: 'var(--fm)', fontSize: '11px' }} onclick="insertMarkdown('`', '`')">`</button>
              <div class="tb-sep"></div>
              <button class="tb" title="链接" onclick="insertMarkdown('[', '](url)')">
                <svg width="13" height="13" viewBox="0 0 13 13" fill="none"><path d="M4.5 8.5l4-4" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/><path d="M3 7l-1 1a2.5 2.5 0 003.5 3.5l1-1" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/><path d="M7 3l1-1a2.5 2.5 0 00-3.5-3.5l-1 1" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/></svg>
              </button>
              <button class="tb" title="图片" onclick="insertMarkdown('![', '](image-url)')">
                <svg width="13" height="13" viewBox="0 0 13 13" fill="none"><rect x="1.5" y="2.5" width="10" height="8" rx="1.5" stroke="currentColor" stroke-width="1.2"/><circle cx="4.5" cy="5.5" r="1" fill="currentColor"/><path d="M1.5 8.5l3-3 2.5 2.5 2-1.5 2 2.5" stroke="currentColor" stroke-width="1.1" stroke-linecap="round" stroke-linejoin="round"/></svg>
              </button>
              <div class="tb-sep"></div>
              <button class="tb" title="无序列表" onclick="insertMarkdown('- ')">
                <svg width="13" height="13" viewBox="0 0 13 13" fill="currentColor"><circle cx="2.5" cy="4.2" r="1"/><circle cx="2.5" cy="7" r="1"/><circle cx="2.5" cy="9.8" r="1"/><rect x="4.5" y="3.5" width="7" height="1.4" rx=".7"/><rect x="4.5" y="6.3" width="5" height="1.4" rx=".7"/><rect x="4.5" y="9.1" width="6" height="1.4" rx=".7"/></svg>
              </button>
              <button class="tb" title="代码块" style={{ fontSize: '10px', fontFamily: 'var(--fm)' }} onclick="insertMarkdown('\n```\n', '\n```\n')">&lt;/&gt;</button>
              <button class="tb" title="引用" onclick="insertMarkdown('> ')">
                <svg width="13" height="13" viewBox="0 0 13 13" fill="currentColor"><rect x="1.5" y="2.5" width="2" height="8" rx="1"/><rect x="4.5" y="4" width="7.5" height="1.4" rx="0.7"/><rect x="4.5" y="6.8" width="6" height="1.4" rx="0.7"/></svg>
              </button>
            </div>

            {/* Split editor */}
            <div class="ed-split" id="editor-area">
              <div class="ed-write" id="edWrite">
                <div class="pane-lbl">Markdown 源码</div>
                <textarea class="ed-textarea" spellcheck={false} id="md-input" name="content" x-data={`{ content: \`${article.content.replace(/`/g, '\\`')}\` }`} x-model="content" hx-put={`/articles/${article.id}`} hx-trigger="keyup changed delay:1500ms" hx-target="#save-status" hx-swap="innerHTML" oninput="updatePreview(this.value)"></textarea>
              </div>
              <div class="ed-prev" id="edPrev" style={{ display: 'none' }}>
                <div class="pane-lbl">渲染预览</div>
                <div class="prev-body" id="preview-content"></div>
              </div>
            </div>
          </div>

          {/* Meta panel */}
          <div class="meta-pane">
            <div class="meta-s">
              <div class="meta-l">状态</div>
              <div class="meta-v" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div class="status-dot" style={article.status === 'published' ? 'background:var(--green)' : ''}></div>
                {article.status === 'published' ? '已发布' : '草稿'}
              </div>
            </div>
            <div class="meta-s">
              <div class="meta-l">标签</div>
              <div class="meta-tag-wrap" id="article-tags-wrap">
                {/* 动态渲染文章标签（新建时为空） */}
                <span class="meta-tag meta-add-tag" onclick={`const t=prompt('输入新标签名称 (逗号分隔多个)'); if(t) { htmx.ajax('POST', '/articles/${articleId}/tags', {values:{tags:t}, target:'#article-tags-wrap', swap:'innerHTML'}); }`}>+ 添加</span>
              </div>
            </div>
            <div class="meta-s">
              <div class="meta-l">字数</div>
              <div class="meta-num" id="meta-word-count">{article.wordCount}</div>
            </div>
            <div class="meta-s">
              <div class="meta-l">阅读时间</div>
              <div class="meta-num" id="meta-read-time">约 {Math.max(1, Math.ceil((article.wordCount || 0) / 300))} 分钟</div>
            </div>
            <div class="meta-s">
              <div class="meta-l">修改时间</div>
              <div class="meta-v" style={{ fontSize: '11px', fontFamily: 'var(--font-mono)' }}>
                {new Date(article.updatedAt).toLocaleString('zh-CN')}
              </div>
            </div>
            <div class="meta-s">
              <div class="meta-l">操作</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <button class="btn btn-sm btn-ghost" style={{ justifyContent: 'flex-start', fontSize: '11px' }} onclick="openModal('moveModal')">📦 移动文章…</button>
                <button class="btn btn-sm btn-ghost" style={{ justifyContent: 'flex-start', fontSize: '11px' }} onclick="toast('链接已复制','success')">🔗 复制链接</button>
                <button class="btn btn-sm btn-ghost" style={{ justifyContent: 'flex-start', fontSize: '11px', color: 'var(--red)' }} onclick="openModal('deleteModal')">🗑 删除文章</button>
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

  const now = Date.now();
  const dateStr = new Date(now).toISOString().split('T')[0];
  const oldWordCount = existing?.wordCount || 0;
  const isNewArticle = !existing;

  if (existing) {
    // 更新
    await db.update(articles)
      .set({ content, title, wordCount, updatedAt: now })
      .where(eq(articles.id, articleId));
      
    // 保存到历史记录 (简单实现，每次修改都保存，真实应用中应限制频率或版本数)
    await db.insert(articleHistory).values({
      id: nanoid(),
      articleId,
      content,
      savedAt: now
    });
  } else {
    // 插入新文章
    await db.insert(articles).values({
      id: articleId,
      userId,
      title,
      content,
      wordCount,
      createdAt: now,
      updatedAt: now
    });
  }

  const deltaWords = wordCount - oldWordCount;
  if (deltaWords !== 0 || isNewArticle) {
    const log = await db
      .select()
      .from(writingLogs)
      .where(and(eq(writingLogs.userId, userId), eq(writingLogs.date, dateStr)))
      .get();

    const newLogWordCount = Math.max(0, (log?.wordCount || 0) + deltaWords);
    const newLogArticleCount = (log?.articleCount || 0) + (isNewArticle ? 1 : 0);

    if (log) {
      await db
        .update(writingLogs)
        .set({ wordCount: newLogWordCount, articleCount: newLogArticleCount })
        .where(eq(writingLogs.id, log.id));
    } else {
      await db.insert(writingLogs).values({
        id: nanoid(),
        userId,
        date: dateStr,
        articleCount: isNewArticle ? 1 : 0,
        wordCount: Math.max(0, deltaWords),
      });
    }
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

// htmx 接口：移动文章
articlesApp.post('/:id/move', async (c) => {
  const db = drizzle(c.env.DB);
  const articleId = c.req.param('id');
  const body = await c.req.parseBody();
  const seriesId = body.seriesId as string || null;
  
  await db.update(articles)
    .set({ seriesId })
    .where(eq(articles.id, articleId));
    
  return c.text('Moved');
});

// htmx 接口：删除文章
articlesApp.delete('/:id', async (c) => {
  const db = drizzle(c.env.DB);
  const articleId = c.req.param('id');
  
  await db.delete(articleTags).where(eq(articleTags.articleId, articleId));
  await db.delete(articles).where(eq(articles.id, articleId));
    
  return c.text('Deleted');
});

// htmx 接口：处理标签
articlesApp.post('/:id/tags', async (c) => {
  const db = drizzle(c.env.DB);
  const userId = c.get('userId');
  const articleId = c.req.param('id');
  const body = await c.req.parseBody();
  const rawTags = (body.tags as string) || '';
  
  const tagNames = rawTags.split(',').map(t => t.trim()).filter(Boolean);
  
  if (tagNames.length > 0) {
    for (const name of tagNames) {
      // 查找或创建 tag
      let tagRecord = await db.select().from(tags).where(and(eq(tags.userId, userId), eq(tags.name, name))).get();
      if (!tagRecord) {
        tagRecord = { id: nanoid(), userId, name, color: 'gray' };
        await db.insert(tags).values(tagRecord);
      }
      
      // 绑定关系
      const existingLink = await db
        .select()
        .from(articleTags)
        .where(and(eq(articleTags.articleId, articleId), eq(articleTags.tagId, tagRecord.id)))
        .get();
        
      if (!existingLink) {
        await db.insert(articleTags).values({ articleId, tagId: tagRecord.id });
      }
    }
  }

  // 重新获取绑定的标签渲染返回
  const attachedTagsRecords = await db.select().from(articleTags).where(eq(articleTags.articleId, articleId));
  const attachedTagIds = attachedTagsRecords.map(t => t.tagId).filter(Boolean) as string[];
  const attachedTags = attachedTagIds.length > 0 
    ? await db.select().from(tags).where(inArray(tags.id, attachedTagIds))
    : [];

  return c.html(html`
    ${attachedTags.map((t: any) => html`
      <span class="meta-tag" onclick="if(confirm('删除标签?')) { htmx.ajax('DELETE', \`/articles/${articleId}/tags/${t.id}\`, {target:'#article-tags-wrap', swap:'innerHTML'}); }">
        ${t.name} &times;
      </span>
    `)}
    <span class="meta-tag meta-add-tag" onclick="const t=prompt('输入新标签名称 (逗号分隔多个)'); if(t) { htmx.ajax('POST', \`/articles/${articleId}/tags\`, {values:{tags:t}, target:'#article-tags-wrap', swap:'innerHTML'}); }">+ 添加</span>
  `);
});

articlesApp.delete('/:id/tags/:tagId', async (c) => {
  const db = drizzle(c.env.DB);
  const articleId = c.req.param('id');
  const tagId = c.req.param('tagId');

  // 删除绑定关系
  await db
    .delete(articleTags)
    .where(and(eq(articleTags.articleId, articleId), eq(articleTags.tagId, tagId)));

  // 重新获取绑定的标签渲染返回
  const attachedTagsRecords = await db.select().from(articleTags).where(eq(articleTags.articleId, articleId));
  const attachedTagIds = attachedTagsRecords.map(t => t.tagId).filter(Boolean) as string[];
  const attachedTags = attachedTagIds.length > 0 
    ? await db.select().from(tags).where(inArray(tags.id, attachedTagIds))
    : [];

  return c.html(html`
    ${attachedTags.map((t: any) => html`
      <span class="meta-tag" onclick="if(confirm('删除标签?')) { htmx.ajax('DELETE', \`/articles/${articleId}/tags/${t.id}\`, {target:'#article-tags-wrap', swap:'innerHTML'}); }">
        ${t.name} &times;
      </span>
    `)}
    <span class="meta-tag meta-add-tag" onclick="const t=prompt('输入新标签名称 (逗号分隔多个)'); if(t) { htmx.ajax('POST', \`/articles/${articleId}/tags\`, {values:{tags:t}, target:'#article-tags-wrap', swap:'innerHTML'}); }">+ 添加</span>
  `);
});

// htmx 接口：获取文章历史记录
articlesApp.get('/:id/history', async (c) => {
  const db = drizzle(c.env.DB);
  const articleId = c.req.param('id');
  const history = await db.select().from(articleHistory).where(eq(articleHistory.articleId, articleId)).orderBy(articleHistory.savedAt).limit(20);
  
  // 倒序排列
  history.reverse();
  
  if (history.length === 0) {
    return c.html(`<div style="padding:10px;text-align:center;color:var(--t3)">暂无历史记录</div>`);
  }
  
  const renderItem = (item: any, isCurrent: boolean) => html`
    <div class="stree-row" style="padding:10px 12px;border-bottom:1px solid var(--border)" onclick="restoreHistory('${item.id}')">
      <div style="flex:1">
        <div style="font-size:12px;font-weight:500">${new Date(item.savedAt).toLocaleString('zh-CN')}</div>
        <div style="font-size:10px;color:var(--t3);margin-top:2px">${item.content.length.toLocaleString()} 字符</div>
      </div>
      ${isCurrent ? html`<span class="strow-status st-pub">当前版本</span>` : html`<button class="btn btn-sm btn-ghost" style="font-size:10px">恢复</button>`}
    </div>
  `;
  
  let listHtml = '';
  for (let i = 0; i < history.length; i++) {
    listHtml += renderItem(history[i], i === 0);
  }
  
  return c.html(html`${raw(listHtml)}`);
});

// htmx 接口：恢复文章历史记录
articlesApp.post('/:id/restore/:historyId', async (c) => {
  const db = drizzle(c.env.DB);
  const articleId = c.req.param('id');
  const historyId = c.req.param('historyId');
  
  const historyItem = await db.select().from(articleHistory).where(eq(articleHistory.id, historyId)).get();
  if (historyItem) {
    const titleMatch = historyItem.content.match(/^#\s+(.*)/m);
    const title = titleMatch ? titleMatch[1].trim() : '无标题文章';
    const wordCount = historyItem.content.replace(/\s+/g, '').length;
    
    await db.update(articles)
      .set({ content: historyItem.content, title, wordCount, updatedAt: Date.now() })
      .where(eq(articles.id, articleId));
  }
  
  return c.text('Restored');
});

export default articlesApp;
