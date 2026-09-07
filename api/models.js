// GET /api/models — lista os modelos disponíveis no provider (usa a chave do
// servidor; não vaza a chave). Serve para diagnosticar e escolher NVIDIA_MODEL.
import { getProvider } from './_lib/providers.js';
import { send, methodGuard } from './_lib/http.js';

export default async function handler(req, res) {
  if (!methodGuard(req, res, ['GET'])) return;
  const provider = getProvider();
  if (!provider.isConfigured()) {
    return send(res, 503, { ok: false, error: 'NVIDIA_API_KEY não configurada.' });
  }
  const base = (process.env.NVIDIA_BASE_URL || 'https://integrate.api.nvidia.com/v1').replace(/\/+$/, '');
  try {
    const r = await fetch(`${base}/models`, {
      headers: { authorization: `Bearer ${process.env.NVIDIA_API_KEY}` },
    });
    const body = await r.text();
    if (!r.ok) return send(res, 502, { ok: false, status: r.status, detail: body.slice(0, 800) });
    let data;
    try { data = JSON.parse(body); } catch { return send(res, 502, { ok: false, error: 'resposta não-JSON', detail: body.slice(0, 800) }); }
    const ids = (data.data || data.models || []).map((m) => m.id || m.name).filter(Boolean).sort();
    send(res, 200, {
      ok: true,
      current: provider.model,
      count: ids.length,
      models: ids,
    });
  } catch (err) {
    send(res, 502, { ok: false, error: String(err && err.message || err) });
  }
}
