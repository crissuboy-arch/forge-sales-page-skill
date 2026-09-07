/* prospect.js — modo PROSPECÇÃO da PageForge AI.
   Motor/dados: /api/prospect (AIsa server-side). Armazenamento: PFStore.leads.
   Integra com o builder via ctx.toBuilder(briefing). */
(function (global) {
  'use strict';

  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };

  var ctx = null; // { toast, toBuilder, go, health }
  var STATUS = ['novo', 'contatado', 'em-criacao', 'redesenhado', 'publicado', 'proposta', 'fechado', 'descartado'];
  var STATUS_LABEL = { novo: 'Novo', contatado: 'Contatado', 'em-criacao': 'Em criação', redesenhado: 'Redesenhado', publicado: 'Publicado', proposta: 'Proposta enviada', fechado: 'Fechado', descartado: 'Descartado' };
  var leadsFilterStatus = '';

  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c];
    });
  }
  function tempBadge(t) {
    var e = t === 'quente' ? '🔥' : (t === 'morno' ? '🌤️' : '❄️');
    return '<span class="temp temp--' + esc(t || 'frio') + '">' + e + ' ' + esc(t || 'frio') + '</span>';
  }
  function digits(s) { return String(s || '').replace(/[^\d]/g, ''); }

  /* ---------------- API ---------------- */
  function apiProspect(body) {
    return fetch('/api/prospect', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) })
      .then(function (r) { return r.json(); });
  }

  /* ---------------- PROSPECÇÃO ---------------- */
  function bindProspectForm() {
    var form = $('#prospectForm');
    if (!form || form.__bound) return;
    form.__bound = true;
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var fd = new FormData(form);
      var body = {
        niche: (fd.get('niche') || '').trim(),
        city: (fd.get('city') || '').trim(),
        count: Number(fd.get('count')) || 10,
        minRating: Number(fd.get('minRating')) || 0,
        minReviews: Number(fd.get('minReviews')) || 0
      };
      if (!body.niche || !body.city) { ctx.toast('Informe nicho e cidade.'); return; }
      var btn = $('#btnProspect'); var st = $('#prospectStatus');
      btn.disabled = true; st.textContent = 'Buscando empresas… (até ~1 min)';
      $('#prospectResults').innerHTML = '<div class="prospect-loading"><div class="gen__spin"></div><p class="muted">Consultando Google Maps, Instagram e IA…</p></div>';
      apiProspect(body).then(function (res) {
        btn.disabled = false;
        if (!res || !res.ok) { st.textContent = ''; $('#prospectResults').innerHTML = notice('err', (res && res.error) || 'Falha na prospecção.'); return; }
        st.textContent = (res.mock || res.provider === 'mock')
          ? (res.degraded ? 'Motor AIsa indisponível — mostrando exemplos.' : 'Modo de exemplo (configure AISA_KEY para prospecção real).')
          : res.count + ' empresas encontradas.';
        renderResults(res.leads || [], body);
      }).catch(function (err) {
        btn.disabled = false; st.textContent = '';
        $('#prospectResults').innerHTML = notice('err', 'Erro de rede: ' + (err && err.message || err));
      });
    });
  }

  function renderResults(leads, query) {
    var wrap = $('#prospectResults');
    if (!leads.length) { wrap.innerHTML = notice('info', 'Nenhuma empresa encontrada. Tente outro nicho/cidade ou afrouxe os filtros.'); return; }
    var saved = {};
    PFStore.leads.list().forEach(function (l) { saved[l.slug] = true; });
    var html = '<div class="results-head"><span>' + leads.length + ' resultados para <strong>' + esc(query.niche) + ' em ' + esc(query.city) + '</strong></span>' +
      '<button class="btn btn--ghost btn--sm" id="btnSaveAll">Salvar todos em Leads</button></div>';
    html += '<div class="lead-cards">' + leads.map(function (l) { return leadCard(l, saved[l.slug]); }).join('') + '</div>';
    wrap.innerHTML = html;
    $('#btnSaveAll').addEventListener('click', function () {
      PFStore.leads.upsertMany(leads.map(function (l) { return Object.assign({}, l, { status: l.status || 'novo' }); }));
      ctx.toast(leads.length + ' leads salvos.');
      renderResults(leads, query);
      ctx.refreshKpis();
    });
    wireCardActions(wrap, leads);
  }

  function leadCard(l, isSaved) {
    var contatos = [];
    if (l.whatsapp) contatos.push('<a href="https://wa.me/' + digits(l.whatsapp) + '" target="_blank" rel="noopener">WhatsApp</a>');
    if (l.email) contatos.push('<a href="mailto:' + esc(l.email) + '">E-mail</a>');
    if (l.instagram) contatos.push('<a href="https://instagram.com/' + esc(l.instagram) + '" target="_blank" rel="noopener">@' + esc(l.instagram) + '</a>');
    if (l.siteAntigo) contatos.push('<a href="' + esc(l.siteAntigo) + '" target="_blank" rel="noopener">Site atual</a>');
    return '<article class="lead-card" data-slug="' + esc(l.slug) + '">' +
      '<div class="lead-card__top">' +
        '<div><h3>' + esc(l.nome) + '</h3><p class="lead-card__meta">' + esc(l.nicho || '') + (l.cidade ? ' · ' + esc(l.cidade) : '') + '</p></div>' +
        '<div class="lead-card__score"><span class="score-num">' + (l.score != null ? l.score : '–') + '</span>' + tempBadge(l.temperatura) + '</div>' +
      '</div>' +
      '<ul class="lead-card__facts">' +
        (l.nota != null ? '<li>★ ' + esc(l.nota) + (l.avaliacoes != null ? ' (' + esc(l.avaliacoes) + ' avaliações)' : '') + '</li>' : '') +
        '<li>' + (l.siteAntigo ? 'Tem site' : 'SEM SITE') + (l.diagnostico ? ' — ' + esc(l.diagnostico) : '') + '</li>' +
        (l.instagram ? '<li>Instagram @' + esc(l.instagram) + (l.igSeguidores ? ' · ' + esc(l.igSeguidores) + ' seguidores' : '') + '</li>' : '') +
        (l.endereco ? '<li>' + esc(l.endereco) + '</li>' : '') +
        (l.abordagem ? '<li class="lead-card__angle">Abordagem: ' + esc(l.abordagem) + '</li>' : '') +
      '</ul>' +
      '<div class="lead-card__contacts">' + contatos.join(' · ') + '</div>' +
      '<div class="lead-card__actions">' +
        (isSaved ? '<span class="chip chip--on">Em Leads</span>' : '<button class="chip" data-act="save">Salvar em Leads</button>') +
        '<button class="btn btn--primary btn--sm" data-act="build">CRIAR NOVA VERSÃO</button>' +
      '</div>' +
    '</article>';
  }

  function wireCardActions(root, leadsRef) {
    $$('.lead-card', root).forEach(function (card) {
      var slug = card.dataset.slug;
      var find = function () {
        return PFStore.leads.get(slug) || (leadsRef || []).filter(function (x) { return x.slug === slug; })[0];
      };
      $$('[data-act]', card).forEach(function (btn) {
        btn.addEventListener('click', function () {
          var lead = find();
          if (!lead) return;
          if (btn.dataset.act === 'save') {
            PFStore.leads.upsert(Object.assign({}, lead, { status: lead.status || 'novo' }));
            ctx.toast('Lead salvo.'); ctx.refreshKpis();
            btn.outerHTML = '<span class="chip chip--on">Em Leads</span>';
          } else if (btn.dataset.act === 'build') {
            toBuilderFromLead(lead);
          }
        });
      });
    });
  }

  /* ---------------- lead -> builder ---------------- */
  function toBuilderFromLead(lead) {
    // garante que está salvo e marca status
    PFStore.leads.upsert(Object.assign({}, lead, { status: 'em-criacao' }));
    ctx.refreshKpis();
    ctx.toast('Preparando briefing de ' + lead.nome + '…');
    apiProspect({ action: 'to-briefing', lead: lead }).then(function (res) {
      if (res && res.ok && res.brief) {
        ctx.toBuilder(res.brief, res.pageType, res.scrollMode, { kind: 'lead', slug: lead.slug, nome: lead.nome });
      } else {
        ctx.toBuilder(fallbackBriefing(lead), 'sales', 'light', { kind: 'lead', slug: lead.slug, nome: lead.nome });
      }
    }).catch(function () {
      ctx.toBuilder(fallbackBriefing(lead), 'sales', 'light', { kind: 'lead', slug: lead.slug, nome: lead.nome });
    });
  }

  function fallbackBriefing(l) {
    return {
      projectName: 'Redesign — ' + (l.nome || 'Cliente'),
      productName: l.nome || 'Cliente',
      description: (l.nome || 'Cliente') + (l.nicho ? ', ' + l.nicho : '') + (l.cidade ? ' em ' + l.cidade : '') + '. ' + (l.diagnostico || 'Precisa de um site profissional novo.'),
      niche: l.nicho || '', language: 'pt-BR',
      audience: l.cidade ? ('Clientes de ' + (l.nicho || 'serviços locais') + ' na região de ' + l.cidade) : '',
      offer: 'Serviços de ' + (l.nome || 'do cliente') + '. Detalhar com o cliente.',
      cta: 'Falar no WhatsApp',
      checkoutUrl: l.whatsapp ? ('https://wa.me/' + digits(l.whatsapp)) : '',
      checkoutPlatform: 'generic', trafficType: 'organic',
      references: [l.whatsapp && ('WhatsApp: ' + l.whatsapp), l.email && ('E-mail: ' + l.email), l.instagram && ('@' + l.instagram), l.siteAntigo].filter(Boolean).join(' · '),
      notes: 'Redesign de cliente real prospectado. Não inventar serviços/números. CTAs para o WhatsApp do cliente.' + (l.siteAntigo ? ' Site atual: ' + l.siteAntigo : ''),
      proof: l.nota && l.avaliacoes ? ['Nota ' + l.nota + ' no Google (' + l.avaliacoes + ' avaliações) — dado público real'] : [],
      benefits: [], pains: [], differentiators: [], palette: [],
      styleKeywords: ['profissional', 'confiável', l.nicho || 'local'].filter(Boolean),
      artDirection: 'Site de estúdio caro. Hero forte + CTA de WhatsApp, prova social com a nota do Google em destaque, seções ricas alternadas, serif elegante nos títulos, botão flutuante de WhatsApp.'
    };
  }

  /* ---------------- LEADS ---------------- */
  function renderLeadsView() {
    var fw = $('#leadsFilter');
    var counts = { '': PFStore.leads.count() };
    PFStore.leads.list().forEach(function (l) { counts[l.status] = (counts[l.status] || 0) + 1; });
    fw.innerHTML = ['', 'novo', 'contatado', 'em-criacao', 'redesenhado', 'publicado', 'descartado'].map(function (s) {
      var n = counts[s] || 0;
      return '<button class="lead-filter-b' + (leadsFilterStatus === s ? ' is-on' : '') + '" data-status="' + s + '">' +
        (s ? STATUS_LABEL[s] : 'Todos') + ' <b>' + n + '</b></button>';
    }).join('');
    $$('.lead-filter-b', fw).forEach(function (b) {
      b.addEventListener('click', function () { leadsFilterStatus = b.dataset.status; renderLeadsView(); });
    });

    var all = PFStore.leads.list();
    var list = leadsFilterStatus ? all.filter(function (l) { return l.status === leadsFilterStatus; }) : all;
    list.sort(function (a, b) { return (b.score || 0) - (a.score || 0); });
    $('#leadsCount').textContent = list.length + ' lead(s)' + (leadsFilterStatus ? ' · ' + STATUS_LABEL[leadsFilterStatus] : '');
    var wrap = $('#leadsList');
    if (!all.length) {
      wrap.innerHTML = notice('info', 'Nenhum lead ainda. Vá para <a href="#/prospeccao">Prospecção</a> e busque empresas.');
      return;
    }
    wrap.innerHTML = '<div class="lead-cards">' + list.map(function (l) { return leadRow(l); }).join('') + '</div>';
    $$('.lead-row', wrap).forEach(function (row) {
      var slug = row.dataset.slug;
      row.querySelector('[data-act="open"]').addEventListener('click', function () { location.hash = '#/lead/' + slug; });
      row.querySelector('[data-act="build"]').addEventListener('click', function () {
        var l = PFStore.leads.get(slug); if (l) toBuilderFromLead(l);
      });
      var sel = row.querySelector('select');
      sel.addEventListener('change', function () {
        PFStore.leads.upsert({ slug: slug, status: sel.value }); ctx.refreshKpis(); renderLeadsView();
      });
    });
  }

  function leadRow(l) {
    return '<article class="lead-card lead-row" data-slug="' + esc(l.slug) + '">' +
      '<div class="lead-card__top">' +
        '<div><h3>' + esc(l.nome) + '</h3><p class="lead-card__meta">' + esc(l.nicho || '') + (l.cidade ? ' · ' + esc(l.cidade) : '') + '</p></div>' +
        '<div class="lead-card__score"><span class="score-num">' + (l.score != null ? l.score : '–') + '</span>' + tempBadge(l.temperatura) + '</div>' +
      '</div>' +
      '<ul class="lead-card__facts">' +
        (l.nota != null ? '<li>★ ' + esc(l.nota) + (l.avaliacoes != null ? ' (' + esc(l.avaliacoes) + ')' : '') + '</li>' : '') +
        '<li>' + (l.siteAntigo ? 'Site: ' + esc(l.siteAntigo) : 'SEM SITE') + '</li>' +
        (l.diagnostico ? '<li>' + esc(l.diagnostico) + '</li>' : '') +
      '</ul>' +
      '<div class="lead-card__actions">' +
        '<label class="lead-status">Status <select>' + STATUS.map(function (s) { return '<option value="' + s + '"' + (l.status === s ? ' selected' : '') + '>' + STATUS_LABEL[s] + '</option>'; }).join('') + '</select></label>' +
        '<button class="chip" data-act="open">Abrir</button>' +
        '<button class="btn btn--primary btn--sm" data-act="build">Criar nova versão</button>' +
      '</div>' +
    '</article>';
  }

  function renderLeadDetail(slug) {
    var l = PFStore.leads.get(slug);
    var el = $('#leadDetail');
    if (!l) { el.innerHTML = notice('err', 'Lead não encontrado.') + '<p><a href="#/leads">← Leads</a></p>'; return; }
    var contatos = [];
    if (l.whatsapp) contatos.push('WhatsApp: <a href="https://wa.me/' + digits(l.whatsapp) + '" target="_blank" rel="noopener">' + esc(l.whatsapp) + '</a>');
    if (l.telefone && l.telefone !== l.whatsapp) contatos.push('Telefone: ' + esc(l.telefone));
    if (l.email) contatos.push('E-mail: <a href="mailto:' + esc(l.email) + '">' + esc(l.email) + '</a>');
    if (l.instagram) contatos.push('Instagram: <a href="https://instagram.com/' + esc(l.instagram) + '" target="_blank" rel="noopener">@' + esc(l.instagram) + '</a>' + (l.igSeguidores ? ' (' + esc(l.igSeguidores) + ' seguidores)' : ''));
    el.innerHTML =
      '<p><a href="#/leads">← Leads</a></p>' +
      '<div class="lead-card__top" style="align-items:flex-start">' +
        '<div><h1 style="margin-bottom:.2rem">' + esc(l.nome) + '</h1><p class="panel__lead">' + esc(l.nicho || '') + (l.cidade ? ' · ' + esc(l.cidade) : '') + '</p></div>' +
        '<div class="lead-card__score"><span class="score-num">' + (l.score != null ? l.score : '–') + '</span>' + tempBadge(l.temperatura) + '</div>' +
      '</div>' +
      '<div class="panel">' +
        '<h2>Dossiê</h2>' +
        '<dl class="cfg-list">' +
          (l.nota != null ? '<dt>Google</dt><dd>★ ' + esc(l.nota) + ' · ' + esc(l.avaliacoes || 0) + ' avaliações</dd>' : '') +
          '<dt>Site atual</dt><dd>' + (l.siteAntigo ? '<a href="' + esc(l.siteAntigo) + '" target="_blank" rel="noopener">' + esc(l.siteAntigo) + '</a>' : '— não tem —') + '</dd>' +
          '<dt>Diagnóstico</dt><dd>' + esc(l.diagnostico || '—') + '</dd>' +
          (l.abordagem ? '<dt>Abordagem sugerida</dt><dd>' + esc(l.abordagem) + '</dd>' : '') +
          (l.endereco ? '<dt>Endereço</dt><dd>' + esc(l.endereco) + '</dd>' : '') +
          (contatos.length ? '<dt>Contatos</dt><dd>' + contatos.join('<br>') + '</dd>' : '') +
          '<dt>Busca de origem</dt><dd>' + esc(l.busca || '—') + '</dd>' +
        '</dl>' +
      '</div>' +
      '<div class="lead-card__actions">' +
        '<label class="lead-status">Status <select id="ldStatus">' + STATUS.map(function (s) { return '<option value="' + s + '"' + (l.status === s ? ' selected' : '') + '>' + STATUS_LABEL[s] + '</option>'; }).join('') + '</select></label>' +
        '<button class="btn btn--ghost btn--sm" id="ldRemove">Remover lead</button>' +
        '<button class="btn btn--primary" id="ldBuild">CRIAR NOVA VERSÃO</button>' +
      '</div>';
    $('#ldStatus').addEventListener('change', function () { PFStore.leads.upsert({ slug: slug, status: this.value }); ctx.refreshKpis(); ctx.toast('Status atualizado.'); });
    $('#ldRemove').addEventListener('click', function () { if (confirm('Remover ' + l.nome + '?')) { PFStore.leads.remove(slug); ctx.refreshKpis(); location.hash = '#/leads'; } });
    $('#ldBuild').addEventListener('click', function () { toBuilderFromLead(PFStore.leads.get(slug)); });
  }

  /* ---------------- PROJETOS ---------------- */
  function renderProjetos() {
    var wrap = $('#projectsList');
    var arr = PFStore.projects.list().sort(function (a, b) { return (b.atualizado || '').localeCompare(a.atualizado || ''); });
    if (!arr.length) { wrap.innerHTML = notice('info', 'Nenhuma página gerada ainda. Comece em <a href="#/new">Criar Página</a>.'); return; }
    wrap.innerHTML = '<div class="lead-cards">' + arr.map(function (p) {
      return '<article class="lead-card"><div class="lead-card__top"><div>' +
        '<h3>' + esc(p.name || 'Página') + '</h3>' +
        '<p class="lead-card__meta">' + esc(p.pageType || '') + (p.leadNome ? ' · lead: ' + esc(p.leadNome) : '') + ' · ' + esc((p.atualizado || '').slice(0, 10)) + '</p></div></div>' +
        '<div class="lead-card__actions">' +
          '<button class="btn btn--primary btn--sm" data-open="' + esc(p.id) + '">Abrir no preview</button>' +
          '<button class="chip" data-del="' + esc(p.id) + '">Excluir</button>' +
        '</div></article>';
    }).join('') + '</div>';
    $$('[data-open]', wrap).forEach(function (b) { b.addEventListener('click', function () { ctx.openProject(b.dataset.open); }); });
    $$('[data-del]', wrap).forEach(function (b) { b.addEventListener('click', function () { PFStore.projects.remove(b.dataset.del); renderProjetos(); ctx.refreshKpis(); }); });
  }

  /* ---------------- CONFIG ---------------- */
  function renderConfig(health) {
    var h = health || {};
    var pg = h.pages || {}; var pr = h.prospect || {};
    $('#cfgEngines').innerHTML =
      '<dt>Criador de Páginas (IA)</dt><dd>' + (pg.ready ? ('✅ ' + esc(pg.provider || 'NVIDIA') + (pg.model ? ' · ' + esc(pg.model) : '')) : '⚠️ NVIDIA_API_KEY pendente' + (pg.mock ? ' (modo exemplo)' : '')) + '</dd>' +
      '<dt>Prospecção (AIsa)</dt><dd>' + (pr.ready ? (pr.keyConfigured ? '✅ AISA_KEY configurada' : '🧪 modo exemplo (sem AISA_KEY)') : '⚠️ AISA_KEY pendente') + '</dd>';
    $('#btnExportData').onclick = function () {
      var data = { leads: PFStore.leads.list(), projects: PFStore.projects.list().map(function (p) { return { id: p.id, name: p.name, pageType: p.pageType, atualizado: p.atualizado }; }) };
      var blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      var a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'pageforge-dados.json';
      document.body.appendChild(a); a.click(); document.body.removeChild(a);
    };
    $('#btnClearData').onclick = function () {
      if (!confirm('Apagar TODOS os leads e projetos deste navegador?')) return;
      PFStore.leads.clear(); PFStore.projects.clear(); ctx.refreshKpis(); ctx.toast('Dados locais apagados.');
    };
  }

  /* ---------------- KPIs ---------------- */
  function renderKpis() {
    var leads = PFStore.leads.list();
    var quentes = leads.filter(function (l) { return l.temperatura === 'quente'; }).length;
    var comSite = leads.filter(function (l) { return l.siteAntigo; }).length;
    var el = $('#kpis'); if (!el) return;
    el.innerHTML = [
      ['Leads', leads.length, '#/leads'],
      ['Oportunidades 🔥', quentes, '#/leads'],
      ['Com site (redesign)', comSite, '#/leads'],
      ['Páginas criadas', PFStore.projects.count(), '#/projetos']
    ].map(function (k) {
      return '<a class="kpi" href="' + k[2] + '"><span class="kpi__n">' + k[1] + '</span><span class="kpi__l">' + k[0] + '</span></a>';
    }).join('');
  }

  /* ---------------- helpers ---------------- */
  function notice(kind, html) { return '<div class="notice notice--' + kind + '">' + html + '</div>'; }

  global.PFProspect = {
    init: function (context) { ctx = context; },
    onRoute: function (route, param, health) {
      if (route === '/prospeccao') { bindProspectForm(); }
      else if (route === '/leads') { renderLeadsView(); }
      else if (route === '/lead') { renderLeadDetail(param); }
      else if (route === '/projetos') { renderProjetos(); }
      else if (route === '/config') { renderConfig(health); }
      if (route === '/' ) renderKpis();
    },
    renderKpis: renderKpis
  };
})(window);
