// POST /api/prospect — busca leads (empresas) por nicho + cidade.
//   body: { niche, city, count?, minRating?, minReviews? }
//   -> { ok, leads:[...], busca, count, mock, provider }
// GET  /api/prospect  -> health do motor de prospecção (AIsa).
import { prospect, mockProspect, aisaConfigured, AisaError } from './_lib/aisa.js';
import { leadToBriefing } from './_lib/prospect.js';
import { readJson, send, methodGuard } from './_lib/http.js';

export const config = { maxDuration: 60 };

export default async function handler(req, res) {
  if (req.method === 'GET') {
    const mock = process.env.PAGEFORGE_MOCK === '1';
    return send(res, 200, {
      ok: true,
      module: 'prospeccao',
      engine: 'aisa',
      keyConfigured: aisaConfigured(),
      mock,
      ready: aisaConfigured() || mock,
      message: aisaConfigured()
        ? 'Motor de prospecção (AIsa) configurado.'
        : (mock ? 'Modo de exemplo (sem AIsa) — leads simulados.' : 'AISA_KEY não configurada. A área abre em modo de exemplo; configure a chave para prospecção real.'),
    });
  }
  if (!methodGuard(req, res, ['GET', 'POST'])) return;

  let body;
  try { body = await readJson(req); }
  catch (err) { return send(res, 400, { ok: false, error: err.message }); }

  // Utilitário: converter um lead já existente em briefing do PageForge.
  if (body.action === 'to-briefing' && body.lead) {
    return send(res, 200, { ok: true, ...leadToBriefing(body.lead) });
  }

  const niche = String(body.niche || '').trim().slice(0, 80);
  const city = String(body.city || '').trim().slice(0, 80);
  if (!niche || !city) return send(res, 422, { ok: false, error: 'Informe o nicho e a cidade.' });

  const count = Math.max(1, Math.min(25, Number(body.count) || 10));
  const minRating = Math.max(0, Math.min(5, Number(body.minRating) || 0));
  const minReviews = Math.max(0, Math.min(9999, Number(body.minReviews) || 0));

  const mock = process.env.PAGEFORGE_MOCK === '1' || !aisaConfigured();
  if (mock) {
    const r = mockProspect({ niche, city, count });
    return send(res, 200, { ok: true, provider: 'mock', ...r });
  }

  const ac = new AbortController();
  const timer = setTimeout(() => ac.abort(), 55000);
  try {
    const r = await prospect({ niche, city, count, minRating, minReviews, signal: ac.signal });
    clearTimeout(timer);
    return send(res, 200, { ok: true, provider: 'aisa', ...r });
  } catch (err) {
    clearTimeout(timer);
    if (err instanceof AisaError) {
      // Degrada para exemplo se a AIsa falhar, sem quebrar a experiência.
      const r = mockProspect({ niche, city, count });
      return send(res, 200, { ok: true, provider: 'mock', degraded: true, error: err.message, ...r });
    }
    return send(res, 500, { ok: false, error: `Erro inesperado na prospecção: ${err.message}` });
  }
}
