/* editor.js — editor visual do PageForge.
   Portado/estendido de maquina-de-leads/modelos/editor-visual.md.
   Opera direto no documento do <iframe> de preview (same-origin). O HTML
   exportado sai LIMPO — nenhum artefato de edição fica no arquivo final. */
(function (global) {
  'use strict';

  var TEXT_SEL = 'h1,h2,h3,h4,h5,h6,p,li,span,button,td,th,figcaption,blockquote,strong,em,small';
  var SECTION_SEL = 'body > section, body > header, body > footer, body > div, main > section, main > header, main > footer';

  var api = { open: open, close: close, isOpen: function () { return !!current; } };
  var current = null; // { iframe, doc, onSave, undo:[], redo:[], panel, bar }

  function $(s, r) { return (r || document).querySelector(s); }

  function open(iframe, onSave) {
    if (current) close();
    var doc = iframe.contentDocument;
    if (!doc || !doc.body) return false;
    current = { iframe: iframe, doc: doc, onSave: onSave || function () {}, undo: [], redo: [] };
    snapshot(); // estado inicial
    buildChrome();
    wireText();
    wireImages();
    wireSections();
    doc.documentElement.setAttribute('data-pf-editing', '1');
    return true;
  }

  function close() {
    if (!current) return;
    var d = current.doc;
    try {
      d.documentElement.removeAttribute('data-pf-editing');
      Array.prototype.forEach.call(d.querySelectorAll('[contenteditable]'), function (n) { n.removeAttribute('contenteditable'); });
      Array.prototype.forEach.call(d.querySelectorAll('.pf-ed-hover,.pf-ed-sec'), function (n) { n.classList.remove('pf-ed-hover', 'pf-ed-sec'); });
      var s = d.getElementById('pf-ed-style'); if (s) s.remove();
      Array.prototype.forEach.call(d.querySelectorAll('.pf-ed-secbar'), function (n) { n.remove(); });
    } catch (e) {}
    if (current.bar) current.bar.remove();
    if (current.panel) current.panel.remove();
    current = null;
  }

  /* ---------- histórico ---------- */
  function currentState() {
    return {
      html: current.doc.body.innerHTML,
      root: current.doc.documentElement.getAttribute('style') || ''
    };
  }
  function snapshot() {
    current.undo.push(currentState());
    if (current.undo.length > 40) current.undo.shift();
    current.redo.length = 0;
    updateButtons();
  }
  function restore(st) {
    current.doc.body.innerHTML = st.html;
    if (st.root) current.doc.documentElement.setAttribute('style', st.root);
    else current.doc.documentElement.removeAttribute('style');
    wireText(); wireImages(); wireSections();
  }
  function undo() {
    if (current.undo.length < 2) return;
    current.redo.push(current.undo.pop());
    restore(current.undo[current.undo.length - 1]);
    updateButtons();
  }
  function redo() {
    if (!current.redo.length) return;
    var st = current.redo.pop();
    current.undo.push(st);
    restore(st);
    updateButtons();
  }
  function updateButtons() {
    if (!current.bar) return;
    $('[data-ed="undo"]', current.bar).disabled = current.undo.length < 2;
    $('[data-ed="redo"]', current.bar).disabled = !current.redo.length;
  }

  /* ---------- chrome (barra + painel, no DOM do pai) ---------- */
  function buildChrome() {
    var d = current.doc;
    var st = d.createElement('style');
    st.id = 'pf-ed-style';
    st.textContent = '.pf-ed-hover{outline:2px dashed #10b981!important;outline-offset:2px;cursor:text}' +
      'img.pf-ed-hover{cursor:pointer}' +
      '[contenteditable="true"]{outline:2px solid #2563eb!important;outline-offset:2px}' +
      '.pf-ed-secbar{position:absolute;z-index:9998;display:flex;gap:4px;background:#0b0f0e;border-radius:8px;padding:3px}' +
      '.pf-ed-secbar button{all:unset;color:#fff;font:600 12px/1 system-ui;padding:5px 8px;border-radius:6px;cursor:pointer}' +
      '.pf-ed-secbar button:hover{background:#1f2937}' +
      '[data-pf-hidden]{opacity:.35;outline:2px dashed #b42318;outline-offset:-2px}';
    d.head.appendChild(st);

    var bar = document.createElement('div');
    bar.className = 'pf-ed-bar';
    bar.innerHTML =
      '<strong>Editor visual</strong>' +
      '<span class="pf-ed-hint">clique em textos, títulos, CTAs e imagens para editar</span>' +
      '<span class="pf-ed-sp"></span>' +
      '<button data-ed="undo" title="Desfazer">↶ Desfazer</button>' +
      '<button data-ed="redo" title="Refazer">↷ Refazer</button>' +
      '<button data-ed="panel">Cores &amp; fontes</button>' +
      '<button data-ed="save" class="pf-ed-primary">Salvar</button>' +
      '<button data-ed="exit">Sair</button>';
    document.body.appendChild(bar);
    current.bar = bar;
    bar.addEventListener('click', function (e) {
      var b = e.target.closest('button'); if (!b) return;
      var a = b.dataset.ed;
      if (a === 'undo') undo();
      else if (a === 'redo') redo();
      else if (a === 'panel') togglePanel();
      else if (a === 'save') doSave();
      else if (a === 'exit') { if (confirm('Sair do editor? Alterações não salvas serão perdidas.')) { close(); document.dispatchEvent(new CustomEvent('pf-editor-exit')); } }
    });
    updateButtons();
  }

  function togglePanel() {
    if (current.panel) { current.panel.remove(); current.panel = null; return; }
    var d = current.doc;
    var cs = d.defaultView.getComputedStyle(d.documentElement);
    var vars = ['--accent', '--ink', '--bg', '--surface', '--accent-ink'];
    var p = document.createElement('div');
    p.className = 'pf-ed-panel';
    p.innerHTML = '<h4>Cores</h4>' + vars.map(function (v) {
      var val = (cs.getPropertyValue(v) || '#000000').trim() || '#000000';
      var hex = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(val) ? val : '#000000';
      return '<label>' + v.replace('--', '') + '<input type="color" data-var="' + v + '" value="' + hex + '"></label>';
    }).join('') +
    '<h4>Fontes</h4>' +
    '<label>Títulos<select data-font="--font-display">' + fontOpts() + '</select></label>' +
    '<label>Texto<select data-font="--font-text">' + fontOpts() + '</select></label>';
    document.body.appendChild(p);
    current.panel = p;
    p.addEventListener('input', function (e) {
      var t = e.target;
      if (t.dataset.var) { snapshot(); d.documentElement.style.setProperty(t.dataset.var, t.value); }
      else if (t.dataset.font && t.value) { snapshot(); d.documentElement.style.setProperty(t.dataset.font, t.value); }
    });
  }
  function fontOpts() {
    var f = ['(manter)', 'ui-sans-serif, system-ui, sans-serif', 'Georgia, "Times New Roman", serif', 'ui-serif, Georgia, serif', '"Segoe UI", Roboto, Helvetica, Arial, sans-serif'];
    return f.map(function (x, i) { return '<option value="' + (i ? x : '') + '">' + (i ? x.split(',')[0].replace(/["]/g, '') : x) + '</option>'; }).join('');
  }

  /* ---------- texto / título / CTA / link ---------- */
  function wireText() {
    var d = current.doc;
    Array.prototype.forEach.call(d.querySelectorAll(TEXT_SEL), function (el) {
      if (el.__pfed) return; el.__pfed = 1;
      if (el.querySelector && el.querySelector(TEXT_SEL)) return; // só folhas de texto
      el.addEventListener('mouseenter', function () { if (!d.documentElement.hasAttribute('data-pf-editing')) return; el.classList.add('pf-ed-hover'); });
      el.addEventListener('mouseleave', function () { el.classList.remove('pf-ed-hover'); });
      el.addEventListener('click', function (e) {
        if (!d.documentElement.hasAttribute('data-pf-editing')) return;
        e.preventDefault(); e.stopPropagation();
        var link = el.tagName === 'A' ? el : el.closest('a');
        if (link && (e.altKey || el.tagName === 'A')) {
          var url = prompt('Link (URL) do botão/link:', link.getAttribute('href') || '');
          if (url !== null) { snapshot(); link.setAttribute('href', url); }
        }
        snapshot();
        el.setAttribute('contenteditable', 'true');
        el.focus();
      });
      el.addEventListener('blur', function () { el.removeAttribute('contenteditable'); });
    });
  }

  /* ---------- imagens ---------- */
  function wireImages() {
    var d = current.doc;
    Array.prototype.forEach.call(d.querySelectorAll('img'), function (img) {
      if (img.__pfed) return; img.__pfed = 1;
      img.addEventListener('mouseenter', function () { img.classList.add('pf-ed-hover'); });
      img.addEventListener('mouseleave', function () { img.classList.remove('pf-ed-hover'); });
      img.addEventListener('click', function (e) {
        if (!d.documentElement.hasAttribute('data-pf-editing')) return;
        e.preventDefault(); e.stopPropagation();
        var inp = document.createElement('input'); inp.type = 'file'; inp.accept = 'image/*';
        inp.onchange = function () {
          var f = inp.files[0]; if (!f) return;
          var r = new FileReader();
          r.onload = function () { snapshot(); img.src = r.result; img.removeAttribute('srcset'); };
          r.readAsDataURL(f);
        };
        inp.click();
      });
    });
  }

  /* ---------- seções: ocultar / reordenar ---------- */
  function wireSections() {
    var d = current.doc;
    Array.prototype.forEach.call(d.querySelectorAll('.pf-ed-secbar'), function (n) { n.remove(); });
    var secs = collectSections(d);
    secs.forEach(function (sec) {
      sec.style.position = sec.style.position || 'relative';
      var bar = d.createElement('div');
      bar.className = 'pf-ed-secbar';
      bar.style.top = '4px'; bar.style.right = '4px';
      bar.innerHTML = '<button data-s="up" title="Subir">↑</button><button data-s="down" title="Descer">↓</button><button data-s="tog" title="Ocultar/mostrar">👁</button>';
      bar.addEventListener('click', function (e) {
        var b = e.target.closest('button'); if (!b) return;
        e.preventDefault(); e.stopPropagation();
        snapshot();
        if (b.dataset.s === 'tog') {
          if (sec.hasAttribute('data-pf-hidden')) { sec.removeAttribute('data-pf-hidden'); sec.style.display = ''; }
          else { sec.setAttribute('data-pf-hidden', '1'); }
        } else if (b.dataset.s === 'up' && sec.previousElementSibling) {
          sec.parentNode.insertBefore(sec, sec.previousElementSibling);
        } else if (b.dataset.s === 'down' && sec.nextElementSibling) {
          sec.parentNode.insertBefore(sec.nextElementSibling, sec);
        }
        wireSections();
      });
      sec.appendChild(bar);
    });
  }
  function collectSections(d) {
    var direct = Array.prototype.slice.call(d.querySelectorAll('body > section, body > header, body > footer, body > main > section, body > main > header, body > main > footer'));
    return direct.filter(function (n) { return n.offsetHeight > 20; });
  }

  /* ---------- salvar ---------- */
  function serialize() {
    var d = current.doc;
    var clone = d.documentElement.cloneNode(true);
    var n = clone.querySelector('#pf-ed-style'); if (n) n.remove();
    Array.prototype.forEach.call(clone.querySelectorAll('.pf-ed-secbar'), function (x) { x.remove(); });
    Array.prototype.forEach.call(clone.querySelectorAll('[contenteditable]'), function (x) { x.removeAttribute('contenteditable'); });
    Array.prototype.forEach.call(clone.querySelectorAll('.pf-ed-hover,.pf-ed-sec'), function (x) { x.classList.remove('pf-ed-hover', 'pf-ed-sec'); });
    Array.prototype.forEach.call(clone.querySelectorAll('[data-pf-hidden]'), function (x) { x.style.display = 'none'; x.removeAttribute('data-pf-hidden'); });
    clone.removeAttribute('data-pf-editing');
    var rootStyle = clone.getAttribute('style');
    if (rootStyle) {
      var head = clone.querySelector('head');
      var st = clone.querySelector('style');
      if (!st) { st = d.createElement('style'); head.appendChild(st); }
      st.textContent += '\n:root{' + rootStyle + '}';
      clone.removeAttribute('style');
    }
    return '<!DOCTYPE html>\n' + clone.outerHTML;
  }
  function doSave() {
    var html = serialize();
    var cb = current.onSave;
    close();
    document.dispatchEvent(new CustomEvent('pf-editor-exit'));
    if (typeof cb === 'function') cb(html);
  }

  global.PFEditor = api;
})(window);
