import { Hono } from 'hono';
import { Layout } from '../components/Layout';
import { html } from 'hono/html';
import { drizzle } from 'drizzle-orm/d1';
import { and, count, eq, sum, desc } from 'drizzle-orm';
import { articles, series, users, writingLogs, notes, tags } from '../db/schema';
import { nanoid } from 'nanoid';

type Bindings = { DB: D1Database };
type Variables = { userId: string };

const dashboard = new Hono<{ Bindings: Bindings; Variables: Variables }>();

dashboard.get('/', async (c) => {
  try {
    const db = drizzle(c.env.DB);
    const userId = c.get('userId');

    // Query stats
    const [seriesCountResult] = await db
      .select({ count: count() })
      .from(series)
      .where(eq(series.userId, userId));
      
    const [articlesCountResult] = await db
      .select({ count: count() })
      .from(articles)
      .where(eq(articles.userId, userId));
      
    const [wordsCountResult] = await db
      .select({ total: sum(articles.wordCount) })
      .from(articles)
      .where(eq(articles.userId, userId));

    const [notesCountResult] = await db
      .select({ count: count() })
      .from(notes)
      .where(eq(notes.userId, userId));

    const totalSeries = seriesCountResult?.count || 0;
    const totalArticles = articlesCountResult?.count || 0;
    const totalWords = Number(wordsCountResult?.total || 0);
    const totalWordsK = (totalWords / 1000).toFixed(1) + 'K';
    const totalNotes = notesCountResult?.count || 0;
    const showSeed = totalSeries === 0 && totalArticles === 0;

    // Fetch recent series
    const recentSeries = await db
      .select()
      .from(series)
      .where(eq(series.userId, userId))
      .orderBy(desc(series.updatedAt))
      .limit(4);

    // Fetch recent articles
    const recentArticles = await db
      .select()
      .from(articles)
      .where(eq(articles.userId, userId))
      .orderBy(desc(articles.updatedAt))
      .limit(5);

    // Fetch tags
    const userTags = await db
      .select()
      .from(tags)
      .where(eq(tags.userId, userId))
      .limit(15);

    // Fetch recent writing logs for activity chart
    const recentLogs = await db
      .select()
      .from(writingLogs)
      .where(eq(writingLogs.userId, userId))
      .orderBy(desc(writingLogs.date))
      .limit(14);
      
    // Format activity data
    const today = new Date();
    const actDataArr = Array(14).fill(0);
    const dateLabels = Array(14).fill('');
    
    for (let i = 13; i >= 0; i--) {
      const d = new Date();
      d.setDate(today.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      
      if (i === 0) dateLabels[13] = '今';
      else dateLabels[13-i] = `${d.getMonth()+1}/${d.getDate()}`;
      
      const log = recentLogs.find(l => l.date === dateStr);
      if (log) {
        actDataArr[13-i] = log.wordCount || 0;
      }
    }

    // Format relative time helper
    const timeAgo = (ts: number) => {
      const diff = Math.floor((Date.now() - ts) / 1000);
      if (diff < 3600) return '刚刚';
      if (diff < 86400) return `${Math.floor(diff/3600)}h`;
      const days = Math.floor(diff/86400);
      if (days === 1) return '昨天';
      return `${days}天前`;
    };

    // Series Progress (Simplified: calculate based on published vs total articles in series)
    // We'll just fetch all articles to calculate this simply for now
    const allArticles = await db.select({ seriesId: articles.seriesId, status: articles.status }).from(articles).where(eq(articles.userId, userId));
    const seriesProgress = recentSeries.map(s => {
      const sArticles = allArticles.filter(a => a.seriesId === s.id);
      const total = sArticles.length;
      if (total === 0) return { ...s, progress: 0 };
      const published = sArticles.filter(a => a.status === 'published').length;
      return { ...s, progress: Math.round((published / total) * 100) };
    }).slice(0, 4);

    // Streak logic (simplified for now)
    const currentStreak = 0;

    return c.html(
      <Layout title="总览" current="dashboard">
        <div id="page-dashboard" class="page">
          <div class="page-head">
            <div>
              <div class="page-title">👋 早上好，fkcoding</div>
              <div class="page-sub">{new Date().toLocaleDateString('zh-CN')} · 连续创作第 {currentStreak} 天 🔥</div>
            </div>
            <button class="btn btn-sm" onclick="openModal('newSeriesModal')">+ 新建系列</button>
          </div>

          {/* Stats */}
          <div class="stat-grid">
            <div class="stat-card" onclick="window.location.href='/series';toast('查看教程系列','info')" style="cursor:pointer">
              <div class="stat-label">教程系列</div>
              <div class="stat-val">{totalSeries}</div>
              <div class="stat-meta"><span class="chip chip-g">↑ 全部系列</span></div>
            </div>
            <div class="stat-card" onclick="window.location.href='/series';toast('查看所有文章','info')" style="cursor:pointer">
              <div class="stat-label">文章总数</div>
              <div class="stat-val">{totalArticles}</div>
              <div class="stat-meta"><span class="chip chip-b">全部文章</span></div>
            </div>
            <div class="stat-card" onclick="openModal('quickNoteModal')" style="cursor:pointer">
              <div class="stat-label">快速笔记</div>
              <div class="stat-val">{totalNotes}</div>
              <div class="stat-meta" style="color:var(--t3)">点击新建笔记</div>
            </div>
            <div class="stat-card" onclick="window.location.href='/stats'" style="cursor:pointer">
              <div class="stat-label">累计字数</div>
              <div class="stat-val">{totalWordsK}</div>
              <div class="stat-meta"><span class="chip chip-a">写作里程碑</span></div>
            </div>
          </div>

          {/* Quick Actions */}
          <div class="qa-grid">
            <div class="qa-card" onclick="openModal('newArticleModal')">
              <div class="qa-ico" style="background:var(--abg)">📝</div>
              <div><div class="qa-label">新建教程文章</div><div class="qa-desc">Markdown 编辑器</div></div>
            </div>
            <div class="qa-card" onclick="openModal('newSeriesModal')">
              <div class="qa-ico" style="background:var(--gbg)">📂</div>
              <div><div class="qa-label">新建教程系列</div><div class="qa-desc">树状层级结构</div></div>
            </div>
            <div class="qa-card" onclick="openModal('quickNoteModal')">
              <div class="qa-ico" style="background:var(--ambg)">⚡</div>
              <div><div class="qa-label">快速笔记</div><div class="qa-desc">即时记录想法</div></div>
            </div>
            <div class="qa-card" onclick="window.location.href='/stats'">
              <div class="qa-ico" style="background:var(--pbg)">📊</div>
              <div><div class="qa-label">学习统计</div><div class="qa-desc">数据可视化分析</div></div>
            </div>
          </div>

          <div class="g2">
            <div class="panel">
              <div class="panel-title">近期教程系列 <span class="panel-link" onclick="window.location.href='/series'">查看全部 →</span></div>
              {recentSeries.length === 0 ? (
                <div style={{ padding: '20px', textAlign: 'center', color: 'var(--t3)', fontSize: '12px' }}>暂无系列</div>
              ) : (
                recentSeries.map(s => (
                  <div class="series-item" onclick="window.location.href='/series'">
                    <div class="series-emoji">{s.icon || '📁'}</div>
                    <div style={{flex:1}}>
                      <div class="series-name">{s.title}</div>
                      <div class="series-meta2">
                        {timeAgo(s.updatedAt)}
                      </div>
                    </div>
                    <svg width="11" height="11" viewBox="0 0 11 11" fill="none" style={{opacity:'.25'}}><path d="M3 2l4 3.5-4 3.5" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/></svg>
                  </div>
                ))
              )}
            </div>

            <div class="panel">
              <div class="panel-title">活跃度 <span style={{color:'var(--t3)', fontSize:'10px'}}>近 14 天</span></div>
              <div class="act-bars" id="actBars"></div>
              <div class="act-days">{dateLabels.map(l => <span>{l}</span>)}</div>
              <div style={{height:'1px', background:'var(--border)', margin:'13px 0'}}></div>
              <div class="panel-title">系列进度</div>
              {seriesProgress.length === 0 ? (
                <div style={{ padding: '10px', textAlign: 'center', color: 'var(--t3)', fontSize: '12px' }}>暂无系列进度</div>
              ) : (
                seriesProgress.map(s => (
                  <div class="prog">
                    <div class="prog-lbl">{s.title} <span class="prog-pct">{s.progress}%</span></div>
                    <div class="prog-track"><div class="prog-fill" style={{width:`${s.progress}%`, background:'var(--accent)'}}></div></div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div class="g22">
            <div class="panel">
              <div class="panel-title">最近编辑</div>
              {recentArticles.length === 0 ? (
                <div style={{ padding: '20px', textAlign: 'center', color: 'var(--t3)', fontSize: '12px' }}>暂无文章</div>
              ) : (
                recentArticles.map((a, i) => {
                  const colors = ['var(--accent)', 'var(--green)', 'var(--amber)', 'var(--purple)', 'var(--orange)'];
                  return (
                    <div class="edit-item" onclick={`window.location.href='/articles/edit/${a.id}'`}>
                      <div class="edit-dot" style={{background:colors[i%colors.length]}}></div>
                      <div class="edit-title">{a.title}</div>
                      <div class="edit-time">{timeAgo(a.updatedAt)}</div>
                    </div>
                  );
                })
              )}
            </div>
            <div class="panel">
              <div class="panel-title">标签 <span class="panel-link" onclick="toast('筛选已清除','info')">清除筛选</span></div>
              <div class="tag-cloud">
                {userTags.length === 0 ? (
                  <div style={{ padding: '10px', textAlign: 'center', color: 'var(--t3)', fontSize: '12px' }}>暂无标签</div>
                ) : (
                  userTags.map(t => (
                    <span class="tag-pill" onclick="this.classList.toggle('active');filterByTag(this)">{t.name}</span>
                  ))
                )}
              </div>
            </div>
          </div>
          <script dangerouslySetInnerHTML={{__html: `
            setTimeout(() => {
              const actData = ${JSON.stringify(actDataArr)};
              const actMax = Math.max(...actData, 1);
              const actContainer = document.getElementById('actBars');
              if (actContainer) {
                actData.forEach((v, i) => {
                  const bar = document.createElement('div');
                  bar.className = 'act-bar';
                  bar.style.height = Math.round((v / actMax) * 100) + '%';
                  if (i === actData.length - 1) { bar.classList.add('hi'); }
                  else if (v > actMax * 0.6) { bar.classList.add('md'); }
                  actContainer.appendChild(bar);
                });
              }
            }, 100);
          `}}></script>

          {showSeed ? (
            <div style={{ marginTop: '18px', background: 'var(--bg1)', border: '1px solid var(--border)', borderRadius: '12px', padding: '14px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px' }}>
              <div>
                <div style={{ fontSize: '13px', fontWeight: '500' }}>当前数据库没有任何数据</div>
                <div style={{ fontSize: '12px', color: 'var(--text3)', marginTop: '4px' }}>一键生成演示系列、文章、热力图数据，方便测试</div>
              </div>
              <button class="btn btn-primary" hx-post="/dashboard/seed" hx-swap="none">生成演示数据</button>
            </div>
          ) : null}
        </div>
      </Layout>
    );
  } catch (err) {
    console.error("Dashboard DB error:", err);
    return c.text("Server Error: Could not execute database query. Please ensure your D1 database is properly bound as 'DB' in Cloudflare Pages Settings -> Functions -> D1 database bindings, and that you have deployed the migrations.", 500);
  }
});

dashboard.post('/seed', async (c) => {
  const db = drizzle(c.env.DB);
  const userId = c.get('userId');

  if (userId !== 'admin-id') {
    return c.text('Forbidden', 403);
  }

  const existingUser = await db.select().from(users).where(eq(users.id, userId)).get();
  if (!existingUser) {
    await db.insert(users).values({ id: userId, username: 'admin', passwordHash: 'admin', createdAt: Date.now() });
  }

  const now = Date.now();

  const seriesRootId = nanoid();
  const seriesChildId = nanoid();
  await db.insert(series).values([
    {
      id: seriesRootId,
      userId,
      parentId: null,
      title: 'JavaScript 全栈开发指南',
      description: '现代 Web 开发从入门到生产部署',
      icon: '⚡',
      sortOrder: 0,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: seriesChildId,
      userId,
      parentId: seriesRootId,
      title: '基础入门',
      description: null,
      icon: '📁',
      sortOrder: 0,
      createdAt: now,
      updatedAt: now,
    },
  ]);

  const a1Content = `# 原型链与继承机制详解\n\n> 🎯 本文目标：深入理解 JavaScript 原型链。\n\n## 什么是原型链？\n\n在 JavaScript 中，每个对象都有一个内部属性 [[Prototype]]。\n\n\`\`\`js\nconst obj = {}\nconsole.log(Object.getPrototypeOf(obj))\n\`\`\`\n`;
  const a2Content = `# 闭包：从原理到实战\n\n闭包是 JavaScript 中非常核心的概念。\n\n- 作用域\n- 词法环境\n- 垃圾回收\n\n\`\`\`js\nfunction makeCounter(){\n  let n = 0\n  return () => ++n\n}\n\`\`\`\n`;

  const a1Id = nanoid();
  const a2Id = nanoid();
  const a1Words = a1Content.replace(/\s+/g, '').length;
  const a2Words = a2Content.replace(/\s+/g, '').length;

  await db.insert(articles).values([
    {
      id: a1Id,
      userId,
      seriesId: seriesChildId,
      title: '原型链与继承机制详解',
      content: a1Content,
      summary: null,
      status: 'draft',
      sortOrder: 0,
      wordCount: a1Words,
      readingMinutes: Math.max(1, Math.ceil(a1Words / 300)),
      createdAt: now,
      updatedAt: now,
      publishedAt: null,
    },
    {
      id: a2Id,
      userId,
      seriesId: seriesChildId,
      title: '闭包：从原理到实战',
      content: a2Content,
      summary: null,
      status: 'published',
      sortOrder: 1,
      wordCount: a2Words,
      readingMinutes: Math.max(1, Math.ceil(a2Words / 300)),
      createdAt: now,
      updatedAt: now,
      publishedAt: now,
    },
  ]);

  const logs: any[] = [];
  for (let i = 0; i < 14; i++) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split('T')[0];
    const wordCount = i % 3 === 0 ? 0 : 200 + i * 120;
    logs.push({
      id: nanoid(),
      userId,
      date: dateStr,
      articleCount: wordCount > 0 ? 1 : 0,
      wordCount,
    });
  }

  for (const log of logs) {
    const existing = await db
      .select()
      .from(writingLogs)
      .where(and(eq(writingLogs.userId, userId), eq(writingLogs.date, log.date)))
      .get();

    if (existing) {
      await db.update(writingLogs).set({ wordCount: log.wordCount, articleCount: log.articleCount }).where(eq(writingLogs.id, existing.id));
    } else {
      await db.insert(writingLogs).values(log);
    }
  }

  c.header('HX-Refresh', 'true');
  return c.text('OK');
});

export default dashboard;
