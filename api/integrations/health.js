// GET /api/integrations/health — PageForge <-> Athena Control.
// Público, somente leitura. Não expõe chaves, prompts ou dados.
import { send, methodGuard } from '../_lib/http.js';

export default async function handler(req, res) {
  if (!methodGuard(req, res, ['GET'])) return;
  return send(res, 200, {
    platform: 'PageForge',
    status: 'operational',
    contract: 'v1',
    endpoints: ['/api/integrations/health', '/api/integrations/stats'],
  });
}
