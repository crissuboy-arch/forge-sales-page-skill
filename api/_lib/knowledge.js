// knowledge.js — curador do "cérebro" da PageForge AI.
// Seleciona, por formato/modo, as fatias relevantes de SKILL.md + references/ +
// scroll-experience/ (compiladas em knowledge.generated.js) e monta o system
// prompt do sistema especialista. NÃO é um chatbot genérico: é a skill Forge
// operando server-side.
import { KNOWLEDGE } from './knowledge.generated.js';

const R = KNOWLEDGE.references || {};
const S = KNOWLEDGE.scrollExperience || {};

// Núcleo sempre presente (independe de formato).
const CORE_REFS = [
  'offer-analysis',
  'sales-architecture',
  'copywriting',
  'visual-direction',
  'seo',
  'compliance-google',
  'compliance-meta',
  'checkout-integrations',
  'qa-checklist',
];

// Referência específica por formato de página.
const FORMAT_REFS = {
  sales: [],
  presell: ['presell'],
  advertorial: ['advertorial'],
  optin: [],
  saas: [],
  thankyou: [],
  affiliate: ['affiliate-pages', 'presell'],
};

// Camada scroll-experience por intensidade.
const SCROLL_DOCS_BASE = ['mode-decision', 'anti-ai', 'art-direction-plus'];
const SCROLL_DOCS_MOTION = ['feeling-curve', 'scroll-grammars', 'motion-system'];

function clamp(txt, max) {
  if (!txt) return '';
  return txt.length > max ? `${txt.slice(0, max)}\n[...trecho truncado...]` : txt;
}

/**
 * Monta o corpus de conhecimento para uma geração específica.
 * @param {{pageType:string, scrollMode:string, affiliate:boolean, sensitive:boolean}} opts
 */
export function buildKnowledgeCorpus(opts = {}) {
  const { pageType = 'sales', scrollMode = 'static', affiliate = false, sensitive = false } = opts;

  const refNames = new Set(CORE_REFS);
  for (const n of FORMAT_REFS[pageType] || []) refNames.add(n);
  if (affiliate) for (const n of FORMAT_REFS.affiliate) refNames.add(n);
  if (pageType === 'advertorial') refNames.add('advertorial');

  const cinematic = ['motion', 'cinematic', 'storytelling'].includes(String(scrollMode).toLowerCase());
  if (cinematic) refNames.add('cinematic-motion');

  const scrollNames = new Set(SCROLL_DOCS_BASE);
  if (cinematic) for (const n of SCROLL_DOCS_MOTION) scrollNames.add(n);

  const parts = [];
  parts.push(`# MÉTODO FORGE (resumo operacional)\n${clamp(KNOWLEDGE.skill, 4200)}`);

  for (const name of refNames) {
    if (R[name]) parts.push(`# references/${name}.md\n${clamp(R[name], 2600)}`);
  }
  for (const name of scrollNames) {
    if (S[name]) parts.push(`# scroll-experience/${name}.md\n${clamp(S[name], 1800)}`);
  }
  if (sensitive) {
    parts.push('# ATENÇÃO: nicho sensível — compliance é blocker, não sugestão. Aplicar TODOS os disclaimers e reescritas de compliance-google.md / compliance-meta.md.');
  }

  // Teto do corpus (~20k chars ≈ 6k tokens) — mantém a geração dentro do
  // limite de tempo da função serverless.
  let corpus = parts.join('\n\n---\n\n');
  if (corpus.length > 20000) corpus = `${corpus.slice(0, 20000)}\n[...corpus truncado no limite de contexto...]`;
  return corpus;
}

export const KNOWLEDGE_BUILT_AT = KNOWLEDGE.builtAt;
