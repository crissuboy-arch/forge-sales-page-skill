// sanitize.js — normaliza e valida o briefing vindo do cliente antes de
// qualquer chamada de IA. Limita tamanho de entrada, valida URLs, corta lixo.

export const PAGE_TYPES = ['sales', 'presell', 'advertorial', 'optin', 'saas', 'thankyou'];
export const SCROLL_MODES = ['static', 'light', 'motion', 'cinematic', 'storytelling'];
export const TRAFFIC_TYPES = ['organic', 'google-ads', 'meta-ads', 'affiliate'];

const LIMITS = {
  short: 200,
  medium: 600,
  long: 4000,
  listItem: 240,
  listMax: 20,
};

const CTRL = new RegExp('[\\u0000-\\u0008\\u000B\\u000C\\u000E-\\u001F\\u007F]', 'g');

function str(v, max = LIMITS.medium) {
  if (v == null) return '';
  return String(v)
    .replace(CTRL, '')
    .replace(/[ \t]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
    .slice(0, max);
}

function list(v, maxItems = LIMITS.listMax, maxLen = LIMITS.listItem) {
  let arr = v;
  if (typeof v === 'string') arr = v.split(/\r?\n|;|·|•/);
  if (!Array.isArray(arr)) return [];
  return arr.map((x) => str(x, maxLen)).filter(Boolean).slice(0, maxItems);
}

function cleanUrl(v) {
  const s = str(v, 600);
  if (!s) return '';
  try {
    const u = new URL(s);
    if (!['http:', 'https:'].includes(u.protocol)) return '';
    return u.toString();
  } catch {
    return '';
  }
}

function pick(v, allowed, fallback) {
  const s = String(v || '').toLowerCase().trim();
  return allowed.includes(s) ? s : fallback;
}

function toBool(v) { return v === true || v === 'true' || v === 1 || v === '1'; }

const SENSITIVE_HINTS = /(sa[úu]de|health|emagre|weight|diet|suplement|supplement|ansiedade|depress|doen[çc]a|cura|renda|invest|finan|money|forex|cripto|crypto|apostas|bet|gambling|relacion|reconquist|div[óo]rcio)/i;

/**
 * @returns {{ ok:boolean, errors:string[], value:object }}
 */
export function sanitizeBrief(raw = {}) {
  const errors = [];
  const b = raw && typeof raw === 'object' ? raw : {};

  const value = {
    projectName: str(b.projectName || b.project || b.name, LIMITS.short),
    productName: str(b.productName || b.product, LIMITS.short),
    description: str(b.description, LIMITS.long),
    niche: str(b.niche, LIMITS.short),
    audience: str(b.audience || b.who, LIMITS.medium),
    language: str(b.language || 'pt-BR', 20) || 'pt-BR',
    offer: str(b.offer, LIMITS.long),
    price: str(b.price, LIMITS.short),
    benefits: list(b.benefits),
    pains: list(b.pains),
    differentiators: list(b.differentiators || b.diferenciais),
    mechanism: str(b.mechanism || b.uniqueMechanism, LIMITS.medium),
    cta: str(b.cta || b.ctaText, LIMITS.short),
    checkoutUrl: cleanUrl(b.checkoutUrl || b.checkout),
    affiliateUrl: cleanUrl(b.affiliateUrl || b.affiliateLink || b.linkAfiliado),
    checkoutPlatform: pick(b.checkoutPlatform, ['kiwify', 'hotmart', 'digistore24', 'stripe', 'generic'], 'generic'),
    trafficType: pick(b.trafficType, TRAFFIC_TYPES, ''),
    references: str(b.references || b.referencias, LIMITS.long),
    notes: str(b.notes || b.observacoes, LIMITS.long),
    guarantee: str(b.guarantee, LIMITS.medium),
    proof: list(b.proof, 12, 400),
    palette: list(b.palette, 8, 40),
    styleKeywords: list(b.styleKeywords || b.style, 8, 40),
    artDirection: str(b.artDirection || b.direcaoArte, LIMITS.long),
  };

  const pageType = pick(b.pageType || b.type, PAGE_TYPES, 'sales');
  let scrollMode = pick(b.scrollMode || b.mode, SCROLL_MODES, 'static');

  // Regras rígidas da skill: advertorial/optin/thankyou não sobem de MOTION.
  if (['advertorial', 'optin', 'thankyou'].includes(pageType) && ['cinematic', 'storytelling'].includes(scrollMode)) {
    scrollMode = 'motion';
  }

  const affiliate = Boolean(value.affiliateUrl) || value.trafficType === 'affiliate';
  if (affiliate && !value.checkoutUrl) value.checkoutUrl = value.affiliateUrl;

  const sensitive = toBool(b.sensitive)
    || SENSITIVE_HINTS.test(`${value.niche} ${value.description} ${value.offer} ${value.audience}`);

  if (!value.productName && !value.description) {
    errors.push('Informe pelo menos o nome do produto ou uma descrição.');
  }
  if (value.description && value.description.length < 12 && !value.offer) {
    errors.push('A descrição está curta demais para a IA entender a oferta. Dê mais contexto.');
  }

  return {
    ok: errors.length === 0,
    errors,
    value: { ...value, pageType, scrollMode, affiliate, sensitive },
  };
}
