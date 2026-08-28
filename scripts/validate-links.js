#!/usr/bin/env node
/**
 * validate-links.js — audita links, âncoras, CTAs, URL de checkout, imagens e vídeos.
 * Uso: node scripts/validate-links.js <caminho-do-projeto | pasta | index.html>
 *
 * Verifica:
 *  - links internos e âncoras (#id) → o alvo existe no HTML
 *  - href de CTA ([data-cta]) → https válido, todos com o mesmo destino
 *  - src de <img>/<video>/<source>/<link>/<script> → arquivo existe (relativo) ou https
 *  - href="#" ou vazio → aviso
 *  - recursos http:// (inseguro) → erro
 *  - snippet de propagação de query string presente no JS (aviso se ausente)
 *  - brief.json (se existir) → checkoutUrl coerente com checkoutPlatform
 */
import fs from 'node:fs';
import path from 'node:path';
import { C, log, ok, warn, err, head, resolveTarget, read, fmtBytes } from './lib/util.js';

const arg = process.argv[2];
if (!arg) {
  log(`Uso: node scripts/validate-links.js <caminho>\n` +
      `  <caminho> pode ser a pasta do projeto (output/<slug>), a pasta src/dist ou um index.html`);
  process.exit(0);
}

const { htmlFile, root } = resolveTarget(arg);
const html = read(htmlFile);
let errors = 0, warnings = 0;
const E = (m) => { err(m); errors++; };
const W = (m) => { warn(m); warnings++; };

head(`Auditando: ${path.relative(process.cwd(), htmlFile)}`);

// ---------- IDs e âncoras ----------
const ids = new Set([...html.matchAll(/\bid\s*=\s*["']([^"']+)["']/gi)].map(m => m[1]));
const names = new Set([...html.matchAll(/\bname\s*=\s*["']([^"']+)["']/gi)].map(m => m[1]));

// ---------- coletar hrefs/srcs ----------
const attrRe = /\b(href|src|poster|data-src)\s*=\s*("([^"]*)"|'([^']*)')/gi;
const refs = [];
for (const m of html.matchAll(attrRe)) {
  const kind = m[1].toLowerCase();
  const val = (m[3] ?? m[4] ?? '').trim();
  refs.push({ kind, val });
}

// srcset
for (const m of html.matchAll(/\bsrcset\s*=\s*("([^"]*)"|'([^']*)')/gi)) {
  const list = (m[2] ?? m[3] ?? '').split(',');
  for (const item of list) {
    const url = item.trim().split(/\s+/)[0];
    if (url) refs.push({ kind: 'srcset', val: url });
  }
}

head('Links, âncoras e recursos');
let localChecked = 0, anchorsChecked = 0;

for (const { kind, val } of refs) {
  if (!val) { W(`${kind} vazio`); continue; }
  if (val.startsWith('data:') || val.startsWith('mailto:') || val.startsWith('tel:')) continue;

  if (val === '#' || val === 'javascript:void(0)') { W(`${kind}="${val}" (placeholder de link)`); continue; }

  if (val.startsWith('#')) {
    anchorsChecked++;
    const target = val.slice(1);
    if (!ids.has(target) && !names.has(target)) E(`Âncora quebrada: ${val} (nenhum id/name "${target}")`);
    continue;
  }

  if (/^https?:\/\//i.test(val)) {
    if (val.startsWith('http://')) E(`Recurso inseguro (http://): ${val}`);
    continue;
  }
  if (val.startsWith('//')) { W(`URL protocol-relative: ${val} (prefira https://)`); continue; }

  // caminho relativo → deve existir
  localChecked++;
  const clean = val.split('#')[0].split('?')[0];
  const fp = path.resolve(root, clean);
  if (!fs.existsSync(fp)) {
    E(`Arquivo não encontrado (${kind}): ${val}  →  ${path.relative(process.cwd(), fp)}`);
  } else {
    const size = fs.statSync(fp).size;
    if (/\.(png|jpe?g|webp|gif|avif)$/i.test(clean) && size > 400 * 1024)
      W(`Imagem pesada: ${val} (${fmtBytes(size)}) — otimizar`);
    if (/\.(mp4|webm|mov)$/i.test(clean) && size > 3 * 1024 * 1024)
      W(`Vídeo pesado: ${val} (${fmtBytes(size)})`);
  }
}
ok(`${localChecked} recursos locais checados, ${anchorsChecked} âncoras checadas`);

// ---------- CTAs ----------
head('CTAs (data-cta)');
const ctaTags = html.match(/<a\b[^>]*\bdata-cta\b[^>]*>/gi) || [];
if (ctaTags.length === 0) {
  W('Nenhum <a data-cta> encontrado — a página tem CTA de checkout?');
} else {
  const hrefs = ctaTags.map(t => {
    const m = t.match(/href\s*=\s*("([^"]*)"|'([^']*)')/i);
    return m ? (m[2] ?? m[3]) : null;
  });
  const primary = hrefs.filter(Boolean);
  const uniq = [...new Set(primary.map(h => h.split('?')[0]))];
  log(`  ${ctaTags.length} CTAs, ${uniq.length} destino(s) distinto(s)`);
  for (const h of primary) {
    if (h.startsWith('#')) { W(`CTA aponta para âncora (${h}) — ok se for scroll até a oferta`); continue; }
    if (!/^https:\/\//i.test(h)) E(`CTA com href não-https: ${h}`);
  }
  if (uniq.length > 2) W(`CTAs com muitos destinos diferentes (${uniq.join(', ')}) — confirme se é intencional`);
  else ok('Destinos de CTA consistentes');
}

// ---------- propagação de query string ----------
head('Propagação de parâmetros (utm/src/aff)');
const jsFiles = [];
(function collect(dir) {
  if (!fs.existsSync(dir)) return;
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const f = path.join(dir, e.name);
    if (e.isDirectory()) collect(f);
    else if (f.endsWith('.js')) jsFiles.push(f);
  }
})(path.join(root, 'assets'));
const allJs = [html, ...jsFiles.map(read)].join('\n');
if (/URLSearchParams\s*\(\s*location\.search\s*\)|new URLSearchParams\(\s*window\.location\.search/.test(allJs) &&
    /data-cta/.test(allJs)) {
  ok('Snippet de propagação de query string encontrado');
} else {
  W('Não encontrei propagação de utm/src/aff para os CTAs — ver checkout-integrations.md §1');
}

// ---------- brief.json ----------
head('Coerência de checkout (brief.json)');
const briefPath = [
  path.join(root, 'brief.json'),
  path.join(root, '..', 'brief.json'),
  path.join(root, '..', '..', 'brief.json'),
].find(p => fs.existsSync(p));

if (!briefPath) {
  W('brief.json não encontrado — pulando checagem de plataforma de checkout');
} else {
  try {
    const brief = JSON.parse(read(briefPath));
    const url = brief.checkoutUrl || '';
    const plat = brief.checkoutPlatform || 'generic';
    if (!/^https:\/\//i.test(url)) E(`brief.checkoutUrl não é https: ${url}`);
    const hints = {
      kiwify: /kiwify\.com|kiwify\.com\.br|pay\.kiwify/i,
      hotmart: /hotmart\.com|pay\.hotmart/i,
      digistore24: /digistore24\.com/i,
      stripe: /buy\.stripe\.com|checkout\.stripe\.com/i,
    };
    if (hints[plat] && !hints[plat].test(url))
      W(`checkoutPlatform="${plat}" mas a URL não parece dessa plataforma: ${url}`);
    // o destino dos CTAs bate com o checkoutUrl?
    if (url && !html.includes(url.split('?')[0]))
      W('A checkoutUrl do brief não aparece literalmente no HTML — confira se os CTAs usam a URL certa');
    ok(`brief.json ok (plataforma: ${plat})`);
  } catch (e) {
    E(`brief.json inválido: ${e.message}`);
  }
}

// ---------- resultado ----------
head('Resultado');
log(`${errors ? C.red : C.green}${errors} erro(s)${C.reset}, ${warnings} aviso(s)`);
process.exit(errors ? 1 : 0);
