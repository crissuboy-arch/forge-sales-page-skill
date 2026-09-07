// http.js — helpers para as funções serverless (ESM, runtime Node da Vercel).

export async function readJson(req, maxBytes = 512 * 1024) {
  const chunks = [];
  let size = 0;
  for await (const chunk of req) {
    size += chunk.length;
    if (size > maxBytes) throw new Error('Payload grande demais.');
    chunks.push(chunk);
  }
  if (!chunks.length) return {};
  try {
    return JSON.parse(Buffer.concat(chunks).toString('utf8'));
  } catch {
    throw new Error('JSON inválido no corpo da requisição.');
  }
}

export function send(res, status, body, extraHeaders = {}) {
  res.statusCode = status;
  res.setHeader('content-type', 'application/json; charset=utf-8');
  res.setHeader('cache-control', 'no-store');
  res.setHeader('x-content-type-options', 'nosniff');
  for (const [k, v] of Object.entries(extraHeaders)) res.setHeader(k, v);
  res.end(JSON.stringify(body));
}

export function methodGuard(req, res, allowed) {
  if (allowed.includes(req.method)) return true;
  send(res, 405, { ok: false, error: `Método ${req.method} não permitido.` }, { allow: allowed.join(', ') });
  return false;
}
