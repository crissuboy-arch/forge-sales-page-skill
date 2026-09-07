// POST /api/commercial  { action, lead, opts }
//   action: "proposal" -> { html, missing, fields }
//   action: "email"    -> { subject, body, gmailUrl, mailto, missing }
//   action: "contract" -> { html, missing, data }
// Sem IA. Templates de maquina-de-leads + gemini-prospector adaptados.
import { buildProposal, buildEmailDraft, buildContract } from './_lib/commercial.js';
import { readJson, send, methodGuard } from './_lib/http.js';

export const config = { maxDuration: 15 };

export default async function handler(req, res) {
  if (!methodGuard(req, res, ['POST'])) return;
  let body;
  try { body = await readJson(req, 1024 * 1024); }
  catch (err) { return send(res, 400, { ok: false, error: err.message }); }

  const lead = body.lead && typeof body.lead === 'object' ? body.lead : {};
  const opts = body.opts && typeof body.opts === 'object' ? body.opts : {};
  const action = String(body.action || '');

  if (!lead.nome && !lead.slug) return send(res, 422, { ok: false, error: 'Lead sem dados.' });

  try {
    if (action === 'proposal') return send(res, 200, { ok: true, ...buildProposal(lead, opts) });
    if (action === 'email') return send(res, 200, { ok: true, ...buildEmailDraft(lead, opts) });
    if (action === 'contract') return send(res, 200, { ok: true, ...buildContract(lead, opts) });
    return send(res, 422, { ok: false, error: 'action deve ser proposal | email | contract.' });
  } catch (err) {
    return send(res, 500, { ok: false, error: `Erro ao gerar: ${err.message}` });
  }
}
