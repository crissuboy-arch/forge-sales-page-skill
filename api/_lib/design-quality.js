// design-quality.js — camada de DESIGN do Impeccable aplicada às PÁGINAS que a
// PageForge gera (não ao dashboard). Determinística, sem IA. Roda entre RENDER e
// ASSEMBLE, no passo "DESIGN QUALITY" do pipeline:
//
//   BRIEFING → PLAN → RENDER → **DESIGN QUALITY** → ASSEMBLE → PREVIEW → EDITOR → QA → EXPORT
//
// Codifica o essencial de craft-floor / layout / typeset / colorize / bolder /
// quieter / harden do Impeccable (github.com/pbakaus/impeccable, Apache-2.0):
//  1. escolhe o PERFIL de design do caso (quais capacidades importam aqui);
//  2. audita padrões de "site genérico feito por IA" e violações do craft-floor;
//  3. aplica as correções seguras (as que são banimento absoluto, sem julgamento).
//
// Não executa as 23 capacidades cegamente — seleciona só as necessárias e
// reporta as demais como recomendação.

const BANDS = [
  [9, 'Exemplar'], [7, 'Sólido'], [5, 'Genérico em partes'], [0, 'Genérico'],
];
function band(score) { for (const [min, name] of BANDS) if (score >= min) return name; return 'Genérico'; }
function count(re, s) { return (s.match(re) || []).length; }

// varre as tags de container e detecta um "card" aberto dentro de outro "card"
// ainda aberto (nested real, não irmãos numa grade).
function nestedCard(html) {
  const CARD = /\b(?:pf-card|card)\b/;
  const tagRe = /<(\/?)(?:div|article|section|li|aside)\b([^>]*)>/gi;
  const stack = [];
  let m;
  while ((m = tagRe.exec(html))) {
    if (m[1]) { // fechamento
      if (stack.length) stack.pop();
    } else {
      const isCard = /class\s*=\s*["']?[^"'>]*/.test(m[2]) && CARD.test((m[2].match(/class\s*=\s*["']?([^"'>]*)/i) || [, ''])[1]);
      if (isCard && stack.some(Boolean)) return true;
      stack.push(isCard);
      if (stack.length > 400) return false;
    }
  }
  return false;
}

// hues do "AI cluster" (violeta→índigo→azul com brilho) que o craft-floor bane
const AI_HUES = /#(?:6d28d9|7c3aed|8b5cf6|a855f7|9333ea|c084fc|6366f1|818cf8|4f46e5|4338ca|7e22ce|a78bfa|5b21b6|3b82f6|60a5fa|2563eb)/i;

/** Modo do visitante (Impeccable) para o formato da página. */
export function visitorMode(brief = {}) {
  switch (brief.pageType) {
    case 'advertorial': return 'read'; // matéria editorial que persuade
    case 'saas': return 'operate';     // ativação/trial
    case 'thankyou': return 'operate';
    default: return 'persuade';        // sales, presell, optin
  }
}

/**
 * PERFIL DE DESIGN — quais capacidades do Impeccable importam para ESTA página.
 * Retorna [{ cap, reason }]. Não roda nada; orienta o revisor humano e o
 * relatório de QA.
 */
export function designProfile(html, brief = {}) {
  const out = String(html || '');
  const css = (out.match(/<style[\s\S]*?<\/style>/gi) || []).join('\n');
  const body = (out.match(/<body[\s\S]*?<\/body>/i) || [''])[0];
  const text = body.replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>|<[^>]+>/g, ' ');
  const mode = visitorMode(brief);
  const scroll = String(brief.scrollMode || 'static').toLowerCase();

  const profile = [
    { cap: 'layout', reason: 'hierarquia, agrupamento e ritmo de espaço da página' },
    { cap: 'typeset', reason: 'escala/peso dos papéis de texto e medida de leitura' },
    { cap: 'audit', reason: 'acessibilidade, performance, responsivo, theming' },
    { cap: 'harden', reason: 'estados reais, texto longo, erro, vazio, i18n' },
    { cap: 'polish', reason: 'passe final de acabamento antes de exportar' },
  ];
  const push = (cap, reason) => { if (!profile.some((p) => p.cap === cap)) profile.push({ cap, reason }); };

  // cor: página quase monocromática ganha colorize
  const hexes = new Set((css.match(/#[0-9a-f]{3,6}/gi) || []).map((h) => h.toLowerCase()));
  if (hexes.size <= 4) push('colorize', 'paleta muito enxuta — cor pode encodar ação/estado/hierarquia');

  // responsivo: sem media query → adapt
  if (!/@media[^{]*(max|min)-width/i.test(css)) push('adapt', 'sem breakpoints — comportamento mobile não é estrutural');

  // movimento: só quando o modo de scroll pede E há função
  if (['motion', 'cinematic', 'storytelling'].includes(scroll)) {
    push('animate', 'scroll ' + scroll + ' — precisa de UM momento autoral, não entradas repetidas');
  } else if (/@keyframes|animation:\s*[^;]*infinite/i.test(css)) {
    push('quieter', 'há animação decorativa num modo de scroll estático');
  }

  // genérico / sem personalidade
  const cards = count(/class="[^"]*\bpf-card\b/gi, out);
  const sections = count(/<section\b/gi, out);
  if (cards >= 8 || (sections && cards / Math.max(1, sections) >= 1.6)) {
    push('critique', 'estrutura apoiada em grade de cards — revisar se as seções são mesmo equivalentes');
    push('distill', 'possível redundância entre seções de card');
  }
  if (mode !== 'operate' && !/font-weight:\s*(7|8|9)\d\d/i.test(css) && !/<h1[^>]*style=["'][^"']*font-size/i.test(out)) {
    push('bolder', 'primeira dobra pode estar lisa — trazer a tipografia de título à força total');
  }

  // copy vaga
  if (/\b(solu[çc][õo]es sob medida|excel[êe]ncia no atendimento|qualidade e compromisso|foco no cliente|melhor custo-benef[íi]cio|resultados que voc[êe] merece)\b/i.test(text)) {
    push('clarify', 'copy com clichê vago — trocar por especificidade');
  }

  return { mode, scroll, profile };
}

/**
 * DESIGN QUALITY — auditoria determinística de design + correções seguras.
 * @param {string} html
 * @param {object} [brief]
 * @returns {{ mode, scroll, profile, score:number, band:string, findings:Array, fixes:string[], html:string }}
 */
export function designQuality(html, brief = {}) {
  let out = String(html || '');
  const findings = [];
  const fixes = [];
  const add = (sev, cat, msg) => findings.push({ severity: sev, category: cat, msg });

  const styleBlocks = out.match(/<style[\s\S]*?<\/style>/gi) || [];
  const css = styleBlocks.join('\n');
  const bodyHtml = (out.match(/<body[\s\S]*?<\/body>/i) || [''])[0];
  const text = bodyHtml.replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>|<[^>]+>/g, ' ').replace(/\s+/g, ' ');

  /* ---- 1. AI-purple: gradiente do cluster violeta→azul (BANIDO) → achatar ---- */
  const gradRe = /(background(?:-image)?|border-image)\s*:\s*[^;{}]*?(?:linear|radial|conic)-gradient\([^;{}]*\)/gi;
  let flat = 0;
  out = out.replace(gradRe, (m) => {
    const hues = m.match(/#[0-9a-f]{3,6}/gi) || [];
    const aiHits = hues.filter((h) => AI_HUES.test(h)).length;
    if (aiHits >= 1 && (aiHits >= 2 || /gradient\([^)]*\bto\b|deg/i.test(m))) {
      flat += 1;
      const prop = m.split(':')[0].trim();
      // usa o accent do tema se existir, senão a cor de marca da PageForge
      return `${prop}: var(--accent, #10b981)`;
    }
    return m;
  });
  if (flat) {
    fixes.push(`${flat} gradiente "AI-purple" (violeta→azul) → achatado para cor sólida (ban do craft-floor).`);
    add('P1', 'Anti-genérico', `${flat} gradiente do cluster violeta/índigo/azul com brilho — achatado.`);
  }
  // gradiente de texto já é tratado no impeccable-qa; aqui só reforço se escapar
  if (/-webkit-text-fill-color\s*:\s*transparent|background-clip\s*:\s*text/i.test(css)) {
    add('P1', 'Anti-genérico', 'Gradient text — ênfase vem de peso/tamanho, não de gradiente na fonte.');
  }

  /* ---- 2. Card como estrutura da página / card dentro de card ---- */
  const cardCls = /class\s*=\s*["']?[^"'>]*\b(?:pf-card|card)\b/gi;
  const cards = count(cardCls, out);
  const sections = count(/<section\b/gi, out) || 1;
  if (cards >= 9) add('P2', 'Anti-genérico', `${cards} cards na página — card é o container preguiçoso; use proximidade e ritmo antes de encaixotar.`);
  if (nestedCard(bodyHtml)) add('P1', 'Anti-genérico', 'Card dentro de card — nested card é sempre erro; achatar um nível.');
  const grids = count(/class="[^"]*\bpf-grid\b/gi, out);
  if (grids >= 4) add('P2', 'Anti-genérico', `${grids} grades de cards — a página virou um mosaico. Varie densidade e escala entre seções.`);

  /* ---- 3. Números de seção decorativos (01 / 02 / 03) ---- */
  if (/>\s*0[1-9]\s*<\/(span|div|p|b|strong)>/i.test(bodyHtml) && count(/>\s*0[1-9]\s*</g, bodyHtml) >= 3) {
    add('P2', 'Anti-genérico', 'Numeração de seção 01/02/03 decorativa — só quando a sequência carrega informação.');
  }

  /* ---- 4. Eyebrow/kicker acima de heading (BAN — reforça o qa) ---- */
  if (/<(p|span|div)\b[^>]*\b(eyebrow|kicker|overline|pf-eyebrow)\b[^>]*>[\s\S]{0,120}?<\/\1>\s*<h[1-3][\s>]/i.test(bodyHtml)) {
    add('P2', 'Anti-genérico', 'Eyebrow/kicker acima de heading — banido; o heading carrega o próprio peso.');
  }

  /* ---- 5. Glow / halo 0 0 / sombra sem offset ---- */
  const glow = (css.match(/box-shadow\s*:\s*[^;]*\b0\s+0\s+\d{2,}px/gi) || []).length
    + (css.match(/text-shadow\s*:\s*[^;]*rgba?\([^)]*[,\s]0?\.[4-9]\d*\s*\)/gi) || []).length;
  if (glow) add('P2', 'Anti-genérico', `${glow} sombra/halo difuso (0 0 Npx ou glow) — sombra é offset + blur, não decoração.`);
  const hardShadow = (css.match(/box-shadow\s*:\s*[^;]*\b\d+px\s+\d+px\s+0(px)?\b/gi) || []).length;
  if (hardShadow) add('P2', 'Anti-genérico', `${hardShadow} hard shadow (Npx Npx 0) — só num mundo neobrutalista de verdade.`);

  /* ---- 6. Border-left colorido > 1px em card/callout ---- */
  const borderLeft = (css.match(/border-(left|right)\s*:\s*(?:[2-9]|\d\d+)px\s+solid/gi) || []).length;
  if (borderLeft >= 2) add('P2', 'Anti-genérico', `${borderLeft} borda lateral colorida > 1px — não é sistema de ênfase.`);

  /* ---- 7. Raio exagerado / pílula em bloco grande ---- */
  const bigRadii = (css.match(/border-radius\s*:\s*(\d{2,})(px)?/gi) || [])
    .map((s) => parseInt(s.replace(/\D/g, ''), 10)).filter((n) => n >= 24 && n < 900);
  if (bigRadii.length >= 4) add('P2', 'Anti-genérico', `${bigRadii.length} raios ≥ 24px — cantos de card ficam em 12–16px; pílula é para controle pequeno.`);
  if (/\.(hero|section|card|panel|pf-card|pf-offer)[^{}]*\{[^}]*border-radius\s*:\s*(999|9999)px/i.test(css)) {
    add('P2', 'Anti-genérico', 'Bloco grande com raio de pílula (999px) — pílula é só para botão/chip.');
  }

  /* ---- 8. Ícone falso: emoji no lugar de ícone ---- */
  const EMOJI = /[\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}\u{2190}-\u{21FF}]/u;
  const EMOJI_G = /[\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}\u{2190}-\u{21FF}]/gu;
  const iconEls = bodyHtml.match(/<(?:span|i|div)\b[^>]*class="[^"]*\b(?:icon|ico|feature-icon|pf-icon)\b[^"]*"[^>]*>([\s\S]{0,12})<\//gi) || [];
  const emojiIcon = iconEls.filter((s) => EMOJI.test(s)).length
    + (bodyHtml.match(/<a\b[^>]*class="[^"]*\bcta\b[^"]*"[^>]*>[^<]*/gi) || []).filter((s) => EMOJI.test(s)).length;
  if (emojiIcon) add('P2', 'Anti-genérico', `${emojiIcon} emoji no lugar de ícone — ícones são desenhados (SVG), traço e peso consistentes.`);
  if (count(EMOJI_G, text) >= 4) add('P3', 'Anti-genérico', 'Vários emoji no texto — reduz a autoridade da página.');

  /* ---- 9. Monospace como "traje técnico" ---- */
  if (/(h1|h2|h3|body|p)\b[^{}]*\{[^}]*font-family\s*:\s*[^;}]*\bmono(space)?\b/i.test(css)) {
    add('P2', 'Anti-genérico', 'Monospace em título/corpo — monospace é para código, dado ou medição.');
  }

  /* ---- 10. Fonte de sistema como voz de display ---- */
  if (/(h1|h2|\.hero h1|\.display)\b[^{}]*\{[^}]*font-family\s*:\s*["']?(Impact|Arial Black|Haettenschweiler)/i.test(css)) {
    add('P2', 'Anti-genérico', 'Impact/Arial Black como voz de título — fonte de sistema não é identidade.');
  }

  /* ---- 11. Ritmo de espaço repetido / seções sem variação ---- */
  const secClasses = (bodyHtml.match(/<section\b[^>]*class="([^"]*)"/gi) || []).map((s) => (s.match(/class="([^"]*)"/) || [])[1] || '');
  if (secClasses.length >= 5) {
    const uniq = new Set(secClasses.map((c) => c.replace(/\breveal\b|\bin\b/g, '').trim()));
    const alt = count(/\bpf-alt\b/gi, bodyHtml);
    if (uniq.size <= 2 && alt === 0) {
      add('P2', 'Anti-genérico', `${secClasses.length} seções com a mesma assinatura e sem alternância de fundo — falta ritmo (um trecho denso ganha um trecho quieto).`);
    }
  }
  const padPatterns = css.match(/padding\s*:\s*[^;]+/gi) || [];
  if (padPatterns.length >= 6) {
    const most = {};
    padPatterns.forEach((p) => { const k = p.replace(/\s+/g, ' ').trim(); most[k] = (most[k] || 0) + 1; });
    const top = Math.max(...Object.values(most));
    if (top >= padPatterns.length * 0.7 && padPatterns.length >= 8) {
      add('P3', 'Anti-genérico', 'Um único valor de padding repetido em quase tudo — sem contraste entre apertado e generoso.');
    }
  }

  /* ---- 12. Hierarquia de tipo fraca (h1 vs corpo) ---- */
  const h1Inline = out.match(/<h1[^>]*style=["'][^"']*font-size\s*:\s*([\d.]+)(rem|px|em)/i);
  if (h1Inline) {
    const n = parseFloat(h1Inline[1]); const unit = h1Inline[2];
    if ((unit === 'rem' && n < 1.9) || (unit === 'px' && n < 30)) {
      add('P1', 'Anti-genérico', `<h1> com font-size inline ${h1Inline[1]}${unit} — título sem presença; a primeira dobra é uma tese, não um cabeçalho.`);
    }
  }
  const h1n = count(/<h1[\s>]/gi, out);
  if (h1n === 0) add('P1', 'Anti-genérico', 'Sem <h1> — a página não declara sua promessa.');

  /* ---- 13. "Prove, não afirme": bloco de números/stats sem fonte ---- */
  if (/class="[^"]*\b(stats?|metrics?|numbers?|counter)\b/i.test(bodyHtml) && !/fonte|source|dados de|segundo\s/i.test(text)) {
    add('P3', 'Anti-genérico', 'Bloco de métricas sem indicação de fonte — números ilustrativos precisam ser rotulados como tal.');
  }

  /* ---- score ---- */
  const WEIGHT = { P0: 3, P1: 2, P2: 1, P3: 0.5 };
  let score = 10;
  for (const f of findings) score -= (WEIGHT[f.severity] || 0.5);
  score = Math.max(0, Math.round(score * 10) / 10);

  if (!findings.length) add('P3', 'Geral', 'Nenhum padrão genérico detectável — revisar a direção de arte manualmente (squint test, ritmo, prova).');
  findings.sort((a, b) => a.severity.localeCompare(b.severity));

  const { mode, scroll, profile } = designProfile(out, brief);

  return { mode, scroll, profile, score, band: band(score), findings, fixes, html: out };
}
