// blob.js — publicação de demos via Vercel Blob (REST, sem dependência).
// Token: BLOB_READ_WRITE_TOKEN (Vercel → Storage → Blob). Sem token, o módulo
// degrada: em dev (PAGEFORGE_MOCK=1) usa memória; em produção retorna pendência.
const API = 'https://blob.vercel-storage.com';
const PREFIX = 'demos/';

function token() { return (process.env.BLOB_READ_WRITE_TOKEN || '').trim(); }
export function blobConfigured() { return Boolean(token()); }

// slug -> { html, nome, at }  (só dev/mock). Em globalThis para sobreviver a
// re-imports do módulo (o dev-server recarrega as rotas a cada request).
const MEM = (globalThis.__PF_DEMO_MEM = globalThis.__PF_DEMO_MEM || new Map());
const useMem = () => process.env.PAGEFORGE_MOCK === '1' || (!blobConfigured() && process.env.PAGEFORGE_DEMO_MEMORY === '1');

/** Publica/atualiza a demo. @returns {{pathname, blobUrl}} */
export async function putDemo(slug, html, nome = '') {
  if (useMem()) { MEM.set(slug, { html: String(html), nome, at: new Date().toISOString() }); return { pathname: PREFIX + slug + '.html', blobUrl: null, memory: true }; }
  if (!blobConfigured()) { const e = new Error('BLOB_READ_WRITE_TOKEN não configurado.'); e.code = 'BLOB_MISSING'; throw e; }
  const pathname = PREFIX + encodeURIComponent(slug) + '.html';
  const res = await fetch(`${API}/${pathname}`, {
    method: 'PUT',
    headers: {
      authorization: `Bearer ${token()}`,
      'x-api-version': '7',
      'x-content-type': 'text/html; charset=utf-8',
      'x-add-random-suffix': '0',
      'x-cache-control-max-age': '300',
    },
    body: String(html),
  });
  if (!res.ok) {
    const t = await res.text().catch(() => '');
    const e = new Error(`Vercel Blob respondeu ${res.status}: ${t.slice(0, 200)}`);
    e.code = res.status === 403 ? 'BLOB_MISSING' : 'BLOB_ERROR';
    throw e;
  }
  const data = await res.json().catch(() => ({}));
  return { pathname, blobUrl: data.url || null };
}

/** Recupera o HTML de uma demo publicada. @returns {string|null} */
export async function getDemoHtml(slug) {
  if (useMem()) { const m = MEM.get(slug); return m ? m.html : null; }
  if (!blobConfigured()) return null;
  // acha a URL pública pelo prefixo
  const res = await fetch(`${API}?prefix=${encodeURIComponent(PREFIX)}&limit=1000`, {
    headers: { authorization: `Bearer ${token()}`, 'x-api-version': '7' },
  });
  if (!res.ok) return null;
  const { blobs = [] } = await res.json().catch(() => ({ blobs: [] }));
  const want = PREFIX + slug + '.html';
  const hit = blobs.find((b) => b.pathname === want);
  if (!hit) return null;
  const r2 = await fetch(hit.url, { cache: 'no-store' });
  return r2.ok ? r2.text() : null;
}

/** Lista demos publicadas. @returns {Array<{slug, nome, at, url}>} */
export async function listDemos() {
  if (useMem()) return Array.from(MEM.entries()).map(([slug, v]) => ({ slug, nome: v.nome, at: v.at }));
  if (!blobConfigured()) return [];
  const res = await fetch(`${API}?prefix=${encodeURIComponent(PREFIX)}&limit=1000`, {
    headers: { authorization: `Bearer ${token()}`, 'x-api-version': '7' },
  });
  if (!res.ok) return [];
  const { blobs = [] } = await res.json().catch(() => ({ blobs: [] }));
  return blobs
    .filter((b) => b.pathname.startsWith(PREFIX) && b.pathname.endsWith('.html'))
    .map((b) => ({ slug: b.pathname.slice(PREFIX.length, -5), at: b.uploadedAt, url: b.url }));
}

export async function deleteDemo(slug) {
  if (useMem()) { MEM.delete(slug); return true; }
  if (!blobConfigured()) return false;
  const list = await listDemos();
  const hit = list.find((d) => d.slug === slug);
  if (!hit || !hit.url) return false;
  const res = await fetch(`${API}/delete`, {
    method: 'POST',
    headers: { authorization: `Bearer ${token()}`, 'x-api-version': '7', 'content-type': 'application/json' },
    body: JSON.stringify({ urls: [hit.url] }),
  });
  return res.ok;
}
