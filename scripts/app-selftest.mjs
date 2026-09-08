#!/usr/bin/env node
/**
 * app-selftest.mjs — testes da camada PageForge AI, em Node puro (sem deps).
 * Cobre: sanitize, knowledge corpus, prompt, postprocess, mock, providers.
 * Roda offline. Uso: node scripts/app-selftest.mjs
 */
import assert from 'node:assert/strict';
import { sanitizeBrief } from '../api/_lib/sanitize.js';
import { buildKnowledgeCorpus } from '../api/_lib/knowledge.js';
import { buildMessages, buildSectionMessages, buildPlanMessages, buildRenderMessages } from '../api/_lib/prompt.js';
import { postprocess, extractHtml, analyzeHtml } from '../api/_lib/postprocess.js';
import { assemblePage, parseJsonLoose } from '../api/_lib/assemble.js';
import { mockGenerate, mockPlan, mockSections } from '../api/_lib/mock.js';
import { getProvider, listProviders } from '../api/_lib/providers.js';
import { scoreLead, normalizeLead, leadToBriefing, slugify, LEAD_STATUS } from '../api/_lib/prospect.js';
import { mockProspect, aisaConfigured } from '../api/_lib/aisa.js';
import { impeccableQa } from '../api/_lib/impeccable-qa.js';
import { designQuality, designProfile, visitorMode } from '../api/_lib/design-quality.js';
import { buildProposal, buildEmailDraft, buildContract, gmailComposeUrl } from '../api/_lib/commercial.js';
import { normStatus, pushHistory } from '../api/_lib/prospect.js';

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
  assert.ok(c.length > 4000 && c.length <= 20200);
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

// ---------- geração em etapas ----------
t('prompt: buildPlanMessages pede JSON de plano', () => {
  const { value } = sanitizeBrief({ productName: 'X', description: 'desc longa o suficiente', pageType: 'presell' });
  const { system, user } = buildPlanMessages(value);
  assert.ok(/CONTRATO DE SAÍDA — PLANO/.test(system));
  assert.ok(/"sections"/.test(system));
  assert.ok(/PLANO da página/i.test(user));
});
t('prompt: buildRenderMessages traz contrato de classes e só os ids pedidos', () => {
  const { value } = sanitizeBrief({ productName: 'X', description: 'desc longa', checkoutUrl: 'https://a.com/c' });
  const plan = { lang: 'pt-BR', ctaText: 'Ir', sections: [{ id: 'hero', kind: 'hero', goal: 'g', copy: 'H' }, { id: 'faq', kind: 'faq', goal: 'g', copy: 'Q' }] };
  const { system, user } = buildRenderMessages(value, plan, ['hero']);
  assert.ok(/pf-wrap|Classes disponíveis/.test(system));
  assert.ok(user.includes('hero'));
  assert.ok(!user.includes('faq'));
});
t('assemble: monta documento com head/style paramétrico/jsonld/base-js e ordem do plano', () => {
  const { value } = sanitizeBrief({ productName: 'Aurora', description: 'desc', checkoutUrl: 'https://pay.x/c' });
  const plan = { lang: 'pt-BR', brandName: 'Aurora', title: 'T', description: 'D', styleTokens: { mood: 'clean', accent: '#123456' }, sections: [{ id: 'hero' }, { id: 'footer' }] };
  const sections = { footer: '<footer class="pf-footer">rodapé</footer>', hero: '<header class="pf-hero"><div class="pf-wrap"><h1>Oi</h1><a class="cta" data-cta="primary" href="{{CHECKOUT_URL}}">x</a></div></header>' };
  const doc = assemblePage(value, plan, sections);
  assert.ok(doc.startsWith('<!DOCTYPE html>'));
  assert.ok(doc.indexOf('pf-hero') < doc.indexOf('pf-footer')); // ordem do plano
  assert.ok(doc.includes('prefers-reduced-motion'));
  assert.ok(doc.includes('--accent:#123456'));
  assert.ok(doc.includes('application/ld+json'));
  assert.ok(doc.includes('data-cta'));
  const pp = postprocess(doc.replace(/\{\{CHECKOUT_URL\}\}/g, 'https://pay.x/c'), value);
  assert.equal(pp.ok, true, pp.errors.join(';'));
  assert.ok(pp.html.includes('https://pay.x/c'));
});
t('theme: buildStylesheet gera CSS com tokens e classes pf-*', async () => {
  const { buildStylesheet } = await import('../api/_lib/theme.js');
  const css = buildStylesheet({ mood: 'editorial', accent: '#0a5', ink: '#111' });
  assert.ok(css.includes('.pf-wrap') && css.includes('.cta') && css.includes('.pf-faq'));
  assert.ok(css.includes('--accent:#0a5'));
  assert.ok(css.includes('prefers-reduced-motion'));
});
t('assemble: parseJsonLoose tolera cercas e trailing comma', () => {
  assert.deepEqual(parseJsonLoose('```json\n{"a":1,"b":[1,2,]}\n```'), { a: 1, b: [1, 2] });
  assert.equal(parseJsonLoose('sem json aqui'), null);
});
t('mock: mockPlan + mockSections + assemble = página válida', () => {
  const { value } = sanitizeBrief({ productName: 'Aurora', description: 'programa de hábitos', benefits: 'foco\nconstância', checkoutUrl: 'https://pay.kiwify.com.br/x', price: 'R$ 197' });
  const plan = mockPlan(value);
  const ids = plan.sections.map((s) => s.id);
  const secs = mockSections(value, plan, ids);
  assert.equal(Object.keys(secs).length, ids.length);
  const pp = postprocess(assemblePage(value, plan, secs), value);
  assert.equal(pp.ok, true, pp.errors.join(';'));
  assert.equal((pp.html.match(/<h1/g) || []).length, 1);
  assert.ok(pp.html.includes('pay.kiwify.com.br/x'));
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

// ---------- PROSPECÇÃO (Máquina de Leads integrada) ----------
t('prospect: scoreLead — nota+avaliações+site+ig → score/temperatura', () => {
  const alto = scoreLead({ nota: 4.9, avaliacoes: 200, siteAntigo: 'https://x.pt', igAtivo: true, igSeguidores: 5000 });
  assert.ok(alto.score >= 70 && alto.temperatura === 'quente');
  const baixo = scoreLead({ nota: 3.9, avaliacoes: 2 });
  assert.ok(baixo.score < 45 && baixo.temperatura === 'frio');
  assert.ok(alto.score <= 100 && baixo.score >= 0);
});
t('prospect: normalizeLead limpa contatos, deriva slug, score e diagnóstico', () => {
  const l = normalizeLead({ title: 'Dra. Ana Nutri', category: 'Nutricionista', city: 'Porto', rating: { value: 4.7, votes_count: 60 }, phone: '+351 912 345 678', url: 'https://instagram.com/ana.nutri' }, 'nutricionista em Porto');
  assert.equal(l.nome, 'Dra. Ana Nutri');
  assert.equal(l.instagram, 'ana.nutri');
  assert.equal(l.whatsapp, '+351912345678');
  assert.ok(l.slug && l.slug.length > 3);
  assert.ok(typeof l.score === 'number' && l.diagnostico.length > 0);
  assert.ok(LEAD_STATUS.includes(l.status));
});
t('prospect: leadToBriefing gera briefing do PageForge com WhatsApp e sem inventar', () => {
  const lead = normalizeLead({ title: 'Clínica Sorriso', category: 'Dentista', city: 'Lisboa', rating: { value: 4.8, votes_count: 130 }, phone: '+351911222333', url: null }, 'dentista em Lisboa');
  const { brief, pageType, source } = leadToBriefing(lead);
  assert.equal(pageType, 'sales');
  assert.equal(brief.productName, 'Clínica Sorriso');
  assert.ok(brief.checkoutUrl.startsWith('https://wa.me/351911222333'));
  assert.ok(/não inventar/i.test(brief.notes));
  assert.ok(brief.proof.some((p) => /Google/.test(p)));
  assert.equal(source.kind, 'lead');
});
t('prospect: slugify remove acentos e caracteres', () => {
  assert.equal(slugify('Café João & Cia — Ltda!'), 'cafe-joao-cia-ltda');
});
t('aisa: mockProspect devolve leads normalizados com score', () => {
  const r = mockProspect({ niche: 'advogado', city: 'São Paulo', count: 4 });
  assert.equal(r.leads.length, 4);
  assert.ok(r.mock === true);
  assert.ok(r.leads.every((l) => typeof l.score === 'number' && l.slug && l.temperatura));
  assert.equal(typeof aisaConfigured(), 'boolean');
});

// ---------- IMPECCABLE QA (camada de acabamento) ----------
t('impeccable: audita 5 dimensões e retorna score /20', () => {
  const html = '<!DOCTYPE html><html lang="pt-BR"><head><title>t</title><style>:root{--accent:#0a5}img,svg{max-width:100%}@media (max-width:640px){body{padding:0}}@media (prefers-reduced-motion:reduce){*{transition:none}}</style></head><body><header><h1>Título</h1></header><main><p>corpo</p></main><footer>rodapé</footer></body></html>';
  const r = impeccableQa(html, { language: 'pt-BR' });
  assert.ok(r.score >= 0 && r.score <= 20);
  assert.ok(['acessibilidade', 'performance', 'responsivo', 'theming', 'integridade'].every((k) => k in r.dims));
  assert.ok(typeof r.band === 'string');
});
t('impeccable: aplica correções seguras (alt, viewport, reduced-motion, eyebrow)', () => {
  const html = '<html><head><title>t</title><style>body{margin:0}</style></head><body><p class="pf-eyebrow">Kicker</p><h1>H</h1><img src="/a.png"><img src="/b.png"><p>x</p></body></html>';
  const r = impeccableQa(html, { language: 'pt-BR' });
  assert.ok(/<img[^>]*alt=""/.test(r.html));
  assert.ok(/name="viewport"/.test(r.html));
  assert.ok(/prefers-reduced-motion/.test(r.html));
  assert.ok(!/pf-eyebrow/.test(r.html));
  assert.ok(/loading="lazy"/.test(r.html)); // 2ª imagem
  assert.ok(r.fixes.length >= 3);
});
t('impeccable: página bem-formada do assemble tem score alto', () => {
  const { value } = sanitizeBrief({ productName: 'Aurora', description: 'programa de hábitos', checkoutUrl: 'https://pay.x/c' });
  const plan = mockPlan(value);
  const secs = mockSections(value, plan, plan.sections.map((s) => s.id));
  const pp = postprocess(assemblePage(value, plan, secs), value);
  const r = impeccableQa(pp.html, value);
  assert.ok(r.score >= 15, `score baixo: ${r.score} — ${r.findings.map((f) => f.msg).join('; ')}`);
});

// ---------- DESIGN QUALITY (camada de design do Impeccable p/ as páginas geradas) ----------
t('design-quality: visitorMode e perfil selecionam capacidades relevantes', () => {
  assert.equal(visitorMode({ pageType: 'sales' }), 'persuade');
  assert.equal(visitorMode({ pageType: 'advertorial' }), 'read');
  assert.equal(visitorMode({ pageType: 'saas' }), 'operate');
  const { profile } = designProfile('<html><head><style>:root{--a:#111}</style></head><body><h1>x</h1></body></html>', { pageType: 'sales', scrollMode: 'static' });
  const caps = profile.map((p) => p.cap);
  assert.ok(['layout', 'typeset', 'audit', 'harden', 'polish'].every((c) => caps.includes(c)));
  assert.ok(caps.includes('adapt'), 'sem media query deve sugerir adapt');
});
t('design-quality: acha AI-purple, nested card, hierarquia fraca e achata o gradiente', () => {
  const html = '<!DOCTYPE html><html lang="pt-BR"><head><style>:root{--accent:#10b981}.hero{background:linear-gradient(135deg,#7c3aed,#3b82f6)}h1{font-size:14px}</style></head><body><main><section class="pf-card"><div class="pf-card">nested</div></section><h1 style="font-size:1.1rem">t</h1></main></body></html>';
  const r = designQuality(html, { pageType: 'sales', scrollMode: 'static' });
  assert.ok(!/7c3aed/.test(r.html), 'gradiente AI-purple deveria ter sido achatado');
  assert.ok(r.fixes.some((f) => /AI-purple|violeta/i.test(f)));
  assert.ok(r.findings.some((f) => /card dentro de card|nested/i.test(f.msg)));
  assert.ok(r.findings.some((f) => /h1|tese|presença/i.test(f.msg)));
  assert.ok(r.score < 9 && r.score >= 0);
  assert.ok(['Exemplar', 'Sólido', 'Genérico em partes', 'Genérico'].includes(r.band));
});
t('design-quality: página limpa do mock passa sem correções de design', () => {
  const { value } = sanitizeBrief({ productName: 'Aurora', description: 'programa de hábitos', checkoutUrl: 'https://pay.x/c' });
  const plan = mockPlan(value);
  const secs = mockSections(value, plan, plan.sections.map((s) => s.id));
  const pp = postprocess(assemblePage(value, plan, secs), value);
  const r = designQuality(pp.html, value);
  assert.equal(r.fixes.length, 0, `mock não deveria disparar correção: ${r.fixes.join('; ')}`);
  assert.ok(r.score >= 7, `design score baixo no mock: ${r.score} — ${r.findings.map((f) => f.msg).join('; ')}`);
  assert.equal(r.mode, 'persuade');
});
t('prompt: camada Impeccable (craft-floor) está nos prompts de plan e render', () => {
  const { value } = sanitizeBrief({ productName: 'X', description: 'y' });
  const p = buildPlanMessages(value);
  const rnd = buildRenderMessages(value, mockPlan(value), ['hero']);
  assert.ok(/craft-floor|CAMADA DE DESIGN/i.test(p.system));
  assert.ok(/squint test|BANIDOS/i.test(p.system));
  assert.ok(/CAMADA DE DESIGN|BANIDOS/i.test(rnd.system));
});

// ---------- FASE 3: pipeline + comercial ----------
t('prospect: pipeline de status + aliases + histórico', () => {
  assert.deepEqual(LEAD_STATUS[0], 'novo');
  assert.equal(normStatus('publicado'), 'demo-publicada');
  assert.equal(normStatus('lixo'), 'novo');
  const h = pushHistory({ historico: [{ status: 'novo', at: 'x' }] }, 'qualificado');
  assert.equal(h.length, 2);
  assert.equal(h[1].status, 'qualificado');
  assert.equal(pushHistory({ historico: [{ status: 'qualificado', at: 'x' }] }, 'qualificado').length, 1);
});
t('commercial: buildProposal usa dados reais, marca missing sem demo', () => {
  const r = buildProposal({ nome: 'Clínica X', nicho: 'dentista', cidade: 'Porto', nota: 4.8, avaliacoes: 90, siteAntigo: 'https://x.pt', diagnostico: 'site datado' }, { settings: { assinaturaNome: 'Ana' } });
  assert.ok(r.html.includes('Clínica X'));
  assert.ok(r.html.includes('site datado'));
  assert.ok(r.missing.some((m) => /demoUrl/.test(m)));
  const r2 = buildProposal({ nome: 'Y', whatsapp: '+351911222333' }, { settings: { assinaturaNome: 'Ana' }, demoUrl: 'https://d/x' });
  assert.ok(!r2.missing.length);
  assert.ok(r2.html.includes('https://d/x'));
});
t('commercial: buildEmailDraft — assunto ≤60, 1 link, sem preço, sem inventar', () => {
  const r = buildEmailDraft({ nome: 'Dr. João Silva', email: 'j@x.pt', nota: 5, avaliacoes: 40, diagnostico: 'sem versão mobile' }, { demoUrl: 'https://d/x' });
  assert.ok(r.subject.length <= 60);
  assert.ok(r.body.includes('https://d/x'));
  assert.ok(!/R\$|€|preço|preço|valor/i.test(r.body));
  assert.ok(r.gmailUrl.startsWith('https://mail.google.com/mail/'));
  assert.ok(gmailComposeUrl('a@b.c', 'oi', 'texto').includes('to=a%40b.c'));
});
t('commercial: buildContract — só dados reais, missing para o resto', () => {
  const r = buildContract({ nome: 'Cliente Z', cidade: 'Lisboa', siteAntigo: 'https://z.pt' }, { settings: {} });
  assert.ok(r.missing.length >= 3);
  assert.ok(r.html.includes('[SEU NOME]') || r.html.includes('mark'));
  const r2 = buildContract({ nome: 'Cliente Z' }, { settings: { contratanteNome: 'Ana Dev', contratanteDoc: '123', contratanteCidade: 'Porto' }, preco: 'R$ 700', prazo: '10 dias', formaPagamento: '50% + 50%' });
  assert.ok(!r2.missing.length);
  assert.ok(r2.html.includes('R$ 700') && r2.html.includes('Ana Dev'));
});
t('blob: memória em modo mock (publica e recupera)', async () => {
  process.env.PAGEFORGE_MOCK = '1';
  const { putDemo, getDemoHtml, listDemos } = await import('../api/_lib/blob.js?mock=1');
  await putDemo('teste-demo', '<html><body>demo</body></html>', 'Teste');
  const got = await getDemoHtml('teste-demo');
  assert.ok(got && got.includes('demo'));
  assert.ok((await listDemos()).some((d) => d.slug === 'teste-demo'));
});

console.log(`\n${process.exitCode ? 'FALHOU' : 'OK'} — ${pass} testes passaram.`);
