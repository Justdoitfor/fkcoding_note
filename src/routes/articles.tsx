import { Hono } from 'hono';
import { Layout } from '../components/Layout';
import { html } from 'hono/html';

const articles = new Hono();

articles.get('/new', async (c) => {
  return c.html(
    <Layout title="编辑器" current="editor">
      <div id="page-editor" style={{ height: 'calc(100vh - var(--topbar-h))' }}>
        <div class="editor-shell" style={{ height: '100%' }}>
          {/* Left tree */}
          <div class="etree">
            <div class="etree-head">
              <div class="etree-series-name">JavaScript 全栈</div>
              <button class="etree-icon-btn" title="新建章节">
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M6 1v10M1 6h10" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/></svg>
              </button>
            </div>
            <div class="etree-body">
              <div class="et-item et-ch">
                <svg class="et-icon" viewBox="0 0 10 10" fill="none"><path d="M2 4l3 3 3-3" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/></svg>
                基础入门
              </div>
              <div class="et-item et-gc active">
                <div class="et-dot"></div>
                原型链机制
              </div>
            </div>
          </div>

          {/* Editor main */}
          <div class="editor-main">
            <div class="editor-topbar">
              <div class="editor-doc-name">原型链与继承机制详解</div>
              <div class="status-saved"><div class="status-dot"></div>已保存</div>
              <button class="btn" style={{ fontSize: '11px', padding: '4px 10px' }}>历史版本</button>
              <button class="btn" style={{ fontSize: '11px', padding: '4px 10px' }}>全屏</button>
              <button class="btn btn-primary" style={{ fontSize: '11px', padding: '4px 10px' }}>发布</button>
            </div>

            <div class="editor-tabs">
              <div class="etab active" onclick="switchEditorMode('edit',this)">编辑</div>
              <div class="etab" onclick="switchEditorMode('preview',this)">预览</div>
              <div class="etab" onclick="switchEditorMode('split',this)">双栏</div>
            </div>

            <div class="toolbar">
              <select class="tb-sel">
                <option>正文</option>
                <option>标题 1</option>
              </select>
              <div class="tb-sep"></div>
              <button class="tb on" title="加粗"><b>B</b></button>
              <button class="tb" title="斜体"><i>I</i></button>
              <button class="tb" title="删除线"><s>S</s></button>
              <button class="tb" title="行内代码" style={{ fontFamily: 'var(--font-mono)', fontSize: '11px' }}>`</button>
            </div>

            {/* Split editor */}
            <div class="editor-split" id="editor-area">
              <div class="ed-pane" id="ed-write">
                <div class="pane-label">Markdown</div>
                <textarea class="ed-textarea" spellcheck={false} id="md-input" x-data="{ content: '# 原型链与继承机制详解\\\\n\\\\n> 🎯 **本文目标**：深入理解 JavaScript 原型链的工作原理。\\\\n\\\\n## 什么是原型链？\\\\n\\\\n在 JavaScript 中，每个对象都有一个内部属性 `[[Prototype]]`...' }" x-model="content" hx-put="/articles/save" hx-trigger="keyup changed delay:1500ms"></textarea>
              </div>
              <div class="prev-pane" id="ed-preview">
                <div class="pane-label">预览</div>
                <div class="prev-body" id="preview-content">
                  {/* Markdown content preview will be rendered here by marked.js on client side */}
                  <h1>原型链与继承机制详解</h1>
                  <blockquote><p>🎯 本文目标：深入理解 JavaScript 原型链的工作原理。</p></blockquote>
                  <h2>什么是原型链？</h2>
                  <p>在 JavaScript 中，每个对象都有一个内部属性...</p>
                </div>
              </div>
            </div>
          </div>

          {/* Meta panel */}
          <div class="meta-pane">
            <div class="meta-sec">
              <div class="meta-lbl">状态</div>
              <div class="meta-val" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><div class="status-dot"></div>已发布</div>
            </div>
            <div class="meta-sec">
              <div class="meta-lbl">所属系列</div>
              <div class="meta-link">JavaScript 全栈 / 基础入门</div>
            </div>
            <div class="meta-sec">
              <div class="meta-lbl">字数</div>
              <div class="meta-num">1,247</div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
});

export default articles;
