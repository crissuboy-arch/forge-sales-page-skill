// cris-os-mapper.js — traduz o payload de um ProductionWorkOrder (Cris OS,
// asset_type LANDING_PAGE) para o formato de briefing que
// api/_lib/sanitize.js + api/_lib/prompt.js já usam. NÃO inventa conteúdo:
// só usa exatamente o que veio no WorkOrder. O que faltar vira `missing`.

const KNOWN_KEYS = [
  'audience', 'offer', 'benefits', 'pains', 'differentiators', 'mechanism',
  'guarantee', 'proof', 'cta', 'checkoutUrl', 'price', 'language', 'niche',
  'palette', 'styleKeywords', 'artDirection', 'pageType', 'scrollMode', 'trafficType',
];
const LIST_KEYS = ['benefits', 'pains', 'differentiators', 'proof', 'palette', 'styleKeywords'];

/**
 * @param {object} payload  corpo do POST /api/integrations/cris-os/work-orders
 * @returns {{ brief: object, missing: string[] }}
 */
export function mapWorkOrderToBrief(payload) {
  const p = payload && typeof payload === 'object' ? payload : {};
  const title = typeof p.title === 'string' ? p.title.trim() : '';
  const objective = typeof p.objective === 'string' ? p.objective.trim() : '';
  const requirements = Array.isArray(p.requirements) ? p.requirements : [];
  const inputRefs = Array.isArray(p.input_refs) ? p.input_refs : [];
  const metadata = p.metadata && typeof p.metadata === 'object' ? p.metadata : {};

  const brief = {
    projectName: title,
    productName: title,
    description: objective,
  };

  // requirements: strings viram contexto (notes); objetos com uma chave
  // reconhecida do briefing entram diretamente no campo correspondente.
  const notes = [];
  for (const r of requirements) {
    if (r == null) continue;
    if (typeof r === 'string') { if (r.trim()) notes.push(r.trim()); continue; }
    if (typeof r === 'object') {
      const key = r.key || r.field || r.type;
      const val = r.value != null ? r.value : (r.text != null ? r.text : r.description);
      if (key && KNOWN_KEYS.includes(key) && val != null) {
        brief[key] = LIST_KEYS.includes(key) ? (Array.isArray(val) ? val : [val]) : (Array.isArray(val) ? val.join('; ') : val);
      } else if (val != null && String(val).trim()) {
        notes.push(String(val).trim());
      }
    }
  }

  for (const key of KNOWN_KEYS) {
    if (brief[key] == null && metadata[key] != null) brief[key] = metadata[key];
  }

  if (inputRefs.length) {
    notes.push(`Referências enviadas pelo Cris OS: ${inputRefs.map((x) => String(x)).join(', ')}`);
  }
  if (notes.length) brief.notes = notes.join('\n');

  const missing = [];
  if (!title && !objective && !brief.offer && !brief.description) {
    missing.push('title, objective ou requirements com offer/descrição — nenhum veio no WorkOrder.');
  }

  return { brief, missing };
}
