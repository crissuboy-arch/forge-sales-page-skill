#!/usr/bin/env node
// cris-os-bridge-selftest.mjs — testes de integração do PageForge Executor
// Bridge (Cris OS). Sobe o dev-server local (PAGEFORGE_MOCK=1 — sem chamada
// paga/real de IA) e bate nos endpoints de verdade via fetch().
//
//   node scripts/cris-os-bridge-selftest.mjs
import { spawn } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const PORT = 3235;
const BASE = `http://localhost:${PORT}`;
const TOKEN = 'test-cris-os-token-abc123';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

let f = 0;
function chk(cond, label) { console.log((cond ? 'PASS ' : 'FAIL ') + label); if (!cond) f++; }

function startServer(env, port) {
  const proc = spawn(process.execPath, ['scripts/dev-server.mjs'], {
    cwd: ROOT,
    env: { ...process.env, PORT: String(port), ...env },
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  let out = '';
  proc.stdout.on('data', (d) => { out += d.toString(); });
  proc.stderr.on('data', (d) => { out += d.toString(); });
  return { proc, getOut: () => out };
}

async function waitUp(base, tries = 40) {
  for (let i = 0; i < tries; i++) {
    try { const r = await fetch(base + '/api/health'); if (r.ok || r.status < 500) return true; } catch {}
    await sleep(200);
  }
  return false;
}

function post(base, path_, body, headers = {}) {
  return fetch(base + path_, { method: 'POST', headers: { 'content-type': 'application/json', ...headers }, body: typeof body === 'string' ? body : JSON.stringify(body) });
}
function get(base, path_, headers = {}) {
  return fetch(base + path_, { method: 'GET', headers });
}

const validWO = (id) => ({
  work_order_id: id,
  project_id: 'proj_452816d87580',
  handoff_id: 'handoff_1',
  execution_plan_id: 'plan_1',
  source_task_id: 'task_1',
  asset_type: 'LANDING_PAGE',
  executor_type: 'PAGEFORGE',
  title: 'Landing — Curso de Culinária da Carla',
  objective: 'Vender o curso online de culinária vegana da Carla para iniciantes.',
  requirements: [
    'Página em pt-BR, tom acolhedor',
    { key: 'audience', value: 'Mulheres 30-50 anos que querem cozinhar saudável sem complicar' },
    { key: 'benefits', value: ['Receitas testadas', 'Suporte em grupo', 'Acesso vitalício'] },
    { key: 'cta', value: 'Quero começar a cozinhar' },
  ],
  input_refs: ['ref://carla/brief-v2'],
  metadata: { language: 'pt-BR' },
});

async function main() {
  const { proc, getOut } = startServer({ PAGEFORGE_MOCK: '1', CRIS_OS_BRIDGE_TOKEN: TOKEN, NVIDIA_API_KEY: '' }, PORT);
  const up = await waitUp(BASE);
  chk(up, 'dev-server (PAGEFORGE_MOCK=1) sobe');
  if (!up) { console.log(getOut().slice(-1500)); proc.kill(); process.exit(1); }

  // 0. Criar Página (motor existente) continua funcionando — regressão rápida
  {
    const r = await post(BASE, '/api/generate', { step: 'plan', brief: { productName: 'Teste Regressão', description: 'checagem rápida' } });
    const j = await r.json();
    chk(r.status === 200 && j.t === 'done' && j.plan && Array.isArray(j.plan.sections), 'regressão: /api/generate (Criar Página) continua funcionando');
  }

  // 1. auth ausente
  {
    const r = await post(BASE, '/api/integrations/cris-os/work-orders', validWO('wo_noauth'));
    const j = await r.json();
    chk(r.status === 401 && j.error && j.error.code === 'UNAUTHORIZED', 'auth ausente -> 401 UNAUTHORIZED');
  }
  // 2. auth inválida
  {
    const r = await post(BASE, '/api/integrations/cris-os/work-orders', validWO('wo_badauth'), { authorization: 'Bearer token-errado' });
    const j = await r.json();
    chk(r.status === 401 && j.error && j.error.code === 'UNAUTHORIZED', 'auth inválida -> 401 UNAUTHORIZED');
  }
  const AUTH = { authorization: `Bearer ${TOKEN}` };

  // 3. payload inválido (JSON quebrado)
  {
    const r = await post(BASE, '/api/integrations/cris-os/work-orders', '{not json', AUTH);
    chk(r.status === 400, 'payload JSON inválido -> 400');
  }
  // 3b. payload sem work_order_id
  {
    const r = await post(BASE, '/api/integrations/cris-os/work-orders', { project_id: 'p1', executor_type: 'PAGEFORGE', asset_type: 'LANDING_PAGE' }, AUTH);
    const j = await r.json();
    chk(r.status === 400 && j.error && j.error.code === 'INVALID_WORK_ORDER_ID', 'payload sem work_order_id -> 400 INVALID_WORK_ORDER_ID');
  }
  // 3c. payload grande demais
  {
    const big = validWO('wo_big');
    big.requirements = [{ key: 'offer', value: 'x'.repeat(300000) }];
    const r = await post(BASE, '/api/integrations/cris-os/work-orders', big, AUTH);
    chk(r.status === 413, 'payload > limite -> 413 PAYLOAD_TOO_LARGE (' + r.status + ')');
  }

  // 4. executor diferente de PAGEFORGE
  {
    const wo = validWO('wo_exec'); wo.executor_type = 'OTHER_EXECUTOR';
    const r = await post(BASE, '/api/integrations/cris-os/work-orders', wo, AUTH);
    const j = await r.json();
    chk(r.status === 422 && j.error.code === 'UNSUPPORTED_EXECUTOR', 'executor_type != PAGEFORGE -> 422 UNSUPPORTED_EXECUTOR');
  }
  // 5. asset_type incompatível
  {
    const wo = validWO('wo_asset'); wo.asset_type = 'EMAIL_SEQUENCE';
    const r = await post(BASE, '/api/integrations/cris-os/work-orders', wo, AUTH);
    const j = await r.json();
    chk(r.status === 422 && j.error.code === 'UNSUPPORTED_ASSET_TYPE', 'asset_type incompatível -> 422 UNSUPPORTED_ASSET_TYPE');
  }
  // 5b. NEEDS_INPUT — sem title/objective/requirements úteis
  {
    const wo = validWO('wo_needsinput'); delete wo.title; delete wo.objective; wo.requirements = ['sem chave reconhecida'];
    const r = await post(BASE, '/api/integrations/cris-os/work-orders', wo, AUTH);
    const j = await r.json();
    chk(r.status === 200 && j.status === 'NEEDS_INPUT' && j.error && Array.isArray(j.error.missing), 'faltando dados indispensáveis -> NEEDS_INPUT (não fabrica)');
  }

  // 6. work order válido — gera de verdade (MOCK) e devolve artefato real
  const id6 = 'wo_valid_001';
  let firstBody;
  {
    const r = await post(BASE, '/api/integrations/cris-os/work-orders', validWO(id6), AUTH);
    firstBody = await r.json();
    chk(r.status === 200 && firstBody.status === 'COMPLETED', 'work order válido -> 200 COMPLETED (' + firstBody.status + ')');
    chk(!!(firstBody.artifact && firstBody.artifact.page_id && firstBody.artifact.checksum), 'artefato real: page_id + checksum presentes');
    chk(!!(firstBody.artifact && firstBody.artifact.preview_url && firstBody.artifact.preview_url.includes('/demo/')), 'artefato real: preview_url aponta para /demo/<page_id> (mesmo mecanismo de Publicar Demo)');
    // Correção pós-incidente real (Cris OS): sem `meta` na resposta, uma
    // falha silenciosa de publicação (Blob) era indistinguível de sucesso
    // completo para quem chama esta API -- garante que o diagnóstico chega.
    chk(!!firstBody.meta, 'resposta expõe meta (provider/model/publish) -- diagnóstico de publicação nunca mais fica escondido');
    chk(!!(firstBody.meta && firstBody.meta.publish && firstBody.meta.publish.status), 'meta.publish.status presente -- permite saber se a publicação no Blob realmente funcionou');
    if (firstBody.artifact && firstBody.artifact.preview_url) {
      const pr = await fetch(firstBody.artifact.preview_url);
      const html = await pr.text();
      chk(pr.status === 200 && /<html/i.test(html), 'preview_url realmente serve a página gerada (200, HTML)');
    }
  }

  // 7/8. idempotência + retry: mesmo work_order_id não duplica página
  {
    const r2 = await post(BASE, '/api/integrations/cris-os/work-orders', validWO(id6), AUTH);
    const body2 = await r2.json();
    chk(r2.status === 200 && body2.idempotent === true, 'reenviar o mesmo work_order_id -> idempotent:true');
    chk(body2.artifact && firstBody.artifact && body2.artifact.checksum === firstBody.artifact.checksum, 'idempotência: checksum do artefato IDÊNTICO (nenhuma página nova gerada)');
    chk(body2.completed_at === firstBody.completed_at, 'idempotência: completed_at não muda (não regenerou)');
    // retry adicional (terceira chamada) — mesmo resultado
    const r3 = await post(BASE, '/api/integrations/cris-os/work-orders', validWO(id6), AUTH);
    const body3 = await r3.json();
    chk(body3.artifact.checksum === firstBody.artifact.checksum, 'retry (3ª chamada) ainda devolve o mesmo artefato');
  }

  // 10/11. status por GET
  {
    const r = await get(BASE, `/api/integrations/cris-os/work-orders/${id6}`, AUTH);
    const j = await r.json();
    chk(r.status === 200 && j.status === 'COMPLETED' && j.artifact && j.artifact.page_id === firstBody.artifact.page_id, 'GET status: COMPLETED + artefato recuperável por work_order_id');
  }
  // GET sem auth
  {
    const r = await get(BASE, `/api/integrations/cris-os/work-orders/${id6}`);
    chk(r.status === 401, 'GET status sem auth -> 401');
  }
  // GET de id inexistente
  {
    const r = await get(BASE, '/api/integrations/cris-os/work-orders/wo_never_existed', AUTH);
    chk(r.status === 404, 'GET status de work_order_id inexistente -> 404 NOT_FOUND');
  }

  // segredo nunca aparece em resposta nem em log
  {
    const r = await post(BASE, '/api/integrations/cris-os/work-orders', validWO('wo_secretcheck'), AUTH);
    const text = await r.text();
    chk(!text.includes(TOKEN), 'resposta HTTP não contém o token de autenticação');
    chk(!getOut().includes(TOKEN), 'stdout/stderr do servidor não contém o token de autenticação');
  }

  // funcionalidades atuais do PageForge continuam OK (mais uma checagem, além da #0)
  {
    const r = await fetch(BASE + '/');
    const html = await r.text();
    chk(r.status === 200 && /PageForge AI/.test(html), 'página normal do PageForge (index.html) continua servindo');
    const r2 = await fetch(BASE + '/api/integrations');
    chk(r2.status === 200, '/api/integrations (status das integrações) continua respondendo');
  }

  proc.kill();
  await sleep(300);

  // 9. falha do gerador: mesmo motor (api/_lib/pageforge-engine.js), sem chave
  // e sem MOCK -> deve lançar erro estruturado, nunca travar nem fabricar
  // página. Teste direto do módulo (determinístico, sem custo, sem HTTP) —
  // o endpoint persiste esse mesmo erro em job.status='FAILED' pelo mesmo
  // safePutJob() já comprovado pelos testes de COMPLETED acima.
  {
    const prevKey = process.env.NVIDIA_API_KEY; const prevMock = process.env.PAGEFORGE_MOCK;
    process.env.NVIDIA_API_KEY = ''; process.env.PAGEFORGE_MOCK = '';
    try {
      const { generatePageForBrief } = await import(`${new URL('../api/_lib/pageforge-engine.js', import.meta.url).href}?t=${Date.now()}`);
      const { sanitizeBrief } = await import('../api/_lib/sanitize.js');
      const { value: brief } = sanitizeBrief({ productName: 'X', description: 'y' });
      let threw = null;
      try { await generatePageForBrief(brief, { mock: false }); } catch (e) { threw = e; }
      chk(!!threw && threw.code === 'PROVIDER_KEY_MISSING', 'motor de geração sem NVIDIA_API_KEY (sem MOCK) -> lança erro estruturado (' + (threw && threw.code) + '), nunca fabrica HTML');
    } finally {
      process.env.NVIDIA_API_KEY = prevKey; process.env.PAGEFORGE_MOCK = prevMock;
    }
  }

  console.log('\n==== ' + (f ? f + ' FALHAS' : 'CRIS OS BRIDGE — TODOS OS TESTES PASSARAM') + ' ====');
  process.exit(f ? 1 : 0);
}

main().catch((err) => { console.error(err); process.exit(1); });
