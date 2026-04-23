import { html } from 'hono/html';

export default function Sidebar(props: { current?: string }) {
  const isCurrent = (name: string) => props.current === name ? 'active' : '';
  
  return html`
<nav class="sidebar">
  <div class="logo">
    <div class="logo-mark">
      <svg width="14" height="14" viewBox="0 0 14 14"><rect x="1" y="1" width="5" height="5" rx="1"/><rect x="8" y="1" width="5" height="5" rx="1"/><rect x="1" y="8" width="5" height="5" rx="1"/><path d="M8 10.5h5M10.5 8v5" stroke="white" stroke-width="1.2" stroke-linecap="round"/></svg>
    </div>
    <div>
      <div class="logo-name">fkcoding-note</div>
      <div class="logo-tag">Knowledge Base</div>
    </div>
  </div>

  <div class="nav-label">主菜单</div>
  <a class="nav-item ${isCurrent('dashboard')}" href="/dashboard">
    <svg class="ni-icon" viewBox="0 0 15 15" fill="currentColor"><rect x="1" y="1" width="6" height="6" rx="1.5"/><rect x="8" y="1" width="6" height="6" rx="1.5"/><rect x="1" y="8" width="6" height="6" rx="1.5"/><rect x="8" y="8" width="6" height="6" rx="1.5"/></svg>
    总览
  </a>
  <a class="nav-item ${isCurrent('series')}" href="/series">
    <svg class="ni-icon" viewBox="0 0 15 15" fill="none" stroke="currentColor" stroke-width="1.3"><rect x="1.5" y="1.5" width="12" height="12" rx="2"/><path d="M4 5h7M4 7.5h5M4 10h7" stroke-linecap="round"/></svg>
    教程系列
  </a>
  <a class="nav-item ${isCurrent('editor')}" href="/articles/new">
    <svg class="ni-icon" viewBox="0 0 15 15" fill="none" stroke="currentColor" stroke-width="1.3"><path d="M10.5 1.5l3 3-8 8H2.5v-3l8-8z" stroke-linecap="round" stroke-linejoin="round"/></svg>
    编辑器
  </a>
  <a class="nav-item ${isCurrent('stats')}" href="/stats">
    <svg class="ni-icon" viewBox="0 0 15 15" fill="currentColor"><rect x="1" y="8" width="3" height="6" rx="1"/><rect x="6" y="5" width="3" height="9" rx="1"/><rect x="11" y="2" width="3" height="12" rx="1"/></svg>
    统计
  </a>
  <a class="nav-item ${isCurrent('tags')}" href="/tags">
    <svg class="ni-icon" viewBox="0 0 15 15" fill="none" stroke="currentColor" stroke-width="1.3"><circle cx="7.5" cy="7.5" r="2.5"/><path d="M7.5 1v2M7.5 12v2M1 7.5h2M12 7.5h2M3.1 3.1l1.4 1.4M10.5 10.5l1.4 1.4M3.1 11.9l1.4-1.4M10.5 4.5l1.4-1.4" stroke-linecap="round"/></svg>
    标签
  </a>

  <div class="nav-label" style="margin-top:6px">教程树</div>
  <div class="tree-scroll" hx-get="/htmx/sidebar-tree" hx-trigger="load">
    <div style="padding: 10px; font-size: 11px; color: var(--text3); text-align: center;">加载中...</div>
  </div>

  <div class="sidebar-footer">
    <div class="user-card">
      <div class="avatar">FK</div>
      <div>
        <div class="user-name">fkcoding</div>
        <div class="user-plan">Free Plan</div>
      </div>
      <form action="/logout" method="post" style="margin-left: auto">
        <button type="submit" style="background:none;border:none;cursor:pointer;color:var(--text3);font-size:11px" title="退出登录">退出</button>
      </form>
    </div>
  </div>
</nav>
  `;
}
