// POST /api/generate — transforma o briefing em uma página completa.
// Body: { brief:{...}, mode?: "full"|"section", instruction?: string, currentHtml?: string }
import { getProvider, MissingKeyError, ProviderError } from './_lib/providers.js';
import { sanitizeBrief } from './_lib/sanitize.js';
import { buildMessages, buildSectionMessages } from './_lib/prompt.js';
import { postprocess } from './_lib/postprocess.js';
import { mockGenerate } from './_lib/mock.js';
import { readJson, send, methodGuard } from './_lib/http.js';

export const config = { maxDuration: 60 };

const STAGES = [
  'normalizar briefing', 'analisar produto e oferta', 'identificar avatar e consciência',
  'definir ângulo e mecanismo', 'escolher arquitetura', 'escrever copy',
  'criar direção de arte', 'estruturar seções', 'gerar página',
  'aplicar SEO', 'aplicar compliance', 'validar CTAs e responsividade',
];

export default async function handler(req, res) {
  if (!methodGuard(req, res, ['POST'])) return;

  let payload;
  try {
    payload = await readJson(req);
  } catch (err) {
    return send(res, 400, { ok: false, error: err.message });
  }

  const { ok: validOk, errors: validErrors, value: brief } = sanitizeBrief(payload.brief || payload);
  if (!validOk) {
    return send(res, 422, { ok: false, error: validErrors.join(' '), fields: validErrors });
  }

  const mock = process.env.PAGEFORGE_MOCK === '1';
  const provider = getProvider();

  if (!mock && !provider.isConfigured()) {
    return send(res, 503, {
      ok: false,
      code: 'NVIDIA_KEY_MISSING',
      error: 'NVIDIA_API_KEY não está configurada no servidor. Configure a variável de ambiente na Vercel (Settings → Environment Variables) e faça um novo deploy. Todo o resto da PageForge AI funciona; só a geração com IA fica bloqueada até a chave existir.',
    });
  }

  const sectionMode = payload.mode === 'section' && payload.currentHtml;
  const { system, user } = sectionMode
    ? buildSectionMessages(brief, payload.currentHtml, payload.instruction)
    : buildMessages(brief);

  const started = Date.now();

  // ---- MOCK ----
  if (mock) {
    const html = mockGenerate(brief, { instruction: sectionMode ? payload.instruction : null });
    const pp = postprocess(html, brief);
    return send(res, 200, {
      ok: pp.ok,
      html: pp.html,
      warnings: ['MODO MOCK — página de exemplo, sem IA real.', ...pp.warnings],
      errors: pp.errors,
      meta: { model: 'mock', provider: 'mock', pageType: brief.pageType, scrollMode: brief.scrollMode, ms: Date.now() - started, stages: STAGES },
    });
  }

  // ---- IA real ----
  const ac = new AbortController();
  const timer = setTimeout(() => ac.abort(), 56000);
  let result;
  try {
    result = await provider.chat({
      system,
      user,
      temperature: sectionMode ? 0.35 : 0.7,
      maxTokens: 8000,
      signal: ac.signal,
    });
  } catch (err) {
    clearTimeout(timer);
    if (err instanceof MissingKeyError) {
      return send(res, 503, { ok: false, code: 'NVIDIA_KEY_MISSING', error: 'NVIDIA_API_KEY ausente no servidor.' });
    }
    if (err instanceof ProviderError) {
      return send(res, err.status || 502, { ok: false, code: 'PROVIDER_ERROR', error: err.message });
    }
    return send(res, 500, { ok: false, error: `Erro inesperado na geração: ${err.message}` });
  }
  clearTimeout(timer);

  const pp = postprocess(result.content, brief);
  if (!pp.ok && !pp.html) {
    return send(res, 502, {
      ok: false,
      code: 'BAD_MODEL_OUTPUT',
      error: `A IA não devolveu um HTML válido. ${pp.errors.join(' ')}`.trim(),
      raw: String(result.content || '').slice(0, 1200),
    });
  }

  return send(res, 200, {
    ok: pp.ok,
    html: pp.html,
    warnings: pp.warnings,
    errors: pp.errors,
    meta: {
      provider: provider.name,
      model: result.model,
      finishReason: result.finishReason,
      usage: result.usage,
      pageType: brief.pageType,
      scrollMode: brief.scrollMode,
      sensitive: brief.sensitive,
      affiliate: brief.affiliate,
      ms: Date.now() - started,
      stages: STAGES,
    },
  });
}
