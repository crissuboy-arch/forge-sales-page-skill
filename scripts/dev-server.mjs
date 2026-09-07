#!/usr/bin/env node
/**
 * dev-server.mjs — servidor de desenvolvimento local da PageForge AI, sem a
 * Vercel CLI. Serve public/ e roteia /api/*.js para as funções serverless
 * (mesmo contrato: export default (req, res)).
 *
 *   node scripts/dev-server.mjs            # porta 3000
 *   PAGEFORGE_MOCK=1 node scripts/dev-server.mjs   # geração de exemplo
 */
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const PUBLIC = path.join(ROOT, 'public');
const PORT = Number(process.env.PORT || 3000);

const MIME = {
  '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8', '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml', '.png': 'image/png', '.webmanifest': 'application/manifest+json',
  '.xml': 'application/xml', '.txt': 'text/plain; charset=utf-8', '.ico': 'image/x-icon',
};

// garante o cérebro compilado
if (!fs.existsSync(path.join(ROOT, 'api', '_lib', 'knowledge.generated.js'))) {
  await import(pathToFileURL(path.join(ROOT, 'scripts', 'build-knowledge.mjs')));
}

const handlerCache = new Map();
async function loadHandler(name) {
  if (handlerCache.has(name)) return handlerCache.get(name);
  const file = path.join(ROOT, 'api', `${name}.js`);
  if (!fs.existsSync(file)) return null;
  const mod = await import(`${pathToFileURL(file).href}?t=${Date.now()}`);
  const h = mod.default;
  handlerCache.set(name, h);
  return h;
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://localhost:${PORT}`);
  let pathname = decodeURIComponent(url.pathname);

  if (pathname.startsWith('/api/')) {
    const name = pathname.slice(5).replace(/\/$/, '');
    const handler = await loadHandler(name);
    if (!handler) { res.statusCode = 404; return res.end('no api route'); }
    try {
      await handler(req, res);
    } catch (err) {
      console.error(`[api/${name}]`, err);
      if (!res.headersSent) res.statusCode = 500;
      res.end(JSON.stringify({ ok: false, error: String(err && err.message || err) }));
    }
    return;
  }

  if (pathname === '/') pathname = '/index.html';
  let file = path.join(PUBLIC, pathname);
  if (!file.startsWith(PUBLIC)) { res.statusCode = 403; return res.end('nope'); }
  if (!fs.existsSync(file) && fs.existsSync(`${file}.html`)) file = `${file}.html`;
  if (!fs.existsSync(file) || fs.statSync(file).isDirectory()) {
    res.statusCode = 404; return res.end('404');
  }
  res.setHeader('content-type', MIME[path.extname(file)] || 'application/octet-stream');
  res.setHeader('cache-control', 'no-store');
  fs.createReadStream(file).pipe(res);
});

server.listen(PORT, () => {
  console.log(`PageForge AI dev → http://localhost:${PORT}${process.env.PAGEFORGE_MOCK === '1' ? '  (MOCK)' : ''}`);
});
