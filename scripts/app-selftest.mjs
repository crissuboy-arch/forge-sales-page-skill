#!/usr/bin/env node
/**
 * app-selftest.mjs — testes da camada PageForge AI, em Node puro (sem deps).
 * Cobre: sanitize, knowledge corpus, prompt, postprocess, mock, providers.
 * Roda offline. Uso: node scripts/app-selftest.mjs
 */
import assert from 'node:assert/strict';
import { sanitizeBrief } from '../api/_lib/sanitize.js';
import { buildKnowledgeCorpus } from '../api/_lib/knowledge.js';
import { buildMessages, buildSectionMessages } from '../api/_lib/prompt.js';
import { postprocess, extractHtml, analyzeHtml } from '../api/_lib/postprocess.js';
import { mockGenerate } from '../api/_lib/mock.js';
import { getProvider, listProviders } from '../api/_lib/providers.js';

let pass = 0;
const t = (name, fn) => {
  try { fn(); pass++; console.log(`  ok  ${name}`); }
  catch (e) { console.error(`  FAIL ${name}\n       ${e.message}`); process.exitCode = 1; }
};

// ---------- sanitize ----------
t('sanitize: exige produto ou descrição', () => {
  const r = sanitizeBrief({});
  assert.equal(r.ok, false);
  assert.ok(r.errors.length);
});
t('sanitize: normaliza listas de string multi-linha', () => {
  const r = sanitizeBrief({ productName: 'X', benefits: 'a\nb\nc' });
  assert.deepEqual(r.value.benefits, ['a', 'b', 'c']);
});
t('sanitize: rejeita URL não-http', () => {
  const r = sanitizeBrief({ productName: 'X', checkoutUrl: 'javascript:alert(1)' });
  assert.equal(r.value.checkoutUrl, '');
});
t('sanitize: preserva fragmento #aff= na URL de afiliado', () => {
  const u = 'https://x.com/p/HD.htm#aff=abc123';
  const r = sanitizeBrief({ productName: 'X', affiliateUrl: u });
  assert.equal(r.value.affiliateUrl, u);
  assert.equal(r.value.affiliate, true);
  assert.equal(r.value.checkoutUrl, u);
});
t('sanitize: advertorial não passa de MOTION', () => {
  const r = sanitizeBrief({ productName: 'X', description: 'algo educativo', pageType: 'advertorial', scrollMode: 'storytelling' });
  assert.equal(r.value.scrollMode, 'motion');
});
t('sanitize: detecta nicho sensível por heurística', () => {
  const r = sanitizeBrief({ productName: 'X', niche: 'suplemento para energia e saúde' });
  assert.equal(r.value.sensitive, true);
});
t('sanitize: corta strings gigantes', () => {
  const r = sanitizeBrief({ productName: 'X'.repeat(5000) });
  assert.ok(r.value.productName.length <= 200);
});

// ---------- knowledge ----------
t('knowledge: corpus inclui método e referências do formato', () => {
  const c = buildKnowledgeCorpus({ pageType: 'presell', scrollMode: 'static', affiliate: true, sensitive: true });
  assert.ok(c.includes('MÉTODO FORGE'));
  assert.ok(/presell/i.test(c));
  assert.ok(/affiliate-pages/i.test(c));
  assert.ok(c.length > 5000 && c.length <= 48200);
});
t('knowledge: cinematic puxa camada de motion', () => {
  const c = buildKnowledgeCorpus({ pageType: 'sales', scrollMode: 'cinematic' });
  assert.ok(/feeling-curve|scroll-grammars/i.test(c));
});

// ---------- prompt ----------
t('prompt: system tem identidade + contrato de saída + guardrails', () => {
  const { value } = sanitizeBrief({ productName: 'Curso X', description: 'ensina Y', pageType: 'sales' });
  const { system, user } = buildMessages(value);
  assert.ok(system.includes('PageForge AI'));
  assert.ok(system.includes('CONTRATO DE SAÍDA'));
  assert.ok(/nunca invente/i.test(system));
  assert.ok(user.includes('{{CHECKOUT_URL}}') || user.includes('Substituições'));
});
t('prompt: seção usa currentHtml e instrução', () => {
  const { value } = sanitizeBrief({ productName: 'X', description: 'desc' });
  const { user } = buildSectionMessages(value, '<!DOCTYPE html><html><body>oi</body></html>', 'Melhorar o hero');
  assert.ok(user.includes('Melhorar o hero'));
  assert.ok(user.includes('PÁGINA ATUAL'));
});

// ---------- postprocess ----------
t('extractHtml: remove cercas markdown', () => {
  const h = extractHtml('Claro!\n```html\n<!DOCTYPE html><html><head></head><body>x</body></html>\n```\npronto');
  assert.ok(h.startsWith('<!DOCTYPE html'));
  assert.ok(h.endsWith('</html>'));
});
t('postprocess: injeta viewport/canonical/reduced-motion e CTA plumbing', () => {
  const raw = '<!DOCTYPE html><html><head><title>t</title></head><body><h1>H</h1><a class="cta" data-cta="primary" href="{{CHECKOUT_URL}}">Ir</a><p>corpo com bastante texto para passar do limite minimo de tamanho da pagina gerada pela ia</p>'.padEnd(1800, '.') + '</body></html>';
  const { value } = sanitizeBrief({ productName: 'X', description: 'desc', checkoutUrl: 'https://pay.x.com/abc' });
  const pp = postprocess(raw, value);
  assert.ok(pp.html.includes('viewport'));
  assert.ok(pp.html.includes('canonical'));
  assert.ok(pp.html.includes('prefers-reduced-motion'));
  assert.ok(pp.html.includes('https://pay.x.com/abc'));
  assert.ok(pp.html.includes('URLSearchParams'));
  assert.equal(pp.ok, true);
});
t('postprocess: remove Review/AggregateRating do JSON-LD', () => {
  const raw = `<!DOCTYPE html><html><head><title>t</title><script type="application/ld+json">{"@type":"Product","name":"X","aggregateRating":{"@type":"AggregateRating","ratingValue":"4.9","reviewCount":"120"}}</` + `script></head><body><h1>H</h1><a data-cta="primary" href="#o">x</a>${'.'.repeat(1700)}</body></html>`;
  const { value } = sanitizeBrief({ productName: 'X', description: 'desc' });
  const pp = postprocess(raw, value);
  assert.ok(!/aggregateRating|ratingValue|reviewCount/i.test(pp.html));
  assert.ok(pp.warnings.some((w) => /Review\/AggregateRating/i.test(w)));
});
t('analyzeHtml: flagra termo proibido e h1 múltiplo', () => {
  const html = '<!DOCTYPE html><html><body><h1>a</h1><h1>b</h1><p>resultado garantido e renda garantida</p><a data-cta="x" href="#">c</a></body></html>';
  const { value } = sanitizeBrief({ productName: 'X', description: 'desc' });
  const a = analyzeHtml(html, value);
  assert.ok(a.warnings.some((w) => /risco/i.test(w)));
  assert.ok(a.warnings.some((w) => /h1/i.test(w)));
});

// ---------- mock ----------
t('mock: gera HTML válido que passa no postprocess', () => {
  const { value } = sanitizeBrief({
    productName: 'Método Aurora', description: 'programa de hábitos', niche: 'produtividade',
    benefits: 'foco\nconstância', pains: 'procrastinação', cta: 'Quero começar',
    checkoutUrl: 'https://pay.kiwify.com.br/abc', price: 'R$ 197',
  });
  const html = mockGenerate(value);
  const pp = postprocess(html, value);
  assert.equal(pp.ok, true, pp.errors.join(';'));
  assert.ok(pp.html.includes('https://pay.kiwify.com.br/abc'));
  assert.equal((pp.html.match(/<h1/g) || []).length, 1);
});
t('mock: nicho sensível adiciona disclaimer', () => {
  const { value } = sanitizeBrief({ productName: 'X', niche: 'suplemento saúde', description: 'energia celular' });
  const html = mockGenerate(value);
  assert.ok(/resultados podem variar|não substitui/i.test(html));
});

// ---------- providers ----------
t('providers: nvidia é o default e reporta config', () => {
  assert.ok(listProviders().includes('nvidia'));
  const p = getProvider();
  assert.equal(p.name, 'nvidia');
  assert.equal(typeof p.isConfigured(), 'boolean');
  assert.ok(p.model.includes('/'));
});
t('providers: chat sem chave lança MISSING_KEY', async () => {
  const p = getProvider('nvidia', { apiKey: '' });
  await assert.rejects(() => p.chat({ system: 's', user: 'u' }), (e) => e.code === 'MISSING_KEY');
});

console.log(`\n${process.exitCode ? 'FALHOU' : 'OK'} — ${pass} testes passaram.`);
