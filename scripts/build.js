#!/usr/bin/env node
/**
 * build.js — monta o pacote dist/ a partir de output/<slug>/src/
 * Uso: node scripts/build.js <output/<slug>  |  pasta com src/  |  pasta src>
 *
 * - copia src/ → dist/
 * - minificação conservadora de .css e .js próprios (comentários + espaços)
 * - injeta marcadores e disclaimers de compliance (a partir de brief.json)
 * - valida que index.html abre sem servidor (sem caminhos absolutos "/")
 * - gera dist/README-PUBLICAR.md (base; package.js finaliza)
 * Nunca inventa copy: só sinaliza o que falta.
 */
import fs from 'node:fs';
import path from 'node:path';
import {
  C, log, ok, warn, err, head, read, exists, copyDir, rmrf, walk, fmtBytes,
} from './lib/util.js';
import { writeReadme } from './lib/readme.js';

const arg = process.argv[2];
if (!arg) { log('Uso: node scripts/build.js <output/<slug>>'); process.exit(0); }

const base = path.resolve(process.cwd(), arg);
if (!exists(base)) { err(`Não encontrado: ${base}`); process.exit(1); }

// localizar src/
let srcDir = null, projectDir = null;
if (exists(path.join(base, 'src', 'index.html'))) { srcDir = path.join(base, 'src'); projectDir = base; }
else if (exists(path.join(base, 'index.html')) && path.basename(base) === 'src') { srcDir = base; projectDir = path.dirname(base); }
else if (exists(path.join(base, 'index.html'))) { srcDir = base; projectDir = base; }
if (!srcDir) { err('Nenhum index.html em <arg>, <arg>/src'); process.exit(1); }

const distDir = path.join(projectDir, 'dist');
head(`Build: ${path.relative(process.cwd(), srcDir)} → ${path.relative(process.cwd(), distDir)}`);

// brief.json (opcional)
let brief = null;
const briefPath = path.join(projectDir, 'brief.json');
if (exists(briefPath)) {
  try { brief = JSON.parse(read(briefPath)); ok('brief.json carregado'); }
  catch (e) { warn(`brief.json inválido: ${e.message}`); }
} else warn('brief.json não encontrado (README-PUBLICAR.md sairá genérico)');

// limpar e copiar
rmrf(distDir);
copyDir(srcDir, distDir);
ok('src/ copiado para dist/');

// -------- minificação conservadora --------
head('Minificação (conservadora)');
let saved = 0;
for (const f of walk(distDir, p => /\.(css|js)$/.test(p) && !/vendor|\.min\./.test(p))) {
  const before = fs.statSync(f).size;
  let code = read(f);
  if (f.endsWith('.css')) {
    code = code.replace(/\/\*[^*]*\*+(?:[^/*][^*]*\*+)*\//g, '') // comentários
               .replace(/\s+/g, ' ')
               .replace(/\s*([{}:;,>])\s*/g, '$1')
               .replace(/;}/g, '}')
               .trim();
  } else {
    // JS: só remove comentários de linha e blocos óbvios + linhas em branco.
    // Não faz mangling (arriscado sem parser). Preserva // dentro de strings de forma best-effort.
    code = code.replace(/^\s*\/\/.*$/gm, '')
               .replace(/\/\*[\s\S]*?\*\//g, '')
               .replace(/\n\s*\n+/g, '\n')
               .trim() + '\n';
  }
  fs.writeFileSync(f, code);
  saved += before - Buffer.byteLength(code);
}
ok(`~${fmtBytes(Math.max(0, saved))} economizados em CSS/JS próprios`);

// -------- checagem "abre sem servidor" --------
head('Portabilidade (abrir sem servidor)');
const indexPath = path.join(distDir, 'index.html');
let html = read(indexPath);
const absRefs = [...html.matchAll(/\b(?:href|src)\s*=\s*["']\/(?!\/)[^"']*["']/gi)].map(m => m[0]);
if (absRefs.length) {
  err(`${absRefs.length} referência(s) com caminho absoluto "/..." — quebram ao abrir o arquivo local:`);
  absRefs.slice(0, 8).forEach(r => log(`   ${r}`));
  process.exitCode = 1;
} else ok('sem caminhos absolutos — index.html abre direto no navegador');

// -------- injeção de compliance --------
head('Compliance');
const sensitive = brief && (brief.compliance?.sensitiveNiche || (brief.compliance?.categories || []).length);
if (!html.includes('<!-- FORGE:ANALYTICS -->')) {
  html = html.replace(/<\/head>/i,
    `  <!-- FORGE:ANALYTICS — cole aqui GA4 / Meta Pixel / GTM. Instruções no README-PUBLICAR.md -->\n</head>`);
}
if (sensitive) {
  const cats = brief.compliance.categories || [];
  const bits = ['<p><strong>Aviso:</strong> Este conteúdo é informativo. Resultados variam conforme empenho, contexto e outros fatores, e não são garantidos.</p>'];
  if (cats.includes('health') || cats.includes('weight-loss') || cats.includes('supplements'))
    bits.push('<p>As informações aqui não substituem avaliação, diagnóstico ou acompanhamento médico ou profissional de saúde.</p>');
  if (cats.includes('finance') || cats.includes('make-money') || cats.includes('crypto'))
    bits.push('<p>Nada nesta página constitui recomendação de investimento. Investimentos envolvem risco, inclusive de perda do capital. Retornos passados não garantem resultados futuros.</p>');
  if (cats.includes('relationship'))
    bits.push('<p>Este material oferece ferramentas de comunicação e autoconhecimento e não garante qualquer resultado em relacionamentos.</p>');
  const marker = '<!-- FORGE:DISCLAIMER -->';
  if (!html.includes(marker)) {
    const block = `\n${marker}\n<aside class="forge-disclaimer" role="note">\n${bits.join('\n')}\n</aside>\n`;
    if (/<\/footer>/i.test(html)) html = html.replace(/<\/footer>/i, `${block}</footer>`);
    else html = html.replace(/<\/body>/i, `${block}</body>`);
    ok(`bloco de isenção injetado (categorias: ${cats.join(', ') || 'nicho sensível'})`);
  } else ok('bloco de isenção já presente');
  // checagem de links legais
  for (const [re, label] of [
    [/pol[ií]tica de privacidade/i, 'Política de Privacidade'],
    [/termos de uso|termos e condi/i, 'Termos de Uso'],
  ]) if (!re.test(html)) warn(`nicho sensível: link "${label}" não encontrado no HTML — adicione no rodapé`);
} else {
  ok('nicho não sensível — nenhuma injeção obrigatória');
}

fs.writeFileSync(indexPath, html);

// -------- README base --------
head('README-PUBLICAR.md');
writeReadme(distDir, brief, { finalize: false });
ok('dist/README-PUBLICAR.md gerado (base)');

// -------- resumo --------
head('Resumo do dist/');
const files = walk(distDir);
const total = files.reduce((s, f) => s + fs.statSync(f).size, 0);
log(`  ${files.length} arquivos, ${fmtBytes(total)} no total`);
log(`\n${C.green}Build concluído.${C.reset} Próximo: node scripts/package.js ${path.relative(process.cwd(), projectDir)}`);
