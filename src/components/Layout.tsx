import { html } from 'hono/html';
import Sidebar from './Sidebar';

export const Layout = (props: { children: any; title?: string; current?: string }) => {
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
  <script src="https://cdn.jsdelivr.net/npm/marked/marked.min.js"></script>
  <script src="https://unpkg.com/htmx.org@1.9.12/dist/htmx.min.js"></script>
  <script src="https://cdn.jsdelivr.net/npm/marked/marked.min.js"></script>
</head>
<body>
  <div class="shell">
    ${<Sidebar current={props.current} />}
    <div class="main">
      <header class="topbar">
        <div class="topbar-breadcrumb">
          <span>fkcoding-note</span>
          <span class="bc-sep">/</span>
          <span class="bc-cur" id="topbar-cur">${props.title || '总览'}</span>
        </div>
        <div class="search-bar">
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><circle cx="5" cy="5" r="3.5" stroke="currentColor" stroke-width="1.2"/><path d="M8 8l2.5 2.5" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/></svg>
          搜索教程、笔记…
          <span class="search-kbd">⌘K</span>
        </div>
        <button class="btn btn-ghost">
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><circle cx="6" cy="4" r="1.5" stroke="currentColor" stroke-width="1.2"/><path d="M3 11c0-1.66 1.34-3 3-3s3 1.34 3 3" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/></svg>
        </button>
        <a class="btn btn-primary" id="topbar-new-btn" href="/articles/new">
          <svg width="11" height="11" viewBox="0 0 12 12" fill="none"><path d="M6 1v10M1 6h10" stroke="white" stroke-width="1.5" stroke-linecap="round"/></svg>
          新建文章
        </a>
      </header>
      <div class="content-scroll">
        ${props.children}
      </div>
    </div>
  </div>
  <script src="/assets/app.js"></script>
</body>
</html>
  `;
};
