// mock.js — gerador determinístico usado só quando PAGEFORGE_MOCK=1
// (desenvolvimento/testes locais). NUNCA em produção. Não chama IA.
// Serve para exercitar o fluxo: preview, editar, regenerar, exportar.

function esc(s) {
  return String(s || '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
}

export function mockGenerate(brief, { instruction } = {}) {
  const name = esc(brief.productName || brief.projectName || 'Seu Produto');
  const promise = esc(brief.offer || brief.description || 'Uma forma mais simples de chegar ao resultado que você quer.');
  const cta = esc(brief.cta || 'Começar agora');
  const checkout = brief.checkoutUrl || '#oferta';
  const lang = esc(brief.language || 'pt-BR');
  const benefits = (brief.benefits && brief.benefits.length ? brief.benefits : ['Clareza sobre o próximo passo', 'Um método em vez de tentativa e erro', 'Economia de tempo']).slice(0, 6);
  const pains = (brief.pains && brief.pains.length ? brief.pains : ['Já tentou de tudo e travou', 'Falta um caminho claro']).slice(0, 4);
  const accent = (brief.palette && brief.palette[0]) || '#1f5f4f';
  const tweak = instruction ? `<!-- regeneração aplicada: ${esc(instruction)} -->` : '';
  const sensitive = brief.sensitive;

  return `<!DOCTYPE html>
<html lang="${lang}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${name} — ${esc((promise).slice(0, 40))}</title>
<meta name="description" content="${esc(promise.slice(0, 150))}">
<link rel="canonical" href="https://exemplo.com/">
<meta property="og:type" content="website">
<meta property="og:title" content="${name}">
<meta property="og:description" content="${esc(promise.slice(0, 150))}">
<meta property="og:url" content="https://exemplo.com/">
<meta name="twitter:card" content="summary_large_image">
<meta name="theme-color" content="${accent}">
<script type="application/ld+json">{"@context":"https://schema.org","@graph":[{"@type":"Organization","@id":"https://exemplo.com/#org","name":"${name}","url":"https://exemplo.com/"},{"@type":"WebSite","url":"https://exemplo.com/","name":"${name}","inLanguage":"${lang}","publisher":{"@id":"https://exemplo.com/#org"}}]}</script>
<style>
:root{--accent:${accent};--ink:#16201d;--soft:#4a5652;--bg:#fbfaf7;--surface:#fff;--line:#e6e3db;--radius:12px}
*{box-sizing:border-box}
html{scroll-behavior:smooth}
body{margin:0;background:var(--bg);color:var(--ink);font:400 1.06rem/1.65 ui-serif,Georgia,"Times New Roman",serif;-webkit-font-smoothing:antialiased}
.wrap{max-width:64rem;margin:0 auto;padding:0 1.25rem}
h1,h2{font-family:ui-sans-serif,system-ui,"Segoe UI",Roboto,sans-serif;line-height:1.1;letter-spacing:-.01em}
h1{font-size:clamp(2rem,1.4rem+2.6vw,3.1rem);margin:.2em 0}
h2{font-size:clamp(1.5rem,1.2rem+1.2vw,2.1rem);margin:2.4rem 0 .8rem}
p{max-width:42rem}
a.cta{display:inline-block;background:var(--accent);color:#fff;text-decoration:none;font-family:ui-sans-serif,system-ui,sans-serif;font-weight:600;padding:1rem 1.6rem;border-radius:999px;min-height:44px}
a.cta:focus-visible{outline:3px solid #000;outline-offset:2px}
header,section,footer{padding:2.6rem 0}
.hero{padding-top:3.4rem;background:linear-gradient(180deg,#fff,var(--bg))}
.lede{font-size:1.2rem;color:var(--soft)}
.note{font-size:.9rem;color:var(--soft);margin-top:.6rem}
ul.b{list-style:none;padding:0;display:grid;gap:.7rem}
ul.b li{padding-left:1.6rem;position:relative}
ul.b li::before{content:"";position:absolute;left:0;top:.55em;width:.6rem;height:.6rem;border-radius:50%;background:var(--accent)}
.card{background:var(--surface);border:1px solid var(--line);border-radius:var(--radius);padding:1.4rem}
.reveal{opacity:0;transform:translateY(14px);transition:opacity .6s,transform .6s}
.reveal.in{opacity:1;transform:none}
footer{background:#f1efe8;color:var(--soft);font-size:.9rem}
footer a{color:var(--soft)}
@media (prefers-reduced-motion:reduce){*,*::before,*::after{animation-duration:.001ms!important;transition-duration:.001ms!important;scroll-behavior:auto!important}}
</style>
</head>
<body>
${tweak}
<header class="hero"><div class="wrap">
  <h1>${esc(brief.mechanism ? brief.mechanism : name)}</h1>
  <p class="lede">${promise}</p>
  <p><a class="cta" data-cta="primary" href="${esc(checkout)}">${cta}</a></p>
  <p class="note">Você será levado para a página segura de checkout${brief.checkoutPlatform && brief.checkoutPlatform !== 'generic' ? ` (${esc(brief.checkoutPlatform)})` : ''}.</p>
</div></header>

<section><div class="wrap reveal">
  <h2>Para quem é</h2>
  <ul class="b">${pains.map((p) => `<li>${esc(p)}</li>`).join('')}</ul>
</div></section>

<section><div class="wrap reveal">
  <h2>O que muda</h2>
  <ul class="b">${benefits.map((x) => `<li>${esc(x)}</li>`).join('')}</ul>
</div></section>

${brief.mechanism ? `<section><div class="wrap reveal"><h2>Como funciona</h2><p>${esc(brief.mechanism)}</p></div></section>` : ''}

<section><div class="wrap reveal">
  <h2>A oferta</h2>
  <div class="card">
    <p><strong>${name}</strong>${brief.price ? ` — ${esc(brief.price)}` : ''}</p>
    ${brief.guarantee ? `<p>${esc(brief.guarantee)}</p>` : ''}
    <p><a class="cta" data-cta="primary" href="${esc(checkout)}">${cta}</a></p>
  </div>
</div></section>

${sensitive ? `<section><div class="wrap"><p class="note">Conteúdo educativo. Resultados podem variar conforme o contexto e a execução de cada pessoa. Não substitui acompanhamento profissional.</p></div></section>` : ''}

<footer><div class="wrap">
  <p>© <span id="y"></span> ${name}. Página independente.</p>
  <p><a href="#privacidade">Política de Privacidade</a> · <a href="#termos">Termos de Uso</a> · <a href="#contato">Contato</a></p>
  ${brief.affiliate ? '<p>Este conteúdo contém link de afiliado. Podemos receber comissão, sem custo adicional para você.</p>' : ''}
</div></footer>

<script>
(function(){try{
  var carry=new URLSearchParams(location.search);
  function trackCTA(n){/* GA4/Meta/GTM: cole aqui */}
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
  var y=document.getElementById('y'); if(y) y.textContent=new Date().getFullYear();
  if(!matchMedia('(prefers-reduced-motion: reduce)').matches){
    var io=new IntersectionObserver(function(es){es.forEach(function(e){if(e.isIntersecting){e.target.classList.add('in');io.unobserve(e.target);}});},{threshold:.15});
    document.querySelectorAll('.reveal').forEach(function(el){io.observe(el);});
  } else { document.querySelectorAll('.reveal').forEach(function(el){el.classList.add('in');}); }
}catch(e){}})();
</script>
</body>
</html>`;
}

/* --- MOCK para a geração em etapas (PAGEFORGE_MOCK=1) --- */
export function mockPlan(brief) {
  const name = brief.productName || brief.projectName || 'Seu Produto';
  const accent = (brief.palette && brief.palette[0]) || '#1f5f4f';
  const bl = (brief.benefits && brief.benefits.length ? brief.benefits : ['Clareza no próximo passo', 'Um método em vez de tentativa e erro', 'Menos tempo perdido']);
  const pn = (brief.pains && brief.pains.length ? brief.pains : ['Começa e para', 'Falta um caminho claro']);
  const hex = /^#[0-9a-f]{6}$/i.test(accent) ? accent : '#1f5f4f';
  return {
    lang: brief.language || 'pt-BR',
    brandName: name,
    title: `${name} — ${(brief.offer || brief.description || 'um caminho mais simples').slice(0, 38)}`,
    description: (brief.offer || brief.description || `Conheça ${name}.`).slice(0, 150),
    styleTicket: { keywords: ['claro', 'direto', 'confiável'], signature: 'coluna de leitura estreita + CTA de cor sólida' },
    styleTokens: { mood: brief.sensitive ? 'calm' : 'clean', bg: '#ffffff', surface: '#f5f6f5', ink: '#16201d', inkSoft: '#55605b', line: '#e5e5e0', accent: hex, accentInk: '#ffffff', fontLink: '', fontDisplay: '', fontText: '' },
    jsonld: { '@context': 'https://schema.org', '@graph': [{ '@type': 'Organization', '@id': 'https://exemplo.com/#org', name, url: 'https://exemplo.com/' }, { '@type': 'WebSite', url: 'https://exemplo.com/', name, inLanguage: brief.language || 'pt-BR', publisher: { '@id': 'https://exemplo.com/#org' } }] },
    ctaText: brief.cta || 'Quero começar',
    sections: [
      { id: 'hero', kind: 'hero', goal: 'promessa + CTA', copy: `${brief.mechanism || name}\n${brief.offer || brief.description || ''}` },
      { id: 'pain', kind: 'problem', goal: 'identificação', copy: pn.join('\n') },
      { id: 'benefits', kind: 'benefits', goal: 'o que muda', copy: bl.join('\n') },
      { id: 'offer', kind: 'offer', goal: 'oferta + CTA', copy: `${name}${brief.price ? ' — ' + brief.price : ''}\n${brief.guarantee || ''}` },
      ...(brief.sensitive ? [{ id: 'disclosure', kind: 'disclosure', goal: 'isenção', copy: 'Conteúdo educativo. Resultados podem variar. Não substitui acompanhamento profissional.' }] : []),
      { id: 'footer', kind: 'footer', goal: 'legal', copy: 'Política de Privacidade · Termos de Uso · Contato' },
    ],
  };
}

export function mockSections(brief, plan, ids) {
  const checkout = brief.checkoutUrl || '#oferta';
  const cta = plan.ctaText || 'Quero começar';
  const out = {};
  for (const s of (plan.sections || [])) {
    if (!ids.includes(s.id)) continue;
    const lines = String(s.copy || '').split('\n').filter(Boolean);
    if (s.kind === 'hero') {
      out[s.id] = `<header class="pf-hero"><div class="pf-wrap reveal"><h1>${esc(lines[0] || '')}</h1><p class="pf-lede">${esc(lines[1] || '')}</p><p><a class="cta" data-cta="primary" href="${esc(checkout)}">${esc(cta)}</a></p></div></header>`;
    } else if (s.kind === 'footer') {
      out[s.id] = `<footer class="pf-footer"><div class="pf-wrap"><p>© <span id="pf-year"></span> ${esc(plan.brandName || '')}. Página independente.</p><p><a href="#privacidade">Política de Privacidade</a> · <a href="#termos">Termos de Uso</a> · <a href="#contato">Contato</a></p></div></footer>`;
    } else if (s.kind === 'disclosure') {
      out[s.id] = `<section class="pf-wrap"><p class="pf-disclosure">${esc(lines.join(' '))}</p></section>`;
    } else if (s.kind === 'offer') {
      out[s.id] = `<section class="pf-wrap pf-alt reveal"><h2>A oferta</h2><div class="pf-offer"><p class="pf-price">${esc(lines[0] || '')}</p><p>${esc(lines.slice(1).join(' '))}</p><p><a class="cta" data-cta="primary" href="${esc(checkout)}">${esc(cta)}</a></p></div></section>`;
    } else {
      out[s.id] = `<section class="pf-wrap reveal"><h2>${esc(s.goal || s.id)}</h2><ul class="pf-list">${lines.map((l) => `<li>${esc(l)}</li>`).join('')}</ul></section>`;
    }
  }
  return out;
}
