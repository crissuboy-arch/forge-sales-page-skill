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
    model: 'meta/llama-3.3-70b-instruct',
  },
};

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

  async chat({ system, user, temperature = 0.6, maxTokens = 8000, signal } = {}) {
    if (!this.isConfigured()) throw new MissingKeyError('nvidia');

    let res;
    try {
      res = await fetch(`${this.cfg.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          authorization: `Bearer ${this.cfg.apiKey}`,
        },
        body: JSON.stringify({
          model: this.cfg.model,
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
      if (err.name === 'AbortError') throw new ProviderError('A geração excedeu o tempo limite. Tente um modo de scroll mais leve ou um briefing mais curto.', 504);
      throw new ProviderError(`Falha de rede ao chamar a NVIDIA: ${err.message}`, 502);
    }

    if (!res.ok) {
      const body = await res.text().catch(() => '');
      let detail = body.slice(0, 500);
      try { detail = JSON.parse(body)?.detail || JSON.parse(body)?.error?.message || detail; } catch { /* keep raw */ }
      if (res.status === 401 || res.status === 403) throw new ProviderError('A NVIDIA_API_KEY foi rejeitada (401/403). Verifique a chave configurada.', 401);
      if (res.status === 429) throw new ProviderError('Limite de requisições da NVIDIA atingido (429). Aguarde alguns segundos e tente de novo.', 429);
      throw new ProviderError(`NVIDIA respondeu ${res.status}: ${detail}`, 502);
    }

    const data = await res.json();
    const choice = data?.choices?.[0];
    const content = choice?.message?.content || '';
    if (!content.trim()) throw new ProviderError('A NVIDIA retornou uma resposta vazia.', 502);
    return {
      content,
      model: data?.model || this.cfg.model,
      finishReason: choice?.finish_reason || 'stop',
      usage: data?.usage || null,
    };
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
