import { html } from 'hono/html';
import Sidebar from './Sidebar';
import { Modals } from './Modals';

export const Layout = (props: { children: any; title?: string; current?: string; hideTopbar?: boolean }) => {
  return html`
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${props.title || 'fkcoding-note'}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link href="https://fonts.googleapis.com/css2?family=DM+Mono:ital,wght@0,300;0,400;0,500;1,400&family=Instrument+Serif:ital@0;1&family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;1,9..40,300&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="/assets/app.css">
  <script src="https://cdn.jsdelivr.net/npm/alpinejs@3/dist/cdn.min.js" defer></script>
  <script src="https://unpkg.com/htmx.org@1.9.12/dist/htmx.min.js"></script>
  <script src="https://cdn.jsdelivr.net/npm/marked/marked.min.js"></script>
</head>
<body>
  <div class="shell">
    ${Sidebar({ current: props.current })}
    <div class="main">
      ${!props.hideTopbar ? html`
      <header class="topbar">
        <div class="topbar-bc">
          <span>fkcoding-note</span>
          <span class="bc-sep">/</span>
          <span class="bc-active" id="topbarCur">${props.title || '总览'}</span>
        </div>
        <div class="search-box" onclick="openModal('searchOverlay')">
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><circle cx="5.5" cy="5.5" r="3.8" stroke="currentColor" stroke-width="1.2"/><path d="M8.5 8.5l2.5 2.5" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/></svg>
          搜索…
          <span class="skbd">⌘K</span>
        </div>
        <div class="tip-wrap">
          <button class="btn btn-icon" onclick="openModal('quickNoteModal')">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M7 1.5v5M4 3.5h6" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/><rect x="1.5" y="5" width="11" height="7.5" rx="1.5" stroke="currentColor" stroke-width="1.2"/></svg>
          </button>
          <div class="tip">快速笔记</div>
        </div>
        <div id="topbarRight">
          <button class="btn btn-primary btn-sm" id="topNewBtn" onclick="window.location.href='/articles/new'">
            <svg width="11" height="11" viewBox="0 0 11 11" fill="none"><path d="M5.5 1v9M1 5.5h9" stroke="white" stroke-width="1.5" stroke-linecap="round"/></svg>
            新建
          </button>
        </div>
      </header>` : ''}
      <div class="page-body">
        ${props.children}
      </div>
    </div>
  </div>
  ${Modals()}
  <script src="/assets/app.js"></script>
</body>
</html>
  `;
};
