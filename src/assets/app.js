// ─── Page switcher ───
const pages = ['dashboard', 'editor', 'series', 'stats'];
const navMap = { dashboard:'nav-dashboard', series:'nav-series', editor:'nav-editor', stats:'nav-stats' };
const topbarCur = { dashboard:'总览', editor:'编辑器', series:'教程系列', stats:'统计分析' };

function showPage(name) {
  pages.forEach(p => {
    const el = document.getElementById('page-' + p);
    if (!el) return;
    if (p === name) {
      el.classList.remove('hidden');
      el.style.display = '';
    } else {
      el.classList.add('hidden');
      el.style.display = 'none';
    }
  });

  // Nav active state
  Object.values(navMap).forEach(id => {
    const el = document.getElementById(id);
    if (el) el.classList.remove('active');
  });
  if (navMap[name]) {
    const el = document.getElementById(navMap[name]);
    if (el) el.classList.add('active');
  }

  // Breadcrumb
  document.getElementById('topbar-cur').textContent = topbarCur[name] || name;

  // Switcher buttons
  document.querySelectorAll('.ds-btn').forEach(b => b.classList.remove('active'));
  const btns = document.querySelectorAll('.ds-btn');
  const idx = pages.indexOf(name);
  if (btns[idx]) btns[idx].classList.add('active');
}

// ─── Activity bars ───
const actData = [8,22,35,28,45,32,20,40,17,38,25,48,14,30];
const actMax = Math.max(...actData);
const actContainer = document.getElementById('act-bars');
if (actContainer) {
  actData.forEach((v, i) => {
    const bar = document.createElement('div');
    bar.className = 'act-bar';
    bar.style.height = Math.round((v / actMax) * 100) + '%';
    if (i === actData.length - 1) { bar.classList.add('hi'); }
    else if (v > actMax * 0.6) { bar.classList.add('md'); }
    actContainer.appendChild(bar);
  });
}

// ─── Heatmap ───
const hmGrid = document.getElementById('hm-grid');
if (hmGrid) {
  const levels = ['hm0','hm1','hm2','hm3','hm4'];
  for (let i = 0; i < 371; i++) {
    const cell = document.createElement('div');
    const r = Math.random();
    let cls = 'hm-cell ';
    if (r > 0.88) cls += 'hm4';
    else if (r > 0.74) cls += 'hm3';
    else if (r > 0.58) cls += 'hm2';
    else if (r > 0.42) cls += 'hm1';
    else cls += 'hm0';
    cell.className = cls;
    hmGrid.appendChild(cell);
  }
}

// ─── Tree toggle ───
function toggleTree(el) {
  const icon = el.querySelector('svg');
  const nextSiblings = [];
  let sib = el.nextElementSibling;
  while (sib && !sib.classList.contains('depth-1')) {
    nextSiblings.push(sib);
    sib = sib.nextElementSibling;
  }
  const hidden = nextSiblings.length > 0 && nextSiblings[0].style.display === 'none';
  nextSiblings.forEach(s => s.style.display = hidden ? '' : 'none');
  if (icon) icon.style.transform = hidden ? 'rotate(90deg)' : '';
}

// ─── Tag pills ───
document.querySelectorAll('.tag-pill').forEach(pill => {
  pill.addEventListener('click', function() {
    this.classList.toggle('sel');
  });
});

// ─── Editor tabs ───
function switchEditorMode(mode, el) {
  document.querySelectorAll('.etab').forEach(t => t.classList.remove('active'));
  el.classList.add('active');
  const write = document.getElementById('ed-write');
  const preview = document.getElementById('ed-preview');
  if (!write || !preview) return;
  if (mode === 'edit') {
    write.style.flex = '1'; preview.style.flex = '0'; preview.style.display = 'none';
  } else if (mode === 'preview') {
    write.style.flex = '0'; write.style.display = 'none'; preview.style.flex = '1'; preview.style.display = 'flex';
  } else {
    write.style.flex = '1'; write.style.display = 'flex'; preview.style.flex = '1'; preview.style.display = 'flex';
  }
}

// Show initial page (based on url)
const pathname = window.location.pathname;
if (pathname === '/dashboard' || pathname === '/') {
  showPage('dashboard');
} else if (pathname === '/series') {
  showPage('series');
} else if (pathname.startsWith('/articles')) {
  showPage('editor');
} else if (pathname === '/stats') {
  showPage('stats');
}

// Open JS tree by default
const jsTree = document.getElementById('tree-js');
if (jsTree) jsTree.style.display = '';

// ─── Editor Preview & Meta Update ───
window.updatePreview = function(content) {
  // Update Preview Content using marked.js
  const previewEl = document.getElementById('preview-content');
  if (previewEl && window.marked) {
    previewEl.innerHTML = marked.parse(content);
  }

  // Update Meta Info
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

  // Handle prefix/suffix (like **bold**)
  if (suffix) {
    if (selectedText.startsWith(prefix) && selectedText.endsWith(suffix)) {
      // Toggle off if already applied
      replacement = selectedText.substring(prefix.length, selectedText.length - suffix.length);
      newCursorPos = start + replacement.length;
    } else {
      // Apply
      replacement = prefix + selectedText + suffix;
      newCursorPos = start + prefix.length + selectedText.length;
    }
  } else {
    // Handle prefix only (like blockquotes or lists)
    const isLineStart = start === 0 || text[start - 1] === '\n';
    const lines = selectedText.split('\n');
    
    // Toggle block prefix
    if (lines.every(line => line.startsWith(prefix))) {
      replacement = lines.map(line => line.substring(prefix.length)).join('\n');
    } else {
      replacement = lines.map(line => (isLineStart || start !== end ? prefix : '\n' + prefix) + line).join('\n');
    }
    newCursorPos = start + replacement.length;
  }

  // Update textarea value using standard methods so Alpine/HTMX can pick it up
  textarea.value = text.substring(0, start) + replacement + text.substring(end);
  
  // Update Alpine state if exists
  const alpineData = textarea.__x;
  if (alpineData && alpineData.$data) {
    alpineData.$data.content = textarea.value;
  }
  
  // Dispatch input event to trigger HTMX and Preview
  textarea.dispatchEvent(new Event('input', { bubbles: true }));
  
  // Restore selection
  textarea.focus();
  textarea.setSelectionRange(newCursorPos, newCursorPos);
};