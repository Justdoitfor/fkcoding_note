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

// Show initial page
showPage('dashboard');
// Open JS tree by default
const jsTree = document.getElementById('tree-js');
if (jsTree) jsTree.style.display = '';