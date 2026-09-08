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
  var VIEWS = {
    '': 'view-home', '/': 'view-home', '/new': 'view-new', '/preview': 'view-preview', '/generating': 'view-generating',
    '/compare': 'view-compare',
    '/prospeccao': 'view-prospeccao', '/leads': 'view-leads', '/lead': 'view-lead', '/followups': 'view-followups',
    '/projetos': 'view-projetos', '/config': 'view-config'
  };
  function route() {
    var hash = location.hash.replace(/^#/, '') || '/';
    if (hash === '/preview' && !state.generated) hash = '/new';
    var parts = hash.split('/').filter(Boolean); // ['lead','slug']
    var base = '/' + (parts[0] || '');
    var param = parts[1] || '';
    var id = VIEWS[base] || VIEWS[hash] || 'view-home';
    $$('.view').forEach(function (v) { v.classList.toggle('is-active', v.id === id); });
    $$('#mainnav a').forEach(function (a) {
      a.classList.toggle('is-on', a.dataset.route === base || (base === '/lead' && a.dataset.route === '/leads'));
    });
    $('#mainnav').classList.remove('is-open');
    var nt = $('#navToggle'); if (nt) nt.setAttribute('aria-expanded', 'false');
    window.scrollTo(0, 0);
    renderCrumbs(base, param);
    try { PFStore.ui.set({ lastRoute: hash }); } catch (e) {}
    if (id === 'view-new') renderWizard();
    if (id === 'view-preview') renderPreview();
    if (id === 'view-compare') renderCompare();
    if (window.PFProspect) PFProspect.onRoute(base, param, health);
  }

  var CRUMB_LABEL = {
    '/new': 'Criar Página', '/prospeccao': 'Prospecção', '/leads': 'Leads', '/lead': 'Leads',
    '/followups': 'Follow-ups', '/projetos': 'Projetos', '/config': 'Configurações',
    '/preview': 'Preview', '/compare': 'Antes × Depois', '/generating': 'Gerando'
  };
  function renderCrumbs(base, param) {
    var el = $('#crumbs'); if (!el) return;
    if (base === '/' || base === '') { el.hidden = true; el.innerHTML = ''; return; }
    var parts = ['<a href="#/">Dashboard</a>'];
    if (base === '/lead') {
      parts.push('<a href="#/leads">Leads</a>');
      var l = param && window.PFStore && PFStore.leads.get(param);
      parts.push('<span>' + escapeHtml(l ? l.nome : 'Lead') + '</span>');
    } else if (base === '/compare' || base === '/preview') {
      var ls = state.leadSource;
      if (ls && ls.slug) {
        parts.push('<a href="#/leads">Leads</a>');
        parts.push('<a href="#/lead/' + escapeHtml(ls.slug) + '">' + escapeHtml(ls.nome || 'Lead') + '</a>');
      } else if (state.currentProjectId && window.PFStore && PFStore.projects.get(state.currentProjectId)) {
        parts.push('<a href="#/projetos">Projetos</a>');
      }
      parts.push('<span>' + escapeHtml(CRUMB_LABEL[base]) + '</span>');
    } else {
      parts.push('<span>' + escapeHtml(CRUMB_LABEL[base] || base.replace('/', '')) + '</span>');
    }
    el.innerHTML = parts.join('<i>›</i>');
    el.hidden = false;
  }
  window.addEventListener('hashchange', route);

  var navT = $('#navToggle');
  if (navT) navT.addEventListener('click', function () {
    var n = $('#mainnav'); var open = n.classList.toggle('is-open');
    navT.setAttribute('aria-expanded', open ? 'true' : 'false');
  });

  $$('[data-new]').forEach(function (b) {
    b.addEventListener('click', function (e) { e.preventDefault(); ui.step = state.generated ? 3 : 0; location.hash = '#/new'; });
  });

  /* ------------------------------------------------- health (páginas + prospecção) */
  function checkHealth() {
    health = { pages: {}, prospect: {}, demo: {}, integrations: [], offline: false };
    var jget = function (u) { return fetch(u).then(function (r) { return r.json(); }).catch(function () { return { __err: true }; }); };
    Promise.all([jget('/api/health'), jget('/api/prospect'), jget('/api/demo'), jget('/api/integrations')]).then(function (r) {
      health.pages = r[0] || {};
      health.prospect = r[1] || {};
      health.demo = r[2] || {};
      health.integrations = (r[3] && r[3].integrations) || [];
      health.offline = !!(r[0] && r[0].__err) && !!(r[3] && r[3].__err);
      var hp = health.pages, pr = health.prospect;
      var fm = $('#footModel'); if (fm && hp.model) fm.textContent = 'NVIDIA · ' + hp.model;
      var hs = $('#homeStatus');
      if (hs) {
        var partes = [];
        partes.push(hp.ready ? ('Páginas: ' + (hp.mock ? 'modo exemplo' : (hp.provider || 'NVIDIA') + ' pronto')) : 'Páginas: NVIDIA_API_KEY pendente');
        partes.push(pr.ready ? ('Prospecção: ' + (pr.keyConfigured ? 'AIsa pronta' : 'modo exemplo')) : 'Prospecção: AISA_KEY pendente');
        hs.textContent = partes.join('  ·  ');
      }
      if (health.offline) {
        $('#healthBannerText').innerHTML = 'Sem conexão com o servidor. A interface continua funcionando com os dados salvos neste navegador; a geração e a prospecção voltam quando a conexão voltar.';
        $('#healthBanner').hidden = false;
      } else if (!hp.ready || !pr.ready) {
        var msgs = [];
        if (!hp.ready) msgs.push('<code>NVIDIA_API_KEY</code> (geração de páginas)');
        if (!pr.ready) msgs.push('<code>AISA_KEY</code> (prospecção)');
        $('#healthBannerText').innerHTML = 'Configuração pendente na Vercel: ' + msgs.join(' e ') + '. O resto funciona em modo de exemplo — <a href="#/config">ver integrações</a>.';
        $('#healthBanner').hidden = false;
      } else {
        $('#healthBanner').hidden = true;
      }
      if (window.PFProspect) { PFProspect.renderKpis(); PFProspect.onRoute(currentBase(), currentParam(), health); }
    });
  }
  function currentBase() { return '/' + ((location.hash.replace(/^#/, '') || '/').split('/').filter(Boolean)[0] || ''); }
  function currentParam() { return (location.hash.replace(/^#/, '') || '/').split('/').filter(Boolean)[1] || ''; }

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
    if (!health || !health.pages || !health.pages.ready) notes.push(['err', 'NVIDIA_API_KEY não configurada — a geração vai falhar até a chave existir na Vercel.']);
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

  // até 2 retries em erro de rede / 5xx / rate-limit / provider retriável (não em config).
  function callStepRetry(body, onProgress, tries) {
    tries = tries || 0;
    return callStep(body, onProgress).catch(function (err) {
      if (err.isConfig) throw err;
      var msg = (err.code || '') + ' ' + (err.message || '');
      var transient = err.retriable || /rede|encerrada|PROVIDER_ERROR|BAD_PLAN|BAD_RENDER|502|503|504|429|sobrecarregad|fila|limite/i.test(msg);
      if (!transient || tries >= 2) throw err;
      var wait = /429|limite|rate/i.test(msg) ? 7000 : 2500;
      return new Promise(function (r) { setTimeout(r, wait); }).then(function () { return callStepRetry(body, onProgress, tries + 1); });
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
        var SZ = 8; // uma chamada só quando cabe (menos exposição ao rate-limit da NVIDIA)
        var batches = chunk(ids, SZ);
        setStage(2, '');
        var run = Promise.resolve();
        batches.forEach(function (batch, bi) {
          run = run.then(function () {
            if (bi > 0) return new Promise(function (r) { setTimeout(r, 1800); }); // espaça as chamadas (rate limit NVIDIA)
          }).then(function () {
            setStage(3, '(seções ' + (bi * SZ + 1) + '–' + (bi * SZ + batch.length) + ' de ' + ids.length + ')');
            return callStepRetry({ step: 'render', brief: state.brief, plan: plan, sectionIds: batch }, function (f) {
              setStage(3, '(seções ' + (bi * SZ + 1) + '–' + (bi * SZ + batch.length) + ' de ' + ids.length + ', ' + kb(f) + ')');
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
      state.generated = { html: f.html, meta: f.meta || {}, warnings: f.warnings || [], errors: f.errors || [], qa: f.qa || (state.generated && state.generated.qa) || null };
      state.generatedAt = Date.now();
      saveProject();
      save();
      location.hash = '#/preview';
      toast(msg + (f.qa ? '  ·  QA ' + f.qa.score + '/20' : ''));
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

    // botão Antes × Depois só quando a página veio de um lead com site atual
    var lead = state.leadSource && state.leadSource.slug && (window.PFStore && PFStore.leads.get(state.leadSource.slug));
    $('#btnCompare').hidden = !state.leadSource;
    renderQaReport(g.qa);
  }

  function renderQaReport(qa) {
    var el = $('#qaReport');
    if (!qa) { el.hidden = true; el.innerHTML = ''; return; }
    el.hidden = false;
    var dims = qa.dims || {};
    var chips = Object.keys(dims).map(function (k) { return '<span class="qa-dim">' + k + ' ' + dims[k] + '/4</span>'; }).join('');
    el.innerHTML = '<div class="qa-report__head"><strong>Impeccable QA: ' + qa.score + '/20 · ' + escapeHtml(qa.band || '') + '</strong>' + chips + '</div>' +
      (qa.fixes && qa.fixes.length ? '<p class="qa-fixes">Correções aplicadas: ' + qa.fixes.map(escapeHtml).join(' · ') + '</p>' : '') +
      (qa.findings && qa.findings.length ? '<ul class="qa-findings">' + qa.findings.slice(0, 8).map(function (f) { return '<li>[' + f.severity + '] ' + escapeHtml(f.category) + ': ' + escapeHtml(f.msg) + '</li>'; }).join('') + '</ul>' : '');
  }

  $$('.pv-devices button').forEach(function (b) {
    b.addEventListener('click', function () { ui.device = b.dataset.device; renderPreview(); });
  });
  $('#btnEdit').addEventListener('click', function () {
    var e = $('#editbar'); e.hidden = !e.hidden;
    if (!e.hidden) $('#editInstruction').focus();
  });

  /* ---- Editor visual ---- */
  $('#btnVisualEditor').addEventListener('click', function () {
    if (!state.generated) { toast('Gere uma página primeiro.'); return; }
    var frame = $('#pvFrame');
    if (!window.PFEditor) { toast('Editor indisponível.'); return; }
    if (PFEditor.isOpen()) { toast('Editor já aberto.'); return; }
    var ok = PFEditor.open(frame, function (html) {
      state.generated.html = html;
      state.generated.warnings = ['Editado no editor visual — a validação automática não foi refeita.'];
      saveProject(); save();
      renderPreview();
      toast('Alterações salvas.');
    });
    if (!ok) toast('Não consegui abrir o editor neste preview.');
    else toast('Modo edição. Clique nos elementos para editar.');
  });
  document.addEventListener('pf-editor-exit', function () { renderPreview(); });

  /* ---- QA (Impeccable) sob demanda ---- */
  $('#btnQA').addEventListener('click', function () {
    if (!state.generated) { toast('Gere uma página primeiro.'); return; }
    var r = $('#qaReport');
    if (!r.hidden && state.generated.qa) { r.hidden = true; return; }
    toast('Rodando QA…');
    fetch('/api/generate', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ step: 'qa', brief: state.brief, html: state.generated.html }) })
      .then(function (res) { return res.text(); })
      .then(function (txt) {
        var f = txt.trim().split('\n').map(function (l) { try { return JSON.parse(l); } catch (e) { return null; } }).filter(Boolean).pop();
        if (f && f.qa) {
          state.generated.qa = f.qa;
          if (f.html) state.generated.html = f.html;
          save(); renderPreview(); toast('QA: ' + f.qa.score + '/20 (' + f.qa.band + ')');
        } else toast('QA sem retorno.');
      }).catch(function () { toast('Falha no QA.'); });
  });

  /* ---- Antes × Depois ---- */
  $('#btnCompare').addEventListener('click', function () { if (state.generated) location.hash = '#/compare'; });
  function renderCompare() {
    if (!state.generated) { location.hash = '#/preview'; return; }
    var lead = state.leadSource && state.leadSource.slug && window.PFStore ? PFStore.leads.get(state.leadSource.slug) : null;
    $('#compareTitle').textContent = 'Antes × Depois' + (lead ? ' — ' + lead.nome : '');
    $('#compareNew').srcdoc = state.generated.html;
    var oldUrl = lead && lead.siteAntigo;
    var ow = $('#compareOldWrap'); var ol = $('#compareOldLink');
    if (oldUrl) {
      ow.innerHTML = '<iframe src="' + oldUrl.replace(/"/g, '&quot;') + '" title="Site atual" referrerpolicy="no-referrer"></iframe>';
      ol.href = oldUrl; ol.hidden = false;
    } else {
      ow.innerHTML = '<div class="compare-empty"><strong>Sem site para comparar</strong><span>' + escapeHtml((lead && lead.diagnostico) || 'O cliente não tem site próprio.') + '</span></div>';
      ol.hidden = true;
    }
    setCompareMode(compareMode);
  }
  var compareMode = 'depois';
  function setCompareMode(m) {
    compareMode = m;
    $('#compareCols').dataset.mode = m;
    $$('#compareTabs button').forEach(function (b) { b.classList.toggle('on', b.dataset.mode === m); });
  }
  $$('#compareTabs button').forEach(function (b) { b.addEventListener('click', function () { setCompareMode(b.dataset.mode); }); });
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
    if (!health || !health.pages || !health.pages.ready) { toast('Precisa da NVIDIA_API_KEY para ajustar com IA.'); return; }
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

  /* ------------------------------------------------- integração PROSPECÇÃO ↔ builder */
  function toBuilder(brief, pageType, scrollMode, source) {
    var base = blank().brief;
    state.brief = Object.assign({}, base, brief || {});
    if (pageType) state.brief.pageType = pageType;
    if (scrollMode) state.brief.scrollMode = scrollMode;
    state.leadSource = source || null;
    state.generated = null;
    ui.step = 0;
    save();
    location.hash = '#/new';
    if (currentBase() === '/new') renderWizard();
    toast('Briefing preenchido' + (source && source.nome ? ' com ' + source.nome : '') + '. Revise e gere.');
  }

  function saveProject() {
    if (!state.generated) return;
    var b = state.brief || {};
    var id = (state.leadSource && state.leadSource.slug ? state.leadSource.slug + '-' : '') + Date.now().toString(36);
    var existingId = state.currentProjectId;
    var proj = {
      id: existingId || id,
      name: b.projectName || b.productName || 'Página',
      pageType: (state.generated.meta && state.generated.meta.pageType) || b.pageType || 'sales',
      html: state.generated.html,
      meta: state.generated.meta || {},
      qa: state.generated.qa || null,
      leadSlug: state.leadSource && state.leadSource.slug || null,
      leadNome: state.leadSource && state.leadSource.nome || null
    };
    try { window.PFStore && PFStore.projects.upsert(proj); } catch (e) {}
    if (proj.leadSlug) {
      try {
        if (window.PFProspect && PFProspect.setLeadStatus) PFProspect.setLeadStatus(proj.leadSlug, 'redesign-criado', 'redesign gerado');
        else PFStore.leads.upsert({ slug: proj.leadSlug, status: 'redesign-criado' });
      } catch (e) {}
    }
    state.currentProjectId = id;
    if (window.PFProspect) PFProspect.renderKpis();
  }

  function openProject(id, opts) {
    var p = window.PFStore && PFStore.projects.get(id);
    if (!p) { toast('Projeto não encontrado.'); return; }
    state.generated = { html: p.html, meta: p.meta || {}, warnings: [], errors: [], qa: p.qa || null };
    state.currentProjectId = id;
    state.brief = Object.assign({}, blank().brief, state.brief || {}, { projectName: p.name, pageType: p.pageType || 'sales' });
    state.leadSource = p.leadSlug ? { kind: 'lead', slug: p.leadSlug, nome: p.leadNome } : null;
    save();
    location.hash = '#/preview';
    renderPreview();
    if (opts && opts.edit) {
      setTimeout(function () { var b = $('#btnVisualEditor'); if (b) b.click(); }, 350);
    }
    if (opts && opts.compare) { setTimeout(function () { location.hash = '#/compare'; }, 200); }
  }

  /* ------------------------------------------------- confirm dialog */
  function confirmDialog(message, onYes, opts) {
    opts = opts || {};
    var back = document.createElement('div');
    back.className = 'modal';
    back.innerHTML = '<div class="modal__backdrop"></div><div class="modal__box" role="alertdialog" aria-modal="true" style="max-width:440px">' +
      '<h2 style="font-size:1.15rem">' + escapeHtml(opts.title || 'Confirmar') + '</h2>' +
      '<p class="muted" style="font-size:.92rem">' + escapeHtml(message) + '</p>' +
      '<div style="display:flex;gap:.6rem;justify-content:flex-end;margin-top:1.2rem">' +
        '<button class="btn btn--ghost btn--sm" data-cd="no">Cancelar</button>' +
        '<button class="btn btn--primary btn--sm" data-cd="yes">' + escapeHtml(opts.yes || 'Confirmar') + '</button>' +
      '</div></div>';
    document.body.appendChild(back);
    var prevFocus = document.activeElement;
    var close = function () { back.remove(); document.removeEventListener('keydown', onKey); try { prevFocus && prevFocus.focus(); } catch (e) {} };
    var btns = $$('button', back);
    var onKey = function (e) {
      if (e.key === 'Escape') { close(); return; }
      if (e.key === 'Tab') { // trap dentro do modal
        var first = btns[0], last = btns[btns.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    };
    document.addEventListener('keydown', onKey);
    back.querySelector('.modal__backdrop').addEventListener('click', close);
    back.querySelector('[data-cd="no"]').addEventListener('click', close);
    back.querySelector('[data-cd="yes"]').addEventListener('click', function () { close(); try { onYes && onYes(); } catch (e) {} });
    back.querySelector('[data-cd="yes"]').focus();
  }

  /* ------------------------------------------------- onboarding */
  function maybeShowOnboarding(force) {
    var ob = $('#onboarding'); if (!ob) return;
    var st = {};
    try { st = PFStore.ui.get(); } catch (e) {}
    var hasWork = (window.PFStore && (PFStore.leads.count() || PFStore.projects.count())) || state.generated;
    if (!force && (st.onboardingHideForever || st.onboardingDone || hasWork)) return;
    ob.hidden = false;
    var hide = $('#obHide'); if (hide) hide.checked = !!st.onboardingHideForever;
    var first = ob.querySelector('[data-ob-go]'); if (first) setTimeout(function () { first.focus(); }, 30);
  }
  function closeOnboarding() {
    var ob = $('#onboarding'); if (!ob) return;
    ob.hidden = true;
    var hideForever = $('#obHide') && $('#obHide').checked;
    try { PFStore.ui.set({ onboardingDone: true, onboardingHideForever: !!hideForever }); } catch (e) {}
  }
  (function wireOnboarding() {
    var ob = $('#onboarding'); if (!ob) return;
    $$('[data-ob-close]', ob).forEach(function (b) { b.addEventListener('click', closeOnboarding); });
    $$('[data-ob-go]', ob).forEach(function (b) {
      b.addEventListener('click', function () { closeOnboarding(); location.hash = b.dataset.obGo; });
    });
    document.addEventListener('keydown', function (e) {
      if (ob.hidden) return;
      if (e.key === 'Escape') { closeOnboarding(); return; }
      if (e.key === 'Tab') {
        var f = $$('button, a, input', ob.querySelector('.modal__box'));
        if (!f.length) return;
        var first = f[0], last = f[f.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    });
  })();

  function doExportProject(p) {
    if (!p || !p.html) { toast('Projeto sem HTML.'); return; }
    var saved = state.generated;
    state.generated = { html: p.html, meta: p.meta || {}, warnings: [], errors: [] };
    var b = state.brief;
    var kept = { projectName: b.projectName, productName: b.productName, pageType: b.pageType };
    state.brief = Object.assign({}, b, { projectName: p.name || b.projectName, productName: p.name || b.productName });
    doExport();
    state.brief = Object.assign({}, state.brief, kept);
    state.generated = saved;
  }

  if (window.PFProspect) {
    PFProspect.init({
      toast: toast,
      toBuilder: toBuilder,
      openProject: openProject,
      exportProject: doExportProject,
      confirm: confirmDialog,
      showOnboarding: function () { maybeShowOnboarding(true); },
      refreshKpis: function () { if (window.PFProspect) { PFProspect.renderKpis(); if (currentBase() === '/') PFProspect.renderDashboard(health); } },
      go: function (h) { location.hash = h; }
    });
  }

  /* ------------------------------------------------- boot */
  checkHealth();
  if (!location.hash) location.hash = '#/';
  route();
  if (window.PFProspect) { PFProspect.renderKpis(); PFProspect.renderDashboard(health); }
  maybeShowOnboarding(false);
})();
