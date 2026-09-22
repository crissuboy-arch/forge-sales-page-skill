// POST /api/integrations/cris-os/work-orders — PageForge Executor Bridge.
//
// Recebe um ProductionWorkOrder (asset_type LANDING_PAGE, executor_type
// PAGEFORGE) do Cris OS (project_id proj_452816d87580), reutiliza o MESMO
// motor de geração da interface "Criar Página" (api/_lib/pageforge-engine.js
// -> plan/render/assemble/postprocess/design-quality/impeccable-qa) e devolve
// o resultado real: status + artefato (quando existir). NÃO cria um segundo
// gerador. NÃO inventa URL/deploy — só preenche o que realmente existe.
//
// Autenticação: Authorization: Bearer <CRIS_OS_BRIDGE_TOKEN> (só no servidor).
// Idempotência: work_order_id é a chave — reenviar o mesmo id nunca gera de
// novo, devolve o job já processado.
import { createHash } from 'node:crypto';
import { readJson, send, methodGuard } from '../../_lib/http.js';
import { verifyBridgeToken, bridgeConfigured } from '../../_lib/cris-os-auth.js';
import { putJob, getJob, jobsStoreConfigured } from '../../_lib/jobs-store.js';
import { mapWorkOrderToBrief } from '../../_lib/cris-os-mapper.js';
import { sanitizeBrief } from '../../_lib/sanitize.js';
import { generatePageForBrief } from '../../_lib/pageforge-engine.js';
import { putDemo, blobConfigured } from '../../_lib/blob.js';

export const config = { maxDuration: 60 };

const EXECUTOR = 'PAGEFORGE';
const SUPPORTED_ASSET_TYPES = ['LANDING_PAGE'];

function fail(res, status, code, message, extra = {}) {
  return send(res, status, { ok: false, error: { code, message, ...extra } });
}
function nowIso() { return new Date().toISOString(); }

function host(req) {
  const h = req.headers['x-forwarded-host'] || req.headers.host || 'pageforge-ai-woad.vercel.app';
  let proto = (req.headers['x-forwarded-proto'] || '').split(',')[0].trim();
  if (!proto) proto = /^localhost|127\.0\.0\.1|\[::1\]/.test(h) ? 'http' : 'https';
  return `${proto}://${h}`;
}
function slugForWorkOrder(id) {
  return `cris-${String(id || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '').slice(0, 56)}` || 'cris-work-order';
}

function toResultBody(job, extra = {}) {
  const body = {
    ok: true,
    work_order_id: job.work_order_id,
    project_id: job.project_id,
    executor: EXECUTOR,
    status: job.status,
    received_at: job.received_at,
    updated_at: job.updated_at,
  };
  if (job.completed_at) body.completed_at = job.completed_at;
  if (job.error) body.error = job.error;
  if (job.artifact) body.artifact = job.artifact;
  if (extra.idempotent) body.idempotent = true;
  return body;
}

export default async function handler(req, res) {
  if (!methodGuard(req, res, ['POST'])) return;

  // ---- autenticação (fail-closed; nunca loga o token) ----
  if (!bridgeConfigured()) {
    return fail(res, 503, 'BRIDGE_NOT_CONFIGURED', 'CRIS_OS_BRIDGE_TOKEN não configurado no servidor. Configure a variável de ambiente na Vercel e faça um novo deploy.');
  }
  if (!verifyBridgeToken(req)) {
    console.warn('[cris-os-bridge] POST work-orders: autenticação ausente ou inválida');
    return fail(res, 401, 'UNAUTHORIZED', 'Token de autenticação ausente ou inválido.');
  }

  // ---- payload ----
  let payload;
  try { payload = await readJson(req, 256 * 1024); }
  catch (err) {
    const tooBig = /grande demais/i.test(err.message || '');
    return fail(res, tooBig ? 413 : 400, tooBig ? 'PAYLOAD_TOO_LARGE' : 'BAD_REQUEST', err.message);
  }
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
    return fail(res, 400, 'BAD_REQUEST', 'O corpo da requisição deve ser um objeto JSON.');
  }

  const workOrderId = String(payload.work_order_id || '').trim();
  const projectId = String(payload.project_id || '').trim();
  const executorType = String(payload.executor_type || '').trim();
  const assetType = String(payload.asset_type || '').trim();

  if (!workOrderId || workOrderId.length > 200) {
    return fail(res, 400, 'INVALID_WORK_ORDER_ID', 'work_order_id é obrigatório (string não vazia, até 200 caracteres).');
  }
  if (!projectId || projectId.length > 200) {
    return fail(res, 400, 'INVALID_PROJECT_ID', 'project_id é obrigatório.');
  }
  if (executorType !== EXECUTOR) {
    return fail(res, 422, 'UNSUPPORTED_EXECUTOR', `executor_type deve ser "${EXECUTOR}". Recebido: "${executorType || '(vazio)'}".`);
  }
  if (!SUPPORTED_ASSET_TYPES.includes(assetType)) {
    return fail(res, 422, 'UNSUPPORTED_ASSET_TYPE', `asset_type não suportado pelo PageForge. Suportados: ${SUPPORTED_ASSET_TYPES.join(', ')}.`, { supported: SUPPORTED_ASSET_TYPES });
  }

  if (!jobsStoreConfigured()) {
    return fail(res, 503, 'STORE_UNAVAILABLE', 'BLOB_READ_WRITE_TOKEN não configurado — o executor não pode persistir o job ledger (idempotência exige persistência real). Configure em Vercel → Storage → Blob.');
  }

  // ---- idempotência: work_order_id já processado ----
  let existing;
  try { existing = await getJob(workOrderId); }
  catch (err) { return fail(res, 503, 'STORE_ERROR', `Falha ao consultar o job ledger: ${String(err.message || err).slice(0, 300)}`); }
  if (existing) {
    return send(res, 200, toResultBody(existing, { idempotent: true }));
  }

  const safePutJob = async (id, record) => {
    try { await putJob(id, record); }
    catch (err) { console.error('[cris-os-bridge] falha ao persistir job', id, String(err.message || err).slice(0, 200)); }
  };

  const receivedAt = nowIso();
  const job = {
    work_order_id: workOrderId,
    project_id: projectId,
    handoff_id: payload.handoff_id || null,
    execution_plan_id: payload.execution_plan_id || null,
    source_task_id: payload.source_task_id || null,
    asset_type: assetType,
    executor_type: EXECUTOR,
    title: typeof payload.title === 'string' ? payload.title.slice(0, 200) : null,
    objective: typeof payload.objective === 'string' ? payload.objective.slice(0, 2000) : null,
    status: 'RECEIVED',
    received_at: receivedAt,
    updated_at: receivedAt,
    completed_at: null,
    error: null,
    artifact: null,
    meta: {},
  };

  // ---- requirements do WorkOrder -> briefing do gerador (sem inventar) ----
  const { brief: rawBrief, missing: mapMissing } = mapWorkOrderToBrief(payload);
  const { ok: briefOk, errors: briefErrors, value: brief } = sanitizeBrief(rawBrief);
  const missing = [...mapMissing, ...(briefOk ? [] : briefErrors)];
  if (missing.length) {
    job.status = 'NEEDS_INPUT';
    job.updated_at = nowIso();
    job.error = { code: 'NEEDS_INPUT', message: 'Faltam informações indispensáveis no WorkOrder para gerar a página.', missing };
    await safePutJob(workOrderId, job);
    return send(res, 200, toResultBody(job));
  }

  job.status = 'RUNNING';
  job.updated_at = nowIso();
  await safePutJob(workOrderId, job);

  // ---- executa O GERADOR EXISTENTE (plan -> render -> assemble) ----
  let gen;
  try {
    gen = await generatePageForBrief(brief, { mock: process.env.PAGEFORGE_MOCK === '1' });
  } catch (err) {
    job.status = 'FAILED';
    job.updated_at = nowIso();
    job.error = { code: err.code || 'GENERATION_FAILED', message: String(err.message || err).slice(0, 500) };
    await safePutJob(workOrderId, job);
    console.error('[cris-os-bridge] geração falhou', workOrderId, job.error.code);
    return send(res, 200, toResultBody(job));
  }

  if (!gen || !gen.html || gen.html.length < 200) {
    job.status = 'FAILED';
    job.updated_at = nowIso();
    job.error = { code: 'BAD_OUTPUT', message: (gen && gen.errors && gen.errors.join(' ')) || 'A geração não produziu uma página válida.' };
    await safePutJob(workOrderId, job);
    return send(res, 200, toResultBody(job));
  }

  // ---- artefato real: página + (quando possível) publicação com URL real ----
  const pageId = slugForWorkOrder(workOrderId);
  const checksum = createHash('sha256').update(gen.html, 'utf8').digest('hex');
  const artifact = { artifact_id: `artf_${pageId}`, artifact_type: assetType, page_id: pageId, version: '1', checksum };

  const publish = { attempted: true };
  try {
    const r = await putDemo(pageId, gen.html, job.title || projectId);
    artifact.preview_url = `${host(req)}/demo/${pageId}`;
    if (r.blobUrl) artifact.deployment_url = r.blobUrl;
    publish.status = r.memory ? 'MEMORY' : 'PUBLISHED';
  } catch (err) {
    // não fabrica URL: sem publicação real, o artefato fica só com page_id/checksum.
    publish.status = err.code || 'PUBLISH_FAILED';
    publish.message = String(err.message || err).slice(0, 300);
  }

  job.status = 'COMPLETED';
  job.updated_at = nowIso();
  job.completed_at = job.updated_at;
  job.artifact = artifact;
  job.meta = {
    provider: gen.meta.provider, model: gen.meta.model, ms: gen.meta.ms,
    qa: gen.qa, design: gen.design, warnings: gen.warnings,
    publish, blobConfigured: blobConfigured(),
  };
  await safePutJob(workOrderId, job);

  return send(res, 200, toResultBody(job));
}
