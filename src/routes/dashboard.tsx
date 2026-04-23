import { Hono } from 'hono';
import { Layout } from '../components/Layout';
import { html } from 'hono/html';
import { drizzle } from 'drizzle-orm/d1';
import { count, eq, sum } from 'drizzle-orm';
import { series, articles, writingLogs } from '../db/schema';

type Bindings = { DB: D1Database };
type Variables = { userId: string };

const dashboard = new Hono<{ Bindings: Bindings; Variables: Variables }>();

dashboard.get('/', async (c) => {
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
  const totalWords = wordsCountResult?.total || 0;
  const totalWordsK = (totalWords / 1000).toFixed(1) + 'K';

  // Streak logic (simplified for now)
  const currentStreak = 0;

  return c.html(
    <Layout title="总览" current="dashboard">
      <div id="page-dashboard" class="page">
        <div class="page-head">
          <div class="page-title">👋 早上好，fkcoding</div>
          <div class="page-sub">今天是 ${new Date().toLocaleDateString('zh-CN')} · 距上次创作 0 天</div>
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
      </div>
    </Layout>
  );
});

export default dashboard;
