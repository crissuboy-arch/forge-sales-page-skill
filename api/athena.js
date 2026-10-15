// api/athena.js — PageForge <-> Athena Control (dispatcher único).
//
// Expõe os dois endpoints do contrato via rewrites no vercel.json:
//   GET /api/integrations/health -> /api/athena?endpoint=health (público)
//   GET /api/integrations/stats  -> /api/athena?endpoint=stats  (Bearer PAGEFORGE_ATHENA_API_KEY)
//
// Função ÚNICA porque o projeto está no limite de funções serverless da Vercel:
// adicionar 2+ funções quebra o build (confirmado por bissecção em 2026-10-15).
// Lógica em api/_lib/pf-auth.js (Bearer timing-safe) e api/_lib/pf-stats.js
// (agregados reais do Vercel Blob). Zero PII. Sem store: nulls honestos.
import { send, methodGuard } from './_lib/http.js';
import { verifyAthenaKey, athenaConfigured, ATHENA_API_KEY_ENV } from './_lib/pf-auth.js';
import { collectStats } from './_lib/pf-stats.js';

export const config = { maxDuration: 30 };

function endpointOf(req) {
  try {
    const u = new URL(req.url || '/', 'http://localhost');
    return u.searchParams.get('endpoint');
  } catch {
    return null;
  }
}

export default async function handler(req, res) {
  if (!methodGuard(req, res, ['GET'])) return;
  const endpoint = endpointOf(req);

  if (endpoint === 'health') {
    return send(res, 200, {
      platform: 'PageForge',
      status: 'operational',
      contract: 'v1',
      endpoints: ['/api/integrations/health', '/api/integrations/stats'],
    });
  }

  if (endpoint === 'stats') {
    if (!athenaConfigured()) {
      return send(res, 503, { ok: false, error: `${ATHENA_API_KEY_ENV} não configurado no servidor.` });
    }
    if (!verifyAthenaKey(req)) {
      return send(res, 401, { ok: false, error: 'unauthorized' });
    }
    try {
      const stats = await collectStats();
      return send(res, 200, { ok: true, ...stats });
    } catch (err) {
      return send(res, 500, { ok: false, error: `falha_interna:${err && err.code ? err.code : 'UNKNOWN'}` });
    }
  }

  return send(res, 404, { ok: false, error: 'unknown_endpoint' });
}
