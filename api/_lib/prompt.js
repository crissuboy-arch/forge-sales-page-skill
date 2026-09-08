// prompt.js — monta as mensagens (system + user) para a geração de página.
import { buildKnowledgeCorpus } from './knowledge.js';
import { CLASS_CONTRACT } from './theme.js';

const TYPE_LABEL = {
  sales: 'Página de vendas',
  presell: 'Presell / página-ponte',
  advertorial: 'Advertorial (matéria editorial)',
  optin: 'Página de captura (opt-in)',
  saas: 'Página de SaaS / app',
  thankyou: 'Página de obrigado',
};

const SCROLL_LABEL = {
  static: 'STATIC LIGHT — reveal-on-enter por CSS/IntersectionObserver, sem libs de motion',
  light: 'STATIC LIGHT — reveal-on-enter discreto por CSS/IntersectionObserver',
  motion: 'MOTION — reveals + stagger + no máximo 1 parallax discreto (JS vanilla, sem GSAP obrigatório)',
  cinematic: 'CINEMATIC — reveals + 1–2 pins curtos + 1 scrub + sticky-media, tudo com fallback estático',
  storytelling: 'SCROLL STORYTELLING — a página é a narrativa: gramática forte, um pico visual dominante, um signature move',
};

const OUTPUT_CONTRACT = `
## CONTRATO DE SAÍDA (obrigatório)

Devolva **um único documento HTML completo e autossuficiente** e NADA além dele.

- Comece EXATAMENTE com \`<!DOCTYPE html>\` e termine com \`</html>\`.
- Sem texto antes ou depois. Sem \`\`\`html. Sem comentários explicando o que você fez.
- TODO o CSS dentro de um \`<style>\` no \`<head>\`. TODO o JS dentro de um \`<script>\` antes de \`</body>\`.
- Zero dependências externas obrigatórias. Fonts: Google Fonts via \`<link>\` é permitido (com \`preconnect\`), mas a página tem que ficar boa com a fallback stack.
- Sem imagens externas que possam 404. Use SVG inline, CSS (gradientes discretos, formas) ou blocos de cor com \`aria-label\`. Se marcar um slot para imagem futura, use um \`<div>\` com proporção fixa e um rótulo — nunca um \`<img src>\` quebrado.
- \`<head>\` completo: charset, viewport, title (50–60 car.), meta description (120–160 car.), canonical (use \`https://exemplo.com\` como placeholder), Open Graph, Twitter card, theme-color, \`<html lang>\` no idioma real.
- **JSON-LD** \`<script type="application/ld+json">\` com \`Organization\` + \`WebSite\` (+ \`Article\` só em advertorial, + \`FAQPage\` só se existir seção de FAQ real na página, com as perguntas verbatim). **NUNCA** \`Review\`, \`AggregateRating\`, \`ratingValue\`, \`reviewCount\`.
- Todo CTA que leva ao checkout é \`<a class="cta" data-cta="primary" href="{{CHECKOUT_URL}}">\`. O JS deve propagar a query string atual (utm_*, src, aff, xcod, sck, gclid, fbclid) para todo \`[data-cta]\` no clique, **sem** duplicar parâmetros e **sem** remover fragmento (#...) do href.
- Inclua \`function trackCTA(name){}\` vazia (com linhas de GA4/Meta/dataLayer comentadas) e chame no clique dos CTAs.
- Bloco \`@media (prefers-reduced-motion: reduce)\` zerando animações/transições. Alvos de toque ≥ 44px. Contraste AA. Um único \`<h1>\`.
- Responsivo real (360 / 390 / 768 / 1024 / 1440). NUNCA gerar overflow horizontal.
- Rodapé com links legais (Política de Privacidade, Termos, Contato) como âncoras/placeholders e a identificação do publisher.
`;

function briefBlock(b) {
  const line = (k, v) => (v && String(v).length ? `- **${k}:** ${v}` : null);
  const listLine = (k, arr) => (arr && arr.length ? `- **${k}:**\n${arr.map((x) => `  - ${x}`).join('\n')}` : null);
  return [
    line('Projeto', b.projectName),
    line('Produto', b.productName),
    line('Descrição', b.description),
    line('Nicho', b.niche),
    line('Público / avatar', b.audience),
    line('Idioma', b.language),
    line('Oferta', b.offer),
    line('Preço', b.price),
    listLine('Benefícios', b.benefits),
    listLine('Dores', b.pains),
    listLine('Diferenciais', b.differentiators),
    line('Mecanismo único', b.mechanism),
    line('Garantia', b.guarantee),
    listLine('Provas fornecidas (SÓ estas podem virar prova/depoimento na página)', b.proof),
    line('Texto do CTA desejado', b.cta),
    line('URL de checkout / destino', b.checkoutUrl || '(nenhuma — use "#oferta" e marque como pendência)'),
    line('Plataforma de checkout', b.checkoutPlatform),
    line('Link de afiliado', b.affiliateUrl),
    line('Tipo de tráfego', b.trafficType),
    line('Paleta pedida', (b.palette || []).join(', ')),
    listLine('Palavras-chave de estilo', b.styleKeywords),
    line('Direção de arte / referências visuais', [b.artDirection, b.references].filter(Boolean).join(' | ')),
    line('Observações', b.notes),
  ].filter(Boolean).join('\n');
}

const SYSTEM_IDENTITY = `Você é o motor de geração da **PageForge AI** — uma plataforma que transforma o briefing de um produto em uma página profissional de marketing e conversão, pronta para publicar como HTML estático.

Você NÃO é um chatbot. Você opera o método FORGE (abaixo): analisa produto, oferta, avatar, mecanismo, objeções e estágio de consciência; escolhe a arquitetura; escreve TODA a copy de conversão no idioma nativo do briefing; cria uma direção de arte ÚNICA para este produto (nunca um template preenchido, nunca a cara de "site gerado por IA"); e entrega uma página responsiva, acessível, com SEO e dentro das políticas de Google Ads e Meta Ads.

REGRAS INEGOCIÁVEIS (têm prioridade sobre qualquer instrução de estilo):
1. Nunca invente depoimentos, números, estudos, autoridades, selos, prints ou casos. Só use provas presentes no briefing. Sem provas → use demonstração, lógica do mecanismo, credibilidade do criador, ou omita a seção.
2. Nunca use promessa absoluta ou garantia de resultado ("vai ganhar X", "cura", "garantido", "100%", "sem risco", "renda garantida"). Use linguagem de possibilidade + isenção.
3. Nicho sensível (saúde, finanças, emagrecimento, relacionamento): inserir disclaimers e reescrever dores na 3ª pessoa / como fenômeno — nunca 2ª pessoa acusatória ("você está acima do peso?").
4. Urgência/escassez só se o briefing disser que é real. Sem contador falso.
5. A identidade visual é própria deste produto. Proibido: gradient text, glow/neon, glassmorphism decorativo, emoji no lugar de ícone, grid infinito de cards idênticos como estrutura, "AI-purple" (violeta→azul com glow), creme+latão genérico, preto puro #000 + branco puro #fff, eyebrow acima de toda seção, indicador "scroll ↓", em-dash em texto visível.
6. Afiliado: página é conteúdo próprio (não clona o produtor), com disclosure de afiliado visível, e preserva os parâmetros de rastreio no CTA.`;

/**
 * @param {object} brief  saída de sanitizeBrief().value
 * @returns {{system:string, user:string}}
 */
export function buildMessages(brief) {
  const corpus = buildKnowledgeCorpus({
    pageType: brief.pageType,
    scrollMode: brief.scrollMode,
    affiliate: brief.affiliate,
    sensitive: brief.sensitive,
  });

  const system = `${SYSTEM_IDENTITY}

=================== MÉTODO FORGE + REFERÊNCIAS (use como sistema especialista) ===================
${corpus}
================================================================================================
${IMPECCABLE_CRAFT}
${OUTPUT_CONTRACT}`;

  const checkout = brief.checkoutUrl || '#oferta';
  const user = `Gere a página agora.

## Formato
${TYPE_LABEL[brief.pageType] || brief.pageType}

## Intensidade de scroll
${SCROLL_LABEL[brief.scrollMode] || brief.scrollMode}
${brief.sensitive ? '\n> NICHO SENSÍVEL detectado — compliance é blocker. No máximo MOTION. Disclaimers obrigatórios.' : ''}

## Briefing normalizado
${briefBlock(brief)}

## Execução (faça internamente, na ordem, antes de escrever o HTML)
1. Normalizar o briefing e preencher lacunas com linguagem segura (sem inventar fato).
2. Analisar produto + oferta + avatar + estágio de consciência + sofisticação de mercado.
3. Definir ângulo e, quando aplicável, nomear o mecanismo único.
4. Escolher a arquitetura de seções para ESTE caso (consciência × tráfego × ticket).
5. Escrever toda a copy no idioma "${brief.language}" — nativo, específico, voz do avatar.
6. Criar o style ticket: 3–5 palavras de marca, paleta (${(brief.palette || []).join(', ') || 'derive do nicho'}), par tipográfico, forma/espaço, 1 layout signature. Honrar a direção pedida se houver.
7. Estruturar as seções + posições de CTA (repetir o CTA a cada ~1.5 tela em long-form).
8. Aplicar SEO (head + JSON-LD sem review/rating), compliance do nicho, e o hook de tracking.
9. Montar o HTML único conforme o CONTRATO DE SAÍDA.

## Substituições
- Onde eu escrever {{CHECKOUT_URL}}, use: ${checkout}
- CTA primário (texto): ${brief.cta || 'derive um verbo + resultado (não "comprar")'}

Responda com o documento HTML e nada mais.`;

  return { system, user };
}

/* ============================================================================
   GERAÇÃO EM ETAPAS (evita 1 requisição longa que estoura o limite da Vercel)
   Etapa 1: PLANO   — análise + arquitetura + direção de arte + copy + CSS + head
   Etapa 2: RENDER  — HTML das seções em lotes pequenos, usando o plano
   Etapa 3: ASSEMBLE — montagem + endurecimento (sem IA, em assemble.js)
   ==========================================================================*/

const PLAN_CONTRACT = `
## CONTRATO DE SAÍDA — PLANO (obrigatório)

Devolva **um único bloco JSON** e NADA além dele (sem \`\`\`, sem texto antes/depois).
Estrutura exata:

{
  "lang": "<idioma real, ex. pt-BR>",
  "brandName": "<nome curto do site/produto para SEO e rodapé>",
  "title": "<title 50-60 caracteres, benefício + marca; advertorial = título editorial>",
  "description": "<meta description 120-160 caracteres, ativa, com a promessa>",
  "styleTicket": { "keywords": ["3 a 5 palavras de marca"], "signature": "1 decisão que torna a página reconhecível" },
  "styleTokens": {
    "mood": "<um de: editorial | clean | warm | bold | calm | tech — o que combina com nicho e avatar>",
    "bg": "#<fundo>", "surface": "#<cards/faixas alternadas>", "ink": "#<texto principal, contraste AA sobre bg>",
    "inkSoft": "#<texto secundário>", "line": "#<bordas>", "accent": "#<cor de marca / CTA>", "accentInk": "#<texto sobre o accent, AA>",
    "fontLink": "<URL de <link> do Google Fonts OU string vazia>", "fontDisplay": "<nome da família de título OU vazio>", "fontText": "<nome da família de texto OU vazio>"
  },
  "jsonld": { "@context": "https://schema.org", "@graph": [ { "@type": "Organization", "@id": "https://exemplo.com/#org", "name": "...", "url": "https://exemplo.com/" }, { "@type": "WebSite", "url": "https://exemplo.com/", "name": "...", "inLanguage": "<lang>", "publisher": { "@id": "https://exemplo.com/#org" } } ] },
  "ctaText": "<texto do CTA primário: verbo + resultado, nunca 'comprar'>",
  "sections": [
    { "id": "hero", "kind": "hero", "goal": "<objetivo desta seção, curto>", "copy": "<a copy real desta seção — headline + subhead + pontos-chave, no idioma, voz do avatar. CONCISO: o passo seguinte transforma isto em HTML. Uma linha por ideia, separadas por \\n.>" }
    /* 5 a 7 seções na ordem da arquitetura para ESTE caso; a última kind:"footer" (links legais + publisher). kind possíveis: hero, problem, mechanism, product, benefits, proof, offer, guarantee, faq, disclosure, footer */
  ]
}

Regras: JSON válido (aspas duplas, sem comentários no JSON real, sem trailing commas), COMPACTO. Você NÃO escreve CSS — só escolhe os \`styleTokens\`. Paleta com contraste AA. \`jsonld\` NUNCA com Review/AggregateRating/rating. Nicho sensível: disclaimers na copy + uma seção kind:"disclosure". A \`copy\` de cada seção é um esqueleto conciso (bullets/frases curtas), não texto corrido longo — o HTML final vem na etapa seguinte.
`;

const RENDER_CONTRACT = `
## CONTRATO DE SAÍDA — RENDER (obrigatório)

Devolva **um único bloco JSON** \`{ "<id>": "<html da seção>", ... }\` e NADA além dele.

- Uma entrada por id pedido. O valor é o HTML da seção: um \`<section>\` (ou \`<header>\`/\`<footer>\` conforme o kind) semântico e acessível.
- Use **apenas** classes/estrutura compatíveis com o CSS do plano (fornecido abaixo). Não invente utilitário que não existe no CSS.
- Escreva a copy EXATAMENTE como está no campo "copy" do plano (pode formatar em <p>, <ul>, <h2> etc., mas não reescreva o conteúdo).
- Um único \`<h1>\` em toda a página → só na seção hero. Demais seções usam \`<h2>\`/\`<h3>\`.
- CTA que leva à oferta: \`<a class="cta" data-cta="primary" href="{{CHECKOUT_URL}}">\`. Pode repetir em várias seções.
- **NÃO** inclua \`<style>\`, \`<script>\`, \`<head>\`, \`<html>\`, \`<body>\`, \`<!DOCTYPE>\`. Só o(s) elemento(s) de seção.
- Sem \`<img src>\` externo. SVG inline / CSS / bloco com aria-label para slots visuais.
- Sem emoji-ícone, sem "scroll ↓", sem em-dash em texto visível, sem promessa absoluta/garantia de resultado.
`;

// CAMADA DE DESIGN — destila craft-floor / layout / typeset / colorize / animate
// do Impeccable (github.com/pbakaus/impeccable). Regras, não botões: a página
// nasce com esse nível e a etapa DESIGN QUALITY (design-quality.js) confere.
const IMPECCABLE_CRAFT = `CAMADA DE DESIGN (Impeccable craft-floor — obrigatória, o briefing pinado vence, seu hábito não):
- PRIMEIRA DOBRA É UMA TESE, não um cabeçalho: mostre o mecanismo / para quem é / a prova em segundos. Nada de hero-template genérico.
- HIERARQUIA pelo squint test: com a tela desfocada dá pra ver, EM ORDEM, o elemento primário, o secundário e os grupos.
- RITMO DE ESPAÇO: apertado dentro do grupo, generoso entre grupos, MAIS espaço acima de um heading do que abaixo. Um único ritmo na página; um trecho denso ganha um trecho quieto. Nada de um valor de padding repetido em tudo.
- TIPOGRAFIA: medida de leitura 60–75 caracteres; degraus ÓBVIOS de tamanho e peso entre h1 / h2 / corpo / rótulo; tracking no piso -0.04em (melhor -0.02 a -0.03); títulos equilibrados (sem viúva).
- COR: o accent tem UM papel (ação/foco/estado), não é decoração espalhada. Texto secundário puxado do tom do fundo/tinta, nunca cinza chapado sobre cor. Deixe a cor forte dominar uma região deliberada em vez de pingar acentos.
- ELEVAÇÃO declarada UMA vez: borda OU sombra. Sombra = offset + blur; halo "0 0" é decoração.
- MOVIMENTO: no máximo UM momento autoral; NUNCA a mesma entrada em toda seção; ease-out exponencial a partir do estado já visível; sempre com caminho prefers-reduced-motion.
- PROVE, NÃO AFIRME: mostre o produto fazendo o trabalho; específicos que um concorrente não copia. Número ilustrativo é rotulado como tal.
- ESTADOS reais onde couber: hover, foco, vazio, erro.
BANIDOS (nenhum briefing recupera): gradient text; eyebrow/kicker acima de heading; card como estrutura da página (e card dentro de card é SEMPRE erro); grade de cards idênticos como esqueleto; números de seção 01/02/03 decorativos; glow/neon; glass decorativo; border-left colorido > 1px em card/alerta; hard shadow "Npx Npx 0" fora de neobrutalismo real; emoji/glyph no lugar de ícone (ícone é SVG desenhado); monospace como "traje técnico"; Impact/Arial Black como voz de título; "AI-purple" (violeta→índigo→azul com brilho); creme+serif como default de qualquer nicho; raio de pílula (999px) em bloco grande (card fica em 12–16px).`;

const SYSTEM_SHORT = `${SYSTEM_IDENTITY}

Você está gerando UMA ETAPA de uma página (não a página inteira). Siga o contrato de saída da etapa à risca. Guardrails de compliance continuam valendo: sem depoimento/número/autoridade inventada, sem promessa absoluta, disclaimers em nicho sensível, urgência só se real.

${IMPECCABLE_CRAFT}`;

// Playbook enxuto para a etapa PLAN (o corpus completo da skill estoura o tempo
// da função). Destila o essencial de sales-architecture / copywriting /
// offer-analysis / compliance / anti-ai.
const PLAN_PLAYBOOK = `MÉTODO (resumo operacional):

ARQUITETURA por estágio de consciência × tráfego:
- problem-aware + Google/nativo → advertorial/artigo-problema → oferta
- solution-aware → presell (mecanismo/comparação) → vendas
- product-aware / lista → vendas direta
- afiliado → SEMPRE presell, conteúdo próprio, disclosure visível, CTA preserva parâmetros (#aff=)
Seções de uma página de conversão (adaptar à ordem certa para o caso, 5–9):
hero(promessa+subhead+prova rápida+CTA) · problem(dor na voz do avatar) · mechanism(nomeie o "como" diferente, por que o método comum falha) · product(o que é, o que vem dentro) · benefits(recurso→o que faz→o que muda) · proof(SÓ provas reais do briefing; sem provas = demonstração/lógica/autoridade ou omitir) · offer(o que recebe, ancoragem, preço, próximo passo) · guarantee · faq(5–7 objeções reais) · disclosure(afiliado/publicidade) · footer(legal + publisher)

COPY: uma ideia central; 2ª pessoa do singular; especificidade > adjetivo; subtítulos que contam a história; prova antes de pedir; voz do cliente (palavras do avatar). Idioma nativo do briefing.
Sofisticação de mercado: 1–2 afirmar benefício; 3 liderar pelo mecanismo; 4 mecanismo+prova superior; 5 identidade ("isto é para quem…").

COMPLIANCE (blocker): nunca inventar depoimento/número/estudo/autoridade/selo. Nunca promessa absoluta ou garantia de resultado ("garantido","cura","100%","renda garantida","sem esforço"). Nicho sensível (saúde/finanças/emagrecimento/relacionamento): disclaimers ("resultados podem variar","não substitui acompanhamento profissional / não é aconselhamento") + dor na 3ª pessoa/como fenômeno, nunca "você está [atributo]?". Urgência só se real. JSON-LD sem Review/AggregateRating.

DIREÇÃO DE ARTE: identidade própria do produto (mood + paleta AA + par tipográfico). Evitar: gradient text, glow/neon, glass decorativo, "AI-purple", creme+latão genérico, #000/#fff puros, eyebrow em toda seção, "scroll ↓", em-dash em texto visível, grid de cards como estrutura.

${IMPECCABLE_CRAFT}`;

/** Etapa 1 — plano (análise + arquitetura + direção + copy + tokens + head). */
export function buildPlanMessages(brief) {
  const system = `${SYSTEM_IDENTITY}

${PLAN_PLAYBOOK}
${PLAN_CONTRACT}`;

  const user = `Monte o PLANO da página.

## Formato
${TYPE_LABEL[brief.pageType] || brief.pageType}

## Intensidade de scroll
${SCROLL_LABEL[brief.scrollMode] || brief.scrollMode}
${brief.sensitive ? '\n> NICHO SENSÍVEL — compliance é blocker. Disclaimers obrigatórios. No máximo MOTION.' : ''}

## Briefing normalizado
${briefBlock(brief)}

## Antes de escrever o JSON, faça internamente:
1. Normalizar o briefing (lacunas → linguagem segura, sem inventar fato).
2. Analisar produto + oferta + avatar + estágio de consciência + sofisticação de mercado.
3. Definir ângulo e nomear o mecanismo único quando aplicável.
4. Escolher a arquitetura de seções para ESTE caso (consciência × tráfego × ticket).
5. Escrever a copy de cada seção no idioma "${brief.language}" — nativa, específica, voz do avatar.
6. Style ticket: paleta (${(brief.palette || []).join(', ') || 'derive do nicho'}), par tipográfico, forma/espaço, 1 layout signature.

CTA primário sugerido: ${brief.cta || '(derive verbo + resultado)'}
Checkout/destino: ${brief.checkoutUrl || '#oferta'}

Responda com o JSON do plano e nada mais.`;

  return { system, user };
}

/** Etapa 2 — HTML das seções pedidas, usando o plano. */
export function buildRenderMessages(brief, plan, ids) {
  const wanted = (plan.sections || []).filter((s) => ids.includes(s.id));
  const specs = wanted.map((s) => `### ${s.id}  (kind: ${s.kind})
objetivo: ${s.goal || ''}
copy (use este texto, sem reescrever o conteúdo):
${s.copy || ''}`).join('\n\n');

  const system = `${SYSTEM_SHORT}
${RENDER_CONTRACT}

=================== ${CLASS_CONTRACT} ===================`;

  const user = `Idioma: ${plan.lang || brief.language}
CTA primário: ${plan.ctaText || brief.cta || 'Começar agora'}  (href = {{CHECKOUT_URL}})
${brief.sensitive ? 'NICHO SENSÍVEL: mantenha os disclaimers da copy; nada de promessa absoluta.' : ''}

Gere o HTML das seções a seguir (uma entrada JSON por id). Cada seção é um \`<section class="pf-wrap reveal">\` (ou \`<header class="pf-hero"><div class="pf-wrap reveal">\` para o hero, \`<footer class="pf-footer"><div class="pf-wrap">\` para o footer):

${specs}

Responda com o JSON { "<id>": "<html>" } e nada mais.`;

  return { system, user };
}

/** Prompt de regeneração focada de uma seção. */
export function buildSectionMessages(brief, currentHtml, instruction) {
  const { system } = buildMessages(brief);
  const html = String(currentHtml || '').slice(0, 120000);
  const user = `Abaixo está a página HTML atual desta PageForge AI. Aplique APENAS esta mudança:

>>> ${String(instruction || '').slice(0, 600)}

Mantenha absolutamente todo o resto igual (estrutura, tokens CSS, copy das outras seções, head, scripts). Devolva o **documento HTML completo atualizado**, começando em <!DOCTYPE html> e terminando em </html>, e nada mais.

=================== PÁGINA ATUAL ===================
${html}`;
  return { system, user };
}
