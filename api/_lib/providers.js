// providers.js — camada de provider de IA desacoplada.
//
//   AIProvider
//     └ NVIDIA   (primeiro provider — endpoint OpenAI-compatível da NVIDIA)
//
// Futuro: OpenAI, Gemini, Groq, etc. implementam a mesma interface `chat()`
// e entram no mapa `PROVIDERS` sem tocar no resto da aplicação.

const DEFAULTS = {
  nvidia: {
    baseUrl: 'https://integrate.api.nvidia.com/v1',
    model: 'meta/llama-3.1-70b-instruct',
  },
};

// Modelos-candidato tentados em ordem quando o configurado sai de linha (410)
// ou não existe (404). NVIDIA aposenta modelos com frequência; isto mantém a
// geração de pé sem exigir novo deploy. Configure NVIDIA_MODEL para fixar um.
const NVIDIA_FALLBACKS = [
  'moonshotai/kimi-k2-instruct',
  'meta/llama-4-maverick-17b-128e-instruct',
  'meta/llama-4-scout-17b-16e-instruct',
  'qwen/qwen2.5-coder-32b-instruct',
  'deepseek-ai/deepseek-v3.1',
  'nvidia/llama-3.3-nemotron-super-49b-v1',
  'meta/llama-3.3-70b-instruct',
  'meta/llama-3.1-70b-instruct',
  'mistralai/mistral-small-24b-instruct',
];

class MissingKeyError extends Error {
  constructor(provider) {
    super(`API key ausente para o provider "${provider}".`);
    this.code = 'MISSING_KEY';
    this.provider = provider;
  }
}
class ProviderError extends Error {
  constructor(message, status) {
    super(message);
    this.code = 'PROVIDER_ERROR';
    this.status = status || 502;
  }
}

/** Interface base — todo provider implementa `chat()`. */
class AIProvider {
  constructor(cfg = {}) { this.cfg = cfg; }
  get name() { return 'base'; }
  get model() { return this.cfg.model; }
  isConfigured() { return false; }
  // eslint-disable-next-line no-unused-vars
  async chat({ system, user, temperature, maxTokens, signal }) {
    throw new Error('not implemented');
  }
}

class NvidiaProvider extends AIProvider {
  constructor(cfg = {}) {
    super({
      apiKey: process.env.NVIDIA_API_KEY || '',
      baseUrl: (process.env.NVIDIA_BASE_URL || DEFAULTS.nvidia.baseUrl).replace(/\/+$/, ''),
      model: process.env.NVIDIA_MODEL || DEFAULTS.nvidia.model,
      ...cfg,
    });
  }
  get name() { return 'nvidia'; }
  isConfigured() { return Boolean(this.cfg.apiKey && this.cfg.apiKey.trim()); }

  /** Ordem de modelos a tentar: o configurado primeiro, depois os fallbacks. */
  candidateModels() {
    const seen = new Set();
    const out = [];
    for (const m of [this.cfg.model, ...NVIDIA_FALLBACKS]) {
      if (m && !seen.has(m)) { seen.add(m); out.push(m); }
    }
    // Se o usuário fixou NVIDIA_MODEL explicitamente, respeita e não tenta outros.
    return process.env.NVIDIA_MODEL ? [process.env.NVIDIA_MODEL] : out;
  }

  async _callModel(model, { system, user, temperature, maxTokens, signal }) {
    let res;
    try {
      res = await fetch(`${this.cfg.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: { 'content-type': 'application/json', authorization: `Bearer ${this.cfg.apiKey}` },
        body: JSON.stringify({
          model,
          messages: [
            { role: 'system', content: system },
            { role: 'user', content: user },
          ],
          temperature,
          top_p: 0.95,
          max_tokens: maxTokens,
          stream: false,
        }),
        signal,
      });
    } catch (err) {
      if (err.name === 'AbortError') { const e = new ProviderError('A geração excedeu o tempo limite. Tente um modo de scroll mais leve ou um briefing mais curto.', 504); e.fatal = true; throw e; }
      throw new ProviderError(`Falha de rede ao chamar a NVIDIA: ${err.message}`, 502);
    }

    if (!res.ok) {
      const raw = await res.text().catch(() => '');
      let detail = raw.slice(0, 500);
      try { detail = JSON.parse(raw)?.detail || JSON.parse(raw)?.error?.message || detail; } catch { /* keep raw */ }
      const err = new ProviderError(`NVIDIA respondeu ${res.status} para "${model}": ${detail}`, 502);
      err.status = res.status;
      err.detail = detail;
      // 401/403/429 são fatais (não adianta trocar de modelo); 404/410/400-"model" são "tente o próximo".
      if (res.status === 401 || res.status === 403) { err.message = 'A NVIDIA_API_KEY foi rejeitada (401/403). Verifique a chave configurada.'; err.status = 401; err.fatal = true; }
      else if (res.status === 429) { err.message = 'Limite de requisições da NVIDIA atingido (429). Aguarde alguns segundos e tente de novo.'; err.status = 429; err.fatal = true; }
      throw err;
    }

    const data = await res.json();
    const choice = data?.choices?.[0];
    const content = choice?.message?.content || '';
    if (!content.trim()) throw new ProviderError(`A NVIDIA retornou resposta vazia para "${model}".`, 502);
    return {
      content,
      model: data?.model || model,
      finishReason: choice?.finish_reason || 'stop',
      usage: data?.usage || null,
    };
  }

  async chat({ system, user, temperature = 0.6, maxTokens = 8000, signal } = {}) {
    if (!this.isConfigured()) throw new MissingKeyError('nvidia');

    const models = this.candidateModels();
    let lastErr = null;
    for (const model of models) {
      try {
        return await this._callModel(model, { system, user, temperature, maxTokens, signal });
      } catch (err) {
        lastErr = err;
        if (err.fatal) throw err;
        const retriable = err.status === 404 || err.status === 410
          || (err.status === 400 && /model|not (found|available)|end of life|deprecat/i.test(err.detail || err.message || ''));
        if (!retriable) throw err;
        // senão: tenta o próximo modelo
      }
    }
    throw lastErr || new ProviderError('Nenhum modelo NVIDIA disponível respondeu. Configure NVIDIA_MODEL com um modelo válido (veja /api/models).', 502);
  }
}

const PROVIDERS = { nvidia: NvidiaProvider };

/** Fábrica: retorna o provider pedido (default: nvidia). */
export function getProvider(name = process.env.AI_PROVIDER || 'nvidia', cfg = {}) {
  const key = String(name).toLowerCase();
  const Ctor = PROVIDERS[key] || PROVIDERS.nvidia;
  return new Ctor(cfg);
}

export function listProviders() { return Object.keys(PROVIDERS); }
export { AIProvider, MissingKeyError, ProviderError, DEFAULTS };
