#!/usr/bin/env node
/**
 * scroll-qa.js — harness de QA visual de scroll (camada scroll-experience).
 *
 * Uso:  node scripts/scroll-qa.js <caminho> [--shots=12] [--viewport=390x844]
 *       <caminho> = pasta com index.html (aceita /, /src, /dist) ou um .html
 *
 * Abre a página num navegador headless (Edge/Chrome; defina BROWSER_PATH),
 * caminha o scroll em N posições, tira um screenshot de cada, monta um
 * contact sheet e um relatório. Detecta:
 *   - scroll morto (nada muda entre posições consecutivas)
 *   - overflow horizontal
 *   - elementos [data-animate] presos invisíveis dentro da viewport
 *   - <img>/<video> ausentes (naturalWidth 0 / erro de decode)
 *   - contraste fino de texto (cor computada vs background computado)
 *
 * SEM navegador: imprime o checklist manual de scroll-experience/visual-qa.md
 * e sai com código 0 (degrada, nunca quebra o build).
 *
 * Node puro. Node >= 20 (fetch e WebSocket globais).
 */
import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import os from 'node:os';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { C, log, ok, warn, err, head, resolveTarget } from './lib/util.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const args = process.argv.slice(2);
const target = args.find((a) => !a.startsWith('--'));
if (!target) {
  log('uso: node scripts/scroll-qa.js <caminho> [--shots=12] [--viewport=390x844]');
  process.exit(0);
}
const SHOTS = Math.max(4, parseInt((args.find((a) => a.startsWith('--shots=')) || '').split('=')[1] || '12', 10));
const VP = ((args.find((a) => a.startsWith('--viewport=')) || '').split('=')[1] || '390x844').split('x').map(Number);
const viewport = { w: VP[0] || 390, h: VP[1] || 844 };

const { htmlFile, root } = resolveTarget(target);
const outDir = root;

/* ---------- localizar navegador ---------- */
function findBrowser() {
  if (process.env.BROWSER_PATH && fs.existsSync(process.env.BROWSER_PATH)) return process.env.BROWSER_PATH;
  const c = [];
  if (process.platform === 'win32') {
    const pf = [process.env['PROGRAMFILES'], process.env['PROGRAMFILES(X86)'], process.env['LOCALAPPDATA']].filter(Boolean);
    for (const b of pf) {
      c.push(path.join(b, 'Microsoft/Edge/Application/msedge.exe'));
      c.push(path.join(b, 'Google/Chrome/Application/chrome.exe'));
    }
  } else if (process.platform === 'darwin') {
    c.push('/Applications/Google Chrome.app/Contents/MacOS/Google Chrome');
    c.push('/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge');
  } else {
    c.push('/usr/bin/google-chrome', '/usr/bin/chromium', '/usr/bin/chromium-browser', '/usr/bin/microsoft-edge');
  }
  return c.find((p) => { try { return fs.existsSync(p); } catch { return false; } }) || null;
}

/* ---------- checklist manual (degrade) ---------- */
function manualChecklist(reason) {
  head(`scroll-qa — sem navegador (${reason})`);
  warn('rodando em modo degradado: checklist manual (ver scroll-experience/visual-qa.md)');
  log(`
  [ ] Rolar a página inteira devagar. Nenhuma faixa de "scroll morto"
      (trechos onde rolar não muda nada visível).
  [ ] Sem scroll horizontal em 360 / 390 / 768 / 1440.
  [ ] Nenhum elemento preso invisível (opacity travada em 0) dentro da viewport.
  [ ] Nenhum elemento preso em opacity intermediária depois de já ter entrado.
  [ ] Nenhuma imagem/vídeo faltando (quadrado quebrado, poster sem fallback).
  [ ] Contraste de texto AA sobre o fundo real (inclusive sobre imagem/scrim).
  [ ] Conteúdo não cortado por overflow:hidden de container animado.
  [ ] prefers-reduced-motion: tudo aparece no estado final, nada preso.
  [ ] Feel check: role sem reler o brief, anote 1 palavra de emoção por seção,
      compare com a curva pretendida (feeling-curve.md §4).
  [ ] Squint test: desfoque a miniatura — primário/secundário/blocos ainda
      identificáveis (anti-ai.md §7).
`);
  log(`${C.gray}Para o harness automático: instale Edge ou Chrome, ou defina BROWSER_PATH.${C.reset}`);
  process.exit(0);
}

/* ---------- servidor estático mínimo ---------- */
function serve(dir) {
  const types = { '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript', '.mjs': 'text/javascript',
    '.json': 'application/json', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp',
    '.svg': 'image/svg+xml', '.woff2': 'font/woff2', '.woff': 'font/woff', '.mp4': 'video/mp4', '.webm': 'video/webm' };
  const srv = http.createServer((req, res) => {
    let p = decodeURIComponent(req.url.split('?')[0]);
    if (p === '/' || p.endsWith('/')) p += 'index.html';
    const full = path.join(dir, p);
    if (!full.startsWith(dir) || !fs.existsSync(full) || fs.statSync(full).isDirectory()) { res.writeHead(404); return res.end('404'); }
    res.writeHead(200, { 'content-type': types[path.extname(full).toLowerCase()] || 'application/octet-stream' });
    fs.createReadStream(full).pipe(res);
  });
  return new Promise((resolve) => srv.listen(0, '127.0.0.1', () => resolve({ srv, port: srv.address().port })));
}

/* ---------- CDP ---------- */
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
async function connectCDP(bin) {
  const ud = fs.mkdtempSync(path.join(os.tmpdir(), 'scrollqa-'));
  const port = 9300 + Math.floor(Math.random() * 400);
  const proc = spawn(bin, ['--headless=new', '--disable-gpu', '--no-sandbox', '--hide-scrollbars',
    '--force-device-scale-factor=1', `--user-data-dir=${ud}`, `--remote-debugging-port=${port}`, 'about:blank'],
    { stdio: 'ignore' });
  let list = null;
  for (let i = 0; i < 40 && !list; i++) {
    await sleep(250);
    try { list = await (await fetch(`http://127.0.0.1:${port}/json/list`)).json(); } catch {}
  }
  if (!list) { proc.kill(); throw new Error('devtools não respondeu'); }
  const tgt = list.find((t) => t.type === 'page');
  const ws = new WebSocket(tgt.webSocketDebuggerUrl);
  let id = 0; const pend = new Map();
  ws.onmessage = (e) => { const m = JSON.parse(e.data); if (m.id && pend.has(m.id)) { pend.get(m.id)(m.result || {}); pend.delete(m.id); } };
  await new Promise((r) => (ws.onopen = r));
  const cdp = (method, params = {}) => new Promise((res) => { const i = ++id; pend.set(i, res); ws.send(JSON.stringify({ id: i, method, params })); });
  await cdp('Page.enable'); await cdp('Runtime.enable');
  return { cdp, cleanup: () => { try { ws.close(); } catch {} proc.kill(); try { fs.rmSync(ud, { recursive: true, force: true }); } catch {} } };
}

const evalJS = async (cdp, expression, awaitPromise = false) => {
  const r = await cdp('Runtime.evaluate', { expression, returnByValue: true, awaitPromise });
  return r.result ? r.result.value : undefined;
};

/* ---------- probe injetado na página ---------- */
const PROBE = `(() => {
  const de = document.documentElement, b = document.body;
  const docH = Math.max(de.scrollHeight, b.scrollHeight);
  const overflowX = de.scrollWidth > de.clientWidth + 1;
  const widest = [];
  if (overflowX) {
    for (const el of document.querySelectorAll('*')) {
      const r = el.getBoundingClientRect();
      if (r.right > de.clientWidth + 2 || r.left < -2) widest.push((el.tagName.toLowerCase()) + (el.className && typeof el.className === 'string' ? '.' + el.className.trim().split(/\\s+/)[0] : ''));
      if (widest.length > 6) break;
    }
  }
  // elementos que deveriam animar mas estão presos
  const stuckHidden = [], stuckMid = [];
  const vpH = window.innerHeight;
  for (const el of document.querySelectorAll('[data-animate], .reveal, [data-sc-cue]')) {
    const r = el.getBoundingClientRect();
    const inView = r.top < vpH * 0.9 && r.bottom > vpH * 0.1;
    if (!inView) continue;
    const op = parseFloat(getComputedStyle(el).opacity);
    const passed = r.top < vpH * 0.6;
    if (op < 0.08) stuckHidden.push(el.tagName.toLowerCase() + (el.id ? '#' + el.id : ''));
    else if (passed && op < 0.85) stuckMid.push(el.tagName.toLowerCase() + (el.id ? '#' + el.id : ''));
  }
  // mídia ausente: só falha real (tentou carregar e veio vazio). Lazy ainda-não-carregada não conta.
  const media = [];
  for (const im of document.images) if (im.complete && im.naturalWidth === 0 && im.getAttribute('src')) media.push('img ' + (im.getAttribute('src') || '').slice(0, 60));
  for (const v of document.querySelectorAll('video')) if (v.error) media.push('video ' + (v.currentSrc || v.getAttribute('src') || '').slice(0, 60));
  return JSON.stringify({ docH, overflowX, widest, stuckHidden: [...new Set(stuckHidden)], stuckMid: [...new Set(stuckMid)], media: [...new Set(media)], y: window.scrollY });
})()`;

const CONTRAST_PROBE = `(() => {
  function lum(c){const s=c.map(v=>{v/=255;return v<=0.03928?v/12.92:Math.pow((v+0.055)/1.055,2.4)});return .2126*s[0]+.7152*s[1]+.0722*s[2]}
  function parse(str){const m=str.match(/rgba?\\(([^)]+)\\)/);if(!m)return null;const p=m[1].split(',').map(x=>parseFloat(x));if(p.length>=4&&p[3]===0)return null;return p.slice(0,3)}
  const bad=[];
  const walker=document.createTreeWalker(document.body,NodeFilter.SHOW_TEXT);
  const seen=new Set();let n;
  while(n=walker.nextNode()){
    const t=n.textContent.trim(); if(t.length<4)continue;
    const el=n.parentElement; if(!el||seen.has(el))continue; seen.add(el);
    const r=el.getBoundingClientRect(); if(r.top>window.innerHeight||r.bottom<0||r.width<8)continue;
    const cs=getComputedStyle(el); const fg=parse(cs.color); if(!fg)continue;
    let bgEl=el,bg=null;
    while(bgEl){const b=parse(getComputedStyle(bgEl).backgroundColor);if(b){bg=b;break}bgEl=bgEl.parentElement}
    if(!bg)bg=[255,255,255];
    const L1=lum(fg)+.05,L2=lum(bg)+.05; const ratio=L1>L2?L1/L2:L2/L1;
    const big=parseFloat(cs.fontSize)>=24||(parseFloat(cs.fontSize)>=18.66&&parseInt(cs.fontWeight)>=700);
    const floor=big?3:4.5;
    if(ratio<floor) bad.push((el.tagName.toLowerCase())+' "'+t.slice(0,32)+'" '+ratio.toFixed(2)+':1 (piso '+floor+')');
  }
  return JSON.stringify([...new Set(bad)].slice(0,20));
})()`;

/* ---------- main ---------- */
const bin = findBrowser();
if (!bin) manualChecklist('nenhum Edge/Chrome encontrado');

head(`scroll-qa · ${path.relative(process.cwd(), htmlFile)} · viewport ${viewport.w}×${viewport.h} · ${SHOTS} posições`);

let server, conn;
const findings = { blocker: [], high: [], medium: [] };
const shots = [];
try {
  const s = await serve(root);
  server = s.srv;
  const url = `http://127.0.0.1:${s.port}/${path.relative(root, htmlFile).split(path.sep).join('/')}`;

  conn = await connectCDP(bin);
  const { cdp } = conn;
  await cdp('Emulation.setDeviceMetricsOverride', { width: viewport.w, height: viewport.h, deviceScaleFactor: 1, mobile: true });
  await cdp('Page.navigate', { url });
  await sleep(1800);
  await evalJS(cdp, 'document.fonts && document.fonts.ready', true);
  await sleep(400);

  const first = JSON.parse(await evalJS(cdp, PROBE));
  const docH = first.docH;
  const maxScroll = Math.max(0, docH - viewport.h);
  const step = SHOTS > 1 ? maxScroll / (SHOTS - 1) : 0;

  let prevBuf = null, deadRun = 0;
  const probes = [];
  for (let i = 0; i < SHOTS; i++) {
    const y = Math.round(step * i);
    await evalJS(cdp, `window.scrollTo(0, ${y})`);
    await sleep(650);
    const p = JSON.parse(await evalJS(cdp, PROBE));
    probes.push(p);
    const shot = await cdp('Page.captureScreenshot', { format: 'png' });
    const buf = Buffer.from(shot.data, 'base64');
    shots.push(buf);
    if (prevBuf) {
      // similaridade grosseira por amostragem de bytes
      const a = prevBuf, b = buf; const L = Math.min(a.length, b.length);
      let same = 0, n = 0;
      for (let k = 1000; k < L; k += 97) { n++; if (a[k] === b[k]) same++; }
      const sim = same / n;
      const atEnd = y >= maxScroll - 2;
      if (sim > 0.995 && !atEnd && Math.abs(p.y - probes[i - 1].y) > 20) deadRun++;
      else deadRun = 0;
      if (deadRun >= 2) findings.high.push(`scroll morto perto de y≈${y}px (${(sim * 100).toFixed(1)}% igual em 3 posições)`);
    }
    prevBuf = buf;
  }

  // agrega achados dos probes
  const anyOverflow = probes.find((p) => p.overflowX);
  if (anyOverflow) findings.blocker.push(`overflow horizontal — elementos: ${anyOverflow.widest.join(', ') || '?'}`);
  const stuckHidden = [...new Set(probes.flatMap((p) => p.stuckHidden))];
  if (stuckHidden.length) findings.blocker.push(`elemento(s) preso(s) invisível(is) na viewport: ${stuckHidden.join(', ')}`);
  const stuckMid = [...new Set(probes.flatMap((p) => p.stuckMid))];
  if (stuckMid.length) findings.high.push(`opacity presa entre 0 e 1 (já entrou): ${stuckMid.join(', ')}`);
  const media = [...new Set(probes.flatMap((p) => p.media))];
  if (media.length) findings.blocker.push(`mídia ausente/quebrada: ${media.join(' | ')}`);

  // contraste (só topo da página, uma passada)
  await evalJS(cdp, 'window.scrollTo(0,0)'); await sleep(300);
  const badC = JSON.parse(await evalJS(cdp, CONTRAST_PROBE));
  if (badC.length) findings.medium.push(`contraste abaixo do piso (amostra topo): ${badC.slice(0, 6).join(' ; ')}${badC.length > 6 ? ` … +${badC.length - 6}` : ''}`);

  // reduced-motion: recarrega emulando e checa que nada ficou preso
  await cdp('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: 'reduce' }] });
  await cdp('Page.navigate', { url }); await sleep(1500);
  await evalJS(cdp, 'window.scrollTo(0, document.body.scrollHeight/2)'); await sleep(500);
  const rm = JSON.parse(await evalJS(cdp, PROBE));
  if (rm.stuckHidden.length) findings.blocker.push(`com prefers-reduced-motion: conteúdo preso invisível: ${rm.stuckHidden.join(', ')}`);

  // contact sheet: desenha os N screenshots num canvas e captura
  await cdp('Emulation.setEmulatedMedia', { features: [] });
  const cols = Math.min(SHOTS, 6);
  const thumbW = 260;
  const dataUrls = shots.map((b) => 'data:image/png;base64,' + b.toString('base64'));
  await cdp('Page.navigate', { url: 'about:blank' }); await sleep(200);
  await evalJS(cdp, `window.__u = ${JSON.stringify(dataUrls)};`);
  const sheetDim = await evalJS(cdp, `(async () => {
    const u = window.__u, cols = ${cols}, tw = ${thumbW};
    const imgs = await Promise.all(u.map(s => new Promise(r => { const i = new Image(); i.onload = () => r(i); i.src = s; })));
    const ar = imgs[0].height / imgs[0].width;
    const th = Math.round(tw * ar);
    const rows = Math.ceil(imgs.length / cols);
    const cv = document.createElement('canvas'); cv.width = cols * (tw + 8) + 8; cv.height = rows * (th + 24) + 8;
    const x = cv.getContext('2d'); x.fillStyle = '#0b0f14'; x.fillRect(0, 0, cv.width, cv.height);
    imgs.forEach((im, k) => {
      const cx = 8 + (k % cols) * (tw + 8), cy = 8 + Math.floor(k / cols) * (th + 24);
      x.drawImage(im, cx, cy, tw, th);
      x.fillStyle = '#9fb0c0'; x.font = '12px sans-serif'; x.fillText('#' + (k + 1), cx + 2, cy + th + 15);
    });
    document.body.style.margin = '0'; document.body.appendChild(cv);
    return JSON.stringify({ w: cv.width, h: cv.height });
  })()`, true);
  const dim = JSON.parse(sheetDim);
  await cdp('Emulation.setDeviceMetricsOverride', { width: dim.w, height: dim.h, deviceScaleFactor: 1, mobile: false });
  await sleep(200);
  const sheet = await cdp('Page.captureScreenshot', { format: 'png', clip: { x: 0, y: 0, width: dim.w, height: dim.h, scale: 1 }, captureBeyondViewport: true });
  fs.writeFileSync(path.join(outDir, 'scroll-qa-sheet.png'), Buffer.from(sheet.data, 'base64'));

} catch (e) {
  warn(`harness falhou (${e.message}) — caindo para checklist manual`);
  if (conn) conn.cleanup();
  if (server) server.close();
  manualChecklist(e.message);
} finally {
  if (conn) conn.cleanup();
  if (server) server.close();
}

/* ---------- relatório ---------- */
const nB = findings.blocker.length, nH = findings.high.length, nM = findings.medium.length;
head('Resultado');
for (const f of findings.blocker) err(`BLOCKER  ${f}`);
for (const f of findings.high) warn(`HIGH     ${f}`);
for (const f of findings.medium) log(`${C.gray}MEDIUM   ${f}${C.reset}`);
if (!nB && !nH && !nM) ok('nenhum problema de scroll detectado');
log(`\ncontact sheet: ${path.relative(process.cwd(), path.join(outDir, 'scroll-qa-sheet.png'))}`);

const md = `# scroll-qa — ${path.basename(root)}

- página: \`${path.relative(process.cwd(), htmlFile)}\`
- viewport: ${viewport.w}×${viewport.h} · posições amostradas: ${SHOTS}
- contact sheet: \`scroll-qa-sheet.png\`

## Achados

### Blocker (${nB})
${findings.blocker.map((f) => `- ${f}`).join('\n') || '- nenhum'}

### High (${nH})
${findings.high.map((f) => `- ${f}`).join('\n') || '- nenhum'}

### Medium (${nM})
${findings.medium.map((f) => `- ${f}`).join('\n') || '- nenhum'}

## Verificação manual ainda necessária (ver scroll-experience/visual-qa.md)

- [ ] Feel check: role sem reler o brief; 1 palavra de emoção por seção; compare com a curva pretendida.
- [ ] Squint test em 360 / 768 / 1440.
- [ ] O pico é a maior mudança visual e tem mais espaço de scroll?
- [ ] Contraste sobre imagem/scrim (o harness só mede sobre background-color).
`;
fs.writeFileSync(path.join(outDir, 'scroll-qa-report.md'), md);
log(`relatório: ${path.relative(process.cwd(), path.join(outDir, 'scroll-qa-report.md'))}`);

process.exit(nB ? 1 : 0);
