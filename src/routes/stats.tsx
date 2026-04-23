import { Hono } from 'hono';
import { Layout } from '../components/Layout';
import { html } from 'hono/html';

const stats = new Hono();

stats.get('/', async (c) => {
  return c.html(
    <Layout title="统计" current="stats">
      <div id="page-stats" class="page">
        <div class="page-head">
          <div class="page-title">学习统计</div>
          <div class="page-sub">记录知识积累的每一天 · 2026年</div>
        </div>

        <div class="stats-row">
          <div class="stat-card">
            <div class="stat-lbl">本月新增</div>
            <div class="stat-num">24</div>
            <div class="stat-meta"><span class="chip chip-green">↑ +8 vs 上月</span></div>
          </div>
          <div class="stat-card">
            <div class="stat-lbl">总写作字数</div>
            <div class="stat-num">892K</div>
            <div class="stat-meta"><span class="chip chip-blue">年均 74K/月</span></div>
          </div>
          <div class="stat-card">
            <div class="stat-lbl">连续创作</div>
            <div class="stat-num">17天</div>
            <div class="stat-meta"><span class="chip chip-amber">🔥 最长 32 天</span></div>
          </div>
          <div class="stat-card">
            <div class="stat-lbl">标签覆盖</div>
            <div class="stat-num">48</div>
            <div class="stat-meta" style={{ fontSize: '11px', color: 'var(--text3)' }}>技术栈多样性</div>
          </div>
        </div>

        <div class="panel heatmap-panel">
          <div class="panel-title">创作热力图 — 近一年 <span style={{ fontSize: '10px', color: 'var(--text3)' }}>共 187 篇</span></div>
          <div class="hm-grid" id="hm-grid"></div>
          <div class="hm-footer">
            <span>少</span>
            <div class="hm-sq" style={{ background: 'var(--surface3)' }}></div>
            <div class="hm-sq" style={{ background: '#bbf7d0' }}></div>
            <div class="hm-sq" style={{ background: '#4ade80' }}></div>
            <div class="hm-sq" style={{ background: '#16a34a' }}></div>
            <div class="hm-sq" style={{ background: '#166534' }}></div>
            <span>多</span>
          </div>
        </div>
      </div>
      {html`<script>
        const hmGrid = document.getElementById('hm-grid');
        if (hmGrid) {
          for (let i = 0; i < 371; i++) {
            const cell = document.createElement('div');
            const r = Math.random();
            let cls = 'hm-cell ';
            if (r > 0.88) cls += 'hm4';
            else if (r > 0.74) cls += 'hm3';
            else if (r > 0.58) cls += 'hm2';
            else if (r > 0.42) cls += 'hm1';
            else cls += 'hm0';
            cell.className = cls;
            hmGrid.appendChild(cell);
          }
        }
      </script>`}
    </Layout>
  );
});

export default stats;
