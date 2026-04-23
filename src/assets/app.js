// ─── PAGE ROUTING ───
function showPage(name) {
  const urlMap = { dashboard: '/dashboard', series: '/series', editor: '/articles/new', stats: '/stats' };
  if (urlMap[name] && window.location.pathname !== urlMap[name]) {
    window.location.href = urlMap[name];
  }
}

// ─── MODALS ───
function openModal(id) {
  closeCtx();
  const el = document.getElementById(id);
  if (el) {
    el.classList.add('show');
    setTimeout(() => {
      const focusEl = el.querySelector('input, textarea, select, button');
      if (focusEl) focusEl.focus();
    }, 0);
  }
}
function closeOverlay(id) {
  const el = document.getElementById(id);
  if (el) el.classList.remove('show');
}
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') {
    document.querySelectorAll('.overlay.show').forEach(o => o.classList.remove('show'));
    closeCtx();
    closePopover();
  }
  if ((e.metaKey || e.ctrlKey) && e.key === 'k') { e.preventDefault(); openModal('searchOverlay'); }
});

// ─── TOAST ───
function toast(msg, type = 'default') {
  const area = document.getElementById('toastArea');
  if (!area) return;
  const t = document.createElement('div');
  t.className = 'toast ' + (type !== 'default' ? type : '');
  const icons = {success:'✓', error:'✕', info:'ℹ'};
  t.innerHTML = `<span style="opacity:.7">${icons[type] || '•'}</span> ${msg}`;
  area.appendChild(t);
  setTimeout(() => { t.classList.add('toast-fade'); setTimeout(() => t.remove(), 300); }, 2200);
}

// ─── CONTEXT MENU ───
let activeCtxArticleId = null;

function showCtx(e, articleId) {
  e.preventDefault();
  activeCtxArticleId = articleId;
  const m = document.getElementById('ctxMenu');
  if (!m) return;
  m.style.left = Math.min(e.clientX, window.innerWidth - 180) + 'px';
  m.style.top = Math.min(e.clientY, window.innerHeight - 200) + 'px';
  m.classList.add('show');
}
function closeCtx() { 
  const m = document.getElementById('ctxMenu');
  if (m) m.classList.remove('show'); 
}
document.addEventListener('click', e => { if (!e.target.closest('#ctxMenu')) closeCtx(); });

// ─── CTX MENU ACTIONS ───
function ctxOpenBlank() {
  if (activeCtxArticleId) {
    window.open(`/articles/edit/${activeCtxArticleId}`, '_blank');
  }
  closeCtx();
}
function ctxCopyLink() {
  if (activeCtxArticleId) {
    navigator.clipboard.writeText(`${window.location.origin}/articles/edit/${activeCtxArticleId}`);
    toast('链接已复制', 'success');
  }
  closeCtx();
}
function ctxMove() {
  if (activeCtxArticleId) {
    // 借用现有的 moveModal 逻辑，修改下全局 id
    window.history.pushState({}, '', `/articles/edit/${activeCtxArticleId}`);
    openModal('moveModal');
  }
  closeCtx();
}
function ctxDelete() {
  if (activeCtxArticleId) {
    // 借用现有的 deleteModal 逻辑，修改下全局 id
    window.history.pushState({}, '', `/articles/edit/${activeCtxArticleId}`);
    openModal('deleteModal');
  }
  closeCtx();
}

// ─── USER POPOVER ───
function togglePopover() {
  const p = document.getElementById('userPopover');
  if (p) p.classList.toggle('show');
}
function closePopover() { 
  const p = document.getElementById('userPopover');
  if (p) p.classList.remove('show'); 
}
document.addEventListener('click', e => { if (!e.target.closest('.sidebar-bottom')) closePopover(); });

// ─── TREE TOGGLE ───
function toggleTree(id) {
  const el = document.getElementById(id);
  const chev = document.getElementById(id + '-chev');
  if (!el) return;
  const collapsed = el.classList.contains('collapsed') || el.style.display === 'none';
  el.classList.toggle('collapsed', !collapsed);
  el.style.display = '';
  if (chev) chev.classList.toggle('open', collapsed);
}

function toggleETree(id) {
  const el = document.getElementById(id);
  const icon = document.getElementById(id + '-i');
  if (!el) return;
  const hidden = el.style.display === 'none';
  el.style.display = hidden ? '' : 'none';
  if (icon) icon.classList.toggle('open', hidden);
}

function toggleStree(id) {
  const el = document.getElementById(id);
  const chev = document.getElementById(id + '-chev');
  if (!el) return;
  const hidden = el.style.display === 'none' || !el.style.display;
  el.style.display = hidden ? 'block' : 'none';
  if (chev) chev.classList.toggle('open', hidden);
}

// ─── EDITOR MODE ───
function switchEdMode(mode) {
  ['edit','prev','split'].forEach(m => {
    const t = document.getElementById('etab-' + m);
    if (t) t.classList.toggle('active', m === mode);
  });
  const w = document.getElementById('edWrite');
  const p = document.getElementById('edPrev');
  if (!w || !p) return;
  if (mode === 'edit')  { w.style.display = 'flex'; p.style.display = 'none'; }
  if (mode === 'prev')  { w.style.display = 'none'; p.style.display = 'flex'; }
  if (mode === 'split') { w.style.display = 'flex'; p.style.display = 'flex'; }
}

// ─── FILTER BY TAG ───
function filterByTag(el) {
  const active = el.classList.contains('active');
  toast(active ? `已按「${el.textContent}」筛选` : '已取消筛选', 'info');
}

// ─── EDITOR ACTIONS ───
window.openPublishModal = function() {
  const titleInput = document.getElementById('title-input');
  if (titleInput) {
    const pubTitlePreview = document.getElementById('pubTitlePreview');
    if (pubTitlePreview) {
      pubTitlePreview.textContent = titleInput.value || '无标题文章';
    }
  }
  openModal('publishModal');
};

window.publishArticle = function() {
  const id = window.location.pathname.split('/').pop();
  htmx.ajax('POST', `/articles/${id}/publish`, {swap:'none'}).then(() => {
    closeOverlay('publishModal');
    toast('文章已成功发布 🎉', 'success');
    setTimeout(() => window.location.reload(), 500);
  });
};

window.deleteArticle = function() {
  const id = window.location.pathname.split('/').pop();
  htmx.ajax('DELETE', `/articles/${id}`, {swap:'none'}).then(() => {
    closeOverlay('deleteModal');
    toast('文章已删除', 'success');
    setTimeout(() => window.location.href = '/dashboard', 500);
  });
};

window.moveArticle = function(seriesId) {
  const id = window.location.pathname.split('/').pop();
  htmx.ajax('POST', `/articles/${id}/move`, {values: {seriesId}, swap:'none'}).then(() => {
    closeOverlay('moveModal');
    toast('文章已移动', 'success');
    setTimeout(() => window.location.reload(), 500);
  });
};

window.openHistoryModal = function(articleId) {
  const list = document.getElementById('historyList');
  if (list) {
    list.innerHTML = '<div style="padding:10px;text-align:center;color:var(--t3)">加载中...</div>';
    htmx.ajax('GET', `/articles/${articleId}/history`, {target: '#historyList', swap: 'innerHTML'});
  }
  openModal('historyModal');
};

window.restoreHistory = function(historyId) {
  if (confirm('确定恢复到该历史版本？')) {
    const articleId = window.location.pathname.split('/').pop();
    htmx.ajax('POST', `/articles/${articleId}/restore/${historyId}`, {swap:'none'}).then(() => {
      closeOverlay('historyModal');
      toast('文章已恢复', 'success');
      setTimeout(() => window.location.reload(), 500);
    });
  }
};

// ─── Editor Preview & Meta Update ───
window.updatePreview = function(content) {
  const previewEl = document.getElementById('preview-content');
  if (previewEl && window.marked) {
    previewEl.innerHTML = marked.parse(content);
  }
  const wordCount = content.replace(/\s+/g, '').length;
  const readTime = Math.max(1, Math.ceil(wordCount / 300));
  
  const countEl = document.getElementById('meta-word-count');
  if (countEl) countEl.textContent = wordCount;
  
  const timeEl = document.getElementById('meta-read-time');
  if (timeEl) timeEl.textContent = `约 ${readTime} 分钟`;
};

// Initial parse for preview if needed
setTimeout(() => {
  const mdInput = document.getElementById('md-input');
  if (mdInput) updatePreview(mdInput.value);
}, 100);

// ─── Markdown Toolbar Helper ───
window.insertMarkdown = function(prefix, suffix = '') {
  const textarea = document.getElementById('md-input');
  if (!textarea) return;

  const start = textarea.selectionStart;
  const end = textarea.selectionEnd;
  const text = textarea.value;
  const selectedText = text.substring(start, end);
  
  let replacement = '';
  let newCursorPos = 0;

  if (suffix) {
    if (selectedText.startsWith(prefix) && selectedText.endsWith(suffix)) {
      replacement = selectedText.substring(prefix.length, selectedText.length - suffix.length);
      newCursorPos = start + replacement.length;
    } else {
      replacement = prefix + selectedText + suffix;
      newCursorPos = start + prefix.length + selectedText.length;
    }
  } else {
    const isLineStart = start === 0 || text[start - 1] === '\n';
    const lines = selectedText.split('\n');
    if (lines.every(line => line.startsWith(prefix))) {
      replacement = lines.map(line => line.substring(prefix.length)).join('\n');
    } else {
      replacement = lines.map(line => (isLineStart || start !== end ? prefix : '\n' + prefix) + line).join('\n');
    }
    newCursorPos = start + replacement.length;
  }

  textarea.value = text.substring(0, start) + replacement + text.substring(end);
  
  const alpineData = textarea.__x;
  if (alpineData && alpineData.$data) {
    alpineData.$data.content = textarea.value;
  }
  textarea.dispatchEvent(new Event('input', { bubbles: true }));
  textarea.focus();
  textarea.setSelectionRange(newCursorPos, newCursorPos);
};

// ─── Editor Tab Key Handler ───
document.addEventListener('keydown', function(e) {
  const textarea = document.getElementById('md-input');
  if (!textarea || document.activeElement !== textarea) return;

  if (e.key === 'Tab') {
    e.preventDefault();
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = textarea.value;
    
    if (start !== end && text.substring(start, end).includes('\n')) {
      const selectedLines = text.substring(start, end).split('\n');
      let replacement = '';
      if (e.shiftKey) {
        replacement = selectedLines.map(line => line.startsWith('  ') ? line.substring(2) : (line.startsWith('\t') ? line.substring(1) : line)).join('\n');
      } else {
        replacement = selectedLines.map(line => '  ' + line).join('\n');
      }
      textarea.value = text.substring(0, start) + replacement + text.substring(end);
      textarea.selectionStart = start;
      textarea.selectionEnd = start + replacement.length;
    } else {
      if (!e.shiftKey) {
        textarea.value = text.substring(0, start) + '  ' + text.substring(end);
        textarea.selectionStart = textarea.selectionEnd = start + 2;
      }
    }
    const alpineData = textarea.__x;
    if (alpineData && alpineData.$data) {
      alpineData.$data.content = textarea.value;
    }
    textarea.dispatchEvent(new Event('input', { bubbles: true }));
  }
});

// ─── SEARCH HANDLER ───
window.handleSearch = function(val) {
  if (val.trim()) {
    htmx.ajax('GET', `/articles/search?q=${encodeURIComponent(val)}`, {target: '#searchResults', swap: 'innerHTML'});
  } else {
    document.getElementById('searchResults').innerHTML = `
      <div class="search-section">快捷操作</div>
      <div class="search-item" onclick="window.location.href='/articles/new';closeOverlay('searchOverlay')">
        <div class="search-item-icon" style="background:var(--abg)">✏️</div>
        <div style="flex:1"><div class="search-item-title">新建文章</div><div class="search-item-meta">创建新 Markdown 文章</div></div>
      </div>
      <div class="search-item" onclick="openModal('newSeriesModal');closeOverlay('searchOverlay')">
        <div class="search-item-icon" style="background:var(--gbg)">📂</div>
        <div style="flex:1"><div class="search-item-title">新建系列</div><div class="search-item-meta">创建教程系列</div></div>
      </div>
    `;
  }
};
