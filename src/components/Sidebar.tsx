import { html } from 'hono/html';

export default function Sidebar(props: { current?: string }) {
  const isCurrent = (name: string) => props.current === name ? 'active' : '';

  return html`
<nav class="sidebar" id="sidebar">
  <div class="logo" onclick="window.location.href='/dashboard'">
    <div class="logo-mark">
      <svg width="14" height="14" viewBox="0 0 14 14" fill="white"><rect x="1" y="1" width="5" height="5" rx="1"/><rect x="8" y="1" width="5" height="5" rx="1"/><rect x="1" y="8" width="5" height="5" rx="1"/><path d="M8 10.5h5M10.5 8v5" stroke="white" stroke-width="1.2" stroke-linecap="round"/></svg>
    </div>
    <div>
      <div class="logo-name">fkcoding-note</div>
      <div class="logo-tag">Knowledge Base</div>
    </div>
  </div>

  <div class="nav-label">主菜单</div>
  <a class="nav-item ${isCurrent('dashboard')}" href="/dashboard">
    <svg class="ni" viewBox="0 0 15 15" fill="currentColor"><rect x="1" y="1" width="6" height="6" rx="1.5"/><rect x="8" y="1" width="6" height="6" rx="1.5"/><rect x="1" y="8" width="6" height="6" rx="1.5"/><rect x="8" y="8" width="6" height="6" rx="1.5"/></svg>
    总览
  </a>
  <a class="nav-item ${isCurrent('series')}" href="/series">
    <svg class="ni" viewBox="0 0 15 15" fill="none" stroke="currentColor" stroke-width="1.3"><rect x="1.5" y="1.5" width="12" height="12" rx="2"/><path d="M4 5h7M4 7.5h5M4 10h7" stroke-linecap="round"/></svg>
    教程系列
  </a>
  <a class="nav-item ${isCurrent('stats')}" href="/stats">
    <svg class="ni" viewBox="0 0 15 15" fill="currentColor"><rect x="1" y="8" width="3" height="6" rx="1"/><rect x="6" y="5" width="3" height="9" rx="1"/><rect x="11" y="2" width="3" height="12" rx="1"/></svg>
    统计
  </a>
  <div class="nav-item" onclick="openModal('quickNoteModal')">
    <svg class="ni" viewBox="0 0 15 15" fill="none" stroke="currentColor" stroke-width="1.3"><rect x="1.5" y="1.5" width="12" height="12" rx="2"/><path d="M4 5h7M4 7.5h7M4 10h4" stroke-linecap="round"/></svg>
    快速笔记
  </div>

  <div class="nav-label" style="margin-top:20px;display:flex;justify-content:space-between;align-items:center">
    <span>全部内容树</span>
    <button class="btn btn-icon" style="width:20px;height:20px;opacity:.5" onclick="window.location.href='/articles/new'" title="新建文章">
      <svg width="10" height="10" viewBox="0 0 12 12" fill="none"><path d="M6 1v10M1 6h10" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/></svg>
    </button>
  </div>
  
  <div class="tree-scroll" hx-get="/htmx/sidebar-tree" hx-trigger="load">
    <div style="padding: 10px; font-size: 11px; color: var(--t3); text-align: center;">加载中...</div>
  </div>

  <div class="sidebar-bottom">
    <div class="user-row" onclick="togglePopover()">
      <div class="avatar">FK</div>
      <div style="flex:1">
        <div class="uname">fkcoding</div>
        <div class="uplan">Pro Plan</div>
      </div>
      <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M3 5l3 3 3-3" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/></svg>
    </div>
  </div>
</nav>
  `;
}
