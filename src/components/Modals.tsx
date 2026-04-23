
import { html } from 'hono/html';

export const Modals = () => html`
<!-- ═══════════ TOAST ═══════════ -->
<div class="toast-area" id="toastArea"></div>

<!-- ═══════════ CONTEXT MENU ═══════════ -->
<div class="ctx-menu" id="ctxMenu">
  <div class="ctx-item" onclick="toast('已在新标签打开','info');closeCtx()">📄 在新标签打开</div>
  <div class="ctx-item" onclick="toast('链接已复制','success');closeCtx()">🔗 复制链接</div>
  <div class="ctx-item" onclick="openModal('moveModal');closeCtx()">📦 移动到…</div>
  <div class="ctx-sep"></div>
  <div class="ctx-item" onclick="toast('开发中','info');closeCtx()">📋 复制文章</div>
  <div class="ctx-item danger" onclick="openModal('deleteModal');closeCtx()">🗑 删除</div>
</div>

<!-- ═══════════ SEARCH OVERLAY ═══════════ -->
<div class="overlay" id="searchOverlay" onclick="if(event.target===this)closeOverlay('searchOverlay')">
  <div class="search-modal">
    <div class="search-input-wrap">
      <svg width="15" height="15" viewBox="0 0 15 15" fill="none" style="flex-shrink:0;opacity:.4"><circle cx="6.5" cy="6.5" r="4.5" stroke="currentColor" stroke-width="1.3"/><path d="M10.5 10.5l3 3" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/></svg>
      <input class="search-input" id="searchInput" placeholder="搜索教程、文章、笔记…" oninput="handleSearch(this.value)">
      <span style="font-size:10.5px;color:var(--t3);cursor:pointer" onclick="closeOverlay('searchOverlay')">ESC</span>
    </div>
    <div class="search-results" id="searchResults">
      <div class="search-section">快捷操作</div>
      <div class="search-item" onclick="window.location.href='/articles/new';closeOverlay('searchOverlay')">
        <div class="search-item-icon" style="background:var(--abg)">✏️</div>
        <div style="flex:1"><div class="search-item-title">新建文章</div><div class="search-item-meta">创建新 Markdown 文章</div></div>
      </div>
      <div class="search-item" onclick="openModal('newSeriesModal');closeOverlay('searchOverlay')">
        <div class="search-item-icon" style="background:var(--gbg)">📂</div>
        <div style="flex:1"><div class="search-item-title">新建系列</div><div class="search-item-meta">创建教程系列</div></div>
      </div>
    </div>
    <div class="search-foot">
      <span><span class="search-kbd2">↑↓</span> 导航</span>
      <span><span class="search-kbd2">↵</span> 打开</span>
      <span><span class="search-kbd2">ESC</span> 关闭</span>
    </div>
  </div>
</div>

<!-- ═══════════ NEW ARTICLE MODAL ═══════════ -->
<div class="overlay" id="newArticleModal" onclick="if(event.target===this)closeOverlay('newArticleModal')">
  <div class="modal">
    <div class="modal-head">
      <div class="modal-title">新建文章</div>
      <button class="modal-close" onclick="closeOverlay('newArticleModal')">✕</button>
    </div>
    <form hx-post="/articles" hx-swap="none">
      <div class="modal-body">
        <div class="form-row">
          <label class="form-label">文章标题 <span style="color:var(--red)">*</span></label>
          <input class="form-input" name="title" placeholder="如：深入理解 JavaScript 闭包" id="newArticleTitle" required>
        </div>
        <div class="form-row">
          <label class="form-label">模板</label>
          <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:7px">
            <div class="template-opt sel" id="tpl-blank" onclick="document.querySelectorAll('.template-opt').forEach(el=>el.classList.remove('sel')); this.classList.add('sel');" style="border:1px solid var(--accent);border-radius:6px;padding:10px 12px;cursor:pointer;background:var(--abg)">
              <div style="font-size:16px;margin-bottom:4px">📄</div>
              <div style="font-size:11px;font-weight:500;color:var(--accent)">空白</div>
              <div style="font-size:10px;color:var(--t3)">从零开始</div>
            </div>
            <div class="template-opt" id="tpl-tut" onclick="document.querySelectorAll('.template-opt').forEach(el=>el.classList.remove('sel')); this.classList.add('sel');" style="border:1px solid var(--border2);border-radius:6px;padding:10px 12px;cursor:pointer">
              <div style="font-size:16px;margin-bottom:4px">📚</div>
              <div style="font-size:11px;font-weight:500">教程</div>
              <div style="font-size:10px;color:var(--t3)">含目标/步骤</div>
            </div>
            <div class="template-opt" id="tpl-note" onclick="document.querySelectorAll('.template-opt').forEach(el=>el.classList.remove('sel')); this.classList.add('sel');" style="border:1px solid var(--border2);border-radius:6px;padding:10px 12px;cursor:pointer">
              <div style="font-size:16px;margin-bottom:4px">📝</div>
              <div style="font-size:11px;font-weight:500">笔记</div>
              <div style="font-size:10px;color:var(--t3)">快速记录</div>
            </div>
          </div>
        </div>
      </div>
      <div class="modal-foot">
        <button type="button" class="btn" onclick="closeOverlay('newArticleModal')">取消</button>
        <button type="submit" class="btn btn-primary" onclick="closeOverlay('newArticleModal')">创建并编辑</button>
      </div>
    </form>
  </div>
</div>

<!-- ═══════════ NEW SERIES MODAL ═══════════ -->
<div class="overlay" id="newSeriesModal" onclick="if(event.target===this)closeOverlay('newSeriesModal')">
  <div class="modal">
    <div class="modal-head">
      <div class="modal-title">新建教程系列</div>
      <button class="modal-close" onclick="closeOverlay('newSeriesModal')">✕</button>
    </div>
    <form hx-post="/series" hx-swap="none" onsubmit="setTimeout(() => window.location.reload(), 300)">
      <div class="modal-body">
        <div class="form-row">
          <label class="form-label">系列名称 <span style="color:var(--red)">*</span></label>
          <input class="form-input" name="title" placeholder="如：Rust 系统编程实战" id="newSeriesName" required>
        </div>
        <div class="form-row">
          <label class="form-label">简介</label>
          <textarea class="form-input" name="description" rows="2" placeholder="一句话描述这个系列的内容…" style="resize:none;line-height:1.5"></textarea>
        </div>
      </div>
      <div class="modal-foot">
        <button type="button" class="btn" onclick="closeOverlay('newSeriesModal')">取消</button>
        <button type="submit" class="btn btn-primary" onclick="closeOverlay('newSeriesModal')">创建系列</button>
      </div>
    </form>
  </div>
</div>

<!-- ═══════════ DELETE CONFIRM MODAL ═══════════ -->
<div class="overlay" id="deleteModal" onclick="if(event.target===this)closeOverlay('deleteModal')">
  <div class="modal confirm-modal">
    <div class="modal-head">
      <div class="modal-title">删除确认</div>
      <button class="modal-close" onclick="closeOverlay('deleteModal')">✕</button>
    </div>
    <div class="modal-body" style="text-align:center;padding:24px 24px 16px">
      <div class="confirm-icon" style="background:var(--rbg)"><svg width="20" height="20" viewBox="0 0 20 20" fill="var(--red)"><path d="M9 3h2v8H9zM9 13h2v2H9z"/></svg></div>
      <div class="confirm-title">确认删除?</div>
      <div class="confirm-desc">此操作不可撤销，内容将被永久删除。</div>
    </div>
    <div class="modal-foot" style="justify-content:center;gap:10px">
      <button class="btn" onclick="closeOverlay('deleteModal')" style="min-width:80px">取消</button>
      <button class="btn btn-danger" onclick="deleteArticle()" style="min-width:80px">确认删除</button>
    </div>
  </div>
</div>

<!-- ═══════════ MOVE MODAL ═══════════ -->
<div class="overlay" id="moveModal" onclick="if(event.target===this)closeOverlay('moveModal')">
  <div class="modal" style="width:400px">
    <div class="modal-head">
      <div class="modal-title">移动到…</div>
      <button class="modal-close" onclick="closeOverlay('moveModal')">✕</button>
    </div>
    <div class="modal-body" style="padding:8px" hx-get="/series/modal-list" hx-trigger="intersect once" id="moveModalList">
      <div style="padding:10px; text-align:center; color:var(--t3); font-size:12px;">加载中...</div>
    </div>
    <div class="modal-foot">
      <button class="btn" onclick="closeOverlay('moveModal')">取消</button>
    </div>
  </div>
</div>

<!-- ═══════════ HISTORY MODAL ═══════════ -->
<div class="overlay" id="historyModal" onclick="if(event.target===this)closeOverlay('historyModal')">
  <div class="modal" style="width:520px">
    <div class="modal-head">
      <div class="modal-title">历史版本</div>
      <button class="modal-close" onclick="closeOverlay('historyModal')">✕</button>
    </div>
    <div class="modal-body" style="padding:8px">
      <div style="padding:0 10px 8px;font-size:11px;color:var(--t3)">保留最近 20 个版本</div>
      <div id="historyList" hx-trigger="intersect once" hx-swap="innerHTML">
        <div style="padding:10px;text-align:center;color:var(--t3)">加载中...</div>
      </div>
    </div>
    <div class="modal-foot">
      <button class="btn" onclick="closeOverlay('historyModal')">关闭</button>
    </div>
  </div>
</div>

<!-- ═══════════ QUICK NOTE MODAL ═══════════ -->
<div class="overlay" id="quickNoteModal" onclick="if(event.target===this)closeOverlay('quickNoteModal')">
  <div class="modal" style="width:440px">
    <div class="modal-head">
      <div class="modal-title">⚡ 快速笔记</div>
      <button class="modal-close" onclick="closeOverlay('quickNoteModal')">✕</button>
    </div>
    <form hx-post="/notes" hx-swap="none" onsubmit="setTimeout(() => { closeOverlay('quickNoteModal'); toast('笔记已保存', 'success'); this.reset(); }, 100)">
      <div class="modal-body">
        <textarea class="form-input" name="content" rows="6" placeholder="快速记录想法、代码片段、链接…&#10;&#10;支持 Markdown 格式" style="resize:none;font-family:var(--fm);font-size:12.5px;line-height:1.7" required></textarea>
      </div>
      <div class="modal-foot">
        <button type="button" class="btn" onclick="closeOverlay('quickNoteModal')">取消</button>
        <button type="submit" class="btn btn-primary">保存笔记</button>
      </div>
    </form>
  </div>
</div>

<!-- ═══════════ PUBLISH MODAL ═══════════ -->
<div class="overlay" id="publishModal" onclick="if(event.target===this)closeOverlay('publishModal')">
  <div class="modal" style="width:420px">
    <div class="modal-head">
      <div class="modal-title">发布文章</div>
      <button class="modal-close" onclick="closeOverlay('publishModal')">✕</button>
    </div>
    <div class="modal-body">
      <div style="background:var(--gbg);border-radius:8px;padding:12px 14px;margin-bottom:14px;border:1px solid rgba(21,163,122,.2)">
        <div style="font-size:12px;font-weight:500;color:var(--green);margin-bottom:3px">✓ 发布检查通过</div>
        <div style="font-size:11px;color:var(--green);opacity:.8">标题、摘要、标签均已填写</div>
      </div>
      <div class="form-row">
        <label class="form-label">摘要预览</label>
        <div style="background:var(--s2);border-radius:6px;padding:10px 12px;font-size:12px;color:var(--t2);line-height:1.6">深入理解 JavaScript 原型链的工作原理，掌握原型式继承、构造函数继承和 ES6 Class 继承的实现差异。</div>
      </div>
      <div class="form-row">
        <label class="form-label">标签</label>
        <div style="display:flex;gap:5px;flex-wrap:wrap">
          <span class="mtag mtag-js">JavaScript</span>
          <span class="mtag" style="background:var(--pbg);color:var(--purple)">原型链</span>
          <span class="mtag" style="background:var(--gbg);color:var(--green)">继承</span>
        </div>
      </div>
      <div class="form-row">
        <label class="form-label">可见性</label>
        <div style="display:flex;gap:8px">
          <label style="display:flex;align-items:center;gap:6px;cursor:pointer;font-size:12px;flex:1;border:1px solid var(--accent);border-radius:6px;padding:8px 10px;background:var(--abg)">
            <input type="radio" name="visibility" checked style="accent-color:var(--accent)"> 公开
          </label>
          <label style="display:flex;align-items:center;gap:6px;cursor:pointer;font-size:12px;flex:1;border:1px solid var(--border2);border-radius:6px;padding:8px 10px">
            <input type="radio" name="visibility" style="accent-color:var(--accent)"> 仅自己
          </label>
        </div>
      </div>
    </div>
    <div class="modal-foot">
      <button class="btn" onclick="closeOverlay('publishModal')">取消</button>
      <button class="btn btn-primary" onclick="publishArticle()">确认发布</button>
    </div>
  </div>
</div>

<!-- ═══════════ USER POPOVER ═══════════ -->
<div class="popover" id="userPopover">
  <div class="popover-head">
    <div class="popover-name">fkcoding</div>
    <div class="popover-email">fkcoding@example.com</div>
  </div>
  <div style="padding:4px">
    <div class="dd-item" onclick="toast('前往设置…','info');closePopover()">⚙️ &nbsp;账户设置</div>
    <div class="dd-item" onclick="toast('已复制邀请链接','success');closePopover()">🔗 &nbsp;分享知识库</div>
    <div class="dd-item" onclick="toast('导出中…','info');closePopover()">📦 &nbsp;导出所有内容</div>
    <div class="dd-sep"></div>
    <form action="/logout" method="post" style="margin:0">
      <button type="submit" class="dd-item danger" style="width:100%;text-align:left;border:none;background:none;font-family:inherit" onclick="closePopover()">🚪 &nbsp;退出登录</button>
    </form>
  </div>
</div>

`;
