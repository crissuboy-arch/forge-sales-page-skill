/* prospect.js — modo PROSPECÇÃO da PageForge AI.
   Motor/dados: /api/prospect (AIsa server-side). Armazenamento: PFStore.leads.
   Integra com o builder via ctx.toBuilder(briefing). */
(function (global) {
  'use strict';

  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };

  var ctx = null; // { toast, toBuilder, go, health }
  var STATUS = ['novo', 'qualificado', 'redesign-criado', 'demo-publicada', 'proposta-pronta', 'proposta-enviada', 'follow-up', 'negociacao', 'fechado', 'perdido'];
  var STATUS_LABEL = { novo: 'Novo', qualificado: 'Qualificado', 'redesign-criado': 'Redesign criado', 'demo-publicada': 'Demo publicada', 'proposta-pronta': 'Proposta pronta', 'proposta-enviada': 'Proposta enviada', 'follow-up': 'Follow-up', negociacao: 'Negociação', fechado: 'Fechado', perdido: 'Perdido' };
  var STATUS_ALIAS = { contatado: 'qualificado', 'em-criacao': 'redesign-criado', redesenhado: 'redesign-criado', publicado: 'demo-publicada', proposta: 'proposta-pronta', descartado: 'perdido' };
  function normStatus(s) { s = String(s || ''); return STATUS.indexOf(s) > -1 ? s : (STATUS_ALIAS[s] || 'novo'); }
  function statusLabel(s) { return STATUS_LABEL[normStatus(s)]; }
  var leadsFilterStatus = '';

  // muda status + registra histórico + campos derivados
  function setLeadStatus(slug, status, nota) {
    var l = PFStore.leads.get(slug); if (!l) return null;
    status = normStatus(status);
    var hist = Array.isArray(l.historico) ? l.historico.slice() : [];
    if (!hist.length || hist[hist.length - 1].status !== status || nota) hist.push({ status: status, at: new Date().toISOString(), nota: nota || '' });
    var patch = { slug: slug, status: status, historico: hist };
    if (status === 'proposta-enviada' && !l.proximaAcaoData) {
      var d = new Date(); d.setDate(d.getDate() + 3);
      patch.proximaAcaoData = d.toISOString().slice(0, 10);
      patch.proximaAcao = 'Follow-up da proposta';
    }
    PFStore.leads.upsert(patch);
    if (ctx && ctx.refreshKpis) ctx.refreshKpis();
    return PFStore.leads.get(slug);
  }

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
      $('#prospectResults').innerHTML = '<div class="prospect-loading"><div class="gen__spin"></div><p class="muted">Consultando Google Maps, Instagram e IA…</p><p class="tiny muted">Nicho “' + esc(body.niche) + '” em ' + esc(body.city) + ' · ' + body.count + ' resultados</p></div>';
      apiProspect(body).then(function (res) {
        btn.disabled = false;
        if (!res || !res.ok) {
          st.textContent = '';
          $('#prospectResults').innerHTML = notice('err', ((res && res.error) || 'Falha na prospecção.') + ' — tente de novo em instantes ou ajuste o nicho/cidade.') +
            '<button class="btn btn--ghost btn--sm" id="btnProspectRetry" style="margin-top:.7rem">Tentar de novo</button>';
          var rb = $('#btnProspectRetry'); if (rb) rb.addEventListener('click', function () { form.dispatchEvent(new Event('submit', { cancelable: true, bubbles: true })); });
          return;
        }
        var isMock = !!(res.mock || res.provider === 'mock');
        st.textContent = isMock
          ? (res.degraded ? 'Motor AIsa indisponível agora — mostrando exemplos.' : 'Modo de exemplo (dados MOCK).')
          : res.count + ' empresas encontradas.';
        renderResults(res.leads || [], body, isMock);
      }).catch(function (err) {
        btn.disabled = false; st.textContent = '';
        $('#prospectResults').innerHTML = notice('err', 'Erro de rede: ' + (err && err.message || err) + '. Verifique a conexão e tente de novo.');
      });
    });
  }

  function renderResults(leads, query, isMock) {
    var wrap = $('#prospectResults');
    if (!leads.length) { wrap.innerHTML = notice('info', 'Nenhuma empresa encontrada para “' + esc(query.niche) + '” em ' + esc(query.city) + '. Tente outro nicho/cidade ou afrouxe os filtros avançados.'); return; }
    var saved = {};
    PFStore.leads.list().forEach(function (l) { saved[l.slug] = true; });
    var html = (isMock ? notice('info', '<strong>Resultados MOCK</strong> — dados de exemplo para percorrer o fluxo. Não são empresas reais.') : '') +
      '<div class="results-head"><span>' + leads.length + ' resultados para <strong>' + esc(query.niche) + ' em ' + esc(query.city) + '</strong></span>' +
      '<button class="btn btn--ghost btn--sm" id="btnSaveAll">Salvar todos em Leads</button></div>';
    html += '<div class="lead-cards">' + leads.map(function (l) { return leadCard(l, saved[l.slug], isMock); }).join('') + '</div>';
    wrap.innerHTML = html;
    $('#btnSaveAll').addEventListener('click', function () {
      PFStore.leads.upsertMany(leads.map(function (l) { return Object.assign({}, l, { status: l.status || 'novo' }); }));
      ctx.toast(leads.length + ' leads salvos.');
      renderResults(leads, query, isMock);
      ctx.refreshKpis();
    });
    wireCardActions(wrap, leads);
  }

  function leadCard(l, isSaved, isMock) {
    var contatos = [];
    if (l.whatsapp) contatos.push('<a href="https://wa.me/' + digits(l.whatsapp) + '" target="_blank" rel="noopener">WhatsApp</a>');
    if (l.email) contatos.push('<a href="mailto:' + esc(l.email) + '">E-mail</a>');
    if (l.instagram) contatos.push('<a href="https://instagram.com/' + esc(l.instagram) + '" target="_blank" rel="noopener">@' + esc(l.instagram) + '</a>');
    if (l.siteAntigo) contatos.push('<a href="' + esc(l.siteAntigo) + '" target="_blank" rel="noopener">Site atual</a>');
    return '<article class="lead-card" data-slug="' + esc(l.slug) + '">' +
      (isMock ? '<span class="mock-tag">EXEMPLO</span>' : '') +
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
    // garante que está salvo e marca como qualificado (entrou no funil)
    if (!PFStore.leads.get(lead.slug)) PFStore.leads.upsert(Object.assign({}, lead, { status: 'novo' }));
    setLeadStatus(lead.slug, 'qualificado', 'enviado para o builder');
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
    PFStore.leads.list().forEach(function (l) { var s = normStatus(l.status); counts[s] = (counts[s] || 0) + 1; });
    fw.innerHTML = [''].concat(STATUS).map(function (s) {
      var n = counts[s] || 0;
      if (s && !n && leadsFilterStatus !== s) return '';
      return '<button class="lead-filter-b' + (leadsFilterStatus === s ? ' is-on' : '') + '" data-status="' + s + '">' +
        (s ? STATUS_LABEL[s] : 'Todos') + ' <b>' + n + '</b></button>';
    }).join('');
    $$('.lead-filter-b', fw).forEach(function (b) {
      b.addEventListener('click', function () { leadsFilterStatus = b.dataset.status; renderLeadsView(); });
    });

    var all = PFStore.leads.list();
    var list = leadsFilterStatus ? all.filter(function (l) { return normStatus(l.status) === leadsFilterStatus; }) : all;
    list.sort(function (a, b) { return (STATUS.indexOf(normStatus(b.status)) - STATUS.indexOf(normStatus(a.status))) || (b.score || 0) - (a.score || 0); });
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
      sel.addEventListener('change', function () { setLeadStatus(slug, sel.value); renderLeadsView(); });
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
        '<label class="lead-status">Status <select>' + STATUS.map(function (s) { return '<option value="' + s + '"' + (normStatus(l.status) === s ? ' selected' : '') + '>' + STATUS_LABEL[s] + '</option>'; }).join('') + '</select></label>' +
        '<button class="chip" data-act="open">Abrir</button>' +
        '<button class="btn btn--primary btn--sm" data-act="build">Criar nova versão</button>' +
      '</div>' +
    '</article>';
  }

  function latestProjectForLead(slug) {
    var arr = PFStore.projects.list(function (p) { return p.leadSlug === slug; });
    arr.sort(function (a, b) { return (b.atualizado || '').localeCompare(a.atualizado || ''); });
    return arr[0] || null;
  }

  // rótulo do estágio atual + posição na esteira
  function stageInfo(l) {
    var st = normStatus(l.status);
    var idx = STATUS.indexOf(st);
    return { st: st, idx: idx, label: STATUS_LABEL[st], pct: Math.round((idx / (STATUS.length - 2)) * 100) };
  }

  var prefersReducedMotion = function () {
    try { return window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) { return false; }
  };
  function scrollToSection(secId) {
    var t = document.getElementById(secId);
    if (t) t.scrollIntoView({ behavior: prefersReducedMotion() ? 'auto' : 'smooth', block: 'start' });
  }

  function leadHeaderHtml(l) {
    var sg = stageInfo(l);
    return '<div class="lead-hd"><div class="lead-hd__main">' +
      '<h1>' + esc(l.nome) + '</h1>' +
      '<p class="panel__lead">' + esc(l.nicho || 'nicho não informado') + (l.cidade ? ' · ' + esc(l.cidade) : '') + '</p>' +
      '<div class="lead-hd__badges"><span class="stage-badge stage-badge--' + esc(sg.st) + '">Estágio: ' + esc(sg.label) + '</span>' + tempBadge(l.temperatura) +
        (l.score != null ? '<span class="chip">Score ' + esc(l.score) + '</span>' : '') +
        (l.demoUrl ? '<a class="chip chip--on" href="' + esc(l.demoUrl) + '" target="_blank" rel="noopener">Demo publicada ↗</a>' : '') +
      '</div>' +
      '<div class="stage-track"><span style="width:' + Math.max(4, sg.pct) + '%"></span></div>' +
      '</div></div>';
  }
  // atualiza só o cabeçalho do lead (estágio/badges) sem redesenhar o painel comercial
  function refreshLeadHeader(slug) {
    var host = document.querySelector('#leadDetail .lead-hd');
    if (!host) return;
    var l = PFStore.leads.get(slug); if (!l) return;
    host.outerHTML = leadHeaderHtml(l);
  }

  function renderLeadDetail(slug) {
    var l = PFStore.leads.get(slug);
    var el = $('#leadDetail');
    if (!el) return;
    if (!l) {
      el.innerHTML = notice('err', 'Lead não encontrado. Ele pode ter sido removido neste navegador.') +
        '<p style="margin-top:1rem"><a class="btn btn--ghost btn--sm" href="#/leads">← Voltar para Leads</a></p>';
      return;
    }
    var proj = latestProjectForLead(slug);
    var contatos = [];
    if (l.whatsapp) contatos.push('WhatsApp: <a href="https://wa.me/' + digits(l.whatsapp) + '" target="_blank" rel="noopener">' + esc(l.whatsapp) + '</a>');
    if (l.telefone && l.telefone !== l.whatsapp) contatos.push('Telefone: ' + esc(l.telefone));
    if (l.email) contatos.push('E-mail: <a href="mailto:' + esc(l.email) + '">' + esc(l.email) + '</a>');
    if (l.instagram) contatos.push('Instagram: <a href="https://instagram.com/' + esc(l.instagram) + '" target="_blank" rel="noopener">@' + esc(l.instagram) + '</a>' + (l.igSeguidores ? ' (' + esc(l.igSeguidores) + ' seguidores)' : ''));
    if (l.endereco) contatos.push('Endereço: ' + esc(l.endereco));

    var NAV = [
      ['visao', 'Visão geral'], ['contatos', 'Contatos'], ['diagnostico', 'Diagnóstico'],
      ['site', 'Site atual'], ['redesign', 'Redesign'], ['comercial', 'Proposta · E-mail · Contrato'],
      ['historico', 'Histórico']
    ];

    el.innerHTML =
      leadHeaderHtml(l) +

      '<div class="lead-quick">' +
        '<button class="btn btn--primary btn--sm" id="qaBuild">CRIAR NOVA VERSÃO</button>' +
        (proj ? '<button class="btn btn--ghost btn--sm" id="qaEdit">EDITAR PÁGINA</button>' +
                '<button class="btn btn--ghost btn--sm" id="qaQA">QA</button>' +
                '<button class="btn btn--ghost btn--sm" id="qaCompare">ANTES × DEPOIS</button>' : '') +
        '<button class="btn btn--ghost btn--sm" data-jump="comercial" id="qaDemo"' + (proj ? '' : ' disabled title="Gere uma página deste lead primeiro"') + '>PUBLICAR DEMO</button>' +
        '<button class="btn btn--ghost btn--sm" data-jump="comercial" id="qaProp">GERAR PROPOSTA</button>' +
        '<button class="btn btn--ghost btn--sm" data-jump="comercial" id="qaEmail">CRIAR E-MAIL</button>' +
        '<button class="btn btn--ghost btn--sm" data-jump="comercial" id="qaFollow">AGENDAR FOLLOW-UP</button>' +
        '<button class="btn btn--ghost btn--sm" data-jump="comercial" id="qaContract">GERAR CONTRATO</button>' +
      '</div>' +

      '<nav class="lead-secnav" id="leadSecnav">' + NAV.map(function (n) {
        return '<a href="#sec-' + n[0] + '" data-sec="' + n[0] + '">' + esc(n[1]) + '</a>';
      }).join('') + '</nav>' +

      '<section class="panel" id="sec-visao"><h2>Visão geral</h2>' +
        '<dl class="cfg-list">' +
          (l.nota != null ? '<dt>Google</dt><dd>★ ' + esc(l.nota) + ' · ' + esc(l.avaliacoes || 0) + ' avaliações</dd>' : '') +
          '<dt>Site atual</dt><dd>' + (l.siteAntigo ? '<a href="' + esc(l.siteAntigo) + '" target="_blank" rel="noopener">' + esc(l.siteAntigo) + '</a>' : '— não tem (maior oportunidade) —') + '</dd>' +
          '<dt>Oportunidade</dt><dd>' + esc(l.oportunidade || l.abordagem || l.diagnostico || '—') + '</dd>' +
          '<dt>Redesign</dt><dd>' + (proj ? esc(proj.name) + ' · ' + esc((proj.atualizado || '').slice(0, 10)) + (proj.qa ? ' · QA ' + esc(proj.qa.score) + '/20' : '') : 'ainda não gerado') + '</dd>' +
          '<dt>Busca de origem</dt><dd>' + esc(l.busca || '—') + '</dd>' +
        '</dl>' +
        '<div class="lead-card__actions" style="margin-top:1rem">' +
          '<button class="btn btn--ghost btn--sm" id="ldRemove">Remover lead</button>' +
        '</div>' +
      '</section>' +

      '<section class="panel" id="sec-contatos"><h2>Contatos</h2>' +
        (contatos.length ? '<dl class="cfg-list">' + contatos.map(function (c) { var i = c.indexOf(':'); return '<dt>' + c.slice(0, i) + '</dt><dd>' + c.slice(i + 1) + '</dd>'; }).join('') + '</dl>'
                         : notice('info', 'Nenhum contato capturado. Complete manualmente pelo site/Instagram do cliente.')) +
      '</section>' +

      '<section class="panel" id="sec-diagnostico"><h2>Diagnóstico</h2>' +
        '<p>' + esc(l.diagnostico || 'Sem diagnóstico automático. Avalie o site atual e anote os pontos fracos.') + '</p>' +
        (l.abordagem ? '<p><strong>Abordagem sugerida:</strong> ' + esc(l.abordagem) + '</p>' : '') +
      '</section>' +

      '<section class="panel" id="sec-site"><h2>Site atual</h2>' +
        (l.siteAntigo
          ? '<p class="tiny muted"><a href="' + esc(l.siteAntigo) + '" target="_blank" rel="noopener">' + esc(l.siteAntigo) + ' ↗</a> — se a prévia abaixo ficar em branco, o site bloqueia incorporação; use o link para abrir em nova aba.</p>' +
            '<div class="site-embed"><iframe src="' + esc(l.siteAntigo) + '" title="Site atual de ' + esc(l.nome) + '" loading="lazy" referrerpolicy="no-referrer"></iframe></div>'
          : notice('ok', 'O cliente não tem site próprio — a nova versão parte do zero, sem comparação. É a maior oportunidade de venda.')) +
      '</section>' +

      '<section class="panel" id="sec-redesign"><h2>Redesign</h2>' +
        (proj
          ? '<div class="redesign-row">' +
              '<iframe class="redesign-thumb" title="Prévia do redesign" sandbox="allow-same-origin" srcdoc="' + esc(String(proj.html || '').slice(0, 200000)) + '"></iframe>' +
              '<div><p><strong>' + esc(proj.name) + '</strong><br><span class="tiny muted">' + esc(proj.pageType || '') + ' · atualizado ' + esc((proj.atualizado || '').slice(0, 10)) + (proj.qa ? ' · QA ' + esc(proj.qa.score) + '/20 (' + esc(proj.qa.band || '') + ')' : '') + '</span></p>' +
              '<div class="lead-card__actions">' +
                '<button class="btn btn--primary btn--sm" id="rdOpen">Abrir no preview</button>' +
                '<button class="btn btn--ghost btn--sm" id="rdEdit">Editor visual</button>' +
                '<button class="btn btn--ghost btn--sm" id="rdCompare">Antes × Depois</button>' +
                '<button class="btn btn--ghost btn--sm" id="rdExport">Exportar HTML/ZIP</button>' +
              '</div></div>' +
            '</div>'
          : notice('info', 'Nenhuma página gerada para este lead ainda. Use <strong>CRIAR NOVA VERSÃO</strong> para montar o briefing automático e gerar o redesign.')) +
      '</section>' +

      '<section id="sec-comercial"><div id="ldCommercial"></div></section>' +

      '<section class="panel" id="sec-historico"><h2>Histórico</h2>' +
        ((l.historico && l.historico.length)
          ? '<ul class="hist-list">' + l.historico.slice().reverse().map(function (h) {
              return '<li><span>' + esc((h.at || '').slice(0, 16).replace('T', ' ')) + '</span> ' + esc(STATUS_LABEL[h.status] || h.status) + (h.nota ? ' — ' + esc(h.nota) : '') + '</li>';
            }).join('') + '</ul>'
          : '<p class="muted tiny">Sem eventos ainda.</p>') +
      '</section>';

    // navegação de seções + botões de ação que saltam para a seção
    $$('#leadSecnav a').forEach(function (a) {
      a.addEventListener('click', function (e) { e.preventDefault(); scrollToSection('sec-' + a.dataset.sec); });
    });
    $$('[data-jump]', el).forEach(function (b) {
      b.addEventListener('click', function () { scrollToSection('sec-' + b.dataset.jump); });
    });

    $('#ldRemove').addEventListener('click', function () {
      ctx.confirm ? ctx.confirm('Remover ' + l.nome + '?', function () { PFStore.leads.remove(slug); ctx.refreshKpis(); location.hash = '#/leads'; })
                  : (confirm('Remover ' + l.nome + '?') && (PFStore.leads.remove(slug), ctx.refreshKpis(), location.hash = '#/leads'));
    });
    $('#qaBuild').addEventListener('click', function () { toBuilderFromLead(PFStore.leads.get(slug)); });

    if (proj) {
      var openP = function (opts) { if (ctx.openProject) ctx.openProject(proj.id, opts); };
      var bind = function (id, opts) { var b = $('#' + id); if (b) b.addEventListener('click', function () { openP(opts); }); };
      bind('qaEdit', { edit: true }); bind('rdEdit', { edit: true });
      bind('qaCompare', { compare: true }); bind('rdCompare', { compare: true });
      bind('qaQA', {}); bind('rdOpen', {});
      var ex = function () { if (ctx.exportProject) ctx.exportProject(proj); };
      var re = $('#rdExport'); if (re) re.addEventListener('click', ex);
    }

    // dispara ações comerciais após o painel montar
    function fireAfterCommercial(id, act) {
      var tries = 0;
      (function poll() {
        var b = document.getElementById(id);
        if (b) { scrollToSection('sec-comercial'); if (act === 'focus') b.focus(); else if (!b.disabled) b.click(); return; }
        if (tries++ < 20) setTimeout(poll, 80);
      })();
    }
    var qd = $('#qaDemo'); if (qd && !qd.disabled) qd.addEventListener('click', function () { fireAfterCommercial('cmPublish'); });
    $('#qaProp').addEventListener('click', function () { fireAfterCommercial('cmProposal'); });
    $('#qaEmail').addEventListener('click', function () { fireAfterCommercial('cmEmail'); });
    $('#qaContract').addEventListener('click', function () { fireAfterCommercial('cmContract'); });
    $('#qaFollow').addEventListener('click', function () { fireAfterCommercial('cmNextDate', 'focus'); });

    if (window.PFCommercial) PFCommercial.renderPanel(slug, $('#ldCommercial'));
  }

  /* ---------------- PROJETOS / PÁGINAS ---------------- */
  function renderProjetos() {
    var wrap = $('#projectsList');
    if (!wrap) return;
    var arr = PFStore.projects.list().sort(function (a, b) { return (b.atualizado || '').localeCompare(a.atualizado || ''); });
    if (!arr.length) {
      wrap.innerHTML = '<div class="empty-state">' +
        '<h3>Nenhuma página ainda</h3>' +
        '<p class="muted">As páginas geradas aparecem aqui, prontas para reabrir, editar, exportar ou publicar como demo.</p>' +
        '<div class="lead-card__actions" style="justify-content:center"><a class="btn btn--primary btn--sm" href="#/new">Criar página do zero</a><a class="btn btn--ghost btn--sm" href="#/prospeccao">Prospectar clientes</a></div>' +
        '</div>';
      return;
    }
    wrap.innerHTML = '<p class="panel__lead">' + arr.length + ' página(s) neste navegador.</p><div class="lead-cards">' + arr.map(function (p) {
      var origem = p.leadSlug ? 'redesign de lead' : 'criada do zero';
      return '<article class="lead-card" data-pid="' + esc(p.id) + '">' +
        '<div class="lead-card__top"><div>' +
          '<h3>' + esc(p.name || 'Página') + '</h3>' +
          '<p class="lead-card__meta">' + esc(p.pageType || 'sales') + ' · ' + esc(origem) + (p.leadNome ? ' (' + esc(p.leadNome) + ')' : '') + '</p>' +
        '</div>' + (p.qa ? '<span class="chip">QA ' + esc(p.qa.score) + '/20</span>' : '') + '</div>' +
        '<ul class="lead-card__facts">' +
          '<li>Criada ' + esc((p.criado || p.atualizado || '').slice(0, 10)) + ' · última edição ' + esc((p.atualizado || '').slice(0, 10)) + '</li>' +
          (p.demoUrl ? '<li>Demo: <a href="' + esc(p.demoUrl) + '" target="_blank" rel="noopener">publicada ↗</a></li>' : '<li>Demo: não publicada</li>') +
        '</ul>' +
        '<div class="lead-card__actions">' +
          '<button class="btn btn--primary btn--sm" data-act="open">Abrir</button>' +
          '<button class="chip" data-act="edit">Editar</button>' +
          '<button class="chip" data-act="compare">Antes/Depois</button>' +
          '<button class="chip" data-act="dup">Duplicar</button>' +
          '<button class="chip" data-act="export">Exportar</button>' +
          (p.leadSlug ? '<a class="chip" href="#/lead/' + esc(p.leadSlug) + '">Publicar / republicar</a>' : '') +
          '<button class="chip chip--danger" data-act="del">Excluir</button>' +
        '</div>' +
      '</article>';
    }).join('') + '</div>';

    $$('.lead-card[data-pid]', wrap).forEach(function (card) {
      var id = card.dataset.pid;
      var get = function () { return PFStore.projects.get(id); };
      $$('[data-act]', card).forEach(function (b) {
        b.addEventListener('click', function () {
          var p = get(); if (!p) return;
          var a = b.dataset.act;
          if (a === 'open') ctx.openProject(id, {});
          else if (a === 'edit') ctx.openProject(id, { edit: true });
          else if (a === 'compare') ctx.openProject(id, { compare: true });
          else if (a === 'export') { if (ctx.exportProject) ctx.exportProject(p); }
          else if (a === 'dup') {
            var copy = Object.assign({}, p, { id: p.id + '-copy' + Date.now().toString(36), name: (p.name || 'Página') + ' (cópia)', demoUrl: '', demoSlug: '' });
            PFStore.projects.upsert(copy); renderProjetos(); ctx.refreshKpis(); ctx.toast('Página duplicada.');
          } else if (a === 'del') {
            var go = function () { PFStore.projects.remove(id); renderProjetos(); ctx.refreshKpis(); ctx.toast('Página excluída.'); };
            ctx.confirm ? ctx.confirm('Excluir "' + (p.name || 'Página') + '"? Isso não afeta arquivos já exportados.', go)
                        : (confirm('Excluir esta página?') && go());
          }
        });
      });
    });
  }

  /* ---------------- CONFIG ---------------- */
  var CFG_SECTIONS = [
    ['Meu perfil', 'Aparece na proposta, no e-mail e no contrato.', [
      ['assinaturaNome', 'Nome', 'text'],
      ['assinaturaEmpresa', 'Empresa / agência', 'text'],
      ['assinaturaEmail', 'E-mail', 'text'],
      ['assinaturaWhatsapp', 'Telefone / WhatsApp (com DDI)', 'text'],
      ['assinaturaApresentacao', 'Apresentação curta', 'text'],
      ['assinaturaComercial', 'Assinatura comercial', 'textarea']
    ]],
    ['Prospecção', 'Valores que já vêm preenchidos ao abrir a Prospecção.', [
      ['prospeccaoNicho', 'Nicho padrão', 'text'],
      ['prospeccaoRegiao', 'Região / cidade padrão', 'text'],
      ['prospeccaoQtd', 'Quantidade padrão', 'text']
    ]],
    ['Páginas', 'Preferências do Criador de Páginas.', [
      ['paginaIdioma', 'Idioma padrão', 'text'],
      ['paginaCta', 'Texto de CTA padrão', 'text'],
      ['paginaScroll', 'Intensidade de scroll padrão', 'scroll']
    ]],
    ['Comercial', 'Nunca inventamos preço — só usamos o que você definir aqui.', [
      ['precoPadrao', 'Preço padrão (opcional)', 'text'],
      ['moeda', 'Moeda', 'moeda'],
      ['prazoPadrao', 'Prazo de entrega padrão', 'text'],
      ['formaPagamento', 'Forma de pagamento', 'text'],
      ['observacoesComerciais', 'Observações comerciais', 'textarea'],
      ['assinaturaProposta', 'Assinatura da proposta', 'text']
    ]],
    ['Publicação', 'Onde as demos e páginas ficam publicadas.', [
      ['dominio', 'Seu domínio (opcional)', 'text'],
      ['dominioDemo', 'Domínio de demonstração (opcional)', 'text']
    ]],
    ['Contrato', 'Dados do contratante (você). O que faltar aparece para preencher à mão no contrato.', [
      ['contratanteNome', 'Nome / razão social', 'text'],
      ['contratanteDoc', 'CPF / CNPJ / NIF', 'text'],
      ['contratanteEndereco', 'Endereço', 'text'],
      ['contratanteCidade', 'Cidade / UF', 'text']
    ]]
  ];
  var SCROLL_OPTS = ['static', 'light', 'motion', 'cinematic', 'storytelling'];
  var MOEDA_OPTS = ['BRL', 'EUR', 'USD'];

  function fieldHtml(key, label, type, val) {
    val = val == null ? '' : val;
    if (type === 'textarea') return '<div class="field"><label>' + esc(label) + '<textarea data-s="' + key + '">' + esc(val) + '</textarea></label></div>';
    if (type === 'scroll' || type === 'moeda') {
      var opts = (type === 'scroll' ? SCROLL_OPTS : MOEDA_OPTS);
      return '<div class="field"><label>' + esc(label) + '<select data-s="' + key + '">' + opts.map(function (o) {
        return '<option value="' + o + '"' + (String(val) === o ? ' selected' : '') + '>' + o + '</option>';
      }).join('') + '</select></label></div>';
    }
    return '<div class="field"><label>' + esc(label) + '<input type="text" data-s="' + key + '" value="' + esc(val) + '"></label></div>';
  }

  function integrationCard(it) {
    var ok = it.status === 'CONFIGURADO';
    var mid = it.status === 'MODO EXEMPLO';
    return '<div class="intg-card intg-card--' + (ok ? 'ok' : (mid ? 'mid' : 'off')) + '">' +
      '<div class="intg-card__hd"><strong>' + esc(it.nome) + '</strong><span class="intg-badge">' + esc(it.status) + '</span></div>' +
      '<p class="tiny muted">' + esc(it.papel) + '</p>' +
      '<p class="tiny">' + esc(it.hint) + '</p>' +
    '</div>';
  }

  function renderConfig(health) {
    var root = $('#cfgRoot');
    if (!root) return;
    var h = health || {};
    var s = PFStore.settings.get();
    var integrations = h.integrations || [];

    root.innerHTML =
      CFG_SECTIONS.map(function (sec) {
        return '<section class="panel"><h2>' + esc(sec[0]) + '</h2><p class="panel__lead">' + esc(sec[1]) + '</p>' +
          '<div class="grid-2">' + sec[2].map(function (f) { return fieldHtml(f[0], f[1], f[2], s[f[0]]); }).join('') + '</div></section>';
      }).join('') +
      '<div class="cfg-savebar"><button class="btn btn--primary btn--sm" id="cfgSave">Salvar configurações</button><span class="tiny muted" id="cfgSaveMsg">Salvo automaticamente ao sair de cada campo.</span></div>' +

      '<section class="panel"><h2>Integrações</h2>' +
        '<p class="panel__lead">Status vindo do servidor. As chaves de API ficam <strong>apenas</strong> nas Environment Variables da Vercel — a PageForge nunca pede nem guarda chave secreta no navegador.</p>' +
        (integrations.length
          ? '<div class="intg-grid">' + integrations.map(integrationCard).join('') + '</div>'
          : (!health
              ? '<div class="prospect-loading" style="padding:1.5rem 0"><div class="gen__spin"></div><p class="muted tiny">Consultando o servidor…</p></div>'
              : notice('warn', 'Não foi possível consultar o status das integrações (servidor indisponível). Recarregue a página.'))) +
      '</section>' +

      '<section class="panel"><h2>Dados locais</h2>' +
        '<p class="tiny muted">Leads, páginas e configurações ficam neste navegador (localStorage). O adapter <code>PFStore</code> já isola isso para migrar para nuvem depois sem reescrever a interface.</p>' +
        '<div class="lead-card__actions">' +
          '<button class="btn btn--ghost btn--sm" id="btnExportData">Exportar tudo (JSON)</button>' +
          '<button class="btn btn--ghost btn--sm" id="btnImportData">Importar JSON</button>' +
          '<button class="btn btn--ghost btn--sm" id="btnReonboard">Rever tutorial inicial</button>' +
          '<button class="btn btn--ghost btn--sm chip--danger" id="btnClearData">Limpar dados locais</button>' +
        '</div><input type="file" id="importFile" accept="application/json" hidden>' +
      '</section>';

    function collectAndSave(quiet) {
      var patch = {};
      $$('[data-s]', root).forEach(function (i) { patch[i.dataset.s] = (i.value || '').trim(); });
      PFStore.settings.set(patch);
      if (!quiet) ctx.toast('Configurações salvas.');
      var m = $('#cfgSaveMsg'); if (m) { m.textContent = 'Salvo ' + new Date().toLocaleTimeString().slice(0, 5) + '.'; }
    }
    $$('[data-s]', root).forEach(function (i) { i.addEventListener('change', function () { collectAndSave(true); }); });
    $('#cfgSave').onclick = function () { collectAndSave(false); };

    $('#btnExportData').onclick = function () {
      var data = { v: 1, exportedAt: new Date().toISOString(), leads: PFStore.leads.list(), projects: PFStore.projects.list(), settings: PFStore.settings.get() };
      var blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      var a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'pageforge-backup-' + new Date().toISOString().slice(0, 10) + '.json';
      document.body.appendChild(a); a.click(); document.body.removeChild(a);
      setTimeout(function () { URL.revokeObjectURL(a.href); }, 15000);
      ctx.toast('Backup exportado.');
    };
    $('#btnImportData').onclick = function () { $('#importFile').click(); };
    $('#importFile').onchange = function (e) {
      var file = e.target.files && e.target.files[0]; if (!file) return;
      var rd = new FileReader();
      rd.onload = function () {
        try {
          var d = JSON.parse(rd.result);
          if (d.leads) PFStore.leads.upsertMany(d.leads);
          if (d.projects) PFStore.projects.upsertMany(d.projects);
          if (d.settings) PFStore.settings.set(d.settings);
          ctx.refreshKpis(); renderConfig(health); ctx.toast('Dados importados.');
        } catch (err) { ctx.toast('Arquivo inválido.'); }
      };
      rd.readAsText(file);
    };
    $('#btnReonboard').onclick = function () { if (ctx.showOnboarding) ctx.showOnboarding(); };
    $('#btnClearData').onclick = function () {
      var go = function () { PFStore.leads.clear(); PFStore.projects.clear(); ctx.refreshKpis(); renderConfig(health); ctx.toast('Dados locais apagados.'); };
      ctx.confirm ? ctx.confirm('Apagar TODOS os leads e páginas deste navegador? As configurações são mantidas.', go)
                  : (confirm('Apagar todos os leads e páginas?') && go());
    };
  }

  /* ---------------- KPIs / funil ---------------- */
  function funnel() {
    var leads = PFStore.leads.list();
    var by = function (fn) { return leads.filter(fn).length; };
    var reached = function (st) {
      var idx = STATUS.indexOf(st);
      return by(function (l) {
        var i = STATUS.indexOf(normStatus(l.status));
        var hist = (l.historico || []).some(function (h) { return STATUS.indexOf(h.status) >= idx; });
        return i >= idx || hist;
      });
    };
    return {
      encontrados: leads.length,
      qualificados: reached('qualificado'),
      redesigns: PFStore.projects.count(),
      demos: reached('demo-publicada'),
      propostasProntas: reached('proposta-pronta'),
      propostasEnviadas: reached('proposta-enviada'),
      followups: leadsPrecisamFollowup().length,
      negociacoes: by(function (l) { return normStatus(l.status) === 'negociacao'; }),
      fechados: by(function (l) { return normStatus(l.status) === 'fechado'; }),
      quentes: by(function (l) { return l.temperatura === 'quente'; })
    };
  }
  function leadsPrecisamFollowup() {
    var hoje = new Date().toISOString().slice(0, 10);
    return PFStore.leads.list().filter(function (l) {
      if (['fechado', 'perdido'].indexOf(normStatus(l.status)) > -1) return false;
      if (l.proximaAcaoData && l.proximaAcaoData <= hoje) return true;
      return ['proposta-enviada', 'follow-up'].indexOf(normStatus(l.status)) > -1 && !l.proximaAcaoData;
    });
  }
  function renderKpis() {
    var el = $('#kpis'); if (!el) return;
    var fn = funnel();
    el.innerHTML = [
      ['Encontrados', fn.encontrados, '#/leads'],
      ['Qualificados', fn.qualificados, '#/leads'],
      ['Redesigns', fn.redesigns, '#/projetos'],
      ['Demos publicadas', fn.demos, '#/leads'],
      ['Propostas prontas', fn.propostasProntas, '#/leads'],
      ['Propostas enviadas', fn.propostasEnviadas, '#/leads'],
      ['Follow-ups', fn.followups, '#/followups'],
      ['Negociações', fn.negociacoes, '#/leads'],
      ['Fechados', fn.fechados, '#/leads']
    ].map(function (k) {
      return '<a class="kpi" href="' + k[2] + '"><span class="kpi__n">' + k[1] + '</span><span class="kpi__l">' + k[0] + '</span></a>';
    }).join('');
  }

  // sugestão de próximo passo a partir do estágio
  var NEXT_STEP = {
    novo: ['Qualificar e diagnosticar', '#/lead/'],
    qualificado: ['Gerar o redesign (Criar nova versão)', '#/lead/'],
    'redesign-criado': ['Publicar a demo', '#/lead/'],
    'demo-publicada': ['Gerar a proposta', '#/lead/'],
    'proposta-pronta': ['Criar o e-mail e enviar', '#/lead/'],
    'proposta-enviada': ['Follow-up', '#/lead/'],
    'follow-up': ['Retomar contato / negociar', '#/lead/'],
    negociacao: ['Fechar e gerar contrato', '#/lead/']
  };

  function renderDashboard(health) {
    var host = $('#dashSections'); if (!host) return;
    var leads = PFStore.leads.list();
    var projects = PFStore.projects.list().sort(function (a, b) { return (b.atualizado || '').localeCompare(a.atualizado || ''); });
    var hoje = new Date().toISOString().slice(0, 10);

    var proximas = leads.filter(function (l) { return ['fechado', 'perdido'].indexOf(normStatus(l.status)) < 0; })
      .sort(function (a, b) { return STATUS.indexOf(normStatus(a.status)) - STATUS.indexOf(normStatus(b.status)); })
      .slice(0, 6);
    var followHoje = leadsPrecisamFollowup().filter(function (l) { return !l.proximaAcaoData || l.proximaAcaoData <= hoje; });
    var quentes = leads.filter(function (l) { return l.temperatura === 'quente' && ['fechado', 'perdido'].indexOf(normStatus(l.status)) < 0; })
      .sort(function (a, b) { return (b.score || 0) - (a.score || 0); }).slice(0, 5);

    if (!leads.length && !projects.length) {
      host.innerHTML = '<div class="empty-state">' +
        '<h3>Comece por aqui</h3>' +
        '<p class="muted">Você ainda não tem leads nem páginas. Escolha um caminho:</p>' +
        '<div class="lead-card__actions" style="justify-content:center">' +
          '<a class="btn btn--primary btn--sm" href="#/prospeccao">Encontrar clientes</a>' +
          '<a class="btn btn--ghost btn--sm" href="#/new">Criar uma página</a>' +
        '</div></div>';
      return;
    }

    function leadMiniCard(l, extra) {
      var ns = NEXT_STEP[normStatus(l.status)];
      return '<a class="dash-lead" href="#/lead/' + esc(l.slug) + '">' +
        '<span class="dash-lead__name">' + esc(l.nome) + '</span>' +
        '<span class="dash-lead__meta">' + (extra || (ns ? '→ ' + esc(ns[0]) : esc(statusLabel(l.status)))) + '</span>' +
      '</a>';
    }

    host.innerHTML =
      '<div class="dash-cols">' +
        '<section class="dash-panel"><h3>Próximas ações</h3>' +
          (proximas.length ? proximas.map(function (l) { return leadMiniCard(l); }).join('')
                           : '<p class="muted tiny">Nenhum lead ativo. <a href="#/prospeccao">Prospecte</a>.</p>') +
        '</section>' +
        '<section class="dash-panel"><h3>Follow-ups de hoje <b>' + followHoje.length + '</b></h3>' +
          (followHoje.length ? followHoje.slice(0, 6).map(function (l) {
              return leadMiniCard(l, (l.proximaAcaoData && l.proximaAcaoData < hoje ? 'atrasado · ' : '') + (l.proximaAcaoData || 'sem data'));
            }).join('') + (followHoje.length > 6 ? '<a class="dash-more" href="#/followups">ver todos →</a>' : '')
                           : '<p class="muted tiny">Nada para acompanhar hoje. 👍</p>') +
        '</section>' +
        '<section class="dash-panel"><h3>Leads quentes 🔥</h3>' +
          (quentes.length ? quentes.map(function (l) { return leadMiniCard(l, 'score ' + (l.score != null ? l.score : '–')); }).join('')
                          : '<p class="muted tiny">Nenhum lead quente ainda.</p>') +
        '</section>' +
        '<section class="dash-panel"><h3>Projetos recentes</h3>' +
          (projects.length ? projects.slice(0, 6).map(function (p) {
              return '<a class="dash-lead" href="#" data-open-proj="' + esc(p.id) + '">' +
                '<span class="dash-lead__name">' + esc(p.name || 'Página') + '</span>' +
                '<span class="dash-lead__meta">' + esc(p.pageType || '') + ' · ' + esc((p.atualizado || '').slice(0, 10)) + '</span></a>';
            }).join('') + '<a class="dash-more" href="#/projetos">ver todos →</a>'
                           : '<p class="muted tiny">Nenhuma página. <a href="#/new">Criar</a>.</p>') +
        '</section>' +
      '</div>';

    $$('[data-open-proj]', host).forEach(function (a) {
      a.addEventListener('click', function (e) { e.preventDefault(); if (ctx.openProject) ctx.openProject(a.dataset.openProj, {}); });
    });
  }

  /* ---------------- PROSPECÇÃO: estado do motor ---------------- */
  function renderProspectMock(health) {
    var box = $('#prospectMock'); if (!box) return;
    var pr = (health && health.prospect) || {};
    if (pr.ready && pr.keyConfigured) { box.innerHTML = ''; return; }
    box.innerHTML = notice('info',
      '<strong>Modo de exemplo.</strong> Sem <code>AISA_KEY</code> no servidor, a prospecção devolve <strong>leads MOCK</strong> realistas — claramente marcados — para você percorrer todo o fluxo (diagnóstico, redesign, demo, proposta). Configure a chave na Vercel para buscar empresas de verdade.');
    // pré-preenche a partir das configurações
    var s = PFStore.settings.get();
    var form = $('#prospectForm');
    if (form && !form.__prefilled) {
      form.__prefilled = true;
      if (s.prospeccaoNicho && !form.niche.value) form.niche.value = s.prospeccaoNicho;
      if (s.prospeccaoRegiao && !form.city.value) form.city.value = s.prospeccaoRegiao;
      if (s.prospeccaoQtd && form.count) form.count.value = s.prospeccaoQtd;
    }
  }

  function renderFollowups() {
    var wrap = $('#followupsList'); if (!wrap) return;
    var list = leadsPrecisamFollowup().sort(function (a, b) { return (a.proximaAcaoData || '9999') < (b.proximaAcaoData || '9999') ? -1 : 1; });
    $('#followupsCount').textContent = list.length + ' lead(s) para acompanhar';
    if (!list.length) { wrap.innerHTML = notice('ok', 'Nenhum follow-up pendente. 👍'); return; }
    var hoje = new Date().toISOString().slice(0, 10);
    wrap.innerHTML = '<div class="lead-cards">' + list.map(function (l) {
      var atrasado = l.proximaAcaoData && l.proximaAcaoData < hoje;
      return '<article class="lead-card"><div class="lead-card__top"><div>' +
        '<h3>' + esc(l.nome) + '</h3><p class="lead-card__meta">' + esc(statusLabel(l.status)) + (l.demoUrl ? ' · demo publicada' : '') + '</p></div>' +
        '<span class="temp temp--' + (atrasado ? 'quente' : 'morno') + '">' + (l.proximaAcaoData ? (atrasado ? 'atrasado ' : '') + l.proximaAcaoData : 'sem data') + '</span></div>' +
        '<ul class="lead-card__facts">' +
          (l.proximaAcao ? '<li>Próxima ação: ' + esc(l.proximaAcao) + '</li>' : '') +
          (l.observacoes ? '<li>' + esc(l.observacoes.slice(0, 140)) + '</li>' : '') +
        '</ul>' +
        '<div class="lead-card__actions">' +
          (l.email ? '<a class="chip" target="_blank" rel="noopener" href="https://mail.google.com/mail/?view=cm&fs=1&to=' + encodeURIComponent(l.email) + '&su=' + encodeURIComponent('Conseguiu ver a página, ' + (l.nome || '').split(' ')[0] + '?') + '&body=' + encodeURIComponent('Olá! Te escrevi há alguns dias sobre a nova versão do site. Conseguiu dar uma olhada? ' + (l.demoUrl || '') + '\n\nQualquer dúvida, estou por aqui.') + '">Rascunho de follow-up</a>' : (l.whatsapp ? '<a class="chip" target="_blank" rel="noopener" href="https://wa.me/' + digits(l.whatsapp) + '">WhatsApp</a>' : '')) +
          '<button class="chip" data-done="' + esc(l.slug) + '">Marcar feito</button>' +
          '<button class="btn btn--primary btn--sm" data-open="' + esc(l.slug) + '">Abrir lead</button>' +
        '</div></article>';
    }).join('') + '</div>';
    $$('[data-open]', wrap).forEach(function (b) { b.addEventListener('click', function () { location.hash = '#/lead/' + b.dataset.open; }); });
    $$('[data-done]', wrap).forEach(function (b) { b.addEventListener('click', function () {
      var l = PFStore.leads.get(b.dataset.done);
      var hist = (l.historico || []).concat([{ status: normStatus(l.status), at: new Date().toISOString(), nota: 'follow-up feito' }]);
      PFStore.leads.upsert({ slug: b.dataset.done, status: 'follow-up', historico: hist, proximaAcaoData: '', proximaAcao: '' });
      ctx.refreshKpis(); renderFollowups();
    }); });
  }

  /* ---------------- helpers ---------------- */
  function notice(kind, html) { return '<div class="notice notice--' + kind + '">' + html + '</div>'; }

  global.PFProspect = {
    init: function (context) { ctx = context; },
    onRoute: function (route, param, health) {
      if (route === '/prospeccao') { bindProspectForm(); renderProspectMock(health); }
      else if (route === '/leads') { renderLeadsView(); }
      else if (route === '/lead') { renderLeadDetail(param); }
      else if (route === '/projetos') { renderProjetos(); }
      else if (route === '/config') { renderConfig(health); }
      else if (route === '/followups') { renderFollowups(); }
      if (route === '/' || route === '') { renderKpis(); renderDashboard(health); }
    },
    renderKpis: renderKpis,
    renderDashboard: renderDashboard,
    renderFollowups: renderFollowups,
    renderLeadDetail: renderLeadDetail,
    refreshLeadHeader: refreshLeadHeader,
    setLeadStatus: setLeadStatus,
    statusLabel: statusLabel,
    normStatus: normStatus,
    STATUS: STATUS,
    STATUS_LABEL: STATUS_LABEL,
    getCtx: function () { return ctx; }
  };
})(window);
