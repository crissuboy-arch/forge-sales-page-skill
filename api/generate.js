// POST /api/generate — geração de página em ETAPAS curtas (nenhuma requisição
// isolada passa do limite de tempo da função serverless).
//
//   step:"plan"     body {brief}                      -> {plan}
//   step:"render"   body {brief, plan, sectionIds[]}   -> {sections:{id:html}}
//   step:"assemble" body {brief, plan, sections}       -> {html, warnings, errors, meta}   (sem IA)
//   mode:"section"  body {brief, currentHtml, instruction}  -> {html,...}   (ajuste no preview)
//   step:"full" (legado)  body {brief}                 -> {html,...}   (uma requisição só)
//
// Resposta: NDJSON em streaming (mantém a conexão viva + progresso):
//   {"t":"progress","chars":N}   {"t":"done", ...}   {"t":"error", code, error}
import { getProvider, MissingKeyError, ProviderError } from './_lib/providers.js';
import { sanitizeBrief } from './_lib/sanitize.js';
import { buildMessages, buildSectionMessages, buildPlanMessages, buildRenderMessages } from './_lib/prompt.js';
import { postprocess } from './_lib/postprocess.js';
import { assemblePage, parseJsonLoose } from './_lib/assemble.js';
import { mockGenerate, mockPlan, mockSections } from './_lib/mock.js';
import { readJson, methodGuard } from './_lib/http.js';

export const config = { maxDuration: 60 };

export default async function handler(req, res) {
  if (!methodGuard(req, res, ['POST'])) return;

  res.statusCode = 200;
  res.setHeader('content-type', 'application/x-ndjson; charset=utf-8');
  res.setHeader('cache-control', 'no-store');
  res.setHeader('x-content-type-options', 'nosniff');
  const write = (o) => { try { res.write(`${JSON.stringify(o)}\n`); } catch { /* client foi embora */ } };
  const finish = (o) => { write(o); try { res.end(); } catch { /* noop */ } };

  let payload;
  try { payload = await readJson(req, 1024 * 1024); }
  catch (err) { return finish({ t: 'error', code: 'BAD_REQUEST', error: err.message }); }

  const { ok: validOk, errors: validErrors, value: brief } = sanitizeBrief(payload.brief || payload);
  if (!validOk) return finish({ t: 'error', code: 'INVALID_BRIEF', error: validErrors.join(' ') });

  const mock = process.env.PAGEFORGE_MOCK === '1';
  const provider = getProvider();
  if (!mock && !provider.isConfigured()) {
    return finish({
      t: 'error', code: 'NVIDIA_KEY_MISSING',
      error: 'NVIDIA_API_KEY não está configurada no servidor. Configure a variável de ambiente na Vercel (Settings → Environment Variables) e faça um novo deploy. Todo o resto da PageForge AI funciona; só a geração com IA fica bloqueada até a chave existir.',
    });
  }

  const step = String(payload.step || (payload.mode === 'section' ? 'section' : 'full'));
  const started = Date.now();

  // progresso em streaming
  let chars = 0; let lastPing = 0;
  const onToken = (d) => {
    chars += d.length;
    const now = Date.now();
    if (now - lastPing > 1100) { lastPing = now; write({ t: 'progress', chars }); }
  };

  async function callAI({ system, user, temperature, maxTokens, budgetMs }) {
    const ac = new AbortController();
    const t = setTimeout(() => ac.abort(), budgetMs);
    try {
      return await provider.chat({ system, user, temperature, maxTokens, signal: ac.signal, deadline: started + budgetMs - 3000, stream: true, onToken });
    } finally { clearTimeout(t); }
  }

  try {
    // ---------------- PING (diagnóstico de latência do modelo) ----------------
    if (step === 'ping') {
      if (mock) return finish({ t: 'done', ok: true, meta: { model: 'mock', ms: 0 } });
      const models = payload.model ? [payload.model] : provider.candidateModels().slice(0, 1);
      const out = [];
      for (const m of models) {
        const s = Date.now();
        try {
          const rr = await provider._callModel(m, { system: 'Responda em uma frase.', user: 'Diga apenas: ok. Nada mais.', temperature: 0.1, maxTokens: 40, stream: false });
          out.push({ model: m, ms: Date.now() - s, ok: true, sample: String(rr.content || '').slice(0, 40) });
        } catch (e) { out.push({ model: m, ms: Date.now() - s, ok: false, error: String(e.message || e).slice(0, 160) }); }
      }
      return finish({ t: 'done', ok: true, results: out, meta: { ms: Date.now() - started } });
    }

    // ---------------- ASSEMBLE (sem IA) ----------------
    if (step === 'assemble') {
      const plan = payload.plan || {};
      const sections = payload.sections || {};
      if (!plan.sections || !Object.keys(sections).length) return finish({ t: 'error', code: 'BAD_REQUEST', error: 'assemble precisa de plan.sections e sections.' });
      const doc = assemblePage(brief, plan, sections);
      const pp = postprocess(doc, brief);
      return finish({
        t: 'done', ok: pp.ok, html: pp.html, warnings: pp.warnings, errors: pp.errors,
        meta: { provider: mock ? 'mock' : provider.name, model: payload.model || (mock ? 'mock' : provider.model), pageType: brief.pageType, scrollMode: brief.scrollMode, sensitive: brief.sensitive, affiliate: brief.affiliate, ms: Date.now() - started, step: 'assemble' },
      });
    }

    // ---------------- PLAN ----------------
    if (step === 'plan') {
      if (mock) return finish({ t: 'done', ok: true, plan: mockPlan(brief), meta: { model: 'mock', ms: Date.now() - started } });
      const { system, user } = buildPlanMessages(brief);
      const r = await callAI({ system, user, temperature: 0.6, maxTokens: 2400, budgetMs: 50000 });
      const plan = parseJsonLoose(r.content);
      if (!plan || !Array.isArray(plan.sections) || !plan.sections.length) {
        return finish({ t: 'error', code: 'BAD_PLAN', error: 'A IA não devolveu um plano válido. Tente de novo.', raw: String(r.content || '').slice(0, 1200) });
      }
      plan.sections = plan.sections.filter((s) => s && s.id).slice(0, 12);
      return finish({ t: 'done', ok: true, plan, meta: { provider: provider.name, model: r.model, ms: Date.now() - started, step: 'plan' } });
    }

    // ---------------- RENDER (lote de seções) ----------------
    if (step === 'render') {
      const plan = payload.plan || {};
      const ids = Array.isArray(payload.sectionIds) ? payload.sectionIds.filter(Boolean).slice(0, 4) : [];
      if (!plan.sections || !ids.length) return finish({ t: 'error', code: 'BAD_REQUEST', error: 'render precisa de plan e sectionIds.' });
      if (mock) return finish({ t: 'done', ok: true, sections: mockSections(brief, plan, ids), meta: { model: 'mock', ms: Date.now() - started } });
      const { system, user } = buildRenderMessages(brief, plan, ids);
      const r = await callAI({ system, user, temperature: 0.5, maxTokens: 2800, budgetMs: 50000 });
      let out = parseJsonLoose(r.content);
      if (!out || typeof out !== 'object') {
        return finish({ t: 'error', code: 'BAD_RENDER', error: 'A IA não devolveu HTML de seção válido. Tente de novo.', raw: String(r.content || '').slice(0, 1000) });
      }
      const clean = {};
      for (const id of ids) {
        let h = out[id];
        if (Array.isArray(h)) h = h.join('\n');
        if (typeof h === 'string' && /<\w/.test(h)) clean[id] = h.replace(/\{\{CHECKOUT_URL\}\}/g, brief.checkoutUrl || '#oferta');
      }
      if (!Object.keys(clean).length) return finish({ t: 'error', code: 'BAD_RENDER', error: 'Nenhuma seção utilizável no retorno da IA.', raw: String(r.content || '').slice(0, 1000) });
      return finish({ t: 'done', ok: true, sections: clean, meta: { provider: provider.name, model: r.model, ms: Date.now() - started, step: 'render', ids: Object.keys(clean) } });
    }

    // ---------------- SECTION (ajuste no preview) ----------------
    if (step === 'section') {
      if (mock) {
        const html = mockGenerate(brief, { instruction: payload.instruction });
        const pp = postprocess(html, brief);
        return finish({ t: 'done', ok: pp.ok, html: pp.html, warnings: ['MODO MOCK.', ...pp.warnings], errors: pp.errors, meta: { model: 'mock', ms: Date.now() - started } });
      }
      const { system, user } = buildSectionMessages(brief, payload.currentHtml, payload.instruction);
      const r = await callAI({ system, user, temperature: 0.3, maxTokens: 8000, budgetMs: 54000 });
      const pp = postprocess(r.content, brief);
      if (!pp.ok && !pp.html) return finish({ t: 'error', code: 'BAD_MODEL_OUTPUT', error: `A IA não devolveu um HTML válido. ${pp.errors.join(' ')}`.trim() });
      return finish({ t: 'done', ok: pp.ok, html: pp.html, warnings: pp.warnings, errors: pp.errors, meta: { provider: provider.name, model: r.model, ms: Date.now() - started, step: 'section' } });
    }

    // ---------------- FULL (legado — uma requisição) ----------------
    if (mock) {
      const html = mockGenerate(brief);
      const pp = postprocess(html, brief);
      return finish({ t: 'done', ok: pp.ok, html: pp.html, warnings: ['MODO MOCK.', ...pp.warnings], errors: pp.errors, meta: { model: 'mock', ms: Date.now() - started } });
    }
    const { system, user } = buildMessages(brief);
    const r = await callAI({ system, user, temperature: 0.55, maxTokens: 4200, budgetMs: 54000 });
    const pp = postprocess(r.content, brief);
    if (!pp.ok && !pp.html) return finish({ t: 'error', code: 'BAD_MODEL_OUTPUT', error: `A IA não devolveu um HTML válido. ${pp.errors.join(' ')}`.trim() });
    return finish({
      t: 'done', ok: pp.ok, html: pp.html, warnings: pp.warnings, errors: pp.errors,
      meta: { provider: provider.name, model: r.model, pageType: brief.pageType, scrollMode: brief.scrollMode, ms: Date.now() - started, step: 'full' },
    });
  } catch (err) {
    if (err instanceof MissingKeyError) return finish({ t: 'error', code: 'NVIDIA_KEY_MISSING', error: 'NVIDIA_API_KEY ausente no servidor.' });
    if (err instanceof ProviderError) return finish({ t: 'error', code: 'PROVIDER_ERROR', error: err.message, retriable: !err.fatal, raw: err.raw || err.detail || null });
    return finish({ t: 'error', code: 'UNEXPECTED', error: `Erro inesperado: ${err.message}` });
  }
}
