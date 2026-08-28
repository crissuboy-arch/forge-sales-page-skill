// Utilitários compartilhados pelos scripts da skill. Node puro, sem dependências.
import fs from 'node:fs';
import path from 'node:path';

export const C = {
  reset: '\x1b[0m', red: '\x1b[31m', green: '\x1b[32m', yellow: '\x1b[33m',
  blue: '\x1b[34m', gray: '\x1b[90m', bold: '\x1b[1m',
};

export function log(msg = '') { process.stdout.write(msg + '\n'); }
export function ok(m) { log(`${C.green}✓${C.reset} ${m}`); }
export function warn(m) { log(`${C.yellow}!${C.reset} ${m}`); }
export function err(m) { log(`${C.red}✗${C.reset} ${m}`); }
export function head(m) { log(`\n${C.bold}${m}${C.reset}`); }

export function fail(msg) { err(msg); process.exit(1); }

export function resolveTarget(arg, { wantSrc = false } = {}) {
  if (!arg) return null;
  let p = path.resolve(process.cwd(), arg);
  if (!fs.existsSync(p)) fail(`Caminho não encontrado: ${p}`);
  const stat = fs.statSync(p);
  if (stat.isFile() && p.endsWith('.html')) return { htmlFile: p, root: path.dirname(p) };
  // diretório: procurar index.html em p, p/src, p/dist
  const candidates = wantSrc
    ? [path.join(p, 'src'), p, path.join(p, 'dist')]
    : [p, path.join(p, 'src'), path.join(p, 'dist')];
  for (const dir of candidates) {
    const idx = path.join(dir, 'index.html');
    if (fs.existsSync(idx)) return { htmlFile: idx, root: dir };
  }
  fail(`Nenhum index.html encontrado em: ${p} (nem em /src ou /dist)`);
}

export function read(f) { return fs.readFileSync(f, 'utf8'); }
export function exists(f) { return fs.existsSync(f); }

export function walk(dir, filterFn = () => true, out = []) {
  if (!fs.existsSync(dir)) return out;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, filterFn, out);
    else if (filterFn(full)) out.push(full);
  }
  return out;
}

export function copyDir(src, dest) {
  fs.mkdirSync(dest, { recursive: true });
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const s = path.join(src, entry.name);
    const d = path.join(dest, entry.name);
    if (entry.isDirectory()) copyDir(s, d);
    else fs.copyFileSync(s, d);
  }
}

export function rmrf(p) { if (fs.existsSync(p)) fs.rmSync(p, { recursive: true, force: true }); }

// extrai atributos simples de tags — suficiente para QA estático, não é um parser HTML completo
export function matchTags(html, tag) {
  const re = new RegExp(`<${tag}\\b[^>]*>`, 'gi');
  return html.match(re) || [];
}
export function attr(tagStr, name) {
  const re = new RegExp(`${name}\\s*=\\s*("([^"]*)"|'([^']*)'|([^\\s>]+))`, 'i');
  const m = tagStr.match(re);
  return m ? (m[2] ?? m[3] ?? m[4] ?? '') : null;
}

export function fmtBytes(n) {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / 1024 / 1024).toFixed(2)} MB`;
}

// contraste WCAG a partir de hex
export function contrastRatio(hex1, hex2) {
  const L = (hex) => {
    const c = hex.replace('#', '');
    const full = c.length === 3 ? c.split('').map(x => x + x).join('') : c;
    const [r, g, b] = [0, 2, 4].map(i => parseInt(full.slice(i, i + 2), 16) / 255)
      .map(v => (v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4)));
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  };
  try {
    const l1 = L(hex1), l2 = L(hex2);
    return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
  } catch { return null; }
}
