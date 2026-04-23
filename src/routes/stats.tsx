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

  // 计算过去 371 天的数据（模拟一整年热力图）
  const days = [];
  for (let i = 370; i >= 0; i--) {
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

  const thisYear = new Date().getFullYear();

  return c.html(
    <Layout title="数据统计" current="stats">
      <div id="page-stats" class="page">
        <div class="page-head" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div><div class="page-title">学习统计</div><div class="page-sub">记录每一天的知识积累 · {thisYear}年</div></div>
          <div style={{ display: 'flex', gap: '6px' }}>
            <button class="btn btn-sm" onclick="toast('导出数据 CSV','info')">导出</button>
          </div>
        </div>

        <div class="stat-grid">
          <div class="stat-card"><div class="stat-label">本月新增</div><div class="stat-val">24</div><div class="stat-meta"><span class="chip chip-g">↑ +8 vs 上月</span></div></div>
          <div class="stat-card"><div class="stat-label">总字数</div><div class="stat-val">892K</div><div class="stat-meta"><span class="chip chip-b">年均 74K/月</span></div></div>
          <div class="stat-card"><div class="stat-label">连续创作</div><div class="stat-val">17天</div><div class="stat-meta"><span class="chip chip-a">🔥 最长 32 天</span></div></div>
          <div class="stat-card"><div class="stat-label">标签覆盖</div><div class="stat-val">48</div><div class="stat-meta" style={{color:'var(--t3)'}}>技术栈</div></div>
        </div>

        <div class="panel" style={{marginBottom:'13px'}}>
          <div class="panel-title">年度创作热力图 <span style={{fontSize:'10px',color:'var(--t3)'}}>悬停查看详情</span></div>
          <div class="hm-grid" id="hmGrid">
            {days.map(d => (
              <div class={`hm-cell hm${d.level}`} title={`${d.date}: ${d.count} 字`}></div>
            ))}
          </div>
          <div class="hm-foot"><span>少</span><div class="hm-sq hm0"></div><div class="hm-sq hm1"></div><div class="hm-sq hm2"></div><div class="hm-sq hm3"></div><div class="hm-sq hm4"></div><span>多</span></div>
        </div>

        <div class="g2s">
          <div class="panel">
            <div class="panel-title">月度文章数 <span style={{display:'flex',gap:'3px'}}>
              <span class="panel-link" onclick="toast('切换至2025年','info')" style={{padding:'2px 5px'}}>2025</span>
              <span class="panel-link" style={{background:'var(--abg)',padding:'2px 5px'}}>2026</span>
            </span></div>
            <div class="chart-bars">
              <div class="cbar" style={{height:'55%',background:'var(--accent)',opacity:'.45'}} onclick="toast('1月：18篇','info')" title="1月：18篇"></div>
              <div class="cbar" style={{height:'40%',background:'var(--accent)',opacity:'.45'}} onclick="toast('2月：13篇','info')" title="2月：13篇"></div>
              <div class="cbar" style={{height:'72%',background:'var(--accent)',opacity:'.45'}} onclick="toast('3月：24篇','info')" title="3月：24篇"></div>
              <div class="cbar" style={{height:'95%',background:'var(--accent)'}} onclick="toast('4月：32篇（进行中）','info')" title="4月：32篇"></div>
              <div class="cbar" style={{height:'18%',background:'var(--s3)'}}></div>
              <div class="cbar" style={{height:'10%',background:'var(--s3)'}}></div>
              <div class="cbar" style={{height:'8%',background:'var(--s3)'}}></div>
              <div class="cbar" style={{height:'6%',background:'var(--s3)'}}></div>
              <div class="cbar" style={{height:'5%',background:'var(--s3)'}}></div>
              <div class="cbar" style={{height:'4%',background:'var(--s3)'}}></div>
              <div class="cbar" style={{height:'3%',background:'var(--s3)'}}></div>
              <div class="cbar" style={{height:'2%',background:'var(--s3)'}}></div>
            </div>
            <div class="cbar-l"><span>1</span><span>2</span><span>3</span><span>4</span><span>5</span><span>6</span><span>7</span><span>8</span><span>9</span><span>10</span><span>11</span><span>12</span></div>
          </div>
          <div class="panel">
            <div class="panel-title">内容分类</div>
            <div class="donut-wrap">
              <svg width="80" height="80" viewBox="0 0 80 80" style={{flexShrink:'0',cursor:'pointer'}} onclick="toast('点击切换高亮系列','info')">
                <circle cx="40" cy="40" r="27" fill="none" stroke="var(--s3)" stroke-width="14"/>
                <circle cx="40" cy="40" r="27" fill="none" stroke="var(--accent)" stroke-width="14" stroke-dasharray="71 99" stroke-dashoffset="0" transform="rotate(-90 40 40)"/>
                <circle cx="40" cy="40" r="27" fill="none" stroke="var(--green)" stroke-width="14" stroke-dasharray="40 130" stroke-dashoffset="-71" transform="rotate(-90 40 40)"/>
                <circle cx="40" cy="40" r="27" fill="none" stroke="var(--amber)" stroke-width="14" stroke-dasharray="30 140" stroke-dashoffset="-111" transform="rotate(-90 40 40)"/>
                <circle cx="40" cy="40" r="27" fill="none" stroke="var(--purple)" stroke-width="14" stroke-dasharray="29 141" stroke-dashoffset="-141" transform="rotate(-90 40 40)"/>
                <text x="40" y="43" text-anchor="middle" font-size="9" fill="var(--t2)" font-family="var(--fm)">187篇</text>
              </svg>
              <div>
                <div class="dl" onclick="toast('筛选 JavaScript 文章','info')"><div class="dl-dot" style={{background:'var(--accent)'}}></div><span class="dl-name">JavaScript</span><span class="dl-pct">42%</span></div>
                <div class="dl" onclick="toast('筛选 Go 文章','info')"><div class="dl-dot" style={{background:'var(--green)'}}></div><span class="dl-name">Go 语言</span><span class="dl-pct">24%</span></div>
                <div class="dl" onclick="toast('筛选算法文章','info')"><div class="dl-dot" style={{background:'var(--amber)'}}></div><span class="dl-name">算法</span><span class="dl-pct">18%</span></div>
                <div class="dl" onclick="toast('筛选系统设计','info')"><div class="dl-dot" style={{background:'var(--purple)'}}></div><span class="dl-name">系统设计</span><span class="dl-pct">16%</span></div>
              </div>
            </div>
          </div>
        </div>

        <div class="g22s">
          <div class="panel">
            <div class="panel-title">月均字数</div>
            <div class="wc-row"><div class="wc-date">1月</div><div class="wc-track"><div class="wc-fill" style={{width:'65%',background:'var(--accent)',opacity:'.55'}}></div></div><div class="wc-val">52K</div></div>
            <div class="wc-row"><div class="wc-date">2月</div><div class="wc-track"><div class="wc-fill" style={{width:'47%',background:'var(--accent)',opacity:'.55'}}></div></div><div class="wc-val">38K</div></div>
            <div class="wc-row"><div class="wc-date">3月</div><div class="wc-track"><div class="wc-fill" style={{width:'90%',background:'var(--accent)',opacity:'.55'}}></div></div><div class="wc-val">72K</div></div>
            <div class="wc-row" style={{cursor:'pointer'}} onclick="toast('4月目标 80K 已达成 🎉','success')"><div class="wc-date" style={{color:'var(--green)'}}>4月</div><div class="wc-track"><div class="wc-fill" style={{width:'100%',background:'var(--green)'}}></div></div><div class="wc-val" style={{color:'var(--green)'}}>80K✓</div></div>
          </div>
          <div class="panel">
            <div class="panel-title">高频标签</div>
            <div class="rank-row" onclick="toast('筛选标签: JavaScript', 'info')"><div class="rank-n">1</div><span class="mtag mtag-js" style={{flexShrink:'0'}}>JS</span><div class="rank-bar"><div class="rank-fill" style={{width:'100%',background:'var(--amber)'}}></div></div><div class="rank-val">78</div></div>
            <div class="rank-row" onclick="toast('筛选标签: Go', 'info')"><div class="rank-n">2</div><span class="mtag mtag-go" style={{flexShrink:'0'}}>Go</span><div class="rank-bar"><div class="rank-fill" style={{width:'57%',background:'var(--green)'}}></div></div><div class="rank-val">45</div></div>
            <div class="rank-row" onclick="toast('筛选标签: 并发', 'info')"><div class="rank-n">3</div><span class="mtag mtag-arch" style={{flexShrink:'0'}}>并发</span><div class="rank-bar"><div class="rank-fill" style={{width:'48%',background:'var(--purple)'}}></div></div><div class="rank-val">38</div></div>
            <div class="rank-row" onclick="toast('筛选标签: React', 'info')"><div class="rank-n">4</div><span class="mtag mtag-ts" style={{flexShrink:'0'}}>React</span><div class="rank-bar"><div class="rank-fill" style={{width:'39%',background:'var(--accent)'}}></div></div><div class="rank-val">31</div></div>
            <div class="rank-row" onclick="toast('筛选标签: 算法', 'info')"><div class="rank-n">5</div><span class="mtag mtag-py" style={{flexShrink:'0'}}>算法</span><div class="rank-bar"><div class="rank-fill" style={{width:'37%',background:'var(--green)'}}></div></div><div class="rank-val">29</div></div>
          </div>
        </div>
      </div>
    </Layout>
  );
});

export default statsApp;
