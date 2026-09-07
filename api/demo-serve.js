// GET /demo/<slug>  (via rewrite -> /api/demo-serve?slug=<slug>)
// Serve a demo publicada. Sem login, mobile, noindex. É o HTML final editado —
// nunca teve painel/editor.
import { getDemoHtml } from './_lib/blob.js';

export const config = { maxDuration: 15 };

const NOT_FOUND = `<!DOCTYPE html><html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex"><title>Demonstração não encontrada</title><style>body{font:16px/1.6 system-ui,sans-serif;color:#16201d;background:#f6f7f7;display:grid;place-items:center;min-height:100vh;margin:0;text-align:center;padding:2rem}</style></head><body><div><h1>Demonstração não encontrada</h1><p>Esta demo não está publicada ou foi removida.</p></div></body></html>`;

export default async function handler(req, res) {
  const slug = new URL(req.url, 'http://x').searchParams.get('slug') || '';
  let html = null;
  try { html = await getDemoHtml(slug); } catch { html = null; }

  res.setHeader('content-type', 'text/html; charset=utf-8');
  res.setHeader('x-robots-tag', 'noindex, nofollow');
  res.setHeader('referrer-policy', 'no-referrer');
  res.setHeader('cache-control', html ? 'public, max-age=120, s-maxage=300' : 'no-store');
  res.setHeader('content-security-policy', "frame-ancestors 'self'");
  res.statusCode = html ? 200 : 404;
  res.end(html || NOT_FOUND);
}
