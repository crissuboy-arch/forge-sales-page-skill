// athena-stats.js — agregados reais para GET /api/integrations/stats.
//
// Fontes (as ÚNICAS persistências do projeto):
//   - ledger de jobs do Executor Bridge (Vercel Blob, prefixo cris-os-jobs/):
//     total, por status, falhas e códigos de erro, tipos de página (asset_type)
//   - demos publicadas (Vercel Blob, prefixo demos/, via listDemos()): exports
//
// O que NÃO existe e por isso vem null + unavailable (sem inventar):
//   - gerações da interface /api/generate (stateless, sem ledger)
//   - projetos (não há tabela/entidade de projeto)
//   - subscriptions / ai_usage (não há tabelas)
//
// Zero PII: só contagens e códigos de erro. Títulos, objetivos, briefs e
// mensagens de erro NUNCA saem daqui. Segredos nunca entram no payload.
import { listDemos } from './blob.js';

const API = 'https://blob.vercel-storage.com';
const JOBS_PREFIX = 'cris-os-jobs/';
const LIST_LIMIT = 1000;
// Teto de registros examinados por chamada (tempo da função serverless).
const RECORDS_CAP = 200;

function token() {
  return (process.env.BLOB_READ_WRITE_TOKEN || '').trim();
}

export function storeConfigured() {
  return process.env.PAGEFORGE_MOCK === '1' || Boolean(token());
}

function classifyStoreError(err) {
  const msg = String((err && err.message) || err || '');
  const code = err && err.code;
  if (code === 'STORE_UNAVAILABLE' || /não configurado/i.test(msg)) return 'missing_env';
  if (/timeout|timed out|aborted/i.test(msg)) return 'timeout';
  if (/403|unauthorized|invalid token/i.test(msg)) return 'auth_failed';
  if (/ENOTFOUND|getaddrinfo|EAI_AGAIN/i.test(msg)) return 'dns_error';
  if (/ECONNREFUSED|ECONNRESET|fetch failed/i.test(msg)) return 'connection_error';
  return 'unknown';
}

async function listJobBlobs(fetchImpl) {
  const res = await fetchImpl(`${API}?prefix=${encodeURIComponent(JOBS_PREFIX)}&limit=${LIST_LIMIT}`, {
    headers: { authorization: `Bearer ${token()}`, 'x-api-version': '7' },
  });
  if (!res.ok) {
    const e = new Error(`Blob list respondeu ${res.status}`);
    if (res.status === 403) e.code = 'STORE_UNAVAILABLE';
    throw e;
  }
  const { blobs = [] } = await res.json().catch(() => ({ blobs: [] }));
  return blobs
    .filter((b) => b.pathname.startsWith(JOBS_PREFIX) && b.pathname.endsWith('.json'))
    .sort((a, b) => String(b.uploadedAt || '').localeCompare(String(a.uploadedAt || '')));
}

async function fetchRecords(blobs, fetchImpl) {
  const slice = blobs.slice(0, RECORDS_CAP);
  const settled = await Promise.allSettled(
    slice.map(async (b) => {
      const r = await fetchImpl(b.url, { cache: 'no-store' });
      if (!r.ok) return null;
      const j = await r.json().catch(() => null);
      return j && typeof j === 'object' ? j : null;
    })
  );
  return settled.filter((s) => s.status === 'fulfilled' && s.value).map((s) => s.value);
}

/**
 * Agregados reais. `fetchImpl` injetável para testes (default: fetch global).
 * Nunca levanta: falha de store vira store_status seguro + nulls honestos.
 */
export async function collectStats({ fetchImpl = fetch } = {}) {
  const failedTables = [];
  let errorCode = null;

  const nullStats = () => ({
    platform: 'PageForge',
    contract: 'v1',
    jobs: { total: null, records_examined: 0, by_status: null, failed_total: null, error_codes: null },
    pages: { types: null },
    exports: { published_total: null },
    generations_ui: null,
    projects: null,
    store_status: { ok: false, error_code: errorCode, failed_tables: failedTables },
    subscriptions: null,
    ai_usage: null,
    unavailable: ['generations_ui', 'projects', 'subscriptions', 'ai_usage'],
    notes: {
      jobs: 'Ledger do Executor Bridge (cris-os-jobs/). Sem store configurado, null.',
      pages: 'Tipos por asset_type dos jobs. Sem store, null.',
      exports: 'Demos publicadas (prefixo demos/). Sem store, null.',
      generations_ui: 'A interface /api/generate não persiste ledger — indisponível.',
      projects: 'Não existe entidade de projeto — indisponível.',
      store_status: 'ok=false significa falha no store — os nulls não são dados válidos.',
      subscriptions: 'Não existe tabela de assinaturas — indisponível.',
      ai_usage: 'Não existe tabela de uso de IA — indisponível.',
    },
  });

  if (!storeConfigured()) {
    errorCode = 'missing_env';
    failedTables.push('blob:cris-os-jobs', 'blob:demos');
    return nullStats();
  }

  try {
    const [jobBlobs, demos] = await Promise.all([
      listJobBlobs(fetchImpl),
      listDemos().catch(() => null),
    ]);

    if (demos === null) {
      failedTables.push('blob:demos');
    }

    const records = await fetchRecords(jobBlobs, fetchImpl);

    const byStatus = {};
    const errorCodes = {};
    const types = {};
    let failedTotal = 0;
    for (const r of records) {
      const st = String(r.status || 'UNKNOWN');
      byStatus[st] = (byStatus[st] || 0) + 1;
      const at = String(r.asset_type || 'UNKNOWN');
      types[at] = (types[at] || 0) + 1;
      if (st === 'FAILED') {
        failedTotal += 1;
        const ec = String((r.error && r.error.code) || 'UNKNOWN');
        errorCodes[ec] = (errorCodes[ec] || 0) + 1;
      }
    }

    return {
      platform: 'PageForge',
      contract: 'v1',
      jobs: {
        total: jobBlobs.length,
        records_examined: records.length,
        by_status: byStatus,
        failed_total: failedTotal,
        error_codes: errorCodes,
      },
      pages: { types },
      exports: { published_total: demos === null ? null : demos.length },
      generations_ui: null,
      projects: null,
      store_status: {
        ok: failedTables.length === 0,
        error_code: failedTables.length ? 'partial_failure' : null,
        failed_tables: failedTables,
      },
      subscriptions: null,
      ai_usage: null,
      unavailable: ['generations_ui', 'projects', 'subscriptions', 'ai_usage'],
      notes: {
        jobs: `Ledger do Executor Bridge: ${jobBlobs.length} job(s), ${records.length} examinado(s).`,
        pages: 'Tipos por asset_type dos jobs examinados.',
        exports: 'Demos publicadas (prefixo demos/).',
        generations_ui: 'A interface /api/generate não persiste ledger — indisponível.',
        projects: 'Não existe entidade de projeto — indisponível.',
        store_status: 'ok=false significa falha no store — os nulls não são dados válidos.',
        subscriptions: 'Não existe tabela de assinaturas — indisponível.',
        ai_usage: 'Não existe tabela de uso de IA — indisponível.',
      },
    };
  } catch (err) {
    errorCode = classifyStoreError(err);
    failedTables.push('blob:cris-os-jobs');
    try {
      const demos = await listDemos().catch(() => null);
      if (demos !== null) {
        // Jobs falharam mas demos responderam: entrega parcial honesta.
        return {
          ...(nullStats()),
          exports: { published_total: demos.length },
          store_status: { ok: false, error_code: errorCode, failed_tables: failedTables },
          notes: {
            ...(nullStats().notes),
            jobs: `Falha ao ler o ledger (${errorCode}); demos lidas com sucesso.`,
          },
        };
      }
      failedTables.push('blob:demos');
    } catch {
      failedTables.push('blob:demos');
    }
    return nullStats();
  }
}
