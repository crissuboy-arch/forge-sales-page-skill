// POST /api/demo   { slug, html, nome }   -> publica/atualiza a demo pública
// GET  /api/demo                          -> health do módulo de publicação
// GET  /api/demo?list=1                    -> demos publicadas
import { putDemo, listDemos, deleteDemo, blobConfigured } from './_lib/blob.js';
import { readJson, send, methodGuard } from './_lib/http.js';

export const config = { maxDuration: 30 };

function slugify(s) {
  return String(s || 'demo').toLowerCase().normalize('NFD').replace(new RegExp('[\\u0300-\\u036f]', 'g'), '')
    .replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '').slice(0, 60) || 'demo';
}
function host(req) {
  const h = req.headers['x-forwarded-host'] || req.headers.host || 'pageforge-ai-woad.vercel.app';
  let proto = (req.headers['x-forwarded-proto'] || '').split(',')[0].trim();
  if (!proto) proto = /^localhost|127\.0\.0\.1|\[::1\]/.test(h) ? 'http' : 'https';
  return `${proto}://${h}`;
}

export default async function handler(req, res) {
  if (req.method === 'GET') {
    if (new URL(req.url, 'http://x').searchParams.get('list')) {
      const demos = await listDemos().catch(() => []);
      return send(res, 200, { ok: true, demos });
    }
    const mock = process.env.PAGEFORGE_MOCK === '1';
    return send(res, 200, {
      ok: true, module: 'demo', storage: 'vercel-blob',
      keyConfigured: blobConfigured(), mock,
      ready: blobConfigured() || mock,
      message: blobConfigured()
        ? 'Publicação de demos ativa (Vercel Blob).'
        : (mock ? 'Modo dev — demos em memória.' : 'BLOB_READ_WRITE_TOKEN não configurado. Configure em Vercel → Storage → Blob para publicar demos com URL pública; enquanto isso use Exportar HTML/ZIP.'),
    });
  }
  if (!methodGuard(req, res, ['GET', 'POST', 'DELETE'])) return;

  let body;
  try { body = await readJson(req, 2 * 1024 * 1024); }
  catch (err) { return send(res, 400, { ok: false, error: err.message }); }

  const slug = slugify(body.slug || body.nome);

  if (req.method === 'DELETE' || body.action === 'delete') {
    const okDel = await deleteDemo(slug).catch(() => false);
    return send(res, 200, { ok: okDel, slug });
  }

  const html = String(body.html || '');
  if (html.length < 200 || !/<html|<!doctype/i.test(html)) {
    return send(res, 422, { ok: false, error: 'HTML da página inválido ou muito curto.' });
  }

  try {
    const r = await putDemo(slug, html, String(body.nome || '').slice(0, 120));
    const url = `${host(req)}/demo/${slug}`;
    return send(res, 200, { ok: true, slug, url, blobUrl: r.blobUrl, memory: !!r.memory, status: 'demo-publicada', publishedAt: new Date().toISOString() });
  } catch (err) {
    if (err.code === 'BLOB_MISSING') {
      return send(res, 503, { ok: false, code: 'BLOB_MISSING', error: 'BLOB_READ_WRITE_TOKEN não configurado na Vercel. Adicione em Project → Storage → Blob → Connect, e faça um novo deploy. Enquanto isso, exporte o HTML/ZIP e hospede manualmente.' });
    }
    return send(res, 502, { ok: false, code: err.code || 'DEMO_ERROR', error: err.message });
  }
}
