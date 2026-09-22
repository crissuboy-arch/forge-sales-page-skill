// cris-os-auth.js — autenticação server-to-server do PageForge Executor
// Bridge (Cris OS -> PageForge). Token único em CRIS_OS_BRIDGE_TOKEN, só no
// servidor (Vercel -> Environment Variables). NUNCA no frontend, NUNCA
// commitado. Comparação por digest SHA-256 + timingSafeEqual: os dois lados
// da comparação têm sempre 32 bytes, então nem o tamanho nem o conteúdo do
// token esperado vazam por tempo de resposta.
import { createHash, timingSafeEqual } from 'node:crypto';

/** true só quando o servidor tem o segredo configurado. */
export function bridgeConfigured() {
  return Boolean((process.env.CRIS_OS_BRIDGE_TOKEN || '').trim());
}

function digest(s) {
  return createHash('sha256').update(String(s || ''), 'utf8').digest();
}

/** Espera `Authorization: Bearer <token>`. Fail-closed: sem segredo configurado, nunca autentica. */
export function verifyBridgeToken(req) {
  const expected = (process.env.CRIS_OS_BRIDGE_TOKEN || '').trim();
  if (!expected) return false;
  const header = String((req.headers && req.headers.authorization) || '');
  const m = header.match(/^Bearer\s+(.+)$/i);
  const got = m ? m[1].trim() : '';
  if (!got) return false;
  try {
    return timingSafeEqual(digest(got), digest(expected));
  } catch {
    return false;
  }
}
