// prompt.js — monta as mensagens (system + user) para a geração de página.
import { buildKnowledgeCorpus } from './knowledge.js';

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
