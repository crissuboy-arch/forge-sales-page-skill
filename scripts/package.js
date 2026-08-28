#!/usr/bin/env node
/**
 * package.js — finaliza dist/ e gera dist/pagina.zip.
 * Uso: node scripts/package.js <output/<slug>  |  pasta com dist/>
 *
 * - finaliza dist/README-PUBLICAR.md (com dados do zip e slots de mídia)
 * - gera dist/pagina.zip (ZIP nativo em Node puro; sem dependências)
 * - confere que o zip abre e lista o conteúdo
 */
import fs from 'node:fs';
import path from 'node:path';
import { C, log, ok, warn, err, head, read, exists, walk, fmtBytes } from './lib/util.js';
import { zipDir } from './lib/zip.js';
import { writeReadme } from './lib/readme.js';

const arg = process.argv[2];
if (!arg) { log('Uso: node scripts/package.js <output/<slug>>'); process.exit(0); }

const base = path.resolve(process.cwd(), arg);
let distDir = null, projectDir = null;
if (exists(path.join(base, 'dist', 'index.html'))) { distDir = path.join(base, 'dist'); projectDir = base; }
else if (path.basename(base) === 'dist' && exists(path.join(base, 'index.html'))) { distDir = base; projectDir = path.dirname(base); }
if (!distDir) { err('Nenhum dist/index.html encontrado. Rode antes: node scripts/build.js ' + arg); process.exit(1); }

head(`Empacotando: ${path.relative(process.cwd(), distDir)}`);

// brief.json
let brief = null;
const briefPath = path.join(projectDir, 'brief.json');
if (exists(briefPath)) { try { brief = JSON.parse(read(briefPath)); } catch (e) { warn(`brief.json inválido: ${e.message}`); } }

// remover zip antigo para não se auto-incluir
const zipPath = path.join(distDir, 'pagina.zip');
if (exists(zipPath)) fs.rmSync(zipPath);

// README base (sem info do zip ainda)
writeReadme(distDir, brief, { finalize: false });

// gerar zip (tudo dentro de dist/, exceto o próprio zip que ainda não existe)
head('Gerando pagina.zip');
let result;
try {
  result = zipDir(distDir, zipPath);
  ok(`pagina.zip criado — ${result.fileCount} arquivos, ${fmtBytes(result.bytes)}`);
} catch (e) {
  err(`Falha ao gerar o zip: ${e.message}`);
  warn('Fallback: compacte a pasta dist/ manualmente (clique direito → Enviar para → Pasta compactada).');
  process.exit(1);
}

// validar o zip (assinatura + End Of Central Directory)
const buf = fs.readFileSync(zipPath);
const okSig = buf.readUInt32LE(0) === 0x04034b50 || buf.length === 22;
const hasEOCD = buf.includes(Buffer.from([0x50, 0x4b, 0x05, 0x06]));
if (okSig && hasEOCD) ok('estrutura do zip válida (PK / EOCD presentes)');
else warn('não consegui validar a estrutura do zip — teste extraindo manualmente');

// README final (agora com a linha do zip)
writeReadme(distDir, brief, { finalize: true });
ok('dist/README-PUBLICAR.md finalizado');

// resumo
head('Conteúdo do dist/');
for (const f of walk(distDir).sort()) {
  log(`  ${path.relative(distDir, f).padEnd(42)} ${fmtBytes(fs.statSync(f).size)}`);
}
const total = walk(distDir).reduce((s, f) => s + fs.statSync(f).size, 0);
log(`\n${C.green}Pronto para publicar.${C.reset} Total: ${fmtBytes(total)}`);
log(`Entregue ao usuário: ${path.relative(process.cwd(), distDir)}/ (index.html, assets/, README-PUBLICAR.md, pagina.zip)`);
