// GET /api/health — estado do provider de IA. Nunca vaza a chave.
import { getProvider } from './_lib/providers.js';
import { send, methodGuard } from './_lib/http.js';
import { KNOWLEDGE_BUILT_AT } from './_lib/knowledge.js';

export default async function handler(req, res) {
  if (!methodGuard(req, res, ['GET'])) return;
  const mock = process.env.PAGEFORGE_MOCK === '1';
  const provider = getProvider();
  const configured = provider.isConfigured();
  send(res, 200, {
    ok: true,
    app: 'PageForge AI',
    provider: provider.name,
    model: provider.model,
    keyConfigured: configured,
    mock,
    ready: configured || mock,
    knowledgeBuiltAt: KNOWLEDGE_BUILT_AT || null,
    message: configured
      ? 'Provider NVIDIA configurado.'
      : (mock
        ? 'Modo MOCK ativo (sem IA real) — apenas para desenvolvimento.'
        : 'NVIDIA_API_KEY não configurada. Configure a variável de ambiente para gerar páginas.'),
  });
}
