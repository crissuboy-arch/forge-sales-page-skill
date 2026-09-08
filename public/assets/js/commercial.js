/* commercial.js — Fase 3: pipeline + publicar demo + proposta + rascunho de
   e-mail + contrato, no detalhe do lead. Reaproveita PFProspect + PFStore.
   Templates vêm de /api/commercial (server-side, sem IA). */
(function (global) {
  'use strict';
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]; }); }
  function digits(s) { return String(s || '').replace(/[^\d]/g, ''); }
  function ctx() { return (window.PFProspect && PFProspect.getCtx && PFProspect.getCtx()) || { toast: function () {}, refreshKpis: function () {} }; }

  function api(path, body) {
    return fetch(path, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) })
      .then(function (r) { return r.text(); })
      .then(function (t) {
        // /api/generate é NDJSON; /api/demo e /api/commercial são JSON
        var last = t.trim().split('\n').map(function (l) { try { return JSON.parse(l); } catch (e) { return null; } }).filter(Boolean).pop();
        return last || {};
      });
  }

  function download(name, content, type) {
    var blob = new Blob([content], { type: type || 'text/html' });
    var a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = name;
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    setTimeout(function () { URL.revokeObjectURL(a.href); }, 15000);
  }
  function copy(text) {
    (navigator.clipboard ? navigator.clipboard.writeText(text) : Promise.reject()).then(function () { ctx().toast('Copiado.'); }).catch(function () {
      var ta = document.createElement('textarea'); ta.value = text; document.body.appendChild(ta); ta.select();
      try { document.execCommand('copy'); ctx().toast('Copiado.'); } catch (e) {}
      document.body.removeChild(ta);
    });
  }

  function latestProjectFor(slug) {
    var arr = PFStore.projects.list(function (p) { return p.leadSlug === slug; });
    arr.sort(function (a, b) { return (b.atualizado || '').localeCompare(a.atualizado || ''); });
    return arr[0] || null;
  }

  function renderPanel(slug, host) {
    var l = PFStore.leads.get(slug);
    if (!l || !host) return;
    if (window.PFProspect && PFProspect.refreshLeadHeader) PFProspect.refreshLeadHeader(slug);
    var S = PFProspect.STATUS, SL = PFProspect.STATUS_LABEL;
    var proj = latestProjectFor(slug);
    var hist = (l.historico || []).slice().reverse();

    host.innerHTML =
      '<div class="panel"><h2>Pipeline</h2>' +
        '<div class="pipeline-bar">' + S.map(function (st) {
          var on = PFProspect.normStatus(l.status) === st;
          var done = S.indexOf(st) < S.indexOf(PFProspect.normStatus(l.status));
          return '<button class="pipe' + (on ? ' on' : (done ? ' done' : '')) + '" data-st="' + st + '">' + esc(SL[st]) + '</button>';
        }).join('') + '</div>' +
        '<div class="grid-2" style="margin-top:1rem">' +
          '<div class="field"><label>Próxima ação<input type="text" id="cmNextAction" value="' + esc(l.proximaAcao || '') + '"></label></div>' +
          '<div class="field"><label>Data de follow-up<input type="date" id="cmNextDate" value="' + esc(l.proximaAcaoData || '') + '"></label></div>' +
        '</div>' +
        '<div class="field"><label>Observações<textarea id="cmObs">' + esc(l.observacoes || '') + '</textarea></label></div>' +
        '<button class="btn btn--ghost btn--sm" id="cmSaveNotes">Salvar anotações</button>' +
        (hist.length ? '<details class="cm-hist"><summary>Histórico (' + hist.length + ')</summary><ul>' + hist.map(function (h) { return '<li>' + esc((h.at || '').slice(0, 16).replace('T', ' ')) + ' — ' + esc(SL[h.status] || h.status) + (h.nota ? ' · ' + esc(h.nota) : '') + '</li>'; }).join('') + '</ul></details>' : '') +
      '</div>' +

      '<div class="panel"><h2>Demonstração</h2>' +
        (l.demoUrl
          ? '<p class="cm-ok">Publicada: <a href="' + esc(l.demoUrl) + '" target="_blank" rel="noopener">' + esc(l.demoUrl) + '</a> · <span class="chip chip--on">PUBLICADA</span></p>'
          : '<p class="panel__lead">Publique a página final (última versão gerada/editada) numa URL pública individual para apresentar ao cliente.</p>') +
        '<div class="cm-actions">' +
          '<button class="btn btn--primary btn--sm" id="cmPublish"' + (proj ? '' : ' disabled title="Gere/edite uma página deste lead primeiro"') + '>' + (l.demoUrl ? 'Republicar demo' : 'PUBLICAR DEMO') + '</button>' +
          (proj ? '<a class="chip" href="#/preview" id="cmOpenPreview">Abrir a página</a>' : '') +
          (l.demoUrl ? '<button class="chip" id="cmUnpublish">Despublicar</button>' : '') +
        '</div>' +
        '<div id="cmDemoMsg"></div>' +
      '</div>' +

      '<div class="panel"><h2>Proposta</h2>' +
        '<div class="cm-actions">' +
          '<button class="btn btn--primary btn--sm" id="cmProposal">GERAR PROPOSTA</button>' +
          (l.propostaHtml ? '<button class="chip" id="cmProposalOpen">Abrir proposta</button><button class="chip" id="cmProposalPublish">Publicar proposta</button>' : '') +
        '</div>' +
        '<div id="cmProposalBox"></div>' +
      '</div>' +

      '<div class="panel"><h2>E-mail</h2>' +
        '<button class="btn btn--primary btn--sm" id="cmEmail">CRIAR RASCUNHO DE E-MAIL</button>' +
        '<p class="tiny muted">Não envia nada. Gera o rascunho para você revisar e abrir no Gmail (ou copiar).</p>' +
        '<div id="cmEmailBox"></div>' +
      '</div>' +

      '<div class="panel"><h2>Contrato</h2>' +
        '<button class="btn btn--primary btn--sm" id="cmContract">GERAR CONTRATO</button>' +
        '<p class="tiny muted">Minuta base. Só preenche dados reais; o que faltar aparece para preencher à mão. Sem assinatura eletrônica nesta fase.</p>' +
        '<div id="cmContractBox"></div>' +
      '</div>';

    // ---- pipeline ----
    $$('.pipe', host).forEach(function (b) {
      b.addEventListener('click', function () {
        PFProspect.setLeadStatus(slug, b.dataset.st);
        ctx().toast('Status: ' + PFProspect.statusLabel(b.dataset.st));
        renderPanel(slug, host);
      });
    });
    $('#cmSaveNotes', host).addEventListener('click', function () {
      PFStore.leads.upsert({ slug: slug, proximaAcao: $('#cmNextAction', host).value.trim(), proximaAcaoData: $('#cmNextDate', host).value, observacoes: $('#cmObs', host).value.trim() });
      ctx().refreshKpis(); ctx().toast('Anotações salvas.');
    });

    // ---- demo ----
    var pubBtn = $('#cmPublish', host);
    if (pubBtn && proj) pubBtn.addEventListener('click', function () {
      pubBtn.disabled = true; $('#cmDemoMsg', host).innerHTML = '<p class="muted tiny">Publicando…</p>';
      api('/api/demo', { slug: slug, nome: l.nome, html: proj.html }).then(function (res) {
        pubBtn.disabled = false;
        if (res.ok && res.url) {
          var hist2 = (PFStore.leads.get(slug).historico || []).concat([{ status: 'demo-publicada', at: new Date().toISOString(), nota: res.url }]);
          PFStore.leads.upsert({ slug: slug, demoUrl: res.url, demoSlug: res.slug, demoPublishedAt: res.publishedAt, status: 'demo-publicada', historico: hist2 });
          ctx().refreshKpis(); renderPanel(slug, host); ctx().toast('Demo publicada.');
        } else if (res.code === 'BLOB_MISSING') {
          $('#cmDemoMsg', host).innerHTML = '<div class="notice notice--warn">' + esc(res.error) + '</div>' +
            '<button class="btn btn--ghost btn--sm" id="cmExportInstead">Exportar HTML</button>';
          $('#cmExportInstead', host).addEventListener('click', function () { download((slug || 'demo') + '.html', proj.html); });
        } else {
          $('#cmDemoMsg', host).innerHTML = '<div class="notice notice--err">' + esc(res.error || 'Falha ao publicar.') + '</div>';
        }
      }).catch(function (e) { pubBtn.disabled = false; $('#cmDemoMsg', host).innerHTML = '<div class="notice notice--err">' + esc(e.message) + '</div>'; });
    });
    var unp = $('#cmUnpublish', host);
    if (unp) unp.addEventListener('click', function () {
      if (!confirm('Despublicar a demo?')) return;
      api('/api/demo', { action: 'delete', slug: l.demoSlug || slug }).then(function () {
        PFStore.leads.upsert({ slug: slug, demoUrl: '', demoSlug: '' });
        renderPanel(slug, host); ctx().refreshKpis();
      });
    });
    var op = $('#cmOpenPreview', host);
    if (op) op.addEventListener('click', function (e) { e.preventDefault(); if (ctx().openProject) ctx().openProject(proj.id); });

    // ---- proposta ----
    $('#cmProposal', host).addEventListener('click', function () {
      var s = PFStore.settings.get();
      $('#cmProposalBox', host).innerHTML = '<p class="muted tiny">Gerando proposta…</p>';
      api('/api/commercial', { action: 'proposal', lead: PFStore.leads.get(slug), opts: { settings: s, demoUrl: l.demoUrl } }).then(function (res) {
        if (!res.ok) { $('#cmProposalBox', host).innerHTML = '<div class="notice notice--err">' + esc(res.error || 'Falha.') + '</div>'; return; }
        var f = res.fields || {};
        $('#cmProposalBox', host).innerHTML =
          (res.missing && res.missing.length ? '<div class="notice notice--warn">Faltando: ' + res.missing.map(esc).join(' · ') + '</div>' : '') +
          '<div class="grid-2">' +
            '<div class="field"><label>Problema / oportunidade<textarea id="pp_problema">' + esc(f.problema || '') + '</textarea></label></div>' +
            '<div class="field"><label>O que está incluído<textarea id="pp_solucao">' + esc(f.solucao || '') + '</textarea></label></div>' +
          '</div>' +
          '<div class="field"><label>Próximo passo<textarea id="pp_proximo">' + esc(f.proximoPasso || '') + '</textarea></label></div>' +
          '<div class="field"><label>Investimento (deixe vazio para "a combinar")<input type="text" id="pp_preco" value="' + esc(f.preco || '') + '"></label></div>' +
          '<div class="cm-actions"><button class="btn btn--primary btn--sm" id="pp_save">Salvar proposta</button></div>';
        $('#pp_save', host).addEventListener('click', function () {
          api('/api/commercial', { action: 'proposal', lead: PFStore.leads.get(slug), opts: { settings: s, demoUrl: l.demoUrl, problema: $('#pp_problema', host).value, solucao: $('#pp_solucao', host).value, proximoPasso: $('#pp_proximo', host).value, preco: $('#pp_preco', host).value } } ).then(function (r2) {
            if (!r2.ok) { ctx().toast('Falha ao salvar.'); return; }
            var hist3 = (PFStore.leads.get(slug).historico || []).concat([{ status: 'proposta-pronta', at: new Date().toISOString(), nota: '' }]);
            PFStore.leads.upsert({ slug: slug, propostaHtml: r2.html, status: 'proposta-pronta', historico: hist3 });
            ctx().refreshKpis(); ctx().toast('Proposta salva.'); renderPanel(slug, host);
          });
        });
      });
    });
    var pOpen = $('#cmProposalOpen', host);
    if (pOpen) pOpen.addEventListener('click', function () {
      var b = new Blob([l.propostaHtml], { type: 'text/html' }); var u = URL.createObjectURL(b);
      window.open(u, '_blank', 'noopener'); setTimeout(function () { URL.revokeObjectURL(u); }, 20000);
    });
    var pPub = $('#cmProposalPublish', host);
    if (pPub) pPub.addEventListener('click', function () {
      pPub.disabled = true;
      api('/api/demo', { slug: slug + '-proposta', nome: l.nome + ' (proposta)', html: l.propostaHtml }).then(function (res) {
        pPub.disabled = false;
        if (res.ok && res.url) { PFStore.leads.upsert({ slug: slug, propostaUrl: res.url }); ctx().toast('Proposta publicada: ' + res.url); copy(res.url); }
        else ctx().toast(res.error || 'Configure BLOB_READ_WRITE_TOKEN para publicar.');
      });
    });

    // ---- e-mail ----
    $('#cmEmail', host).addEventListener('click', function () {
      var s = PFStore.settings.get();
      $('#cmEmailBox', host).innerHTML = '<p class="muted tiny">Gerando rascunho…</p>';
      api('/api/commercial', { action: 'email', lead: PFStore.leads.get(slug), opts: { settings: s, demoUrl: l.demoUrl, propostaUrl: l.propostaUrl || l.demoUrl } }).then(function (res) {
        if (!res.ok) { $('#cmEmailBox', host).innerHTML = '<div class="notice notice--err">' + esc(res.error || 'Falha.') + '</div>'; return; }
        $('#cmEmailBox', host).innerHTML =
          (res.missing && res.missing.length ? '<div class="notice notice--warn">Faltando: ' + res.missing.map(esc).join(' · ') + '</div>' : '') +
          '<div class="field"><label>Assunto<input type="text" id="em_su" value="' + esc(res.subject) + '"></label></div>' +
          '<div class="field"><label>Corpo<textarea id="em_body" style="min-height:180px">' + esc(res.body) + '</textarea></label></div>' +
          '<div class="cm-actions">' +
            (l.email ? '<a class="btn btn--primary btn--sm" id="em_gmail" target="_blank" rel="noopener" href="' + esc(res.gmailUrl) + '">Abrir no Gmail</a>' : '') +
            (l.email ? '<a class="chip" href="' + esc(res.mailto) + '">Abrir no e-mail padrão</a>' : '<span class="chip">Sem e-mail — use WhatsApp</span>') +
            '<button class="chip" id="em_copy">Copiar texto</button>' +
            '<button class="chip" id="em_sent">Marcar como enviada</button>' +
          '</div>';
        function currentDraft() { return { subject: $('#em_su', host).value, body: $('#em_body', host).value }; }
        $('#em_copy', host).addEventListener('click', function () { var d = currentDraft(); copy(d.subject + '\n\n' + d.body); });
        var g = $('#em_gmail', host);
        function refreshGmail() { if (g) g.href = 'https://mail.google.com/mail/?view=cm&fs=1&to=' + encodeURIComponent(l.email || '') + '&su=' + encodeURIComponent($('#em_su', host).value) + '&body=' + encodeURIComponent($('#em_body', host).value); }
        $('#em_su', host).addEventListener('input', refreshGmail); $('#em_body', host).addEventListener('input', refreshGmail);
        $('#em_sent', host).addEventListener('click', function () {
          PFStore.leads.upsert({ slug: slug, emailDraft: currentDraft() });
          PFProspect.setLeadStatus(slug, 'proposta-enviada', 'e-mail marcado como enviado');
          ctx().toast('Marcada como enviada. Follow-up agendado (+3 dias).'); renderPanel(slug, host);
        });
      });
    });

    // ---- contrato ----
    $('#cmContract', host).addEventListener('click', function () {
      var s = PFStore.settings.get();
      renderContract(slug, host, s, {});
    });
    if (l.contratoHtml) {
      $('#cmContractBox', host).innerHTML = '<button class="chip" id="ct_open">Abrir contrato salvo</button>';
      $('#ct_open', host).addEventListener('click', function () { var b = new Blob([l.contratoHtml], { type: 'text/html' }); var u = URL.createObjectURL(b); window.open(u, '_blank', 'noopener'); setTimeout(function () { URL.revokeObjectURL(u); }, 20000); });
    }
  }

  function renderContract(slug, host, settings, extra) {
    var l = PFStore.leads.get(slug);
    $('#cmContractBox', host).innerHTML = '<p class="muted tiny">Gerando minuta…</p>';
    api('/api/commercial', { action: 'contract', lead: l, opts: Object.assign({ settings: settings }, extra) }).then(function (res) {
      if (!res.ok) { $('#cmContractBox', host).innerHTML = '<div class="notice notice--err">' + esc(res.error || 'Falha.') + '</div>'; return; }
      var manual = res.missing || [];
      $('#cmContractBox', host).innerHTML =
        (manual.length ? '<div class="notice notice--warn">Preencha à mão: ' + manual.map(esc).join(' · ') + '</div>' : '') +
        '<div class="grid-2">' +
          '<div class="field"><label>Valor acordado<input type="text" id="ct_preco" value="' + esc(extra.preco || settings.precoPadrao || '') + '"></label></div>' +
          '<div class="field"><label>Prazo de entrega<input type="text" id="ct_prazo" value="' + esc(extra.prazo || settings.prazoPadrao || '') + '"></label></div>' +
          '<div class="field"><label>Forma de pagamento<input type="text" id="ct_forma" value="' + esc(extra.formaPagamento || settings.formaPagamento || '') + '"></label></div>' +
          '<div class="field"><label>CPF/CNPJ do cliente<input type="text" id="ct_cdoc" value="' + esc(extra.clienteDoc || '') + '"></label></div>' +
        '</div>' +
        '<div class="cm-actions">' +
          '<button class="btn btn--ghost btn--sm" id="ct_regen">Atualizar minuta</button>' +
          '<button class="btn btn--primary btn--sm" id="ct_save">Salvar &amp; abrir</button>' +
        '</div>';
      $('#ct_regen', host).addEventListener('click', function () {
        renderContract(slug, host, settings, { preco: $('#ct_preco', host).value, prazo: $('#ct_prazo', host).value, formaPagamento: $('#ct_forma', host).value, clienteDoc: $('#ct_cdoc', host).value });
      });
      $('#ct_save', host).addEventListener('click', function () {
        PFStore.leads.upsert({ slug: slug, contratoHtml: res.html });
        var b = new Blob([res.html], { type: 'text/html' }); var u = URL.createObjectURL(b);
        window.open(u, '_blank', 'noopener'); setTimeout(function () { URL.revokeObjectURL(u); }, 20000);
        ctx().toast('Contrato salvo.');
      });
    });
  }

  global.PFCommercial = { renderPanel: renderPanel, download: download };
})(window);
