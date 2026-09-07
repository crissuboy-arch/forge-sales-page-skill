/* PageForge AI — builder web (vanilla). O "cérebro" roda server-side em /api. */
(function () {
  'use strict';

  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var STORE_KEY = 'pageforge:v1';

  var FIELDS = ['projectName', 'productName', 'description', 'niche', 'language', 'audience', 'offer',
    'price', 'cta', 'benefits', 'pains', 'differentiators', 'mechanism', 'guarantee', 'proof',
    'checkoutUrl', 'checkoutPlatform', 'affiliateUrl', 'notes', 'pageType', 'trafficType',
    'palette', 'styleKeywords', 'artDirection', 'scrollMode'];

  var STEP_TITLES = ['Briefing', 'Tipo', 'Estilo', 'Gerar'];
  var TOTAL_STEPS = 4;

  var state = load();
  var ui = { step: 0, device: 'desktop', codeVisible: false };
  var health = null;

  /* ------------------------------------------------- persistence */
  function blank() {
    return {
      brief: { language: 'pt-BR', pageType: 'sales', scrollMode: 'static', checkoutPlatform: 'generic', trafficType: '' },
      generated: null, // { html, meta, warnings, errors }
      generatedAt: null
    };
  }
  function load() {
    try {
      var raw = localStorage.getItem(STORE_KEY);
      if (!raw) return blank();
      var p = JSON.parse(raw);
      if (!p || !p.brief) return blank();
      return p;
    } catch (e) { return blank(); }
  }
  function save() {
    try { localStorage.setItem(STORE_KEY, JSON.stringify(state)); } catch (e) {}
  }

  /* ------------------------------------------------- toast */
  var toastEl = $('#toast'); var toastT;
  function toast(msg) {
    toastEl.textContent = msg;
    toastEl.classList.add('is-on');
    clearTimeout(toastT);
    toastT = setTimeout(function () { toastEl.classList.remove('is-on'); }, 2600);
  }

  /* ------------------------------------------------- router */
  var VIEWS = { '': 'view-home', '/': 'view-home', '/new': 'view-new', '/preview': 'view-preview', '/generating': 'view-generating' };
  function route() {
    var hash = location.hash.replace(/^#/, '') || '/';
    if (hash === '/preview' && !state.generated) hash = '/new';
    var id = VIEWS[hash] || 'view-home';
    $$('.view').forEach(function (v) { v.classList.toggle('is-active', v.id === id); });
    window.scrollTo(0, 0);
    if (id === 'view-new') renderWizard();
    if (id === 'view-preview') renderPreview();
  }
  window.addEventListener('hashchange', route);

  $$('[data-new]').forEach(function (b) {
    b.addEventListener('click', function (e) { e.preventDefault(); ui.step = state.generated ? 3 : 0; location.hash = '#/new'; });
  });

  /* ------------------------------------------------- health */
  function checkHealth() {
    fetch('/api/health').then(function (r) { return r.json(); }).then(function (h) {
      health = h;
      var hs = $('#homeStatus');
      var fm = $('#footModel');
      if (fm && h.model) fm.textContent = 'NVIDIA · ' + h.model;
      if (h.ready) {
        if (hs) hs.textContent = h.mock ? 'Modo de desenvolvimento (MOCK) ativo.' : 'Motor de IA pronto (NVIDIA · ' + h.model + ').';
      } else {
        if (hs) hs.innerHTML = 'A geração com IA está bloqueada: falta configurar <code>NVIDIA_API_KEY</code>.';
        var b = $('#healthBanner');
        $('#healthBannerText').innerHTML = 'Configuração pendente: defina a variável <code>NVIDIA_API_KEY</code> nas Environment Variables da Vercel e refaça o deploy. O resto do builder funciona normalmente.';
        b.hidden = false;
      }
    }).catch(function () {
      var hs = $('#homeStatus'); if (hs) hs.textContent = 'Não foi possível falar com o servidor de IA.';
    });
  }

  /* ------------------------------------------------- wizard */
  var form = $('#briefForm');

  function fillForm() {
    FIELDS.forEach(function (name) {
      var el = form.elements[name];
      if (!el) return;
      var val = state.brief[name];
      if (el.type === 'radio') { return; }
      if (val == null) return;
      el.value = Array.isArray(val) ? val.join('\n') : val;
    });
    setRadio('pageType', state.brief.pageType || 'sales');
    setRadio('scrollMode', state.brief.scrollMode || 'static');
  }
  function setRadio(name, value) {
    var r = form.querySelector('input[name="' + name + '"][value="' + value + '"]');
    if (r) r.checked = true;
  }
  function readForm() {
    var b = state.brief;
    FIELDS.forEach(function (name) {
      var el = form.elements[name];
      if (!el) return;
      if (el.length && el[0] && el[0].type === 'radio') {
        var sel = form.querySelector('input[name="' + name + '"]:checked');
        b[name] = sel ? sel.value : b[name];
        return;
      }
      if (el.type === 'radio') return;
      var LIST = ['benefits', 'pains', 'differentiators', 'proof', 'styleKeywords'];
      if (LIST.indexOf(name) > -1) {
        b[name] = el.value.split(/\r?\n/).map(function (s) { return s.trim(); }).filter(Boolean);
      } else if (name === 'palette') {
        b[name] = el.value.split(',').map(function (s) { return s.trim(); }).filter(Boolean);
      } else {
        b[name] = el.value.trim();
      }
    });
    save();
  }

  form.addEventListener('input', function () { readForm(); renderRail(); });
  form.addEventListener('change', function () { readForm(); renderRail(); renderPreflight(); });

  function renderStepper() {
    var s = $('#stepper');
    s.innerHTML = '';
    for (var i = 0; i < TOTAL_STEPS; i++) {
      (function (i) {
        var b = document.createElement('button');
        b.type = 'button';
        b.className = 'stepper__b' + (i === ui.step ? ' is-current' : (i < ui.step ? ' is-done' : ''));
        b.textContent = (i + 1) + '. ' + STEP_TITLES[i];
        b.addEventListener('click', function () { gotoStep(i); });
        s.appendChild(b);
      })(i);
    }
  }
  function gotoStep(i) {
    ui.step = Math.max(0, Math.min(TOTAL_STEPS - 1, i));
    $$('.wizard-step').forEach(function (p) { p.hidden = Number(p.dataset.step) !== ui.step; });
    $('#btnPrev').style.visibility = ui.step === 0 ? 'hidden' : 'visible';
    $('#btnNext').hidden = ui.step === TOTAL_STEPS - 1;
    renderStepper();
    if (ui.step === 3) renderPreflight();
    window.scrollTo(0, 0);
  }
  function renderWizard() {
    fillForm();
    gotoStep(ui.step);
    renderRail();
  }

  $('#btnNext').addEventListener('click', function () {
    if (ui.step === 0) {
      var b = state.brief;
      if (!b.productName && !b.description) { toast('Informe ao menos o nome do produto ou a descrição.'); return; }
    }
    gotoStep(ui.step + 1);
  });
  $('#btnPrev').addEventListener('click', function () { gotoStep(ui.step - 1); });
  $('#btnReset').addEventListener('click', function () {
    if (!confirm('Limpar todo o briefing e a página gerada?')) return;
    state = blank(); save(); ui.step = 0; fillForm(); renderRail(); renderPreflight(); toast('Tudo limpo.');
  });

  function renderRail() {
    var b = state.brief;
    var rows = [
      ['Produto', b.productName || b.projectName],
      ['Formato', labelType(b.pageType)],
      ['Scroll', (b.scrollMode || 'static')],
      ['Idioma', b.language],
      ['Preço', b.price],
      ['Destino', b.checkoutUrl || b.affiliateUrl],
      ['Tráfego', b.trafficType]
    ].filter(function (r) { return r[1]; });
    $('#railSummary').innerHTML = rows.map(function (r) {
      return '<dt>' + r[0] + '</dt><dd>' + escapeHtml(String(r[1])) + '</dd>';
    }).join('') || '<dd class="muted tiny">Preencha o briefing…</dd>';
  }
  function labelType(t) {
    return ({ sales: 'Sales Page', presell: 'Presell', advertorial: 'Advertorial', optin: 'Captura', saas: 'SaaS/App', thankyou: 'Obrigado' })[t] || t;
  }

  function renderPreflight() {
    readForm();
    var b = state.brief;
    var el = $('#genPreflight');
    var notes = [];
    if (!health || !health.ready) notes.push(['err', 'NVIDIA_API_KEY não configurada — a geração vai falhar até a chave existir na Vercel.']);
    if (!b.checkoutUrl && !b.affiliateUrl) notes.push(['warn', 'Sem URL de checkout/afiliado: os CTAs vão para “#oferta” (pendência).']);
    if (b.affiliateUrl && b.affiliateUrl.indexOf('#') > -1) notes.push(['ok', 'Fragmento de afiliado (#…) será preservado nos CTAs.']);
    var sens = /sa[úu]de|emagre|suplement|ansiedade|renda|invest|cripto|aposta|relacion/i.test((b.niche || '') + (b.description || '') + (b.offer || ''));
    if (sens) notes.push(['info', 'Nicho sensível detectado: disclaimers e reescritas de compliance serão aplicados; scroll no máximo Motion.']);
    if (!notes.length) notes.push(['ok', 'Tudo pronto para gerar.']);
    el.className = 'notices';
    el.innerHTML = notes.map(function (n) {
      return '<div class="notice notice--' + n[0] + '">' + escapeHtml(n[1]) + '</div>';
    }).join('');
  }

  /* ------------------------------------------------- generate (em etapas) */
  var STAGES6 = ['Analisando briefing', 'Criando copy', 'Montando estrutura', 'Gerando página', 'Validando', 'Finalizando'];

  function renderStages() {
    var ul = $('#genStages'); ul.innerHTML = '';
    STAGES6.forEach(function (l) { var li = document.createElement('li'); li.textContent = l + '...'; ul.appendChild(li); });
  }
  function setStage(idx, detail) {
    var items = $$('#genStages li');
    items.forEach(function (li, i) {
      li.classList.toggle('is-done', i < idx);
      li.classList.toggle('is-active', i === idx);
      li.textContent = STAGES6[i] + (i === idx && detail ? ' ' + detail : '...');
    });
  }
  function allStagesDone() { $$('#genStages li').forEach(function (li) { li.classList.remove('is-active'); li.classList.add('is-done'); }); }

  // Uma etapa = 1 requisição curta a /api/generate lendo o stream NDJSON.
  // Resolve com o frame {t:'done',...}; rejeita com Error (err.code, err.isConfig).
  function callStep(body, onProgress) {
    return new Promise(function (resolve, reject) {
      var settled = false;
      var doneFrame = null;
      fetch('/api/generate', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) })
        .then(function (r) {
          if (!r.body || !r.body.getReader) {
            return r.json().then(function (j) { if (!j.t) j.t = (j.ok === false ? 'error' : 'done'); frame(j); endStream(); });
          }
          var reader = r.body.getReader(); var dec = new TextDecoder(); var buf = '';
          function pump() {
            return reader.read().then(function (res) {
              if (res.value) buf += dec.decode(res.value, { stream: true });
              var lines = buf.split('\n'); buf = lines.pop() || '';
              lines.forEach(function (s) { s = s.trim(); if (s) { try { frame(JSON.parse(s)); } catch (e) {} } });
              if (res.done) { if (buf.trim()) { try { frame(JSON.parse(buf.trim())); } catch (e) {} } endStream(); return; }
              return pump();
            });
          }
          return pump();
        })
        .catch(function (err) { fin(new Error('rede: ' + (err && err.message || err))); });

      function frame(f) {
        if (!f || settled) return;
        if (f.t === 'progress' && onProgress) onProgress(f);
        else if (f.t === 'done') doneFrame = f;
        else if (f.t === 'error') {
          var e = new Error(f.error || 'falha');
          e.code = f.code; e.isConfig = (f.code === 'NVIDIA_KEY_MISSING'); e.retriable = f.retriable;
          fin(e);
        }
      }
      function endStream() { if (settled) return; if (doneFrame) fin(null, doneFrame); else fin(new Error('conexão encerrada antes do fim')); }
      function fin(err, val) { if (settled) return; settled = true; if (err) reject(err); else resolve(val); }
    });
  }

  // 1 retry seguro em erro de rede / 5xx / provider retriável (não em config).
  function callStepRetry(body, onProgress) {
    return callStep(body, onProgress).catch(function (err) {
      if (err.isConfig) throw err;
      var transient = err.retriable || /rede|encerrada|PROVIDER_ERROR|BAD_PLAN|BAD_RENDER|502|503|504|429/i.test((err.code || '') + ' ' + err.message);
      if (!transient) throw err;
      return new Promise(function (r) { setTimeout(r, 1500); }).then(function () { return callStep(body, onProgress); });
    });
  }

  function chunk(arr, n) { var o = []; for (var i = 0; i < arr.length; i += n) o.push(arr.slice(i, i + n)); return o; }

  function generate(opts) {
    opts = opts || {};
    lastGenOpts = opts;
    readForm();
    location.hash = '#/generating';
    resetGenView();
    renderStages();
    var kb = function (f) { return Math.max(1, Math.round((f.chars || 0) / 1024)) + ' KB'; };

    // ----- ajuste de seção no preview: uma requisição só -----
    if (opts.section) {
      $('#genSubtitle').textContent = 'Aplicando o ajuste…';
      setStage(3, '');
      callStepRetry({ brief: state.brief, mode: 'section', instruction: opts.instruction, currentHtml: state.generated && state.generated.html }, function (f) { setStage(3, '(' + kb(f) + ')'); })
        .then(function (f) { finishOk(f, 'Ajuste aplicado.'); })
        .catch(function (e) { fail(e); });
      return;
    }

    // ----- geração completa em etapas -----
    $('#genSubtitle').textContent = 'A PageForge AI está montando a página em etapas.';
    var plan = null;
    var sections = {};

    setStage(0, '');
    callStepRetry({ step: 'plan', brief: state.brief }, function (f) { setStage(1, '(' + kb(f) + ')'); })
      .then(function (f) {
        plan = f.plan;
        var ids = (plan.sections || []).map(function (s) { return s.id; });
        if (!ids.length) throw new Error('plano sem seções');
        var batches = chunk(ids, 3);
        setStage(2, '');
        var run = Promise.resolve();
        batches.forEach(function (batch, bi) {
          run = run.then(function () {
            setStage(3, '(seções ' + (bi * 3 + 1) + '–' + (bi * 3 + batch.length) + ' de ' + ids.length + ')');
            return callStepRetry({ step: 'render', brief: state.brief, plan: plan, sectionIds: batch }, function (f) {
              setStage(3, '(seções ' + (bi * 3 + 1) + '–' + (bi * 3 + batch.length) + ' de ' + ids.length + ', ' + kb(f) + ')');
            }).then(function (f) { Object.keys(f.sections || {}).forEach(function (k) { sections[k] = f.sections[k]; }); });
          });
        });
        return run;
      })
      .then(function () {
        if (!Object.keys(sections).length) throw new Error('nenhuma seção renderizada');
        setStage(4, '');
        return callStepRetry({ step: 'assemble', brief: state.brief, plan: plan, sections: sections });
      })
      .then(function (f) {
        setStage(5, '');
        allStagesDone();
        finishOk(f, 'Página gerada.');
      })
      .catch(function (e) { fail(e); });

    function finishOk(f, msg) {
      if (!f || !f.html) { fail(new Error((f && f.errors && f.errors.join(' ')) || 'A IA não devolveu uma página.')); return; }
      state.generated = { html: f.html, meta: f.meta || {}, warnings: f.warnings || [], errors: f.errors || [] };
      state.generatedAt = Date.now();
      save();
      location.hash = '#/preview';
      toast(msg);
    }
    function fail(err) {
      if (err && err.isConfig) showFatal('Falta a NVIDIA_API_KEY', err.message, true);
      else showFatal('Não deu para gerar', (err && err.message) || 'Falha desconhecida na geração.', false);
    }
  }

  function showFatal(title, message, isConfig) {
    var v = $('#view-generating .gen');
    v.innerHTML = '<h2>' + escapeHtml(title) + '</h2><p class="muted" style="max-width:46ch;margin:0 auto 1.2rem">' + escapeHtml(message) + '</p>' +
      (isConfig ? '<p class="tiny muted" style="max-width:46ch;margin:0 auto 1.2rem">Na Vercel: Project → Settings → Environment Variables → <code>NVIDIA_API_KEY</code> → Redeploy.</p>' : '') +
      '<div style="display:flex;gap:.6rem;justify-content:center;flex-wrap:wrap">' +
      (isConfig ? '' : '<button class="btn btn--primary btn--sm" id="genRetry">Tentar de novo</button>') +
      '<button class="btn btn--ghost btn--sm" id="genBack">Voltar ao briefing</button></div>';
    $('#genBack').addEventListener('click', function () { location.hash = '#/new'; resetGenView(); });
    var rb = $('#genRetry');
    if (rb) rb.addEventListener('click', function () { resetGenView(); renderStages(); generate(lastGenOpts); });
  }
  var lastGenOpts = {};
  function resetGenView() {
    $('#view-generating .gen').innerHTML =
      '<div class="gen__spin" aria-hidden="true"></div><h2>Gerando sua página…</h2>' +
      '<p class="muted" id="genSubtitle">Isso costuma levar de 20 a 60 segundos.</p><ul class="gen__stages" id="genStages"></ul>';
  }

  $('#btnGenerate').addEventListener('click', function () { generate(); });

  /* ------------------------------------------------- preview */
  function renderPreview() {
    if (!state.generated) { location.hash = '#/new'; return; }
    var g = state.generated;
    var frame = $('#pvFrame');
    frame.srcdoc = g.html;
    $('#frameWrap').dataset.device = ui.device;
    $$('.pv-devices button').forEach(function (b) { b.classList.toggle('is-active', b.dataset.device === ui.device); });
    $('#footModel').textContent = g.meta && g.meta.model ? ('NVIDIA · ' + g.meta.model) : 'NVIDIA';

    var n = $('#notices'); n.innerHTML = '';
    var items = [];
    if (g.meta && g.meta.model === 'mock') items.push(['info', 'Página de exemplo (MOCK). Configure a NVIDIA_API_KEY para gerar de verdade.']);
    (g.errors || []).forEach(function (e) { items.push(['err', e]); });
    (g.warnings || []).forEach(function (w) { items.push(['warn', w]); });
    if (!items.length) items.push(['ok', 'Nenhum aviso. Revise no preview antes de exportar.']);
    if (g.meta && typeof g.meta.ms === 'number') items.push(['info', 'Gerado em ' + (g.meta.ms / 1000).toFixed(1) + 's · formato ' + labelType(g.meta.pageType) + ' · scroll ' + (g.meta.scrollMode || '—')]);
    n.innerHTML = items.map(function (it) { return '<div class="notice notice--' + it[0] + '">' + escapeHtml(it[1]) + '</div>'; }).join('');
  }

  $$('.pv-devices button').forEach(function (b) {
    b.addEventListener('click', function () { ui.device = b.dataset.device; renderPreview(); });
  });
  $('#btnEdit').addEventListener('click', function () {
    var e = $('#editbar'); e.hidden = !e.hidden;
    if (!e.hidden) $('#editInstruction').focus();
  });
  $('#btnToggleCode').addEventListener('click', function () {
    var w = $('#codeWrap'); w.hidden = !w.hidden;
    if (!w.hidden) { $('#codeArea').value = state.generated.html; }
  });
  $('#btnApplyCode').addEventListener('click', function () {
    var html = $('#codeArea').value;
    if (html.indexOf('<') === -1) { toast('Isso não parece HTML.'); return; }
    state.generated.html = html; state.generated.warnings = ['Editado manualmente — a validação automática não foi refeita.'];
    save(); renderPreview(); toast('Edição aplicada.');
  });
  $$('.chip[data-instruction]').forEach(function (c) {
    c.addEventListener('click', function () { $('#editInstruction').value = c.dataset.instruction; });
  });
  $('#btnApplyAi').addEventListener('click', function () {
    var instr = $('#editInstruction').value.trim();
    if (!instr) { toast('Escreva a instrução ou escolha um atalho.'); return; }
    if (!health || !health.ready) { toast('Precisa da NVIDIA_API_KEY para ajustar com IA.'); return; }
    generate({ section: true, instruction: instr });
  });
  $('#btnRegen').addEventListener('click', function () {
    if (!confirm('Gerar uma nova versão do zero com o mesmo briefing?')) return;
    generate();
  });
  $('#btnCopy').addEventListener('click', function () {
    var html = state.generated.html;
    (navigator.clipboard ? navigator.clipboard.writeText(html) : Promise.reject()).then(function () {
      toast('HTML copiado.');
    }).catch(function () {
      var ta = document.createElement('textarea'); ta.value = html; document.body.appendChild(ta); ta.select();
      try { document.execCommand('copy'); toast('HTML copiado.'); } catch (e) { toast('Não consegui copiar.'); }
      document.body.removeChild(ta);
    });
  });
  $('#btnOpen').addEventListener('click', function () {
    var blob = new Blob([state.generated.html], { type: 'text/html' });
    var url = URL.createObjectURL(blob);
    window.open(url, '_blank', 'noopener');
    setTimeout(function () { URL.revokeObjectURL(url); }, 20000);
  });

  /* ------------------------------------------------- export */
  $('#btnExport').addEventListener('click', doExport);

  function slugify(s) {
    return (s || 'pagina').toString().toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
      .replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '').slice(0, 50) || 'pagina';
  }

  function doExport() {
    if (!state.generated) return;
    var b = state.brief;
    var slug = slugify(b.projectName || b.productName);
    var html = state.generated.html;
    var domain = 'https://exemplo.com';
    var robots = 'User-agent: *\nAllow: /\n\nSitemap: ' + domain + '/sitemap.xml\n';
    var sitemap = '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n  <url><loc>' + domain + '/</loc></url>\n</urlset>\n';
    var manifest = JSON.stringify({
      name: b.productName || b.projectName || 'Página', short_name: (b.productName || 'Página').slice(0, 12),
      lang: b.language || 'pt-BR', start_url: '/', display: 'browser', theme_color: '#111111', background_color: '#ffffff', icons: []
    }, null, 2);
    var readme = buildReadme(b, state.generated.meta || {}, state.generated.warnings || []);

    var entries = [
      { name: 'index.html', data: html },
      { name: 'robots.txt', data: robots },
      { name: 'sitemap.xml', data: sitemap },
      { name: 'site.webmanifest', data: manifest },
      { name: 'README-PUBLICAR.md', data: readme }
    ];

    toast('Compactando…');
    window.PFZip.makeZip(entries).then(function (blob) {
      var a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = slug + '-pagina.zip';
      document.body.appendChild(a); a.click(); document.body.removeChild(a);
      setTimeout(function () { URL.revokeObjectURL(a.href); }, 20000);
      toast('pagina.zip baixado.');
    }).catch(function (e) { toast('Falha ao compactar: ' + e.message); });
  }

  function buildReadme(b, meta, warnings) {
    var L = [];
    L.push('# Publicar esta página');
    L.push('');
    L.push('Gerada pela **PageForge AI** — formato: ' + labelType(b.pageType) + ' · scroll: ' + (b.scrollMode || 'static') + (meta.model ? ' · modelo: ' + meta.model : ''));
    L.push('');
    L.push('Esta página é **independente**. Não precisa da PageForge AI para funcionar.');
    L.push('');
    L.push('## Conteúdo do pacote');
    L.push('- `index.html` — a página completa (CSS e JS embutidos)');
    L.push('- `robots.txt`, `sitemap.xml`, `site.webmanifest`');
    L.push('');
    L.push('## Publicar');
    L.push('1. **Netlify:** arraste esta pasta (ou o zip) em app.netlify.com/drop.');
    L.push('2. **Vercel:** `vercel` na pasta, ou importe como projeto estático (Output = raiz).');
    L.push('3. **Cloudflare Pages / GitHub Pages:** suba a pasta como site estático.');
    L.push('4. **Hospedagem cPanel:** File Manager → `public_html` → enviar o zip → extrair.');
    L.push('');
    L.push('## Antes de ligar o tráfego');
    L.push('- Trocar o domínio placeholder `https://exemplo.com` em: `index.html` (canonical/OG), `robots.txt`, `sitemap.xml`.');
    L.push('- Conferir a URL de destino dos botões: `' + (b.checkoutUrl || b.affiliateUrl || '(defina o checkout)') + '`');
    L.push('- Colar GA4 / Meta Pixel / GTM no lugar do comentário de analytics e ligar `trackCTA()`.');
    if (b.affiliate || b.affiliateUrl) L.push('- Afiliado: confirmar o disclosure visível e o parâmetro de afiliado preservado no clique.');
    L.push('- Rodar o checklist de compliance do nicho.');
    if (warnings && warnings.length) {
      L.push('');
      L.push('## Avisos da geração');
      warnings.forEach(function (w) { L.push('- ' + w); });
    }
    L.push('');
    L.push('_Gerado por PageForge AI. Sem garantia; revise a copy e os dados antes de publicar._');
    return L.join('\n');
  }

  /* ------------------------------------------------- utils */
  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c];
    });
  }

  /* ------------------------------------------------- boot */
  checkHealth();
  if (!location.hash) location.hash = '#/';
  route();
})();
