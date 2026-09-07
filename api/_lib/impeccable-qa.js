// impeccable-qa.js — camada de acabamento/QA do PageForge.
// Codifica o audit determinístico do Impeccable (github.com/pbakaus/impeccable,
// Apache-2.0) — 5 dimensões, score /20, severidade P0–P3 — e aplica UMA rodada
// de correções seguras. NÃO chama IA. "1 avaliação, 1 correção, parar."
//
// Fluxo: PageForge gera → postprocess → impeccableQa → resultado final.

const BANDS = [
  [18, 'Excelente'], [14, 'Bom'], [10, 'Aceitável'], [6, 'Fraco'], [0, 'Crítico'],
];
function band(total) { for (const [min, name] of BANDS) if (total >= min) return name; return 'Crítico'; }

function count(re, s) { return (s.match(re) || []).length; }

/**
 * @param {string} html  documento completo (pós-postprocess)
 * @param {object} [brief]
 * @returns {{ score:number, band:string, dims:object, findings:Array, html:string, fixes:string[] }}
 */
export function impeccableQa(html, brief = {}) {
  let out = String(html || '');
  const findings = [];
  const fixes = [];
  const add = (sev, cat, msg) => findings.push({ severity: sev, category: cat, msg });

  const headTag = (out.match(/<head[\s\S]*?<\/head>/i) || [''])[0];
  const styleBlocks = out.match(/<style[\s\S]*?<\/style>/gi) || [];
  const css = styleBlocks.join('\n');
  const bodyHtml = (out.match(/<body[\s\S]*?<\/body>/i) || [''])[0];
  const text = bodyHtml.replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>|<[^>]+>/g, ' ');

  /* ---------- 1. Acessibilidade ---------- */
  let a11y = 4;
  const h1n = count(/<h1[\s>]/gi, out);
  if (h1n === 0) { a11y -= 2; add('P0', 'Acessibilidade', 'Sem <h1>.'); }
  else if (h1n > 1) { a11y -= 1; add('P1', 'Acessibilidade', h1n + ' elementos <h1> (deveria haver 1).'); }
  if (!/<main[\s>]/i.test(out)) { a11y -= 1; add('P2', 'Acessibilidade', 'Sem landmark <main>.'); }
  // imagens sem alt → autofix
  const imgNoAlt = out.match(/<img(?![^>]*\balt=)[^>]*>/gi) || [];
  if (imgNoAlt.length) {
    out = out.replace(/<img(?![^>]*\balt=)([^>]*)>/gi, '<img alt=""$1>');
    fixes.push(`${imgNoAlt.length} <img> sem alt → alt="" adicionado (marcar como decorativa ou descrever).`);
    add('P1', 'Acessibilidade', `${imgNoAlt.length} imagem(ns) sem alt (corrigido para alt="").`);
    a11y -= 1;
  }
  if (!/prefers-reduced-motion/i.test(css)) {
    out = out.replace(/<\/head>/i, '<style>@media (prefers-reduced-motion: reduce){*,*::before,*::after{animation-duration:.001ms!important;transition-duration:.001ms!important}}</style>\n</head>');
    fixes.push('Bloco prefers-reduced-motion ausente → inserido.');
    add('P1', 'Acessibilidade', 'prefers-reduced-motion ausente (inserido).');
    a11y -= 1;
  }
  if (!/<html[^>]*\blang=/i.test(out)) {
    out = out.replace(/<html/i, `<html lang="${(brief.language || 'pt-BR')}"`);
    fixes.push('Atributo lang ausente → definido.');
    a11y -= 1;
  }
  // links/botões sem texto
  const emptyLinks = (bodyHtml.match(/<a\b[^>]*>\s*<\/a>/gi) || []).length;
  if (emptyLinks) { a11y -= 1; add('P1', 'Acessibilidade', `${emptyLinks} link(s) sem texto acessível.`); }
  a11y = Math.max(0, a11y);

  /* ---------- 2. Performance ---------- */
  let perf = 4;
  const extImg = out.match(/<img\s[^>]*src=["']https?:\/\/(?!fonts\.)[^"']+["']/gi) || [];
  if (extImg.length) { perf -= 2; add('P1', 'Performance', `${extImg.length} <img> com src externo (risco de 404 / carga). Prefira SVG/CSS ou embutir.`); }
  const scripts = count(/<script\s[^>]*src=/gi, out);
  if (scripts > 1) { perf -= 1; add('P2', 'Performance', `${scripts} <script src> externos.`); }
  // lazy nas imagens além da primeira → autofix
  const imgs = out.match(/<img\b[^>]*>/gi) || [];
  if (imgs.length > 1) {
    let i = 0;
    out = out.replace(/<img\b([^>]*)>/gi, (m, attrs) => {
      i += 1;
      if (i === 1 || /loading=/i.test(attrs)) return m;
      return `<img${attrs} loading="lazy" decoding="async">`;
    });
    if (i > 1) fixes.push('loading="lazy" decoding="async" nas imagens além da primeira.');
  }
  if (/filter:\s*blur\([^)]*\)[^;]*;[\s\S]{0,40}(background|position)/i.test(css)) { perf -= 1; add('P2', 'Performance', 'Blur possivelmente aplicado a área grande / animada.'); }
  perf = Math.max(0, perf);

  /* ---------- 3. Responsivo ---------- */
  let resp = 4;
  if (!/<meta[^>]+name=["']viewport["']/i.test(headTag)) {
    out = out.replace(/<head[^>]*>/i, (m) => `${m}\n<meta name="viewport" content="width=device-width, initial-scale=1">`);
    fixes.push('meta viewport ausente → inserido.');
    add('P0', 'Responsivo', 'meta viewport ausente (inserido).');
    resp -= 2;
  }
  const fixedWide = (css.match(/\bwidth:\s*(\d{3,})px/gi) || []).filter((s) => parseInt(s.replace(/\D/g, ''), 10) >= 600);
  if (fixedWide.length) { resp -= 1; add('P1', 'Responsivo', `${fixedWide.length} largura(s) fixa(s) ≥ 600px em CSS — pode gerar scroll horizontal no mobile.`); }
  if (!/max-width:\s*100%/i.test(css) && imgs.length) {
    out = out.replace(/<\/head>/i, '<style>img,svg{max-width:100%;height:auto}</style>\n</head>');
    fixes.push('img/svg sem max-width:100% → regra inserida.');
    resp -= 1;
  }
  if (!/@media[^{]*max-width/i.test(css) && !/@media[^{]*min-width/i.test(css)) { resp -= 1; add('P2', 'Responsivo', 'Nenhum @media query — layout pode não ter variação mobile.'); }
  // touch targets: .cta / button com min-height explícito?
  if (/\.cta\b/i.test(css) && !/\.cta[^}]*min-height:\s*4[4-9]|\.cta[^}]*min-height:\s*[5-9]\d|\.cta[^}]*padding:\s*[1-9]/i.test(css)) {
    add('P2', 'Responsivo', 'CTA sem min-height/padding claro ≥ 44px (verificar alvo de toque).');
  }
  resp = Math.max(0, resp);

  /* ---------- 4. Theming ---------- */
  let theme = 4;
  // cores hex hard-coded no HTML do corpo (fora de <style>)
  const inlineHex = (bodyHtml.match(/style=["'][^"']*#[0-9a-f]{3,6}/gi) || []).length;
  if (inlineHex > 2) { theme -= 1; add('P2', 'Theming', `${inlineHex} cores hex em style inline — prefira tokens/classes.`); }
  if (!/:root\s*{/i.test(css)) { theme -= 1; add('P2', 'Theming', 'Sem :root com custom properties — troca de tema fica difícil.'); }
  theme = Math.max(0, theme);

  /* ---------- 5. Integridade de implementação (craft-floor) ---------- */
  let integ = 4;
  // ban: kicker/eyebrow imediatamente antes de um heading → autofix (remover)
  const eyebrowRe = /<(p|span|div)\b[^>]*\b(?:eyebrow|kicker|pf-eyebrow|overline)\b[^>]*>[\s\S]*?<\/\1>\s*(?=<(?:h[1-3])[\s>])/gi;
  const eyebrows = out.match(eyebrowRe) || [];
  if (eyebrows.length) {
    out = out.replace(eyebrowRe, '');
    fixes.push(`${eyebrows.length} kicker/eyebrow acima de heading → removido (ban do craft-floor).`);
    add('P2', 'Integridade', `${eyebrows.length} kicker/eyebrow acima de heading (removido).`);
    integ -= 1;
  }
  if (/background-clip:\s*text|-webkit-text-fill-color:\s*transparent/i.test(css)) { integ -= 1; add('P1', 'Integridade', 'Gradient text (background-clip:text) — banido.'); }
  if (/box-shadow:\s*\d+px\s+\d+px\s+0(px)?\b/i.test(css)) { integ -= 1; add('P2', 'Integridade', 'Hard offset shadow (Npx Npx 0) — só em mundo neobrutalista.'); }
  if (/text-shadow:[^;]*rgba?\([^)]*0?\.[5-9]/i.test(css) || /box-shadow:[^;]*(0 0 \d{2,}px)/i.test(css)) { integ -= 1; add('P2', 'Integridade', 'Glow (text-shadow/box-shadow difuso) — evitar.'); }
  const FILLER = /\b(seamless|unleash|revolutionize|supercharge|elevate your|transformador|excelência no atendimento|qualidade e compromisso)\b/i;
  if (FILLER.test(text)) { integ -= 1; add('P3', 'Integridade', 'Clichê vazio no texto (ex.: "excelência no atendimento").'); }
  integ = Math.max(0, integ);

  const dims = { acessibilidade: a11y, performance: perf, responsivo: resp, theming: theme, integridade: integ };
  const score = a11y + perf + resp + theme + integ;

  if (!findings.length) add('P3', 'Geral', 'Nenhum problema detectável automaticamente — revisar o visual manualmente.');
  findings.sort((a, b) => a.severity.localeCompare(b.severity));

  return { score, band: band(score), dims, findings, html: out, fixes };
}
