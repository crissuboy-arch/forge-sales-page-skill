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
    model: 'minimaxai/minimax-m3',
  },
};

// Modelos-candidato tentados em ordem quando o configurado sai de linha (410)
// ou não existe (404). NVIDIA aposenta modelos com frequência; isto mantém a
// geração de pé sem exigir novo deploy. Configure NVIDIA_MODEL para fixar um.
// Verifique o catálogo vigente em GET /api/models.
const NVIDIA_FALLBACKS = [
  'moonshotai/kimi-k3',
  'deepseek-ai/deepseek-v4-flash-0731',
  'nvidia/nemotron-3-super-120b-a12b',
  'deepseek-ai/deepseek-v4-pro-0813',
];

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/** Remove blocos de raciocínio que alguns modelos emitem antes da resposta. */
function stripReasoning(s) {
  let t = String(s || '');
  t = t.replace(/<think>[\s\S]*?<\/think>/gi, '');
  t = t.replace(/<\|thinking\|>[\s\S]*?<\|\/thinking\|>/gi, '');
  // <think> aberto e nunca fechado (budget estourou no meio do raciocínio)
  if (/<think>/i.test(t) && !/<\/think>/i.test(t)) t = t.replace(/<think>[\s\S]*$/i, '');
  return t.trim();
}

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

  async _callModel(model, { system, user, temperature, maxTokens, signal, stream, onToken }) {
    // Desliga o "raciocínio" (reasoning/think) que estoura tempo e tokens.
    // Nemotron: via system prompt. Outros: via chat_template_kwargs (ignorado se não suportado).
    let sys = system;
    const body = {
      model,
      messages: [{ role: 'system', content: sys }, { role: 'user', content: user }],
      temperature,
      top_p: 0.95,
      max_tokens: maxTokens,
      stream: Boolean(stream),
    };
    if (/nemotron/i.test(model)) {
      body.messages[0].content = `detailed thinking off\n\n${sys}`;
    }

    let res;
    try {
      res = await fetch(`${this.cfg.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: { 'content-type': 'application/json', authorization: `Bearer ${this.cfg.apiKey}` },
        body: JSON.stringify(body),
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
      if (res.status === 401 || res.status === 403) { err.message = 'A NVIDIA_API_KEY foi rejeitada (401/403). Verifique a chave configurada.'; err.status = 401; err.fatal = true; }
      else if (res.status === 429) { err.message = 'Limite de requisições da NVIDIA atingido (429).'; err.status = 429; }
      throw err;
    }

    if (stream && res.body) {
      const reader = res.body.getReader();
      const dec = new TextDecoder();
      let buf = '';
      let content = '';
      let finishReason = 'stop';
      let usage = null;
      let realModel = model;
      for (;;) {
        const { value, done } = await reader.read();
        if (done) break;
        buf += dec.decode(value, { stream: true });
        const lines = buf.split('\n');
        buf = lines.pop() || '';
        for (const line of lines) {
          const s = line.trim();
          if (!s || !s.startsWith('data:')) continue;
          const payload = s.slice(5).trim();
          if (payload === '[DONE]') continue;
          try {
            const j = JSON.parse(payload);
            const d = j?.choices?.[0]?.delta?.content;
            if (d) { content += d; if (onToken) onToken(d); }
            if (j?.choices?.[0]?.finish_reason) finishReason = j.choices[0].finish_reason;
            if (j?.usage) usage = j.usage;
            if (j?.model) realModel = j.model;
          } catch { /* linha parcial — ignora */ }
        }
      }
      const clean = stripReasoning(content);
      if (!clean.trim()) {
        const e = new ProviderError(`A NVIDIA retornou stream vazio (ou só raciocínio) para "${model}".`, 502);
        e.raw = `finish=${finishReason} rawlen=${content.length} :: ${content.slice(0, 400)}`;
        throw e;
      }
      return { content: clean, model: realModel, finishReason, usage };
    }

    const data = await res.json();
    const choice = data?.choices?.[0];
    const raw = choice?.message?.content || '';
    const content = stripReasoning(raw);
    if (!content.trim()) throw new ProviderError(`A NVIDIA retornou resposta vazia (ou só raciocínio) para "${model}".`, 502);
    return {
      content,
      model: data?.model || model,
      finishReason: choice?.finish_reason || 'stop',
      usage: data?.usage || null,
    };
  }

  async chat({ system, user, temperature = 0.6, maxTokens = 8000, signal, deadline = 0, stream = false, onToken } = {}) {
    if (!this.isConfigured()) throw new MissingKeyError('nvidia');

    const models = this.candidateModels();
    let lastErr = null;
    for (const model of models) {
      // Não começa uma nova tentativa se já não há tempo hábil (< 12s).
      if (deadline && Date.now() > deadline - 12000 && lastErr) break;
      for (let attempt = 0; attempt < 3; attempt++) {
        try {
          return await this._callModel(model, { system, user, temperature, maxTokens, signal, stream, onToken });
        } catch (err) {
          lastErr = err;
          if (err.fatal) throw err;
          const rateLimited = err.status === 429;
          const overloaded = err.status === 500 || err.status === 502 || err.status === 503
            || /overload|temporarily|try again|stream vazio|resposta vazia/i.test(err.message || '');
          const wrongModel = err.status === 404 || err.status === 410
            || (err.status === 400 && /model|not (found|available)|end of life|deprecat/i.test(err.detail || err.message || ''));
          if (wrongModel) break; // próximo modelo
          const timeLeft = !deadline || Date.now() < deadline - 16000;
          if (rateLimited && attempt < 2 && timeLeft) { await sleep(6000 + attempt * 2000); continue; }
          if (overloaded && attempt < 2 && timeLeft) { await sleep(1500); continue; }
          if (rateLimited || overloaded) break; // esgotou retries → próximo modelo
          throw err; // erro não recuperável
        }
      }
    }
    throw lastErr || new ProviderError('O servidor de IA da NVIDIA está sobrecarregado (503) em todos os modelos tentados. É uma limitação de capacidade do endpoint gratuito integrate.api.nvidia.com — tente de novo em alguns minutos, ou use uma NVIDIA_API_KEY com cota de inferência dedicada.', 503);
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
