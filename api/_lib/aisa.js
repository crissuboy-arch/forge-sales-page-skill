// aisa.js — provider da AIsa (aisa.one) para o modo PROSPECÇÃO.
// A AIsa é OpenAI-compatível (chat) e traz Google Maps + Instagram na mesma
// chave. Motor portado de maquina-de-leads/motor.py (buscar_negocios,
// avaliar_site, enriquecer_instagram). Chave SÓ no servidor (AISA_KEY).
//
// A camada de providers de IA da PageForge (api/_lib/providers.js) segue
// separada e dedicada à geração de páginas (NVIDIA hoje; Gemini/OpenAI/Groq
// depois). AIsa é o motor de dados da prospecção.
import { normalizeLead } from './prospect.js';

const BASE_CHAT = 'https://api.aisa.one/v1';
const BASE_APIS = 'https://api.aisa.one/apis/v1';
const CHAT_MODELS = ['gemini-2.5-flash', 'gpt-4.1-mini', 'gpt-4o-mini', 'claude-3-5-haiku'];

export function aisaKey() {
  return (process.env.AISA_KEY || process.env.AISA_API_KEY || '').trim();
}
export function aisaConfigured() { return Boolean(aisaKey()); }

class AisaError extends Error {
  constructor(message, status) { super(message); this.code = 'AISA_ERROR'; this.status = status || 502; }
}

async function post(url, body, { signal } = {}) {
  const key = aisaKey();
  if (!key) throw new AisaError('AISA_KEY não configurada.', 503);
  let res;
  try {
    res = await fetch(url, {
      method: 'POST',
      headers: { authorization: `Bearer ${key}`, 'content-type': 'application/json' },
      body: JSON.stringify(body),
      signal,
    });
  } catch (err) {
    if (err.name === 'AbortError') throw new AisaError('A AIsa demorou mais que o limite.', 504);
    throw new AisaError(`Falha de rede ao chamar a AIsa: ${err.message}`, 502);
  }
  const txt = await res.text();
  if (!res.ok) {
    if (res.status === 401 || res.status === 403) throw new AisaError('AISA_KEY rejeitada (401/403). Verifique a chave / saldo.', 401);
    if (res.status === 429) throw new AisaError('Limite de requisições da AIsa (429).', 429);
    throw new AisaError(`AIsa respondeu ${res.status}: ${txt.slice(0, 300)}`, 502);
  }
  try { return JSON.parse(txt); } catch { return {}; }
}

async function get(url, { signal } = {}) {
  const key = aisaKey();
  if (!key) throw new AisaError('AISA_KEY não configurada.', 503);
  const res = await fetch(url, { headers: { authorization: `Bearer ${key}` }, signal });
  if (!res.ok) throw new AisaError(`AIsa GET ${res.status}`, res.status >= 500 ? 502 : res.status);
  return res.json();
}

/** Chat OpenAI-compatível da AIsa, com fallback de modelo. JSON opcional. */
export async function aisaChat({ system, user, json = true, maxTokens = 500, signal } = {}) {
  let last;
  for (const model of CHAT_MODELS) {
    try {
      const r = await post(`${BASE_CHAT}/chat/completions`, {
        model,
        messages: [{ role: 'system', content: system }, { role: 'user', content: user }],
        max_tokens: maxTokens,
        temperature: 0.4,
      }, { signal });
      const content = r?.choices?.[0]?.message?.content || '';
      if (!content.trim()) throw new AisaError('Resposta vazia da AIsa.', 502);
      if (!json) return content;
      const m = content.match(/\{[\s\S]*\}/);
      return m ? JSON.parse(m[0]) : {};
    } catch (err) {
      last = err;
      if (err.status === 404 || err.status === 400) continue;
      throw err;
    }
  }
  throw last || new AisaError('Nenhum modelo da AIsa respondeu.', 502);
}

/** Busca negócios no Google Maps via AIsa (DataForSEO SERP). */
async function mapsSearch(niche, city, depth, signal) {
  const body = {
    keyword: `${niche} em ${city}`,
    location_name: city,
    language_code: 'pt',
    depth: Math.max(10, Math.min(80, depth || 40)),
  };
  const r = await post(`${BASE_APIS}/dataforseo/serp/google/maps/live/advanced`, [body], { signal });
  const items = [];
  for (const task of (r?.tasks || [])) {
    for (const result of (task?.result || [])) {
      for (const it of (result?.items || [])) {
        if (it.type && it.type !== 'maps_search') continue;
        items.push(it);
      }
    }
  }
  return items;
}

/** Enriquecimento leve de Instagram (opcional, tolerante a falha). */
async function igProfile(handle, signal) {
  if (!handle) return null;
  try {
    const r = await get(`${BASE_APIS}/instagram/profile?handle=${encodeURIComponent(handle)}&trim=true`, { signal });
    const u = r?.data?.user || {};
    return {
      seguidores: u?.edge_followed_by?.count ?? null,
      posts: u?.edge_owner_to_timeline_media?.count ?? null,
      categoria: u?.category_name || null,
      ativo: null,
    };
  } catch { return null; }
}

/**
 * Orquestra a prospecção. Retorna leads normalizados + custo aproximado.
 * @param {{niche:string, city:string, count?:number, minRating?:number, minReviews?:number, signal?:AbortSignal}} opts
 */
export async function prospect(opts = {}) {
  const { niche, city, count = 10, minRating = 0, minReviews = 0, signal } = opts;
  const busca = `${niche} em ${city}`;
  const raw = await mapsSearch(niche, city, count * 3, signal);

  const leads = [];
  for (const it of raw) {
    if (leads.length >= count) break;
    const rating = it.rating || {};
    if ((rating.value || 0) < minRating) continue;
    if ((rating.votes_count || 0) < minReviews) continue;
    const nome = it.title || it.name;
    if (!nome) continue;

    let handle = null;
    const url = it.url || it.website || '';
    const igm = String(url).match(/instagram\.com\/([A-Za-z0-9_.]+)/i);
    if (igm) handle = igm[1];
    const ig = handle && leads.length < 6 ? await igProfile(handle, signal) : null;

    const lead = normalizeLead({
      nome,
      nicho: it.category || niche,
      cidade: city,
      rating,
      phone: it.phone,
      url,
      address: it.address,
      instagram: handle,
      seguidores: ig?.seguidores,
      posts: ig?.posts,
      categoria: ig?.categoria,
      ativo: ig?.ativo,
    }, busca);

    leads.push(lead);
  }

  // Diagnóstico + ângulo por IA (1 chamada por lead, só nos primeiros — barato e limitado).
  for (const lead of leads.slice(0, 8)) {
    try {
      const r = await aisaChat({
        system: 'Você avalia a presença online de um negócio local para vender um site novo. Responda APENAS JSON: {"diagnostico":"1 frase objetiva e verificável sobre o site/presença atual","abordagem":"1 frase: melhor canal e gancho de abordagem"}.',
        user: `Negócio: ${lead.nome} (${lead.nicho}) em ${lead.cidade}. Nota Google: ${lead.nota ?? '?'} (${lead.avaliacoes ?? 0} avaliações). Site: ${lead.siteAntigo || 'não tem'}. Instagram: ${lead.instagram ? '@' + lead.instagram + (lead.igSeguidores ? ` (${lead.igSeguidores} seg.)` : '') : 'não achado'}.`,
        json: true,
        maxTokens: 200,
        signal,
      });
      if (r.diagnostico) lead.diagnostico = String(r.diagnostico).slice(0, 300);
      if (r.abordagem) lead.abordagem = String(r.abordagem).slice(0, 300);
    } catch { /* mantém diagnóstico heurístico */ }
  }

  return { leads, busca, count: leads.length };
}

/** Dados de exemplo (sem chave) — mesmo formato do modo `simular` de motor.py. */
export function mockProspect({ niche = 'nutricionista', city = 'Lisboa', count = 6 } = {}) {
  const busca = `${niche} em ${city}`;
  const base = [
    { nome: `Dra. Marina ${cap(niche)}`, rating: { value: 4.9, votes_count: 132 }, url: `https://www.marina-${slug(niche)}.pt`, phone: '+351912345671', address: 'Av. da República, 1200', instagram: 'marina.saude', seguidores: 5400, posts: 320, ativo: true, motivo: 'site com layout datado de 2016, sem versão mobile decente e sem CTA na primeira dobra' },
    { nome: `Clínica ${cap(city)} Bem-Estar`, rating: { value: 4.8, votes_count: 88 }, url: null, phone: '+351912345672', address: 'Rua do Comércio, 45', motivo: 'não tem site — presença só no Google e num diretório' },
    { nome: `Studio ${cap(niche)} Insta`, rating: { value: 5.0, votes_count: 61 }, url: 'https://instagram.com/studio.' + slug(niche), phone: '+351912345673', address: 'Praça Central, 8', instagram: 'studio.' + slug(niche), seguidores: 2100, posts: 140, ativo: true, motivo: 'usa o Instagram como site; sem página própria, sem agendamento online' },
    { nome: `${cap(niche)} Familiar ${cap(city)}`, rating: { value: 4.6, votes_count: 210 }, url: `https://${slug(niche)}familiar.pt`, phone: '+351912345674', address: 'Estrada Nacional, 300', motivo: 'site lento, template genérico, textos institucionais sem proposta de valor' },
    { nome: `Espaço Vida — ${cap(niche)}`, rating: { value: 4.7, votes_count: 74 }, url: null, phone: '+351912345675', instagram: 'espacovida', seguidores: 900, posts: 60, ativo: false, motivo: 'sem site e Instagram parado há meses' },
    { nome: `${cap(niche)} Express`, rating: { value: 4.4, votes_count: 38 }, url: `https://${slug(niche)}-express.pt`, phone: '+351912345676', address: 'Centro Comercial, loja 12', motivo: 'site em construção há mais de um ano' },
  ];
  const leads = base.slice(0, count).map((b) => normalizeLead({ ...b, nicho: niche, cidade: city }, busca));
  return { leads, busca, count: leads.length, mock: true };
}

function slug(s) { return String(s).toLowerCase().normalize('NFD').replace(new RegExp('[\\u0300-\\u036f]', 'g'), '').replace(/[^a-z0-9]+/g, '').slice(0, 14); }
function cap(s) { return String(s).charAt(0).toUpperCase() + String(s).slice(1); }

export { AisaError };
