import { html } from 'hono/html';

export default function Sidebar(props: { current?: string }) {
  const isCurrent = (name: string) => props.current === name ? 'active' : '';
  
  return html`
<nav class="sidebar" id="sidebar">
  <div class="logo" onclick="window.location.href='/dashboard'" style="cursor:pointer">
    <div class="logo-mark">
      <svg width="14" height="14" viewBox="0 0 14 14" fill="white"><rect x="1" y="1" width="5" height="5" rx="1"/><rect x="8" y="1" width="5" height="5" rx="1"/><rect x="1" y="8" width="5" height="5" rx="1"/><path d="M8 10.5h5M10.5 8v5" stroke="white" stroke-width="1.2" stroke-linecap="round"/></svg>
    </div>
    <div>
      <div class="logo-name">fkcoding-note</div>
      <div class="logo-tag">Knowledge Base</div>
    </div>
  </div>

  <div class="nav-section">主菜单</div>
  <a class="nav-item ${isCurrent('dashboard')}" href="/dashboard">
    <svg class="nav-icon" viewBox="0 0 15 15" fill="currentColor"><rect x="1" y="1" width="6" height="6" rx="1.5"/><rect x="8" y="1" width="6" height="6" rx="1.5"/><rect x="1" y="8" width="6" height="6" rx="1.5"/><rect x="8" y="8" width="6" height="6" rx="1.5"/></svg>
    总览
  </a>
  <a class="nav-item ${isCurrent('series')}" href="/series">
    <svg class="nav-icon" viewBox="0 0 15 15" fill="none" stroke="currentColor" stroke-width="1.3"><rect x="1.5" y="1.5" width="12" height="12" rx="2"/><path d="M4 5h7M4 7.5h5M4 10h7" stroke-linecap="round"/></svg>
    教程系列
  </a>
  <a class="nav-item ${isCurrent('editor')}" href="/articles/new">
    <svg class="nav-icon" viewBox="0 0 15 15" fill="none" stroke="currentColor" stroke-width="1.3"><path d="M10.5 1.5l3 3-8 8H2.5v-3l8-8z" stroke-linecap="round" stroke-linejoin="round"/></svg>
    编辑器
  </a>
  <a class="nav-item ${isCurrent('stats')}" href="/stats">
    <svg class="nav-icon" viewBox="0 0 15 15" fill="currentColor"><rect x="1" y="8" width="3" height="6" rx="1"/><rect x="6" y="5" width="3" height="9" rx="1"/><rect x="11" y="2" width="3" height="12" rx="1"/></svg>
    统计
  </a>
  <div class="nav-item" onclick="openModal('quickNoteModal')" style="cursor:pointer">
    <svg class="nav-icon" viewBox="0 0 15 15" fill="none" stroke="currentColor" stroke-width="1.3"><rect x="1.5" y="1.5" width="12" height="12" rx="2"/><path d="M4 5h7M4 7.5h7M4 10h4" stroke-linecap="round"/></svg>
    快速笔记
  </div>

  <div class="nav-section" style="margin-top:5px">教程树</div>
  <div class="tree-area" hx-get="/htmx/sidebar-tree" hx-trigger="load">
    <div style="padding: 10px; font-size: 11px; color: var(--text3); text-align: center;">加载中...</div>
  </div>

  <div class="sidebar-bottom" style="position:relative">
    <div class="user-row" id="userRow" onclick="togglePopover()">
      <div class="avatar">FK</div>
      <div>
        <div class="user-name">fkcoding</div>
        <div class="user-plan">Free · Cloudflare</div>
      </div>
      <svg style="margin-left:auto;width:11px;height:11px;opacity:.3" viewBox="0 0 11 11" fill="none"><path d="M2 4l3.5 3.5L9 4" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/></svg>
    </div>
  </div>
</nav>
  `;
}
