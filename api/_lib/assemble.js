// assemble.js — monta o documento HTML final a partir do PLANO + seções
// renderizadas. Sem IA. O <head>, o <style> wrapper, o JSON-LD e o JS base
// (reveal + propagação de rastreio + trackCTA) são controlados aqui — isso
// remove modos de falha e garante SEO/tracking/compliance consistentes.

import { buildStylesheet, normalizeTokens } from './theme.js';

const CTRL = new RegExp('[\\u0000-\\u0008\\u000B\\u000C\\u000E-\\u001F]', 'g');

function esc(s) {
  return String(s == null ? '' : s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
}

/** Extrai o primeiro objeto JSON de um texto (tolera ```json, texto ao redor). */
export function parseJsonLoose(raw) {
  let s = String(raw || '').trim();
  const fence = s.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fence) s = fence[1].trim();
  const start = s.indexOf('{');
  if (start === -1) return null;
  let depth = 0, inStr = false, escNext = false, end = -1;
  for (let i = start; i < s.length; i++) {
    const ch = s[i];
    if (inStr) {
      if (escNext) escNext = false;
      else if (ch === '\\') escNext = true;
      else if (ch === '"') inStr = false;
    } else if (ch === '"') inStr = true;
    else if (ch === '{') depth++;
    else if (ch === '}') { depth--; if (depth === 0) { end = i; break; } }
  }
  const chunk = end === -1 ? s.slice(start) : s.slice(start, end + 1);
  try { return JSON.parse(chunk); } catch { /* tenta consertos */ }
  try { return JSON.parse(chunk.replace(/,\s*([}\]])/g, '$1').replace(CTRL, ' ')); } catch { return null; }
}

const BASE_JS = `<script>
(function(){try{
  var carry=new URLSearchParams(location.search);
  function trackCTA(name){/* GA4: gtag&&gtag('event','select_cta',{cta:name}); Meta: fbq&&fbq('track','InitiateCheckout'); GTM: dataLayer&&dataLayer.push({event:'cta_click',cta:name}); */}
  window.trackCTA=trackCTA;
  document.querySelectorAll('a[data-cta]').forEach(function(a){
    a.addEventListener('click',function(){
      try{var h=a.getAttribute('href')||'',hash='',hi=h.indexOf('#');
        if(hi>-1){hash=h.slice(hi);h=h.slice(0,hi);}
        var u=new URL(h,location.href);
        carry.forEach(function(v,k){if(!u.searchParams.has(k))u.searchParams.set(k,v);});
        a.setAttribute('href',u.toString()+hash);}catch(e){}
      trackCTA(a.getAttribute('data-cta')||'primary');
    });
  });
  var y=document.getElementById('pf-year'); if(y) y.textContent=new Date().getFullYear();
  var reduce=window.matchMedia&&matchMedia('(prefers-reduced-motion: reduce)').matches;
  var els=document.querySelectorAll('.reveal');
  if(reduce||!('IntersectionObserver' in window)){els.forEach(function(el){el.classList.add('in');});}
  else{var io=new IntersectionObserver(function(es){es.forEach(function(e){if(e.isIntersecting){e.target.classList.add('in');io.unobserve(e.target);}});},{threshold:.12,rootMargin:'0px 0px -8% 0px'});els.forEach(function(el){io.observe(el);});}
}catch(e){}})();
</script>`;


/**
 * @param {object} brief   sanitizeBrief().value
 * @param {object} plan    JSON da etapa PLANO
 * @param {object} sections  { id: "<section html>", ... }
 * @returns {string} documento HTML completo (antes do postprocess)
 */
export function assemblePage(brief, plan, sections) {
  const lang = esc(plan.lang || brief.language || 'pt-BR');
  const title = esc(String(plan.title || brief.productName || 'Página').slice(0, 70));
  const desc = esc(String(plan.description || brief.description || '').slice(0, 200));
  const tokens = normalizeTokens(plan.styleTokens || {});
  const theme = tokens.accent;
  const brand = esc(plan.brandName || brief.productName || brief.projectName || 'PageForge');

  let jsonld;
  try {
    const g = (plan.jsonld && typeof plan.jsonld === 'object') ? plan.jsonld : {
      '@context': 'https://schema.org',
      '@graph': [
        { '@type': 'Organization', '@id': 'https://exemplo.com/#org', name: brand, url: 'https://exemplo.com/' },
        { '@type': 'WebSite', url: 'https://exemplo.com/', name: brand, inLanguage: lang, publisher: { '@id': 'https://exemplo.com/#org' } },
      ],
    };
    jsonld = JSON.stringify(g);
  } catch {
    jsonld = `{"@context":"https://schema.org","@type":"WebSite","name":"${brand}"}`;
  }

  const order = Array.isArray(plan.sections) ? plan.sections.map((s) => s.id) : Object.keys(sections);
  const body = order.map((id) => String(sections[id] || '').trim()).filter(Boolean).join('\n\n');

  const fontLink = tokens.fontLink
    ? `<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin><link href="${esc(tokens.fontLink)}" rel="stylesheet">`
    : '';

  const css = buildStylesheet(plan.styleTokens || {});

  return `<!DOCTYPE html>
<html lang="${lang}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${title}</title>
<meta name="description" content="${desc}">
<link rel="canonical" href="https://exemplo.com/">
<meta name="theme-color" content="${theme}">
<meta property="og:type" content="${brief.pageType === 'advertorial' ? 'article' : 'website'}">
<meta property="og:title" content="${title}">
<meta property="og:description" content="${desc}">
<meta property="og:url" content="https://exemplo.com/">
<meta name="twitter:card" content="summary_large_image">
${fontLink}
<style>
${css}
</style>
<script type="application/ld+json">${jsonld}</script>
</head>
<body>
${body}
${BASE_JS}
</body>
</html>`;
}
