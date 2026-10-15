// GET /api/integrations/stats — PageForge <-> Athena Control.
//
// Protegido por Authorization: Bearer <PAGEFORGE_ATHENA_API_KEY>
// (chave exclusiva, comparação timing-safe em api/_lib/athena-auth.js).
// Sem chave -> 401. Chave errada -> 401. Chave não configurada no
// servidor -> 503 (não é falha de auth).
//
// Somente agregados reais do store existente (Vercel Blob: ledger de jobs
// + demos publicadas). Zero PII: contagens e códigos de erro, nunca
// títulos, briefs ou mensagens internas. O que não existe vem null +
// unavailable — nada é inventado.
import { send, methodGuard } from '../_lib/http.js';
import { verifyAthenaKey, athenaConfigured, ATHENA_API_KEY_ENV } from '../_lib/athena-auth.js';
import { collectStats } from '../_lib/athena-stats.js';

export const config = { maxDuration: 30 };

export default async function handler(req, res) {
  if (!methodGuard(req, res, ['GET'])) return;

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
