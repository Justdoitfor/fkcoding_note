import { Hono } from 'hono';
import { Layout } from '../components/Layout';
import { html } from 'hono/html';
import { drizzle } from 'drizzle-orm/d1';
import { writingLogs, articles, tags, articleTags, series } from '../db/schema';
import { eq, desc, and, count, sum, gte, sql } from 'drizzle-orm';

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

  // 基础统计
  const thisYear = new Date().getFullYear();
  const thisMonth = new Date().getMonth();
  
  // 总字数
  const [totalWordsResult] = await db.select({ total: sum(articles.wordCount) }).from(articles).where(eq(articles.userId, userId));
  const totalWordsNum = Number(totalWordsResult?.total || 0);
  const totalWordsK = (totalWordsNum / 1000).toFixed(1) + 'K';

  // 标签总数
  const [totalTagsResult] = await db.select({ count: count() }).from(tags).where(eq(tags.userId, userId));
  const totalTags = totalTagsResult?.count || 0;

  // 本月新增文章
  const startOfMonth = new Date(thisYear, thisMonth, 1).getTime();
  const [newArticlesResult] = await db.select({ count: count() }).from(articles).where(and(eq(articles.userId, userId), gte(articles.createdAt, startOfMonth)));
  const newArticles = newArticlesResult?.count || 0;

  // 热力图
  const days = [];
  let currentStreak = 0;
  let maxStreak = 0;
  let tempStreak = 0;
  
  for (let i = 370; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split('T')[0];
    
    const log = allLogs.find(l => l.date === dateStr);
    const wc = log ? log.wordCount : 0;
    
    let level = 0;
    if (wc > 0) {
      level = 1;
      tempStreak++;
      if (tempStreak > maxStreak) maxStreak = tempStreak;
      if (i === 0) currentStreak = tempStreak; // 如果今天是连续的，更新current
    } else {
      if (wc > 500) level = 2;
      if (wc > 1000) level = 3;
      if (wc > 2000) level = 4;
      if (i === 0) currentStreak = tempStreak; // 如果今天断了，current是之前的，或者是0（这里简化处理：真实情况今天不写应该显示之前的连续天数或0，这里算今天未结束所以保留昨日的连续天数。更严谨的算法需要判断昨天的状态，这里简化为一直连续的天数）
      tempStreak = 0;
    }
    
    days.push({ date: dateStr, count: wc, level });
  }

  // 简单的连续天数修正（如果今天没写，看看昨天写了没）
  if (days[370].count === 0 && days[369].count > 0) {
    let streak = 0;
    for(let i=369; i>=0; i--) {
      if (days[i].count > 0) streak++;
      else break;
    }
    currentStreak = streak;
  } else if (days[370].count > 0) {
    let streak = 0;
    for(let i=370; i>=0; i--) {
      if (days[i].count > 0) streak++;
      else break;
    }
    currentStreak = streak;
  }

  // 月度文章数和字数
  const monthlyArticles = Array(12).fill(0);
  const monthlyWords = Array(12).fill(0);
  
  const allUserArticles = await db.select({ createdAt: articles.createdAt, wordCount: articles.wordCount }).from(articles).where(eq(articles.userId, userId));
  
  for (const a of allUserArticles) {
    const d = new Date(a.createdAt);
    if (d.getFullYear() === thisYear) {
      const m = d.getMonth();
      monthlyArticles[m]++;
      monthlyWords[m] += (a.wordCount || 0);
    }
  }

  const maxMonthlyArticles = Math.max(...monthlyArticles, 1);
  const maxMonthlyWords = Math.max(...monthlyWords, 1);

  // 分类占比 (基于 Series)
  const allSeries = await db.select().from(series).where(eq(series.userId, userId));
  const seriesCountMap: Record<string, number> = {};
  allUserArticles.forEach(a => {
    if (a.seriesId) {
      seriesCountMap[a.seriesId] = (seriesCountMap[a.seriesId] || 0) + 1;
    }
  });

  const seriesData = allSeries.map(s => ({
    title: s.title,
    count: seriesCountMap[s.id] || 0
  })).filter(s => s.count > 0).sort((a,b) => b.count - a.count).slice(0, 4);

  const totalClassified = seriesData.reduce((acc, curr) => acc + curr.count, 0) || 1;
  const colors = ['var(--accent)', 'var(--green)', 'var(--amber)', 'var(--purple)'];
  
  // 动态生成 SVG 环形图参数
  let dashOffset = 0;
  const svgCircles = seriesData.map((s, i) => {
    const pct = s.count / totalClassified;
    const dashArray = `${pct * 170} 200`; // 2*pi*27 ≈ 170
    const circle = `<circle cx="40" cy="40" r="27" fill="none" stroke="${colors[i]}" stroke-width="14" stroke-dasharray="${dashArray}" stroke-dashoffset="${-dashOffset}" transform="rotate(-90 40 40)"/>`;
    dashOffset += (pct * 170);
    return circle;
  }).join('');

  // 高频标签
  const allTags = await db.select().from(tags).where(eq(tags.userId, userId));
  const allArticleTags = await db.select().from(articleTags); // 实际应使用 join
  
  const tagCountMap: Record<string, number> = {};
  for (const at of allArticleTags) {
    tagCountMap[at.tagId] = (tagCountMap[at.tagId] || 0) + 1;
  }
  
  const topTags = allTags.map(t => ({
    name: t.name,
    count: tagCountMap[t.id] || 0
  })).filter(t => t.count > 0).sort((a,b) => b.count - a.count).slice(0, 5);
  const maxTagCount = topTags[0]?.count || 1;

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
          <div class="stat-card"><div class="stat-label">本月新增</div><div class="stat-val">{newArticles}</div><div class="stat-meta"><span class="chip chip-g">全部文章</span></div></div>
          <div class="stat-card"><div class="stat-label">总字数</div><div class="stat-val">{totalWordsK}</div><div class="stat-meta"><span class="chip chip-b">创作里程碑</span></div></div>
          <div class="stat-card"><div class="stat-label">连续创作</div><div class="stat-val">{currentStreak}天</div><div class="stat-meta"><span class="chip chip-a">🔥 最长 {maxStreak} 天</span></div></div>
          <div class="stat-card"><div class="stat-label">标签覆盖</div><div class="stat-val">{totalTags}</div><div class="stat-meta" style={{color:'var(--t3)'}}>知识节点</div></div>
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
              {monthlyArticles.map((count, i) => {
                const height = count > 0 ? Math.max((count / maxMonthlyArticles) * 100, 4) : 0;
                const bg = count > 0 ? 'var(--accent)' : 'var(--s3)';
                const opacity = count > 0 && i !== thisMonth ? '.45' : '1';
                return (
                  <div class="cbar" style={{height:`${height}%`,background:bg,opacity}} onclick={`toast('${i+1}月：${count}篇','info')`} title={`${i+1}月：${count}篇`}></div>
                );
              })}
            </div>
            <div class="cbar-l"><span>1</span><span>2</span><span>3</span><span>4</span><span>5</span><span>6</span><span>7</span><span>8</span><span>9</span><span>10</span><span>11</span><span>12</span></div>
          </div>
          <div class="panel">
            <div class="panel-title">内容分类</div>
            <div class="donut-wrap">
              {seriesData.length === 0 ? (
                <div style={{ padding: '20px', textAlign: 'center', color: 'var(--t3)', fontSize: '12px' }}>暂无分类数据</div>
              ) : (
                <>
                  <svg width="80" height="80" viewBox="0 0 80 80" style={{flexShrink:'0',cursor:'pointer'}} onclick="toast('点击切换高亮系列','info')">
                    <circle cx="40" cy="40" r="27" fill="none" stroke="var(--s3)" stroke-width="14"/>
                    <g dangerouslySetInnerHTML={{__html: svgCircles}}></g>
                    <text x="40" y="43" text-anchor="middle" font-size="9" fill="var(--t2)" font-family="var(--fm)">{allUserArticles.length}篇</text>
                  </svg>
                  <div style={{ flex: 1, overflow: 'hidden' }}>
                    {seriesData.map((s, i) => (
                      <div class="dl" onclick={`toast('筛选 ${s.title}','info')`}>
                        <div class="dl-dot" style={{background:colors[i]}}></div>
                        <span class="dl-name" style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{s.title}</span>
                        <span class="dl-pct">{Math.round((s.count/totalClassified)*100)}%</span>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        <div class="g22s">
          <div class="panel">
            <div class="panel-title">月均字数</div>
            {monthlyWords.filter(w => w > 0).length === 0 ? (
              <div style={{ padding: '20px', textAlign: 'center', color: 'var(--t3)', fontSize: '12px' }}>暂无数据</div>
            ) : (
              monthlyWords.map((w, i) => {
                if (w === 0) return null;
                const pct = Math.max((w / maxMonthlyWords) * 100, 5);
                const isCurrent = i === thisMonth;
                const mColors = isCurrent ? 'var(--green)' : 'var(--accent)';
                return (
                  <div class="wc-row">
                    <div class="wc-date" style={{color: isCurrent ? mColors : ''}}>{i+1}月</div>
                    <div class="wc-track">
                      <div class="wc-fill" style={{width:`${pct}%`,background:mColors,opacity:isCurrent?'1':'.55'}}></div>
                    </div>
                    <div class="wc-val" style={{color: isCurrent ? mColors : ''}}>{(w/1000).toFixed(1)}K</div>
                  </div>
                );
              })
            )}
          </div>
          <div class="panel">
            <div class="panel-title">高频标签</div>
            {topTags.length === 0 ? (
              <div style={{ padding: '20px', textAlign: 'center', color: 'var(--t3)', fontSize: '12px' }}>暂无标签数据</div>
            ) : (
              topTags.map((t, i) => {
                const pct = Math.max((t.count / maxTagCount) * 100, 5);
                const c = ['var(--amber)', 'var(--green)', 'var(--purple)', 'var(--accent)', 'var(--green)'][i%5];
                return (
                  <div class="rank-row" onclick={`toast('筛选标签: ${t.name}', 'info')`}>
                    <div class="rank-n">{i+1}</div>
                    <span class="mtag" style={{flexShrink:'0'}}>{t.name}</span>
                    <div class="rank-bar"><div class="rank-fill" style={{width:`${pct}%`,background:c}}></div></div>
                    <div class="rank-val">{t.count}</div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
});

export default statsApp;
