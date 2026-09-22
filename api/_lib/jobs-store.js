// jobs-store.js — ledger de execução do PageForge Executor Bridge (Cris OS).
// work_order_id -> registro do job (status, erro, artefato). Mesmo mecanismo
// de armazenamento de api/_lib/blob.js (Vercel Blob, REST, sem dependência),
// prefixo separado — não reaproveita as demos publicadas nem as altera.
//
// Em produção, sem BLOB_READ_WRITE_TOKEN, a persistência é recusada de forma
// explícita: memória de processo serverless não sobrevive de forma confiável
// entre invocações, e um job ledger que finge persistir sem persistir de
// verdade quebra a idempotência que o Cris OS depende. Só em
// PAGEFORGE_MOCK=1 (dev/testes) cai para memória.
const API = 'https://blob.vercel-storage.com';
const PREFIX = 'cris-os-jobs/';

function token() { return (process.env.BLOB_READ_WRITE_TOKEN || '').trim(); }

/** true quando o job ledger consegue persistir de verdade (Blob ou mock). */
export function jobsStoreConfigured() {
  return process.env.PAGEFORGE_MOCK === '1' || Boolean(token());
}

const MEM = (globalThis.__PF_JOB_MEM = globalThis.__PF_JOB_MEM || new Map());
const useMem = () => process.env.PAGEFORGE_MOCK === '1';

export async function putJob(workOrderId, record) {
  const body = JSON.stringify(record);
  if (useMem()) { MEM.set(workOrderId, body); return { memory: true }; }
  if (!token()) { const e = new Error('BLOB_READ_WRITE_TOKEN não configurado — o job ledger não pode persistir.'); e.code = 'STORE_UNAVAILABLE'; throw e; }
  const pathname = PREFIX + encodeURIComponent(workOrderId) + '.json';
  const res = await fetch(`${API}/${pathname}`, {
    method: 'PUT',
    headers: {
      authorization: `Bearer ${token()}`,
      'x-api-version': '7',
      'x-content-type': 'application/json; charset=utf-8',
      'x-add-random-suffix': '0',
    },
    body,
  });
  if (!res.ok) {
    const t = await res.text().catch(() => '');
    const e = new Error(`Vercel Blob respondeu ${res.status} ao salvar o job: ${t.slice(0, 200)}`);
    e.code = res.status === 403 ? 'STORE_UNAVAILABLE' : 'STORE_ERROR';
    throw e;
  }
  return { memory: false };
}

export async function getJob(workOrderId) {
  if (useMem()) {
    const raw = MEM.get(workOrderId);
    if (!raw) return null;
    try { return JSON.parse(raw); } catch { return null; }
  }
  if (!token()) return null;
  const res = await fetch(`${API}?prefix=${encodeURIComponent(PREFIX)}&limit=1000`, {
    headers: { authorization: `Bearer ${token()}`, 'x-api-version': '7' },
  });
  if (!res.ok) return null;
  const { blobs = [] } = await res.json().catch(() => ({ blobs: [] }));
  const want = PREFIX + workOrderId + '.json';
  const hit = blobs.find((b) => b.pathname === want);
  if (!hit) return null;
  const r2 = await fetch(hit.url, { cache: 'no-store' });
  if (!r2.ok) return null;
  try { return await r2.json(); } catch { return null; }
}
