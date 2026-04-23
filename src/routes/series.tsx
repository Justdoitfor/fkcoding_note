import { Hono } from 'hono';
import { Layout } from '../components/Layout';
import { html } from 'hono/html';

const series = new Hono();

series.get('/', async (c) => {
  return c.html(
    <Layout title="教程系列" current="series">
      <div id="page-series" class="page">
        <div class="page-head" style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
          <div>
            <div class="page-title">教程系列</div>
            <div class="page-sub">12 个系列 · 树状层级管理</div>
          </div>
          <button class="btn btn-primary" onclick="alert('Not implemented in MVP')">
            <svg width="11" height="11" viewBox="0 0 12 12" fill="none"><path d="M6 1v10M1 6h10" stroke="white" stroke-width="1.5" stroke-linecap="round"/></svg>
            新建系列
          </button>
        </div>

        <div class="series-tree">
          <div class="stree-root">
            <div class="stree-row is-series">
              <svg class="stree-chevron open" viewBox="0 0 12 12" fill="none"><path d="M4 2l4 4-4 4" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/></svg>
              <span class="stree-emoji">⚡</span>
              <div style={{ flex: 1 }}>
                <div class="stree-title">JavaScript 全栈开发指南</div>
                <div style={{ fontSize: '10px', color: 'var(--text3)', marginTop: '2px' }}>现代 Web 开发从入门到生产部署</div>
              </div>
              <span class="stree-count">23 篇</span>
              <span class="stree-status st-prog">进行中</span>
              <div class="stree-actions">
                <button class="stree-act" title="新建子章节">+</button>
                <button class="stree-act" title="编辑">✎</button>
                <button class="stree-act" title="删除">✕</button>
              </div>
            </div>
            
            <div class="stree-row stree-indent-1">
              <svg class="stree-chevron open" viewBox="0 0 12 12" fill="none"><path d="M4 2l4 4-4 4" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/></svg>
              <span class="stree-emoji" style={{ fontSize: '12px' }}>📁</span>
              <div class="stree-title">基础入门</div>
              <span class="stree-count">6 篇</span>
              <div class="stree-actions">
                <button class="stree-act">+</button>
                <button class="stree-act">✎</button>
              </div>
            </div>
            
            <a class="stree-row stree-indent-2" href="/articles/new" style={{ textDecoration: 'none', color: 'inherit' }}>
              <span class="stree-emoji" style={{ fontSize: '12px' }}>📄</span>
              <div class="stree-title">原型链与继承机制详解</div>
              <span class="stree-status st-pub">已发布</span>
              <div class="stree-actions">
                <button class="stree-act">✎</button>
                <button class="stree-act">✕</button>
              </div>
            </a>
          </div>
        </div>
      </div>
    </Layout>
  );
});

export default series;
