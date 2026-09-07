// postprocess.js — extrai o HTML da resposta do modelo, endurece o resultado
// (head, tracking, compliance de schema) e roda um QA leve server-side.

const FORBIDDEN_TERMS = [
  'garantido', 'garantia de resultado', 'renda garantida', 'lucro certo',
  'fique rico', 'enriqueça', 'sem esforço', 'resultado imediato', 'milagroso',
  'cura garantida', 'elimina de vez', 'aprovado pela anvisa', '100% garantido',
  'guaranteed results', 'get rich', 'miracle cure', 'risk-free', 'no risk',
];

const PERSONAL_ATTR = [
  /você está (acima do peso|gordo|obeso|endividad|falido|deprimid|sozinh)/i,
  /you (are|'re) (overweight|broke|in debt|depressed|lonely)/i,
];

export function extractHtml(raw) {
  let s = String(raw || '').trim();
  // remove cercas markdown
  const fence = s.match(/```(?:html)?\s*([\s\S]*?)```/i);
  if (fence && /<!doctype html|<html/i.test(fence[1])) s = fence[1].trim();
  const start = s.search(/<!doctype html/i);
  if (start > 0) s = s.slice(start);
  const end = s.toLowerCase().lastIndexOf('</html>');
  if (end !== -1) s = s.slice(0, end + 7);
  return s.trim();
}

/** remove Review/AggregateRating de blocos JSON-LD */
function stripFakeSchema(html, warnings) {
  return html.replace(/<script[^>]*application\/ld\+json[^>]*>([\s\S]*?)<\/script>/gi, (m, body) => {
    if (!/review|aggregaterating|ratingvalue|reviewcount/i.test(body)) return m;
    try {
      const json = JSON.parse(body.trim());
      const scrub = (node) => {
        if (Array.isArray(node)) return node.map(scrub);
        if (node && typeof node === 'object') {
          for (const k of Object.keys(node)) {
            if (/^(review|aggregateRating|ratingValue|reviewCount)$/i.test(k)) { delete node[k]; continue; }
            node[k] = scrub(node[k]);
          }
        }
        return node;
      };
      const cleaned = scrub(json);
      warnings.push('JSON-LD continha Review/AggregateRating — removido automaticamente (compliance).');
      return m.replace(body, `\n${JSON.stringify(cleaned, null, 2)}\n`);
    } catch {
      warnings.push('JSON-LD com Review/rating e inválido para parse — removido o bloco inteiro.');
      return '';
    }
  });
}

function ensureHeadEssentials(html, brief, warnings) {
  let out = html;
  if (!/<meta[^>]+viewport/i.test(out)) {
    out = out.replace(/<head[^>]*>/i, (m) => `${m}\n<meta name="viewport" content="width=device-width, initial-scale=1">`);
    warnings.push('meta viewport ausente — inserido.');
  }
  if (!/<meta[^>]+charset/i.test(out)) {
    out = out.replace(/<head[^>]*>/i, (m) => `${m}\n<meta charset="utf-8">`);
    warnings.push('meta charset ausente — inserido.');
  }
  if (!/<link[^>]+rel=["']canonical/i.test(out)) {
    out = out.replace(/<\/head>/i, '<link rel="canonical" href="https://exemplo.com/">\n</head>');
    warnings.push('canonical ausente — inserido placeholder https://exemplo.com/.');
  }
  if (!/prefers-reduced-motion/i.test(out)) {
    out = out.replace(/<\/head>/i, '<style>@media (prefers-reduced-motion: reduce){*,*::before,*::after{animation-duration:.001ms!important;transition-duration:.001ms!important;scroll-behavior:auto!important}}</style>\n</head>');
    warnings.push('bloco prefers-reduced-motion ausente — inserido.');
  }
  const lang = (brief.language || 'pt-BR').trim();
  if (/<html(?![^>]*\blang=)/i.test(out)) {
    out = out.replace(/<html/i, `<html lang="${lang}"`);
    warnings.push(`atributo lang ausente — definido como "${lang}".`);
  }
  return out;
}

/** injeta propagação de query-string + trackCTA se o modelo não fez */
function ensureCtaPlumbing(html, checkoutUrl, warnings) {
  let out = html;
  const hasCarry = /data-cta/i.test(out) && /URLSearchParams|location\.search/i.test(out);
  if (!hasCarry) {
    const snippet = `<script>/* PageForge AI — propaga rastreio para os CTAs, sem quebrar o fragmento #aff= */
(function(){try{var carry=new URLSearchParams(location.search);function trackCTA(n){/* GA4: gtag&&gtag('event','select_cta',{cta:n}); Meta: fbq&&fbq('track','InitiateCheckout'); GTM: dataLayer&&dataLayer.push({event:'cta_click',cta:n}); */}
window.trackCTA=window.trackCTA||trackCTA;
document.querySelectorAll('a[data-cta]').forEach(function(a){a.addEventListener('click',function(){try{var h=a.getAttribute('href')||'';var hash='';var hi=h.indexOf('#');if(hi>-1){hash=h.slice(hi);h=h.slice(0,hi);}var u=new URL(h,location.href);carry.forEach(function(v,k){if(!u.searchParams.has(k))u.searchParams.set(k,v);});a.setAttribute('href',u.toString()+hash);}catch(e){}try{window.trackCTA(a.getAttribute('data-cta')||'primary');}catch(e){}});});}catch(e){}})();</script>`;
    out = out.replace(/<\/body>/i, `${snippet}\n</body>`);
    warnings.push('Propagação de rastreio nos CTAs ausente — script inserido.');
  }
  if (checkoutUrl && !out.includes(checkoutUrl) && !/\{\{CHECKOUT_URL\}\}/.test(out)) {
    warnings.push('A URL de checkout do briefing não aparece na página. Confira os CTAs antes de publicar.');
  }
  out = out.replace(/\{\{CHECKOUT_URL\}\}/g, checkoutUrl || '#oferta');
  return out;
}

export function analyzeHtml(html, brief) {
  const warnings = [];
  const errors = [];
  const text = html.replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>|<[^>]+>/g, ' ');

  const h1 = (html.match(/<h1\b/gi) || []).length;
  if (h1 === 0) errors.push('Nenhum <h1> na página.');
  if (h1 > 1) warnings.push(`${h1} elementos <h1> — deveria haver só 1.`);

  if (!/<!doctype html/i.test(html)) errors.push('Documento não começa com <!DOCTYPE html>.');
  if (!/<\/html>\s*$/i.test(html)) errors.push('Documento não termina em </html>.');

  const foundTerms = FORBIDDEN_TERMS.filter((t) => new RegExp(`\\b${t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`, 'i').test(text));
  if (foundTerms.length) warnings.push(`Termos de risco (Google/Meta) no texto: ${foundTerms.join(', ')}. Revise antes de rodar tráfego.`);

  if (brief.sensitive) {
    for (const rx of PERSONAL_ATTR) {
      if (rx.test(text)) { warnings.push('Copy em 2ª pessoa acusatória (atributo pessoal) — reescreva na 3ª pessoa para Meta Ads.'); break; }
    }
    if (!/(resultados? (podem )?variam|não substitui|consulte um|educativ|isenção|não é aconselhamento)/i.test(text)) {
      warnings.push('Nicho sensível sem disclaimer visível de "resultados variam / não substitui acompanhamento". Adicione.');
    }
  }
  if (/review|aggregaterating|ratingvalue/i.test(html)) warnings.push('Ainda há vestígio de schema de review/rating.');
  if (/<img\s[^>]*src=["']https?:\/\//i.test(html)) warnings.push('Há <img> com src externo — pode dar 404 no deploy. Prefira SVG/CSS.');
  if (!/data-cta/i.test(html) && brief.pageType !== 'thankyou') errors.push('Nenhum CTA com data-cta na página.');
  if (html.length < 1500) errors.push('HTML muito curto — a geração provavelmente falhou.');

  return { warnings, errors };
}

/**
 * @returns {{ ok:boolean, html:string, warnings:string[], errors:string[] }}
 */
export function postprocess(rawModelOutput, brief) {
  const warnings = [];
  let html = extractHtml(rawModelOutput);
  if (!html || !/<html[\s>]/i.test(html)) {
    return { ok: false, html: html || '', warnings, errors: ['O modelo não devolveu um documento HTML válido.'] };
  }
  html = stripFakeSchema(html, warnings);
  html = ensureHeadEssentials(html, brief, warnings);
  html = ensureCtaPlumbing(html, brief.checkoutUrl, warnings);

  const analysis = analyzeHtml(html, brief);
  return {
    ok: analysis.errors.length === 0,
    html,
    warnings: [...warnings, ...analysis.warnings],
    errors: analysis.errors,
  };
}
