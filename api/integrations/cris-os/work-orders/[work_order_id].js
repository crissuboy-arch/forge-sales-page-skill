// GET /api/integrations/cris-os/work-orders/{work_order_id} — status +
// artefato do job de execução (PageForge Executor Bridge). Mesma
// autenticação e mesmo job ledger do POST em ../work-orders.js.
import { send, methodGuard } from '../../../_lib/http.js';
import { verifyBridgeToken, bridgeConfigured } from '../../../_lib/cris-os-auth.js';
import { getJob, jobsStoreConfigured } from '../../../_lib/jobs-store.js';

export const config = { maxDuration: 15 };

// Lê o id do WorkOrder direto do path — funciona tanto no runtime dinâmico
// da Vercel quanto no dev-server local, sem depender de req.query.
function extractWorkOrderId(req) {
  try {
    const u = new URL(req.url, 'http://internal');
    const parts = u.pathname.split('/').filter(Boolean);
    return decodeURIComponent(parts[parts.length - 1] || '');
  } catch {
    return '';
  }
}

export default async function handler(req, res) {
  if (!methodGuard(req, res, ['GET'])) return;

  if (!bridgeConfigured()) {
    return send(res, 503, { ok: false, error: { code: 'BRIDGE_NOT_CONFIGURED', message: 'CRIS_OS_BRIDGE_TOKEN não configurado no servidor.' } });
  }
  if (!verifyBridgeToken(req)) {
    console.warn('[cris-os-bridge] GET work-orders: autenticação ausente ou inválida');
    return send(res, 401, { ok: false, error: { code: 'UNAUTHORIZED', message: 'Token de autenticação ausente ou inválido.' } });
  }

  const workOrderId = extractWorkOrderId(req);
  if (!workOrderId) {
    return send(res, 400, { ok: false, error: { code: 'INVALID_WORK_ORDER_ID', message: 'work_order_id ausente na URL.' } });
  }
  if (!jobsStoreConfigured()) {
    return send(res, 503, { ok: false, error: { code: 'STORE_UNAVAILABLE', message: 'BLOB_READ_WRITE_TOKEN não configurado no servidor.' } });
  }

  let job;
  try { job = await getJob(workOrderId); }
  catch (err) { return send(res, 503, { ok: false, error: { code: 'STORE_ERROR', message: String(err.message || err).slice(0, 300) } }); }

  if (!job) {
    return send(res, 404, { ok: false, error: { code: 'NOT_FOUND', message: `Nenhum job encontrado para work_order_id "${workOrderId}".` } });
  }

  const body = {
    ok: true,
    work_order_id: job.work_order_id,
    project_id: job.project_id,
    executor: 'PAGEFORGE',
    status: job.status,
    received_at: job.received_at,
    updated_at: job.updated_at,
  };
  if (job.completed_at) body.completed_at = job.completed_at;
  if (job.error) body.error = job.error;
  if (job.artifact) body.artifact = job.artifact;
  return send(res, 200, body);
}
