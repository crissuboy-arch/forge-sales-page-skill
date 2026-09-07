// prospect.js — modelo de lead + scoring + diagnóstico + lead→briefing.
// Lógica portada de maquina-de-leads (motor.py: score_lead, buscar_negocios,
// avaliar_site). Sem dependência de SQLite: o armazenamento é um adapter
// (localStorage no cliente hoje; API/nuvem depois).

// Campos de um lead (compatível com o schema `leads` da Máquina de Leads).
export const LEAD_FIELDS = [
  'slug', 'nome', 'nicho', 'cidade', 'nota', 'avaliacoes', 'email', 'telefone', 'whatsapp',
  'instagram', 'igSeguidores', 'igPosts', 'igAtivo', 'igCategoria',
  'siteAntigo', 'motivo', 'diagnostico', 'score', 'temperatura', 'abordagem',
  'status', 'endereco', 'obs', 'busca', 'criado', 'atualizado',
];

export const LEAD_STATUS = ['novo', 'contatado', 'em-criacao', 'redesenhado', 'publicado', 'proposta', 'fechado', 'descartado'];

const DIACRITICS = new RegExp('[\\u0300-\\u036f]', 'g');
export function slugify(s) {
  return String(s || 'lead').toLowerCase().normalize('NFD').replace(DIACRITICS, '')
    .replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '').slice(0, 60) || 'lead';
}

/**
 * Score de oportunidade 0–100 + temperatura. Fórmula de motor.py:score_lead.
 * @returns {{score:number, temperatura:'quente'|'morno'|'frio', emoji:string}}
 */
export function scoreLead(lead = {}) {
  let base = 0;
  const nota = Number(lead.nota) || 0;
  const aval = Number(lead.avaliacoes) || 0;
  base += Math.max(-30, Math.min(30, Math.round((nota - 4.0) * 30)));
  base += Math.min(25, Math.floor(aval / 8));
  if (lead.siteAntigo) base += 20;                 // tem site (redesign) = oportunidade clara
  else base += 14;                                 // sem site = oportunidade também, mas contato mais frio
  if (lead.igAtivo === true || lead.igAtivo === 'true' || lead.igAtivo === 1) base += 12;
  const seg = Number(lead.igSeguidores) || 0;
  base += Math.min(13, Math.floor(seg / 400));
  base = Math.max(0, Math.min(100, base));
  const temperatura = base >= 70 ? 'quente' : (base >= 45 ? 'morno' : 'frio');
  const emoji = temperatura === 'quente' ? '🔥' : (temperatura === 'morno' ? '🌤️' : '❄️');
  return { score: base, temperatura, emoji };
}

/**
 * Diagnóstico heurístico do site atual quando não há análise da IA.
 * A análise real (site_ruim + motivo) vem de /api/prospect via AIsa.
 */
export function heuristicDiagnosis(lead = {}) {
  const url = String(lead.siteAntigo || '');
  if (!url) {
    return { site_ruim: true, motivo: lead.instagram ? 'só tem rede social, sem site próprio (maior oportunidade)' : 'não tem site (maior oportunidade)' };
  }
  if (/instagram\.com|facebook\.com|linktr\.ee|linktree/i.test(url)) {
    return { site_ruim: true, motivo: 'usa diretório/rede social como site, sem página própria' };
  }
  return { site_ruim: null, motivo: 'site próprio existente — avaliar layout, responsividade e CTA' };
}

/** Normaliza um lead cru (da busca ou importado) e calcula score/diagnóstico. */
export function normalizeLead(raw = {}, busca = '') {
  const lead = {};
  for (const k of LEAD_FIELDS) if (raw[k] != null) lead[k] = raw[k];
  lead.nome = String(raw.nome || raw.title || raw.name || '').trim().slice(0, 160);
  lead.nicho = String(raw.nicho || raw.category || '').trim().slice(0, 80);
  lead.cidade = String(raw.cidade || raw.city || '').trim().slice(0, 80);
  lead.nota = raw.nota != null ? Number(raw.nota) : (raw.rating && raw.rating.value != null ? Number(raw.rating.value) : null);
  lead.avaliacoes = raw.avaliacoes != null ? Number(raw.avaliacoes) : (raw.rating && raw.rating.votes_count != null ? Number(raw.rating.votes_count) : null);
  lead.email = cleanContact(raw.email, 'email');
  lead.telefone = cleanContact(raw.telefone || raw.phone, 'phone');
  lead.whatsapp = cleanContact(raw.whatsapp || raw.phone, 'phone');
  lead.instagram = cleanHandle(raw.instagram || raw.handle || raw.url || raw.website || '');
  lead.igSeguidores = num(raw.igSeguidores ?? raw.seguidores);
  lead.igPosts = num(raw.igPosts ?? raw.posts);
  lead.igAtivo = raw.igAtivo ?? raw.ativo ?? null;
  lead.igCategoria = raw.igCategoria || raw.categoria || null;
  const site = String(raw.siteAntigo || raw.url || raw.website || '').trim();
  lead.siteAntigo = /^https?:\/\//i.test(site) ? site.slice(0, 300) : null;
  lead.endereco = String(raw.endereco || raw.address || '').trim().slice(0, 200);
  lead.obs = String(raw.obs || '').slice(0, 500);
  lead.motivo = String(raw.motivo || '').slice(0, 300);
  lead.diagnostico = String(raw.diagnostico || raw.motivo || '').slice(0, 400);
  lead.busca = busca || raw.busca || `${lead.nicho} em ${lead.cidade}`.trim();
  lead.status = LEAD_STATUS.includes(raw.status) ? raw.status : 'novo';
  lead.slug = raw.slug || slugify(`${lead.nome}-${lead.cidade}`);

  if (!lead.diagnostico) {
    const h = heuristicDiagnosis(lead);
    lead.diagnostico = h.motivo;
  }
  const s = scoreLead(lead);
  lead.score = s.score;
  lead.temperatura = s.temperatura;
  lead.abordagem = String(raw.abordagem || '').slice(0, 300);
  lead.criado = raw.criado || new Date().toISOString();
  lead.atualizado = new Date().toISOString();
  return lead;
}

function num(v) { const n = Number(v); return Number.isFinite(n) ? n : null; }
function cleanContact(v, kind) {
  const s = String(v || '').trim();
  if (!s) return '';
  if (kind === 'email') return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s) ? s.toLowerCase().slice(0, 120) : '';
  return s.replace(/[^\d+]/g, '').slice(0, 20);
}
function cleanHandle(v) {
  let s = String(v || '').trim();
  const m = s.match(/instagram\.com\/([A-Za-z0-9_.]+)/i);
  if (m) s = m[1];
  else if (/:\/\//.test(s)) return ''; // é uma URL que não é instagram
  s = s.replace(/^@/, '').replace(/[^A-Za-z0-9_.]/g, '').toLowerCase();
  return ['p', 'reel', 'explore', 'accounts', 'stories', ''].includes(s) ? '' : s.slice(0, 40);
}

/**
 * Transforma um lead num briefing do PageForge (Criador de Páginas).
 * O usuário não precisa copiar/colar nada.
 * @returns {{brief:object, pageType:string, scrollMode:string, source:object}}
 */
export function leadToBriefing(lead = {}) {
  const nome = lead.nome || 'Cliente';
  const nicho = lead.nicho || '';
  const cidade = lead.cidade || '';
  const contatos = [];
  if (lead.whatsapp) contatos.push(`WhatsApp: ${lead.whatsapp}`);
  if (lead.telefone && lead.telefone !== lead.whatsapp) contatos.push(`Telefone: ${lead.telefone}`);
  if (lead.email) contatos.push(`E-mail: ${lead.email}`);
  if (lead.instagram) contatos.push(`Instagram: @${lead.instagram}${lead.igSeguidores ? ` (${lead.igSeguidores} seguidores)` : ''}`);

  const provas = [];
  if (lead.nota && lead.avaliacoes) provas.push(`Nota ${lead.nota} no Google com ${lead.avaliacoes} avaliações (dado público real)`);

  const notas = [
    `Redesign para um cliente real prospectado. NÃO inventar serviços, credenciais ou números — usar só o que está aqui e o que o cliente confirmar.`,
    lead.siteAntigo ? `Site atual do cliente: ${lead.siteAntigo}` : `O cliente ainda não tem site próprio${lead.instagram ? ` (só Instagram @${lead.instagram})` : ''}.`,
    lead.diagnostico ? `Diagnóstico do site atual: ${lead.diagnostico}` : '',
    lead.endereco ? `Endereço: ${lead.endereco}` : '',
    lead.abordagem ? `Ângulo de venda sugerido: ${lead.abordagem}` : '',
    `Todos os CTAs devem levar ao WhatsApp do cliente${lead.whatsapp ? ` (${lead.whatsapp})` : ' (confirmar número)'} com mensagem pré-preenchida.`,
  ].filter(Boolean).join('\n');

  const brief = {
    projectName: `Redesign — ${nome}`,
    productName: nome,
    description: [
      `${nome}${nicho ? `, ${nicho}` : ''}${cidade ? ` em ${cidade}` : ''}.`,
      lead.diagnostico ? `Precisa de um site novo: ${lead.diagnostico}.` : 'Precisa de um site profissional novo.',
    ].join(' '),
    niche: nicho,
    audience: cidade ? `Clientes de ${nicho || 'serviços locais'} na região de ${cidade}` : `Clientes locais de ${nicho || 'serviços'}`,
    language: 'pt-BR',
    offer: `Atendimento / serviços de ${nome}${nicho ? ` (${nicho})` : ''}. Detalhar com o cliente antes de publicar.`,
    price: '',
    benefits: [],
    pains: [],
    differentiators: lead.nota ? [`Boa reputação local (nota ${lead.nota} no Google)`] : [],
    mechanism: '',
    cta: 'Falar no WhatsApp',
    checkoutUrl: lead.whatsapp ? `https://wa.me/${String(lead.whatsapp).replace(/[^\d]/g, '')}` : '',
    checkoutPlatform: 'generic',
    affiliateUrl: '',
    trafficType: 'organic',
    references: contatos.join(' · '),
    notes: notas,
    proof: provas,
    palette: [],
    styleKeywords: ['profissional', 'confiável', nicho || 'local'].filter(Boolean),
    artDirection: 'Site de estúdio caro (não template grátis). Hero forte com CTA de WhatsApp, prova social com a nota do Google em destaque, seções ricas alternadas, tipografia com serif elegante nos títulos, botão flutuante de WhatsApp. Identidade própria derivada do nicho do cliente.',
  };

  return {
    brief,
    pageType: 'sales',
    scrollMode: 'light',
    source: { kind: 'lead', slug: lead.slug, nome, capturedAt: new Date().toISOString() },
  };
}
