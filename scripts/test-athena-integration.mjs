// Testes da integração PageForge <-> Athena Control.
// Sem rede, sem credenciais: fetch é mockado. Uso: node scripts/test-athena-integration.mjs
// Mocks ANTES dos imports (ESM: imports dinâmicos depois do mock).
const calls = [];
const JOB_BLOBS = [
  { pathname: 'cris-os-jobs/wo1.json', uploadedAt: '2026-10-15T10:00:00Z', url: 'https://blob.test/wo1.json' },
  { pathname: 'cris-os-jobs/wo2.json', uploadedAt: '2026-10-15T09:00:00Z', url: 'https://blob.test/wo2.json' },
  { pathname: 'cris-os-jobs/wo3.json', uploadedAt: '2026-10-15T08:00:00Z', url: 'https://blob.test/wo3.json' },
];
const JOB_RECORDS = {
  'https://blob.test/wo1.json': { status: 'COMPLETED', asset_type: 'LANDING_PAGE', title: 'Página secreta do produto X', objective: 'vender muito' },
  'https://blob.test/wo2.json': { status: 'FAILED', asset_type: 'LANDING_PAGE', error: { code: 'GENERATION_FAILED', message: 'detalhe interno sensível' } },
  'https://blob.test/wo3.json': { status: 'RUNNING', asset_type: 'LANDING_PAGE' },
};
const DEMO_BLOBS = [
  { pathname: 'demos/pagina-a.html', uploadedAt: '2026-10-14T10:00:00Z', url: 'https://blob.test/a' },
  { pathname: 'demos/pagina-b.html', uploadedAt: '2026-10-14T11:00:00Z', url: 'https://blob.test/b' },
];

globalThis.fetch = async (url, opts) => {
  calls.push(String(url));
  const u = String(url);
  if (u.includes('prefix=cris-os-jobs')) {
    return { ok: true, json: async () => ({ blobs: JOB_BLOBS }) };
  }
  if (u.includes('prefix=demos')) {
    return { ok: true, json: async () => ({ blobs: DEMO_BLOBS }) };
  }
  if (JOB_RECORDS[u]) {
    return { ok: true, json: async () => JOB_RECORDS[u] };
  }
  return { ok: false, status: 404, json: async () => ({}) };
};

process.env.BLOB_READ_WRITE_TOKEN = 'test-dummy-token';
process.env.PAGEFORGE_ATHENA_API_KEY = 'test-chave-123';

const { verifyAthenaKey, athenaConfigured } = await import('../api/_lib/athena-auth.js');
const { collectStats } = await import('../api/_lib/athena-stats.js');
const healthHandler = (await import('../api/integrations/health.js')).default;
const statsHandler = (await import('../api/integrations/stats.js')).default;

let pass = 0, fail = 0;
function check(name, cond) {
  if (cond) { pass++; console.log(`  ok   ${name}`); }
  else { fail++; console.log(`  FAIL ${name}`); }
}
const req = (headers = {}) => ({ method: 'GET', headers });
function makeRes() {
  const chunks = [];
  return {
    res: {
      statusCode: 0, headers: {},
      setHeader(k, v) { this.headers[k] = v; },
      end(b) { chunks.push(b); },
    },
    body: () => JSON.parse(chunks.join('')),
  };
}

console.log('== athena-auth ==');
check('configurado', athenaConfigured() === true);
check('aceita Bearer exato', verifyAthenaKey(req({ authorization: 'Bearer test-chave-123' })) === true);
check('rejeita chave errada', verifyAthenaKey(req({ authorization: 'Bearer errada' })) === false);
check('rejeita sem header', verifyAthenaKey(req()) === false);
check('rejeita esquema diferente', verifyAthenaKey(req({ authorization: 'Token test-chave-123' })) === false);
check('rejeita Bearer vazio', verifyAthenaKey(req({ authorization: 'Bearer ' })) === false);
delete process.env.PAGEFORGE_ATHENA_API_KEY;
check('fail-closed sem env', verifyAthenaKey(req({ authorization: 'Bearer test-chave-123' })) === false);
check('não configurado', athenaConfigured() === false);
process.env.PAGEFORGE_ATHENA_API_KEY = 'test-chave-123';

console.log('== collectStats ==');
const stats = await collectStats();
check('platform/contract', stats.platform === 'PageForge' && stats.contract === 'v1');
check('jobs.total == 3', stats.jobs.total === 3);
check('records_examined == 3', stats.jobs.records_examined === 3);
check('by_status', stats.jobs.by_status.COMPLETED === 1 && stats.jobs.by_status.FAILED === 1 && stats.jobs.by_status.RUNNING === 1);
check('failed_total == 1', stats.jobs.failed_total === 1);
check('error_codes', stats.jobs.error_codes.GENERATION_FAILED === 1);
check('pages.types', stats.pages.types.LANDING_PAGE === 3);
check('exports.published_total == 2', stats.exports.published_total === 2);
check('store_status.ok', stats.store_status.ok === true);
check('unavailable lista', JSON.stringify(stats.unavailable) === JSON.stringify(['generations_ui', 'projects', 'subscriptions', 'ai_usage']));
check('generations_ui null', stats.generations_ui === null);
check('projects null', stats.projects === null);

console.log('== sem PII / sem segredos ==');
const payload = JSON.stringify(stats);
check('sem título do job', !payload.includes('Página secreta'));
check('sem objective', !payload.includes('vender muito'));
check('sem mensagem de erro interna', !payload.includes('detalhe interno sensível'));
check('sem chave', !payload.includes('test-chave-123'));
check('sem token blob', !payload.includes('test-dummy-token'));

console.log('== sem store -> nulls honestos ==');
delete process.env.BLOB_READ_WRITE_TOKEN;
const stats2 = await collectStats();
check('store_status.ok false', stats2.store_status.ok === false);
check('error_code missing_env', stats2.store_status.error_code === 'missing_env');
check('jobs.total null', stats2.jobs.total === null);
check('exports null', stats2.exports.published_total === null);
process.env.BLOB_READ_WRITE_TOKEN = 'test-dummy-token';

console.log('== handlers HTTP ==');
{
  const { res, body } = makeRes();
  await healthHandler(req(), res);
  check('GET /health -> 200', res.statusCode === 200);
  const b = body();
  check('health platform PageForge', b.platform === 'PageForge');
}
{
  const { res, body } = makeRes();
  await statsHandler(req(), res);
  check('GET /stats sem chave -> 401', res.statusCode === 401);
}
{
  const { res } = makeRes();
  await statsHandler(req({ authorization: 'Bearer errada' }), res);
  check('GET /stats chave errada -> 401', res.statusCode === 401);
}
{
  const { res, body } = makeRes();
  await statsHandler(req({ authorization: 'Bearer test-chave-123' }), res);
  check('GET /stats com chave -> 200', res.statusCode === 200);
  check('stats ok:true', body().ok === true);
}
{
  delete process.env.PAGEFORGE_ATHENA_API_KEY;
  const { res } = makeRes();
  await statsHandler(req({ authorization: 'Bearer test-chave-123' }), res);
  check('GET /stats sem env no servidor -> 503', res.statusCode === 503);
  process.env.PAGEFORGE_ATHENA_API_KEY = 'test-chave-123';
}

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
