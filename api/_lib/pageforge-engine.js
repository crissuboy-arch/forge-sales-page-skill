// pageforge-engine.js — O MESMO motor de geração usado pela interface
// "Criar Página" (api/generate.js), reempacotado numa única chamada
// server-to-server (sem streaming NDJSON, que é só para a barra de progresso
// do navegador). Mesma sequência: PLAN -> RENDER -> ASSEMBLE (postprocess +
// design-quality + impeccable-qa), mesmos módulos, mesmos prompts. Não é um
// segundo gerador — é o gerador existente com uma orquestração síncrona.
import { getProvider } from './providers.js';
import { buildPlanMessages, buildRenderMessages } from './prompt.js';
import { assemblePage, parseJsonLoose } from './assemble.js';
import { postprocess } from './postprocess.js';
import { designQuality } from './design-quality.js';
import { impeccableQa } from './impeccable-qa.js';
import { mockPlan, mockSections } from './mock.js';

export const ENGINE = 'api/_lib/{prompt,assemble,postprocess,design-quality,impeccable-qa,mock}.js (mesmo motor de api/generate.js)';

/**
 * @param {object} brief  sanitizeBrief().value
 * @param {{mock?:boolean}} [opts]
 * @returns {Promise<{ok, html, warnings, errors, qa, design, meta}>}
 */
export async function generatePageForBrief(brief, opts = {}) {
  const started = Date.now();
  const mock = opts.mock === true || process.env.PAGEFORGE_MOCK === '1';
  const provider = getProvider();

  if (!mock && !provider.isConfigured()) {
    const envVar = `${provider.name.toUpperCase().replace(/[^A-Z0-9]/g, '_')}_API_KEY`;
    const err = new Error(`${envVar} não configurada no servidor — a geração real de páginas está bloqueada até a chave existir.`);
    err.code = 'PROVIDER_KEY_MISSING';
    throw err;
  }

  async function callAI({ system, user, temperature, maxTokens, budgetMs }) {
    const ac = new AbortController();
    const t = setTimeout(() => ac.abort(), budgetMs);
    try {
      return await provider.chat({ system, user, temperature, maxTokens, signal: ac.signal, deadline: started + budgetMs - 2000, stream: false });
    } catch (err) {
      if (err.name === 'AbortError' || /aborted/i.test(err.message || '')) {
        const e = new Error('O provider de IA demorou mais que o limite desta chamada e foi cancelado.');
        e.code = 'PROVIDER_TIMEOUT';
        throw e;
      }
      throw err;
    } finally {
      clearTimeout(t);
    }
  }

  let planModel = 'mock';
  let plan;
  if (mock) {
    plan = mockPlan(brief);
  } else {
    const { system, user } = buildPlanMessages(brief);
    const r = await callAI({ system, user, temperature: 0.6, maxTokens: 4096, budgetMs: 20000 });
    planModel = r.model;
    plan = parseJsonLoose(r.content);
    if (!plan || !Array.isArray(plan.sections) || !plan.sections.length) {
      const err = new Error('A IA não devolveu um plano de página válido.');
      err.code = 'BAD_PLAN';
      throw err;
    }
  }
  plan.sections = (plan.sections || []).filter((s) => s && s.id).slice(0, 8);
  const ids = plan.sections.map((s) => s.id);
  if (!ids.length) { const err = new Error('Plano sem seções.'); err.code = 'BAD_PLAN'; throw err; }

  let renderModel = planModel;
  let sections;
  if (mock) {
    sections = mockSections(brief, plan, ids);
  } else {
    const { system, user } = buildRenderMessages(brief, plan, ids);
    const r = await callAI({ system, user, temperature: 0.5, maxTokens: 5200, budgetMs: 25000 });
    renderModel = r.model;
    const out = parseJsonLoose(r.content);
    sections = {};
    if (out && typeof out === 'object') {
      for (const id of ids) {
        let h = out[id];
        if (Array.isArray(h)) h = h.join('\n');
        if (typeof h === 'string' && /<\w/.test(h)) sections[id] = h.replace(/\{\{CHECKOUT_URL\}\}/g, brief.checkoutUrl || '#oferta');
      }
    }
    if (!Object.keys(sections).length) {
      const err = new Error('A IA não devolveu HTML de seção válido.');
      err.code = 'BAD_RENDER';
      throw err;
    }
  }

  const doc = assemblePage(brief, plan, sections);
  const pp = postprocess(doc, brief);
  const dq = designQuality(pp.html, brief);
  const qa = impeccableQa(dq.html, brief);

  return {
    ok: pp.ok,
    html: qa.html,
    warnings: pp.warnings,
    errors: pp.errors,
    qa: { score: qa.score, band: qa.band, dims: qa.dims, fixes: qa.fixes },
    design: { mode: dq.mode, score: dq.score, band: dq.band, profile: dq.profile.map((x) => x.cap), fixes: dq.fixes },
    meta: {
      provider: mock ? 'mock' : provider.name,
      model: mock ? 'mock' : renderModel,
      ms: Date.now() - started,
      pageType: brief.pageType,
      scrollMode: brief.scrollMode,
    },
  };
}
