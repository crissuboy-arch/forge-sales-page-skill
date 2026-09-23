// GET /api/provider-test — diagnóstico mínimo do provider de IA ATIVO
// (hoje OpenRouter, via api/_lib/providers.js — o mesmo módulo que
// api/generate.js e api/_lib/pageforge-engine.js usam). Confirma só que o
// servidor lê a chave, autentica e recebe uma resposta — nada além disso:
//
//   NÃO chama generatePageForBrief/PLAN/RENDER, NÃO monta página, NÃO cria
//   artefato, NÃO grava/consulta job do Cris OS, NÃO expõe a chave.
//
// Só roda quando chamada explicitamente (GET manual); nenhum outro código
// deste projeto invoca esta rota automaticamente.
import { getProvider } from './_lib/providers.js';
import { send, methodGuard } from './_lib/http.js';

export const config = { maxDuration: 15 };

export default async function handler(req, res) {
  if (!methodGuard(req, res, ['GET'])) return;

  const provider = getProvider();
  const mock = process.env.PAGEFORGE_MOCK === '1';

  // Modo mock: nenhuma chamada de rede — só para testar a rota localmente
  // (formato da resposta, ausência da chave no corpo) sem custo/segredo real.
  if (mock) {
    return send(res, 200, { ok: true, provider: provider.name, model: provider.model, response: 'OPENROUTER_OK', mock: true });
  }

  if (!provider.isConfigured()) {
    const envVar = `${provider.name.toUpperCase().replace(/[^A-Z0-9]/g, '_')}_API_KEY`;
    return send(res, 503, {
      ok: false, provider: provider.name, model: provider.model,
      error: { code: 'PROVIDER_KEY_MISSING', message: `${envVar} não configurada no servidor.` },
    });
  }

  const ac = new AbortController();
  const t = setTimeout(() => ac.abort(), 12000);
  try {
    const r = await provider.chat({
      system: 'Você é um verificador de diagnóstico do PageForge. Responda apenas com o texto pedido, exatamente, sem mais nada.',
      user: 'Responda exatamente: OPENROUTER_OK',
      temperature: 0,
      maxTokens: 16,
      signal: ac.signal,
      deadline: Date.now() + 10000,
      stream: false,
    });
    return send(res, 200, {
      ok: true,
      provider: provider.name,
      model: r.model || provider.model,
      response: String(r.content || '').trim(),
    });
  } catch (err) {
    // Nunca inclui a chave: as mensagens de erro de providers.js já são
    // sanitizadas (nunca interpolam o valor da API key).
    const status = (err && err.status) || 502;
    return send(res, status, {
      ok: false,
      provider: provider.name,
      model: provider.model,
      error: { code: (err && err.code) || 'PROVIDER_ERROR', message: String((err && err.message) || err).slice(0, 300) },
    });
  } finally {
    clearTimeout(t);
  }
}
