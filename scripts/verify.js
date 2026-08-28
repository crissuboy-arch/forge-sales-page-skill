#!/usr/bin/env node
/**
 * verify.js — QA automatizado da página (parte de references/qa-checklist.md).
 * Uso: node scripts/verify.js <caminho-do-projeto | pasta src | index.html>
 *
 * Checa: <head> completo, headings, alt em imagens, contraste dos tokens,
 * prefers-reduced-motion, defer nos scripts, lazy-loading, peso de assets,
 * CTA acima da dobra, hooks de tracking, blocos/termos de compliance.
 * Sai com código 1 se houver BLOCKERS.
 */
import fs from 'node:fs';
import path from 'node:path';
import {
  C, log, ok, warn, err, head, resolveTarget, read, walk, fmtBytes, contrastRatio, exists,
} from './lib/util.js';

const arg = process.argv[2];
if (!arg) {
  log('Uso: node scripts/verify.js <caminho>');
  process.exit(0);
}

const { htmlFile, root } = resolveTarget(arg, { wantSrc: true });
const html = read(htmlFile);
const lower = html.toLowerCase();

let blockers = 0, highs = 0, mediums = 0;
const B = (m) => { err(`[blocker] ${m}`); blockers++; };
const H = (m) => { warn(`[high]    ${m}`); highs++; };
const M = (m) => { log(`${C.gray}[medium]  ${m}${C.reset}`); mediums++; };
const P = (m) => ok(m);

head(`Verificando: ${path.relative(process.cwd(), htmlFile)}`);

// ---------------- <head> ----------------
head('<head> e metadados');
const checks = [
  [/<html[^>]*\blang\s*=/i, '<html lang="...">', 'blocker'],
  [/<meta[^>]*charset/i, '<meta charset>', 'blocker'],
  [/<meta[^>]*name=["']viewport["']/i, '<meta viewport>', 'blocker'],
  [/<title>[^<]{3,70}<\/title>/i, '<title> (3–70 car.)', 'blocker'],
  [/<meta[^>]*name=["']description["'][^>]*content=["'][^"']{20,300}/i, 'meta description', 'high'],
  [/<meta[^>]*property=["']og:title["']/i, 'og:title', 'high'],
  [/<meta[^>]*property=["']og:description["']/i, 'og:description', 'high'],
  [/<meta[^>]*property=["']og:image["']/i, 'og:image', 'medium'],
  [/<meta[^>]*property=["']og:url["']/i, 'og:url', 'medium'],
  [/<meta[^>]*name=["']twitter:card["']/i, 'twitter:card', 'medium'],
  [/<link[^>]*rel=["']canonical["']/i, 'link canonical', 'medium'],
  [/<meta[^>]*name=["']theme-color["']/i, 'theme-color', 'medium'],
  [/<link[^>]*rel=["'][^"']*icon/i, 'favicon', 'medium'],
];
for (const [re, label, sev] of checks) {
  if (re.test(html)) P(label);
  else (sev === 'blocker' ? B : sev === 'high' ? H : M)(`faltando: ${label}`);
}

// ---------------- SEO técnico ----------------
head('SEO técnico');
const isNoindex = /<meta[^>]*name=["']robots["'][^>]*noindex/i.test(html);
if (/<meta[^>]*name=["']robots["']/i.test(html)) P(isNoindex ? '<meta robots> (noindex — página não indexável, ok se intencional)' : '<meta robots> presente');
else M('sem <meta name="robots"> — o default é indexável; declare explicitamente');

const ld = [...html.matchAll(/<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)];
if (!ld.length) { if (!isNoindex) M('sem dados estruturados (JSON-LD) — considere Organization / WebSite / SoftwareApplication / FAQPage conforme o conteúdo REAL'); }
else {
  let okLd = 0;
  for (const m of ld) { try { JSON.parse(m[1]); okLd++; } catch (e) { H(`JSON-LD inválido: ${e.message}`); } }
  if (okLd === ld.length) P(`${okLd} bloco(s) JSON-LD válido(s)`);
  const ldText = ld.map((m) => m[1]).join(' ');
  if (/aggregateRating|"review"\s*:|ratingValue|reviewCount/i.test(ldText))
    H('JSON-LD contém review/rating — só use com avaliações REAIS e verificáveis (compliance)');
}

for (const f of ['robots.txt', 'sitemap.xml']) {
  if (exists(path.join(root, f))) P(`${f} presente`);
  else if (!isNoindex) M(`${f} ausente na raiz do site`);
}
if (exists(path.join(root, 'site.webmanifest')) || exists(path.join(root, 'manifest.json'))) {
  const mf = exists(path.join(root, 'site.webmanifest')) ? 'site.webmanifest' : 'manifest.json';
  if (/<link[^>]*rel=["']manifest["']/i.test(html)) P(`${mf} + <link rel="manifest">`);
  else M(`${mf} existe mas falta <link rel="manifest"> no HTML`);
}

// ---------------- headings ----------------
head('Headings');
const h1 = html.match(/<h1\b/gi) || [];
if (h1.length === 0) B('nenhum <h1>');
else if (h1.length > 1) H(`${h1.length} <h1> (deveria ser 1)`);
else P('1 <h1>');
const levels = [...html.matchAll(/<h([1-6])\b/gi)].map(m => +m[1]);
let prev = 0, jump = false;
for (const l of levels) { if (prev && l > prev + 1) jump = true; prev = l; }
if (jump) M('hierarquia de headings pula nível (ex.: h2 → h4)');
else if (levels.length) P('hierarquia de headings ok');

// ---------------- imagens ----------------
head('Imagens');
const imgs = html.match(/<img\b[^>]*>/gi) || [];
let noAlt = 0, noDim = 0, noLazy = 0;
imgs.forEach((tag, i) => {
  if (!/\balt\s*=/.test(tag)) noAlt++;
  if (!/\bwidth\s*=/.test(tag) || !/\bheight\s*=/.test(tag)) noDim++;
  if (i > 0 && !/\bloading\s*=\s*["']lazy["']/.test(tag) && !/\bfetchpriority/.test(tag)) noLazy++;
});
if (imgs.length === 0) M('nenhuma <img> no HTML (ok se for tudo CSS/SVG inline)');
if (noAlt) B(`${noAlt}/${imgs.length} <img> sem atributo alt`);
else if (imgs.length) P('todas as <img> têm alt');
if (noDim) H(`${noDim}/${imgs.length} <img> sem width/height (risco de CLS)`);
if (noLazy) M(`${noLazy} <img> abaixo da dobra sem loading="lazy"`);

// ---------------- scripts ----------------
head('Scripts');
const scripts = html.match(/<script\b[^>]*>/gi) || [];
const external = scripts.filter(s => /\bsrc\s*=/.test(s));
const blocking = external.filter(s => !/\b(defer|async)\b/.test(s));
if (blocking.length) H(`${blocking.length} <script src> sem defer/async`);
else P('scripts externos com defer/async (ou nenhum)');
const inHead = (html.split(/<\/head>/i)[0].match(/<script\b[^>]*\bsrc=/gi) || [])
  .filter(s => !/\b(defer|async)\b/.test(s));
if (inHead.length) H(`${inHead.length} <script src> bloqueante no <head>`);

// ---------------- reduced motion ----------------
head('Movimento e acessibilidade');
if (/prefers-reduced-motion/i.test(html) || cssHas(/prefers-reduced-motion/i))
  P('prefers-reduced-motion tratado');
else B('nenhuma regra prefers-reduced-motion (CSS ou JS)');

if (/:focus-visible|:focus\s*{/.test(html) || cssHas(/:focus(-visible)?/))
  P('estilo de foco presente');
else H('sem estilo de :focus/:focus-visible detectado');

if (/outline\s*:\s*(none|0)\b/.test(collectCss()) && !/:focus[^{]*{[^}]*outline/.test(collectCss()))
  H('outline:none sem substituto de foco visível');

// ---------------- contraste dos tokens ----------------
head('Contraste (tokens do :root)');
const css = collectCss();
const rootVars = extractRootVars(css);
function pair(a, b, label, big = false) {
  if (!rootVars[a] || !rootVars[b]) return;
  const r = contrastRatio(rootVars[a], rootVars[b]);
  if (r == null) return;
  const min = big ? 3 : 4.5;
  const msg = `${label}: ${r.toFixed(2)}:1 (mín ${min})`;
  if (r >= min) P(msg); else H(msg);
}
if (Object.keys(rootVars).length) {
  pair('--c-ink', '--c-bg', 'texto sobre fundo');
  pair('--c-ink-soft', '--c-bg', 'texto secundário sobre fundo', false);
  pair('--c-cta-ink', '--c-cta', 'texto do botão sobre CTA');
  pair('--c-ink', '--c-surface', 'texto sobre superfície');
} else {
  M('nenhuma custom property de cor em :root encontrada — ver visual-direction.md §3');
}

// ---------------- CTA acima da dobra ----------------
head('CTA e conversão');
const firstChunk = html.slice(0, Math.min(html.length, html.indexOf('</section>') > 0 ? html.indexOf('</section>') + 10 : 4000));
if (/data-cta/i.test(firstChunk) || /class=["'][^"']*(btn|cta)[^"']*["']/i.test(firstChunk))
  P('CTA presente perto do topo (above the fold)');
else H('não detectei CTA na primeira seção/above the fold');

if (/function\s+trackcta|trackcta\s*\(/i.test(collectJs())) P('hook trackCTA() presente');
else M('hook trackCTA() ausente — ver checkout-integrations.md §7');

if (/<meta[^>]*name=["']robots["'][^>]*noindex/i.test(html)) {
  M('página com noindex — presumindo página de obrigado/captura');
  if (!/trackconversion|purchase/i.test(collectJs()))
    M('página noindex sem trackConversion()/Purchase — ok se não for obrigado');
}

// ---------------- peso de assets ----------------
head('Peso de assets');
const assetFiles = walk(path.join(root, 'assets'));
let jsBytes = 0, cssBytes = 0, imgBytes = 0, vendorBytes = 0, biggest = null;
for (const f of assetFiles) {
  const s = fs.statSync(f).size;
  if (/vendor/.test(f)) vendorBytes += s;
  else if (f.endsWith('.js')) jsBytes += s;
  if (f.endsWith('.css')) cssBytes += s;
  if (/\.(png|jpe?g|webp|gif|avif|svg)$/i.test(f)) imgBytes += s;
  if (/\.(png|jpe?g|webp|gif|avif)$/i.test(f) && s > 400 * 1024) H(`imagem > 400KB: ${path.relative(root, f)} (${fmtBytes(s)})`);
  if (!biggest || s > biggest.s) biggest = { f, s };
}
log(`  JS próprio: ${fmtBytes(jsBytes)} | vendor: ${fmtBytes(vendorBytes)} | CSS: ${fmtBytes(cssBytes)} | imagens: ${fmtBytes(imgBytes)}`);
if (jsBytes > 20 * 1024) H(`JS próprio acima de 20KB (${fmtBytes(jsBytes)})`);
// libs vendor: limite em bytes crus (~200KB cru ≈ ~60KB gzip). GSAP+ScrollTrigger+Lenis
// juntos ficam por volta de 125KB crus (~38KB gzip) e são a stack padrão do modo CINEMATIC.
if (vendorBytes > 200 * 1024) H(`libs vendor acima de ~200KB crus (${fmtBytes(vendorBytes)}) — revise o que está vendorizado (cortar Lenis, usar só o core do GSAP)`);
else if (vendorBytes > 0) M(`libs vendor: ${fmtBytes(vendorBytes)} crus (≈ ${fmtBytes(Math.round(vendorBytes * 0.32))} gzip estimado)`);
if (biggest) M(`maior asset: ${path.relative(root, biggest.f)} (${fmtBytes(biggest.s)})`);

// ---------------- compliance ----------------
head('Compliance — varredura de termos');
const briefPath = [path.join(root, 'brief.json'), path.join(root, '..', 'brief.json'), path.join(root, '..', '..', 'brief.json')]
  .find(p => fs.existsSync(p));
let brief = null;
try { if (briefPath) brief = JSON.parse(read(briefPath)); } catch {}

const text = stripTags(html).toLowerCase();
const risky = [
  'garantido', 'garantia de resultado', 'sem risco', 'renda garantida', 'lucro certo',
  'fique rico', 'enriqueça', 'enriquecer rápido', '100% garantido', 'resultado imediato',
  'sem esforço', 'milagroso', 'cura ', 'curar ', 'elimina de vez', 'cientificamente comprovado',
  'aprovado pela anvisa', 'como visto na globo', 'como visto na forbes', 'última chance',
];
const found = risky.filter(t => text.includes(t));
if (found.length) H(`termos de risco encontrados (revisar com compliance-*.md): ${found.join(', ')}`);
else P('nenhum termo de risco óbvio no texto visível');

// atributos pessoais (Meta) — 2ª pessoa acusatória
const personal = [
  'você está acima do peso', 'você está gordo', 'você está endividado', 'você está sozinho',
  'você está deprimido', 'você está falido', 'cansado de ser rejeitado', 'sofre de',
  'suas dívidas não param', 'sua barriga',
];
const pf = personal.filter(t => text.includes(t));
if (pf.length) H(`possível violação de "atributos pessoais" (Meta): ${pf.join(', ')} — reescrever na 3ª pessoa`);

// blocos exigidos em nicho sensível
const sensitive = brief && (brief.compliance?.sensitiveNiche ||
  (brief.compliance?.categories || []).some(c => c && c !== 'other'));
if (sensitive) {
  const htmlN = deaccent(html); // checagens de compliance são tolerantes a acento
  const need = [
    [/politica de privacidade/i, 'link Política de Privacidade'],
    [/termos de uso|termos e condi/i, 'link Termos de Uso'],
    [/resultados? (podem )?variam|nao (e|sao) garanti|resultados nao sao garantidos|nao ha garantia de resultado/i, 'isenção "resultados variam"'],
    [/(cnpj|razao social|nome empresarial|ltda\b|\bme\b|eireli)/i, 'identificação do vendedor (CNPJ/razão social)'],
    [/(contato|suporte|fale conosco|e-?mail|atendimento)/i, 'canal de contato'],
  ];
  for (const [re, label] of need) {
    if (re.test(htmlN)) P(`nicho sensível: ${label} presente`);
    else B(`nicho sensível exige: ${label}`);
  }
  const cats = brief.compliance?.categories || [];
  if (cats.includes('finance') || cats.includes('make-money') || cats.includes('crypto')) {
    if (/investiment[o]s? envolvem risco|nao (e|constitui) recomendacao de investimento|perda do capital/i.test(htmlN)) P('disclaimer de risco financeiro presente');
    else B('nicho financeiro exige disclaimer de risco (ex.: "Investimentos envolvem risco, inclusive de perda do capital")');
  }
  if (cats.includes('health') || cats.includes('weight-loss') || cats.includes('supplements')) {
    if (/nao substitui (avaliacao|acompanhamento|diagnostico)|procure (um|uma) (profissional|medic)/i.test(htmlN)) P('disclaimer de saúde presente');
    else B('nicho de saúde exige disclaimer "não substitui avaliação/acompanhamento médico"');
  }
}

// depoimentos sem prova verificada
if (/depoimento|testemunho|"[^"]{40,}"\s*[—-]\s*[A-ZÀ-Ú]/.test(html)) {
  const verified = (brief?.proof || []).filter(p => p.verified).length;
  if (!verified) H('a página parece conter depoimentos, mas brief.proof não tem itens verified:true — remover ou substituir');
  else M(`página com depoimentos; brief tem ${verified} prova(s) verificada(s) — conferir 1:1`);
}

// ---------------- resultado ----------------
head('Resultado do verify');
log(`${blockers ? C.red : C.green}${blockers} blocker(s)${C.reset}, ${C.yellow}${highs} high${C.reset}, ${C.gray}${mediums} medium${C.reset}`);
if (blockers) log(`\n${C.red}Corrija os blockers antes de exportar.${C.reset}`);
process.exit(blockers ? 1 : 0);

// ===================== helpers =====================
function collectCss() {
  const inline = [...html.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/gi)].map(m => m[1]).join('\n');
  const files = walk(path.join(root, 'assets'), f => f.endsWith('.css')).map(read).join('\n');
  return inline + '\n' + files;
}
function collectJs() {
  const inline = [...html.matchAll(/<script(?![^>]*\bsrc)[^>]*>([\s\S]*?)<\/script>/gi)].map(m => m[1]).join('\n');
  const files = walk(path.join(root, 'assets'), f => f.endsWith('.js') && !/vendor/.test(f)).map(read).join('\n');
  return inline + '\n' + files;
}
function cssHas(re) { return re.test(collectCss()); }
function extractRootVars(css) {
  const out = {};
  const block = css.match(/:root\s*{([\s\S]*?)}/);
  if (!block) return out;
  for (const m of block[1].matchAll(/(--[\w-]+)\s*:\s*(#[0-9a-fA-F]{3,8})/g)) out[m[1]] = m[2];
  return out;
}
function deaccent(s) {
  return s.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}
function stripTags(s) {
  return s.replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ');
}
