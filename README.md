# FORGE SALES PAGE SKILL

Skill reutilizável para **Claude Code, Codex e agentes compatíveis** que
transforma os **dados de um produto** em uma **página de vendas profissional
completa** — copy de conversão, direção de arte própria, HTML/CSS/JS estático,
validada e pronta para publicar.

> Sem Lovable. Sem construtor pago. Sem backend obrigatório. O resultado é um
> pacote `dist/` que você sobe em qualquer hospedagem estática.

---

## O que ela entrega

- **Formatos:** página de vendas, presell, advertorial, página de captura,
  página SaaS/app, página de obrigado.
- **Copy completa:** headline, subheadline, mecanismo, dores, benefícios,
  objeções, provas, oferta, bônus, garantia, FAQ, CTAs, fechamento.
- **Direção de arte única por produto** — nunca o mesmo visual, nunca identidades
  misturadas.
- **3 modos visuais** (stack técnica):
  - `PREMIUM STATIC` — HTML/CSS/JS leve, sofisticado, rápido (padrão).
  - `CINEMATIC CODE` — storytelling de scroll com GSAP + Lenis quando faz sentido.
  - `AI FILM READY` — estrutura pronta para footage de IA, funcionando hoje com placeholders.
- **4 níveis de scroll** (camada `scroll-experience/`): `STATIC LIGHT` · `MOTION` ·
  `CINEMATIC` · `SCROLL STORYTELLING` — a skill decide quanto a página precisa, com
  gramática de página, curva de sentimento, pico único e gate anti-repetição.
- **Exportação:** `dist/index.html`, `dist/assets/`, `dist/README-PUBLICAR.md`, `dist/pagina.zip`.
- **Validação automática:** mobile, desktop, links, CTAs, checkout, imagens
  quebradas, acessibilidade básica, performance, `prefers-reduced-motion`, e
  **QA visual de scroll** (contact sheet + detecção de scroll morto / overflow /
  elemento preso).
- **Guardrails de compliance:** Google Ads, Meta Ads, sem promessas absolutas,
  sem provas/depoimentos inventados.

---

## Como usar

1. Aponte seu agente para o [`SKILL.md`](SKILL.md).
2. Forneça os dados do produto (o agente pede o [bloco obrigatório](SKILL.md#3-perguntas-mínimas-ao-usuário)).
3. O agente executa o [fluxo de 7 fases](SKILL.md#2-fluxo-completo-7-fases).
4. Você recebe `output/<seu-projeto>/dist/` pronto para publicar.

### Requisitos

- **Node.js ≥ 18** (só para os `scripts/`; a página em si não precisa de nada).
- Opcional: `zip` no PATH (há fallback nativo).
- Nenhuma chave de API. Nenhum serviço pago.

---

## Anatomia da skill

| Caminho | Papel |
|---------|-------|
| [`SKILL.md`](SKILL.md) | Entrada. Fluxo, perguntas mínimas, decisões de arquitetura e visual, build, export, publicação, guardrails. |
| `schemas/product.schema.json` | Contrato dos dados de entrada normalizados (`brief.json`). |
| `references/copywriting.md` | Frameworks (PAS, AIDA, 4Ps, Star-Story-Solution), banco de blocos, fórmulas de headline, tom por nicho, tradução benefício↔resultado. |
| `references/sales-architecture.md` | Matriz consciência × tráfego × ticket → arquitetura. Estruturas base de cada formato. |
| `references/offer-analysis.md` | Como dissecar avatar, oferta (value stack), mecanismo único, objeções, estágio de consciência e sofisticação de mercado. |
| `references/visual-direction.md` | Como criar identidade única: style ticket, tokens CSS, tipografia, cor, forma, fotografia. Detalhe dos 3 modos. |
| `references/cinematic-motion.md` | GSAP/ScrollTrigger/Lenis: padrões de scroll, orçamento de performance, `prefers-reduced-motion`, fallback estático, como vendorizar libs. |
| `scroll-experience/` | **Camada de scroll-storytelling + direção de arte premium** (ref.: ScrollCraft). 4 níveis de scroll (STATIC LIGHT/MOTION/CINEMATIC/STORYTELLING), 8 gramáticas de página, curva de sentimento + pico único, taste floor numérico, anti-"cara de IA", fingerprint gate anti-repetição, feel check + harness `scroll-qa`. Não é engine — a stack continua sendo a de `cinematic-motion.md`. |
| `references/presell.md` | Anatomia de presell (story-based, listicle, quiz-lite, "carta de descoberta"), quando usar cada uma, ponte para o checkout. |
| `references/advertorial.md` | Anatomia de advertorial editorial, tom jornalístico, disclosure de publicidade, o que Google permite. |
| `references/affiliate-pages.md` | Regras de página de afiliado: presell obrigatório, disclosure, não clonar o produtor, preservar `?aff=`/`src`. |
| `references/compliance-google.md` | Políticas do Google Ads por categoria; termos proibidos; como escrever headline/claims dentro da política; landing page requirements. |
| `references/compliance-meta.md` | Políticas do Meta Ads; "antes/depois" e saúde; personal attributes; como estruturar a página para aprovar. |
| `references/checkout-integrations.md` | Kiwify, Hotmart, Digistore24, Stripe (Payment Link) e URL genérica: formato de URL, parâmetros, order bump/upsell, tracking (GA4, Meta Pixel, GTM), postback. |
| `references/seo.md` | SEO on-page + técnico (`robots.txt`, `sitemap.xml`, `site.webmanifest`, OG image 1200×630, favicon/apple-touch), Open Graph/Twitter, JSON-LD por formato (só schema justificável — sem review/rating fake), domínio configurável (`SITE_URL` + `seo.js`), tracking ready sem IDs. |
| `references/qa-checklist.md` | Checklist completo de QA — o que `verify.js`/`validate-links.js` automatizam e o que é manual. |
| `templates/*/` | **Referência estrutural apenas.** Esqueleto de seções + notas de direção por vertical. A IA adapta tudo. |
| `scripts/build.js` | `src/` → `dist/`, injeta `<head>`, minifica, gera `README-PUBLICAR.md`. |
| `scripts/validate-links.js` | Audita links, âncoras, CTAs, URL de checkout, imagens/vídeos. |
| `scripts/package.js` | Gera `pagina.zip` e finaliza o guia de publicação. |
| `scripts/verify.js` | QA automatizado: acessibilidade, meta tags, **SEO técnico** (robots, JSON-LD válido sem review/rating, robots.txt/sitemap/manifest), performance, termos proibidos de compliance. |
| `scripts/scroll-qa.js` | QA visual de scroll: navegador headless caminha o scroll, monta contact sheet, detecta scroll morto / overflow horizontal / elemento preso invisível / mídia ausente / contraste fino. Degrada para checklist manual sem navegador. |
| `examples/` | Exemplo de `brief.json` preenchido e notas. |
| `output/` | Saída por projeto (ignorada pelo git). |

### Templates disponíveis (referência)

`direct-response` · `app-saas` · `beauty` · `relationship` · `finance` ·
`wellness` · `editorial` · `cinematic`

Cada pasta tem `README.md` (quando usar, seções típicas, armadilhas) e
`reference.html` (esqueleto semântico comentado, **sem** identidade visual — a IA
cria a dela).

---

## Filosofia

1. **Analisar antes de escrever.** Avatar, oferta, mecanismo, objeções e
   consciência definem tudo.
2. **Uma identidade por produto.** Direção de arte criada do zero, justificada.
3. **Conversão e velocidade não são opostos.** Página rápida converte mais e
   custa menos no tráfego pago.
4. **Honestidade converte e mantém a conta viva.** Guardrails de compliance
   vêm antes do estilo.
5. **Template é referência, não gabarito.**

---

## Licença

MIT — ver [`LICENSE`](LICENSE).
