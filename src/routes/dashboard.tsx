import { Hono } from 'hono';
import { Layout } from '../components/Layout';
import { html } from 'hono/html';
import { drizzle } from 'drizzle-orm/d1';
import { and, count, eq, sum } from 'drizzle-orm';
import { articles, series, users, writingLogs } from '../db/schema';
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

    const totalSeries = seriesCountResult?.count || 0;
    const totalArticles = articlesCountResult?.count || 0;
    const totalWords = Number(wordsCountResult?.total || 0);
    const totalWordsK = (totalWords / 1000).toFixed(1) + 'K';
    const showSeed = totalSeries === 0 && totalArticles === 0;

    // Streak logic (simplified for now)
    const currentStreak = 0;

    return c.html(
      <Layout title="总览" current="dashboard">
        <div id="page-dashboard" class="page">
          <div class="page-head">
            <div class="page-title">👋 早上好，fkcoding</div>
            <div class="page-sub">今天是 {new Date().toLocaleDateString('zh-CN')} · 距上次创作 0 天</div>
          </div>

          <div class="stats-row">
            <div class="stat-card">
              <div class="stat-lbl">教程系列</div>
              <div class="stat-num">{totalSeries}</div>
              <div class="stat-meta"><span class="chip chip-green">↑ 全部系列</span></div>
            </div>
            <div class="stat-card">
              <div class="stat-lbl">文章总数</div>
              <div class="stat-num">{totalArticles}</div>
              <div class="stat-meta"><span class="chip chip-blue">全部文章</span></div>
            </div>
            <div class="stat-card">
              <div class="stat-lbl">累计字数</div>
              <div class="stat-num">{totalWordsK}</div>
              <div class="stat-meta"><span class="chip chip-amber">写作里程碑</span></div>
            </div>
            <div class="stat-card">
              <div class="stat-lbl">连续创作</div>
              <div class="stat-num">{currentStreak}</div>
              <div class="stat-meta" style="color:var(--text3);font-size:11px">🔥 天</div>
            </div>
          </div>

          <div class="qa-grid">
            <a class="qa-card" href="/articles/new" style="text-decoration:none;color:inherit">
              <div class="qa-icon" style="background:var(--accent-bg)">📝</div>
              <div><div class="qa-lbl">新建教程文章</div><div class="qa-sub">Markdown 编辑器</div></div>
            </a>
            <a class="qa-card" href="/series" style="text-decoration:none;color:inherit">
              <div class="qa-icon" style="background:var(--green-bg)">📂</div>
              <div><div class="qa-lbl">新建教程系列</div><div class="qa-sub">树状层级结构</div></div>
            </a>
            <a class="qa-card" href="/notes" style="text-decoration:none;color:inherit">
              <div class="qa-icon" style="background:var(--amber-bg)">⚡</div>
              <div><div class="qa-lbl">快速笔记</div><div class="qa-sub">即时记录想法</div></div>
            </a>
            <a class="qa-card" href="/stats" style="text-decoration:none;color:inherit">
              <div class="qa-icon" style="background:var(--purple-bg)">📊</div>
              <div><div class="qa-lbl">查看统计</div><div class="qa-sub">学习数据可视化</div></div>
            </a>
          </div>

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
