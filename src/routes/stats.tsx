import { Hono } from 'hono';
import { Layout } from '../components/Layout';
import { html } from 'hono/html';
import { drizzle } from 'drizzle-orm/d1';
import { writingLogs } from '../db/schema';
import { eq } from 'drizzle-orm';

const statsApp = new Hono<{ Bindings: { DB: D1Database }; Variables: { userId: string } }>();

statsApp.get('/', async (c) => {
  const db = drizzle(c.env.DB);
  const userId = c.get('userId');

  let allLogs: any[] = [];
  try {
    allLogs = await db.select().from(writingLogs).where(eq(writingLogs.userId, userId));
  } catch (err) {
    console.error("Stats fetch error:", err);
  }

  // 计算过去 30 天的数据（简化版热力图数据结构）
  const days = [];
  for (let i = 29; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split('T')[0];
    
    const log = allLogs.find(l => l.date === dateStr);
    const count = log ? log.wordCount : 0;
    
    let level = 0;
    if (count > 0) level = 1;
    if (count > 500) level = 2;
    if (count > 1000) level = 3;
    if (count > 2000) level = 4;
    
    days.push({ date: dateStr, count, level });
  }

  return c.html(
    <Layout title="数据统计" current="stats">
      <div id="page-stats" class="page">
        <div class="page-head">
          <div class="page-title">数据统计</div>
          <div class="page-sub">回顾你的创作历程</div>
        </div>
        
        <div style={{ background: 'var(--bg1)', padding: '24px', borderRadius: '12px', border: '1px solid var(--border)' }}>
          <div style={{ marginBottom: '16px', fontSize: '13px', fontWeight: '500' }}>近 30 天创作热力图</div>
          <div class="heatmap">
            {days.map(d => (
              <div class="hm-cell" data-level={d.level} title={`${d.date}: ${d.count} 字`}></div>
            ))}
          </div>
          <div style={{ marginTop: '16px', display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '6px', fontSize: '11px', color: 'var(--text3)' }}>
            少
            <div class="hm-cell" data-level="0"></div>
            <div class="hm-cell" data-level="1"></div>
            <div class="hm-cell" data-level="2"></div>
            <div class="hm-cell" data-level="3"></div>
            <div class="hm-cell" data-level="4"></div>
            多
          </div>
        </div>
      </div>
    </Layout>
  );
});

export default statsApp;
