// athena-auth.js — autenticação server-to-server da integração
// PageForge <-> Athena Control. Espelha o padrão de api/_lib/cris-os-auth.js:
// chave exclusiva em PAGEFORGE_ATHENA_API_KEY, só no servidor
// (Vercel -> Environment Variables). NUNCA no frontend, NUNCA commitada.
// Comparação por digest SHA-256 + timingSafeEqual: nem o tamanho nem o
// conteúdo da chave esperada vazam por tempo de resposta.
import { createHash, timingSafeEqual } from 'node:crypto';

export const ATHENA_API_KEY_ENV = 'PAGEFORGE_ATHENA_API_KEY';

/** true só quando o servidor tem o segredo configurado. */
export function athenaConfigured() {
  return Boolean((process.env[ATHENA_API_KEY_ENV] || '').trim());
}

function digest(s) {
  return createHash('sha256').update(String(s || ''), 'utf8').digest();
}

/** Espera `Authorization: Bearer <chave>`. Fail-closed: sem segredo configurado, nunca autentica. */
export function verifyAthenaKey(req) {
  const expected = (process.env[ATHENA_API_KEY_ENV] || '').trim();
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
