import { Hono } from 'hono';
import { Layout } from '../components/Layout';
import { html } from 'hono/html';

const dashboard = new Hono();

dashboard.get('/', async (c) => {
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
            <div class="stat-num">12</div>
            <div class="stat-meta"><span class="chip chip-green">↑ +2 本月</span></div>
          </div>
          <div class="stat-card">
            <div class="stat-lbl">文章总数</div>
            <div class="stat-num">187</div>
            <div class="stat-meta"><span class="chip chip-blue">+14 本周</span></div>
          </div>
          <div class="stat-card">
            <div class="stat-lbl">累计字数</div>
            <div class="stat-num">892K</div>
            <div class="stat-meta"><span class="chip chip-amber">年均 74K/月</span></div>
          </div>
          <div class="stat-card">
            <div class="stat-lbl">连续创作</div>
            <div class="stat-num">17</div>
            <div class="stat-meta" style="color:var(--text3);font-size:11px">🔥 天 · 最长 32 天</div>
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
