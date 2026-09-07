// theme.js — stylesheet paramétrico da PageForge AI. A IA escolhe só os TOKENS
// (paleta, fontes, mood); o CSS real é montado aqui. Isso torna a etapa "plan"
// rápida e o resultado consistente/testado. A direção de arte por produto vem
// dos tokens + da estrutura HTML das seções + do mood.

const HEX = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i;
const okHex = (v, fb) => (HEX.test(String(v || '')) ? v : fb);

const MOODS = {
  editorial: { measure: '40rem', radius: '4px', heroPad: '5rem', display: 'Georgia, "Times New Roman", serif', body: 'Georgia, "Times New Roman", serif', h1w: '650', tracking: '-0.011em', shadow: '0 1px 2px rgba(0,0,0,.06)' },
  clean: { measure: '42rem', radius: '12px', heroPad: '4.5rem', display: 'ui-sans-serif, system-ui, "Segoe UI", Roboto, sans-serif', body: 'ui-sans-serif, system-ui, "Segoe UI", Roboto, sans-serif', h1w: '760', tracking: '-0.021em', shadow: '0 1px 2px rgba(16,24,40,.05), 0 10px 30px rgba(16,24,40,.06)' },
  warm: { measure: '41rem', radius: '18px', heroPad: '4.5rem', display: 'ui-serif, Georgia, serif', body: 'ui-sans-serif, system-ui, sans-serif', h1w: '700', tracking: '-0.014em', shadow: '0 2px 8px rgba(60,40,20,.08)' },
  bold: { measure: '42rem', radius: '8px', heroPad: '4rem', display: 'ui-sans-serif, system-ui, "Segoe UI", sans-serif', body: 'ui-sans-serif, system-ui, sans-serif', h1w: '820', tracking: '-0.028em', shadow: '0 2px 4px rgba(0,0,0,.12)' },
  calm: { measure: '40rem', radius: '14px', heroPad: '5rem', display: 'ui-serif, Georgia, serif', body: 'ui-sans-serif, system-ui, sans-serif', h1w: '620', tracking: '-0.008em', shadow: '0 1px 3px rgba(20,30,28,.06)' },
  tech: { measure: '44rem', radius: '10px', heroPad: '4.5rem', display: 'ui-sans-serif, system-ui, "Segoe UI", sans-serif', body: 'ui-sans-serif, system-ui, sans-serif', h1w: '780', tracking: '-0.024em', shadow: '0 1px 2px rgba(2,6,23,.08), 0 12px 34px rgba(2,6,23,.10)' },
};

export function normalizeTokens(raw = {}) {
  const t = raw && typeof raw === 'object' ? raw : {};
  const moodKey = Object.keys(MOODS).includes(String(t.mood)) ? String(t.mood) : 'clean';
  return {
    bg: okHex(t.bg, '#ffffff'),
    ink: okHex(t.ink, '#16201d'),
    inkSoft: okHex(t.inkSoft, '#55605b'),
    surface: okHex(t.surface, '#f7f7f5'),
    line: okHex(t.line, '#e5e5e0'),
    accent: okHex(t.accent, '#1f5f4f'),
    accentInk: okHex(t.accentInk, '#ffffff'),
    fontLink: /^https:\/\/fonts\.googleapis\.com\//.test(t.fontLink || '') ? t.fontLink : '',
    fontDisplay: typeof t.fontDisplay === 'string' && t.fontDisplay.trim() ? t.fontDisplay.trim().slice(0, 80) : '',
    fontText: typeof t.fontText === 'string' && t.fontText.trim() ? t.fontText.trim().slice(0, 80) : '',
    mood: moodKey,
  };
}

/** CSS completo (conteúdo de <style>, sem a tag). */
export function buildStylesheet(rawTokens = {}) {
  const t = normalizeTokens(rawTokens);
  const m = MOODS[t.mood];
  const disp = t.fontDisplay ? `"${t.fontDisplay}", ${m.display}` : m.display;
  const body = t.fontText ? `"${t.fontText}", ${m.body}` : m.body;

  return `:root{
  --bg:${t.bg};--ink:${t.ink};--soft:${t.inkSoft};--surface:${t.surface};--line:${t.line};
  --accent:${t.accent};--accent-ink:${t.accentInk};--radius:${m.radius};--measure:${m.measure};
  --shadow:${m.shadow};--font-display:${disp};--font-text:${body};
}
*,*::before,*::after{box-sizing:border-box}
html{-webkit-text-size-adjust:100%;scroll-behavior:smooth}
body{margin:0;background:var(--bg);color:var(--ink);font:400 1.06rem/1.62 var(--font-text);-webkit-font-smoothing:antialiased}
img,svg{max-width:100%;display:block;height:auto}
h1,h2,h3{font-family:var(--font-display);line-height:1.14;letter-spacing:${m.tracking};margin:0 0 .5em}
h1{font-size:clamp(2rem,1.35rem+2.7vw,3.1rem);font-weight:${m.h1w}}
h2{font-size:clamp(1.45rem,1.15rem+1.15vw,2.05rem);font-weight:${m.h1w}}
h3{font-size:1.18rem;font-weight:700}
p{margin:0 0 1em;max-width:var(--measure)}
a{color:var(--accent)}
strong{font-weight:700}
.pf-wrap{max-width:62rem;margin:0 auto;padding:2.6rem 1.3rem}
.pf-narrow{max-width:calc(var(--measure) + 3rem)}
section,header,footer{overflow:hidden}
.pf-hero{padding-top:${m.heroPad};background:linear-gradient(180deg,var(--surface),var(--bg))}
.pf-hero p:first-of-type{font-size:1.18rem;color:var(--soft)}
.pf-eyebrow{font:600 .8rem/1.4 var(--font-text);letter-spacing:.12em;text-transform:uppercase;color:var(--soft);margin-bottom:.6rem}
.pf-lede{font-size:1.15rem;color:var(--soft)}
.cta{display:inline-block;background:var(--accent);color:var(--accent-ink);text-decoration:none;font-family:var(--font-text);font-weight:700;font-size:1rem;padding:1rem 1.7rem;border-radius:999px;min-height:44px;line-height:1.3;transition:transform .12s ease,filter .12s ease}
.cta:hover{transform:translateY(-1px);filter:brightness(.95)}
.cta:focus-visible{outline:3px solid var(--ink);outline-offset:2px}
.pf-note{font-size:.9rem;color:var(--soft);margin-top:.7rem}
.pf-list{list-style:none;padding:0;margin:1rem 0;display:grid;gap:.7rem}
.pf-list li{position:relative;padding-left:1.6rem;max-width:var(--measure)}
.pf-list li::before{content:"";position:absolute;left:0;top:.6em;width:.55rem;height:.55rem;border-radius:50%;background:var(--accent)}
.pf-steps{list-style:none;counter-reset:s;padding:0;margin:1.2rem 0;display:grid;gap:.9rem}
.pf-steps li{counter-increment:s;position:relative;padding-left:2.4rem;max-width:var(--measure)}
.pf-steps li::before{content:counter(s);position:absolute;left:0;top:-.1em;width:1.7rem;height:1.7rem;border-radius:50%;background:var(--surface);border:1px solid var(--line);display:grid;place-items:center;font:700 .9rem/1 var(--font-text);color:var(--accent)}
.pf-card{background:var(--surface);border:1px solid var(--line);border-radius:var(--radius);padding:1.5rem;box-shadow:var(--shadow)}
.pf-grid{display:grid;gap:1rem;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));margin:1.2rem 0}
.pf-offer{background:var(--surface);border:1px solid var(--line);border-radius:var(--radius);padding:1.8rem;box-shadow:var(--shadow);max-width:36rem}
.pf-price{font-family:var(--font-display);font-size:1.6rem;font-weight:${m.h1w}}
.pf-faq details{border-bottom:1px solid var(--line);padding:.9rem 0}
.pf-faq summary{cursor:pointer;font-weight:700;list-style:none}
.pf-faq summary::-webkit-details-marker{display:none}
.pf-faq summary::after{content:"+";float:right;color:var(--accent)}
.pf-faq details[open] summary::after{content:"–"}
.pf-alt{background:var(--surface)}
.pf-disclosure{font-size:.9rem;color:var(--soft);border:1px solid var(--line);border-radius:var(--radius);padding:1rem 1.2rem;background:var(--surface)}
.pf-footer{background:var(--ink);color:var(--bg)}
.pf-footer a{color:var(--bg);opacity:.85}
.pf-footer .pf-wrap{font-size:.9rem}
.reveal{opacity:0;transform:translateY(14px);transition:opacity .6s ease,transform .6s ease}
.reveal.in{opacity:1;transform:none}
@media (max-width:640px){.pf-wrap{padding:2rem 1.15rem}.cta{width:100%;text-align:center}}
@media (prefers-reduced-motion:reduce){*,*::before,*::after{animation-duration:.001ms!important;transition-duration:.001ms!important;scroll-behavior:auto!important}.reveal{opacity:1;transform:none}}`;
}

/** Contrato de classes para o prompt de RENDER (a IA só usa estas). */
export const CLASS_CONTRACT = `Classes disponíveis no CSS (use SÓ estas; não invente):
- layout: .pf-wrap (container padrão de toda seção), .pf-narrow (coluna de leitura estreita), .pf-alt (fundo alternado, na <section>)
- hero: .pf-hero (na <header>), .pf-eyebrow, .pf-lede
- texto/listas: .pf-list (ul de bullets), .pf-steps (ol/ul de passos numerados), .pf-note (microcopy)
- blocos: .pf-card, .pf-grid (wrapper de 2-4 .pf-card curtos e realmente paralelos), .pf-offer + .pf-price
- faq: .pf-faq (wrapper) com <details><summary>Pergunta</summary><p>Resposta</p></details>
- disclosure/legal: .pf-disclosure
- rodapé: .pf-footer (na <footer>); inclua <span id="pf-year"></span> no copyright
- CTA: <a class="cta" data-cta="primary" href="{{CHECKOUT_URL}}">
- animação de entrada: adicione a classe "reveal" ao container de cada seção (.pf-wrap.reveal)`;
