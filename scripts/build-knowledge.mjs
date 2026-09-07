#!/usr/bin/env node
/**
 * build-knowledge.mjs — compila o "cérebro" da skill (SKILL.md + references/ +
 * scroll-experience/) em um módulo JS único que as funções serverless da
 * PageForge AI importam. Roda no build da Vercel e localmente.
 *
 * Saída: api/_lib/knowledge.generated.js  (commitado; regenerado no deploy)
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT = path.join(ROOT, 'api', '_lib', 'knowledge.generated.js');

function read(rel) {
  try { return fs.readFileSync(path.join(ROOT, rel), 'utf8').trim(); }
  catch { return ''; }
}

/** remove frontmatter YAML e comprime linhas em branco repetidas */
function tidy(md) {
  return md
    .replace(/^---\n[\s\S]*?\n---\n/, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

const references = {};
for (const f of fs.readdirSync(path.join(ROOT, 'references')).filter((n) => n.endsWith('.md'))) {
  references[f.replace(/\.md$/, '')] = tidy(read(`references/${f}`));
}
const scrollExperience = {};
for (const f of fs.readdirSync(path.join(ROOT, 'scroll-experience')).filter((n) => n.endsWith('.md'))) {
  scrollExperience[f.replace(/\.md$/, '')] = tidy(read(`scroll-experience/${f}`));
}

const payload = {
  builtAt: new Date().toISOString(),
  skill: tidy(read('SKILL.md')),
  productSchema: read('schemas/product.schema.json'),
  references,
  scrollExperience,
};

const banner = `// AUTO-GERADO por scripts/build-knowledge.mjs — NÃO editar à mão.\n// Fonte: SKILL.md + references/*.md + scroll-experience/*.md\n`;
fs.mkdirSync(path.dirname(OUT), { recursive: true });
fs.writeFileSync(OUT, `${banner}export const KNOWLEDGE = ${JSON.stringify(payload)};\nexport default KNOWLEDGE;\n`);

const kb = (JSON.stringify(payload).length / 1024).toFixed(0);
console.log(`knowledge.generated.js — ${Object.keys(references).length} references, ${Object.keys(scrollExperience).length} scroll-experience docs, ${kb} KB`);
