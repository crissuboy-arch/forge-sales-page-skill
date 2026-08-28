---
name: forge-sales-page
description: >-
  Gera páginas de vendas, presells, advertoriais, páginas de captura, páginas
  SaaS/app e páginas de obrigado extremamente profissionais, persuasivas e
  responsivas, exportáveis como HTML/CSS/JS estático (sem backend, sem Lovable,
  sem construtores pagos). Use quando o usuário fornecer dados de um produto e
  quiser uma página pronta para publicar e para rodar tráfego (orgânico, Google
  Ads, Meta Ads ou afiliado). A skill analisa produto, avatar, oferta, mecanismo,
  objeções e estágio de consciência; escolhe automaticamente a arquitetura de
  página; escreve a copy de conversão completa; cria uma direção de arte própria
  por produto; e valida mobile, desktop, links, CTAs, checkout, acessibilidade,
  performance e compliance.
license: MIT
metadata:
  version: 1.0.0
  authors:
    - cris.suboy@gmail.com
  compatible_agents:
    - Claude Code
    - Codex
    - Agentes compatíveis com Agent Skills (SKILL.md + arquivos de apoio)
---

# FORGE SALES PAGE SKILL

Skill reutilizável para transformar **dados de um produto** em uma **página de
vendas completa**, escrita, desenhada e validada — pronta para publicar em
qualquer hospedagem estática e pronta para rodar tráfego pago ou orgânico.

O resultado é sempre um pacote `dist/` autocontido:

```
dist/
  index.html            # página completa, funciona sem backend
  assets/               # css, js, imagens, fonts locais
  README-PUBLICAR.md     # como publicar (Netlify, Vercel, Cloudflare, GitHub Pages, hospedagem)
  pagina.zip             # tudo compactado para upload manual
```

---

## 1. Quando usar a skill

Use quando o pedido envolver **qualquer uma** destas entregas:

- Página de vendas (long-form ou short-form) para info-produto, curso, mentoria,
  SaaS, produto físico, serviço.
- **Presell** / página de pré-venda para esquentar tráfego frio antes do checkout.
- **Advertorial** (matéria/editorial no estilo "artigo") para Google Ads e nativo.
- Página de captura (lead magnet, isca digital, lista de espera, webinar).
- Página institucional de SaaS/app com foco em ativação.
- Página de obrigado / upsell / entrega.

**Não use** para: blog posts, e-mails soltos, criativos de anúncio isolados,
aplicações com backend/estado de usuário. (A skill gera front-end estático.)

### Regra de ouro

> A skill **nunca** entrega um template preenchido. Ela analisa o produto e
> **constrói** copy, layout, tipografia, hierarquia, seções e direção visual
> específicos para aquele produto. Os arquivos em `templates/` são **referência
> estrutural**, não formulário.

---

## 2. Fluxo completo (7 fases)

```
[1] COLETA        → reunir dados do produto (seção 3)
[2] ANÁLISE       → avatar, oferta, mecanismo, objeções, consciência, tráfego
[3] ARQUITETURA   → formato + estrutura de seções (seção 5)
                    + nível de scroll + gramática de página + fingerprint gate
[4] DIREÇÃO       → modo visual + identidade única (seção 6)
                    + taste floor + anti-IA + (se houver imagem gerada) preâmbulo de estilo
[5] COPY          → todos os blocos de texto (references/copywriting.md)
                    + curva de sentimento e o pico único
[6] BUILD         → montar HTML/CSS/JS, rodar scripts/, validar (seção 8)
                    + feel check + squint test + scroll-qa
[7] EXPORT        → gerar dist/ + README-PUBLICAR.md + pagina.zip (seção 10)
```

Cada fase tem um arquivo de referência dedicado em `references/`. **Leia o
arquivo relevante antes de executar a fase** — eles contêm as heurísticas de
decisão, checklists e exemplos.

| Fase | Leia antes |
|------|-----------|
| Análise de oferta/mecanismo/consciência | `references/offer-analysis.md` |
| Escolha de arquitetura | `references/sales-architecture.md` |
| **Nível de scroll (STATIC LIGHT / MOTION / CINEMATIC / STORYTELLING)** | `scroll-experience/mode-decision.md` |
| **Gramática de página (variedade estrutural)** | `scroll-experience/scroll-grammars.md` |
| **Fingerprint gate (anti-repetição entre projetos)** | `scroll-experience/fingerprint-gate.md` |
| Presell | `references/presell.md` |
| Advertorial | `references/advertorial.md` |
| Páginas de afiliado | `references/affiliate-pages.md` |
| Copy | `references/copywriting.md` |
| **Curva de sentimento + pico único** | `scroll-experience/feeling-curve.md` |
| Direção visual | `references/visual-direction.md` |
| **Taste floor + preâmbulo de estilo** | `scroll-experience/art-direction-plus.md` |
| **Anti-template / anti-"cara de IA"** | `scroll-experience/anti-ai.md` |
| Motion / scroll / GSAP (stack, orçamento, fallback) | `references/cinematic-motion.md` |
| **Devices de scroll + janelas de cue** | `scroll-experience/motion-system.md` |
| Checkout | `references/checkout-integrations.md` |
| **SEO on-page, técnico, social, schema** | `references/seo.md` |
| Compliance Google | `references/compliance-google.md` |
| Compliance Meta | `references/compliance-meta.md` |
| QA final | `references/qa-checklist.md` |
| **QA visual de scroll (feel check + harness headless)** | `scroll-experience/visual-qa.md` |

> A camada **`scroll-experience/`** destila os princípios úteis de scroll‑storytelling
> e direção de arte premium (ref.: ScrollCraft) em regras operacionais da skill.
> Não é engine — a stack de motion continua sendo a de `cinematic-motion.md`.
> Ver `scroll-experience/README.md`.

---

## 3. Perguntas mínimas ao usuário

Peça **só o que faltar**. Se o usuário já enviou um documento/briefing, extraia
de lá e **confirme os pontos críticos** (promessa, preço, checkout, idioma,
tráfego) em vez de repetir tudo.

### Bloco obrigatório (não dá para gerar sem)

1. **Nome do produto**
2. **Descrição** (o que é, em 1–3 frases)
3. **Nicho / mercado**
4. **Público / avatar** (quem é, dor principal, nível de consciência se souber)
5. **Promessa principal** (o resultado central)
6. **Benefícios** (lista)
7. **Preço** (valor, moeda, parcelamento, ancoragem se houver)
8. **URL do checkout**
9. **Plataforma do checkout**: Kiwify | Hotmart | Digistore24 | Stripe | URL genérica
10. **Idioma** (pt-BR, en, es, ...)
11. **Tipo de tráfego**: orgânico | Google Ads | Meta Ads | afiliado
12. **Formato desejado** (ou "você decide"): vendas | presell | advertorial | captura | saas | obrigado

### Bloco opcional (melhora muito o resultado)

13. **Bônus** (lista + valor percebido)
14. **Garantia** (dias, tipo, condições)
15. **Provas / depoimentos reais** (texto, prints, números verificáveis, autoridade)
16. **Mecanismo único** (por que funciona, o "como" diferente)
17. **Objeções conhecidas** (o que trava a compra)
18. **Estilo desejado** (referências visuais, marcas admiradas, "clean", "editorial", "agressivo"...)
19. **Modo visual**: PREMIUM STATIC | CINEMATIC CODE | AI FILM READY (ou "você decide")
20. **Restrições de compliance** (nicho sensível: saúde, finanças, relacionamento, emagrecimento?)
21. **Ativos** (logo, fotos de produto, headshots, paleta de marca, fonts)
22. **Domínio / onde vai publicar**

### Se o usuário disser "decida você"

Escolha com base nas heurísticas das seções 5 e 6 e **declare a escolha** no
início da entrega ("Escolhi advertorial + PREMIUM STATIC porque o tráfego é
Google Ads e o público é problema-consciente"). Nunca trave o fluxo esperando
respostas opcionais.

---

## 4. Formatos de página

| Formato | Objetivo | Quando | Referência |
|---------|----------|--------|-----------|
| **Página de vendas** | Venda direta no checkout | Público já sabe que quer a solução; tráfego morno/quente; remarketing | `sales-architecture.md` |
| **Presell** | Aquecer e qualificar antes do checkout | Tráfego frio (Meta Ads), afiliado, público solução-inconsciente | `presell.md` |
| **Advertorial** | Editorial que educa e converte | Google Ads, nativo, público problema-consciente; nichos que exigem contexto | `advertorial.md` |
| **Página de captura** | Trocar e-mail/lead por isca | Topo de funil, webinar, lista de espera, lançamento | `sales-architecture.md` (§ captura) |
| **Página SaaS/app** | Ativação / trial / demo | Produto recorrente, público solução-consciente, comparação de planos | `templates/app-saas/` |
| **Página de obrigado** | Confirmar, entregar, fazer upsell | Pós-compra ou pós-lead | `sales-architecture.md` (§ obrigado) |

Um projeto pode gerar **mais de uma** (ex.: advertorial → página de vendas →
obrigado). Gere cada uma em sua própria pasta de saída.

---

## 5. Como escolher a arquitetura

Decida por **estágio de consciência** (Schwartz) × **temperatura do tráfego** ×
**complexidade da oferta**. Detalhe completo em `references/sales-architecture.md`.

### Matriz rápida

| Consciência do público | Tráfego | Arquitetura recomendada |
|------------------------|---------|-------------------------|
| Inconsciente do problema | Meta Ads frio | Advertorial ou presell storytelling → VSL/vendas |
| Consciente do problema | Google Ads / nativo | **Advertorial** → página de vendas |
| Consciente da solução | Meta/Google morno | Presell curto → **página de vendas long-form** |
| Consciente do produto | Remarketing, e-mail, orgânico | **Página de vendas** direta (short/long) |
| Mais consciente (só falta oferta) | Lista, recompra | Página de oferta curta + urgência real |

### Ajustes por variável

- **Ticket alto (> R$1.000 / mentoria / high-ticket):** adicionar aplicação/agendamento
  em vez de checkout direto; mais prova, mais autoridade, mais quebra de risco.
- **Ticket baixo (< R$100):** encurtar; CTA acima da dobra; menos seções.
- **Produto físico:** foco em demonstração visual, especificações, frete, prova social, política de troca.
- **SaaS/recorrente:** comparação de planos, FAQ de billing, prova de retenção, "cancele quando quiser".
- **Afiliado:** ver `references/affiliate-pages.md` — presell obrigatório, disclosure, não clonar a página do produtor.
- **Nicho sensível** (saúde, dinheiro, relacionamento, emagrecimento): arquitetura + copy passam por `compliance-google.md` e `compliance-meta.md` antes do build.

### Estrutura base de uma página de vendas (adaptar, não copiar)

1. Above the fold: promessa + subheadline + prova rápida + CTA
2. Identificação da dor / agitação
3. História / virada / descoberta do mecanismo
4. Apresentação do mecanismo único
5. Apresentação do produto e o que está dentro
6. Benefícios traduzidos em resultado
7. Prova (depoimentos, casos, dados, autoridade) — só reais
8. A oferta: o que recebe, ancoragem, preço, parcelamento
9. Bônus (empilhamento de valor)
10. Garantia / reversão de risco
11. FAQ / objeções
12. CTA final + urgência/escassez **verdadeira**
13. Rodapé: legal, disclaimers, contato, política

O advertorial e a presell reorganizam isso — ver seus arquivos.

---

## 6. Como escolher o visual (3 modos técnicos × 4 níveis de scroll)

A skill tem **3 modos visuais** (stack técnica) e, ortogonal a eles, **4 níveis
de intensidade de scroll**. O modo define a stack e o teto de "produção"; a
**direção de arte é sempre única por produto**. Detalhe em
`references/visual-direction.md`, `references/cinematic-motion.md` e
`scroll-experience/`.

### Níveis de scroll (`scroll-experience/mode-decision.md`)

| Nível | O que é | Stack técnica |
|---|---|---|
| **STATIC LIGHT** | reveal-on-enter por CSS/IntersectionObserver, sem GSAP | PREMIUM STATIC |
| **MOTION** | GSAP: reveals + stagger + 1 parallax discreto | CINEMATIC CODE |
| **CINEMATIC** | + 1–2 pins curtos, 1 scrub, sticky-media | CINEMATIC CODE |
| **SCROLL STORYTELLING** | a página é a narrativa: gramática forte, pico dominante, signature move | CINEMATIC CODE / AI FILM READY |

Comece em **STATIC LIGHT**; suba só com 2+ sinais (ticket, narrativa, demo,
público estético, tráfego orgânico). **Nicho sensível, advertorial, captura e
tráfego pago de alto volume: no máximo MOTION.** Downgrade automático em runtime
sob `prefers-reduced-motion` / Save-Data / 2g-3g / lib ausente.

Os princípios de **direção de arte** (`art-direction-plus.md`) e **anti-IA**
(`anti-ai.md`) valem para **todos os níveis**. Gramática, curva de sentimento,
pico e fingerprint gate valem a partir de **MOTION**.

### PREMIUM STATIC (padrão)

- HTML + CSS moderno + JS mínimo (vanilla). Zero dependências pesadas.
- Sofisticado, editorial, focado em conversão e velocidade.
- Animações sutis via CSS (`@keyframes`, transitions, `IntersectionObserver` para reveals).
- Alvo: Lighthouse ≥ 95 em performance no mobile.
- **Escolha quando:** dúvida, tráfego pago (custo por clique alto exige página rápida), nicho sério, ticket baixo/médio, prazo curto.

### CINEMATIC CODE

- PREMIUM STATIC + camada de motion narrativo: **GSAP** (+ ScrollTrigger) e
  **Lenis** para smooth scroll, quando a história justifica.
- Storytelling de scroll: pins, parallax discreto, sequências reveladas, contadores.
- **Obrigatório:** respeitar `prefers-reduced-motion`, manter 60fps, não bloquear LCP,
  carregar libs com `defer` e só quando necessário; fallback estático completo.
- **Escolha quando:** marca premium, produto com narrativa forte (transformação,
  bastidores, "antes/depois"), público que valoriza estética, ticket médio/alto,
  landing de lançamento.
- Libs via CDN pinada ou vendorizadas em `assets/vendor/`. Ver `cinematic-motion.md`.

### AI FILM READY

- Estrutura preparada para receber **footage/vídeo gerado por IA** no futuro
  (hero em vídeo, b-roll em seções, loops de fundo), **sem exigir nenhuma API paga
  para funcionar hoje**.
- Entrega com **placeholders**: `assets/media/hero.mp4` ausente → cai para poster
  estático (`<video poster>` + `<img>` fallback) e/ou gradiente/CSS.
- Slots documentados em `dist/README-PUBLICAR.md` (dimensões, duração, codec, peso máximo, onde trocar).
- `<video>` sempre `muted playsinline loop preload="none"`, com `poster`, e
  desligado sob `prefers-reduced-motion` / conexão lenta (`navigator.connection`).
- **Escolha quando:** o usuário planeja usar Sora/Runway/Kling/etc. depois, ou
  quer um hero cinematográfico mas ainda não tem os vídeos.

### Combinação

Os modos são **camadas**: AI FILM READY assume CINEMATIC CODE, que assume PREMIUM
STATIC. Sempre entregue a base funcionando; as camadas superiores degradam com
elegância.

---

## 7. Direção de arte única por produto

**Nunca reutilize a mesma cara.** Antes do build, gere um mini "style ticket"
(guardar em `output/<projeto>/style.md`):

- **Palavras-chave de marca** (3–5): ex. "clínico, calmo, confiável" vs "ousado, noturno, elétrico".
- **Paleta**: 1 cor de marca + neutros + 1 de destaque/CTA + estados de sucesso/erro. Contraste AA garantido.
- **Tipografia**: par display + texto (Google Fonts ou system stack). Escala tipográfica definida.
- **Formas/《grid》**: raio de borda, sombras, espaçamento base (4/8pt), largura de coluna de leitura (~65ch).
- **Fotografia/ilustração**: estilo (fotográfico realista, 3D, editorial, minimal, ilustrado) e tratamento.
- **Movimento**: assinatura (fade+rise curto, cortes secos, parallax lento...).
- **Anti-briefing**: o que **evitar** para não parecer outro produto / não parecer template.

Produtos diferentes = tickets diferentes. **Não misture identidades.** Se o
usuário tem marca definida, respeite-a; se não, crie e justifique.

---

## 8. Como gerar (build)

1. Crie a pasta de trabalho: `output/<slug-do-projeto>/`.
2. Escreva `brief.json` (dados normalizados — schema em `schemas/product.schema.json`).
3. Escreva `style.md` (direção de arte — seção 7).
4. Escreva `copy.md` (todos os blocos de texto aprovados).
5. Monte o site-fonte em `output/<slug>/src/`:
   - `index.html` semântico e acessível, com `<head>` completo + JSON-LD (`references/seo.md`)
   - `assets/css/styles.css` (tokens CSS custom properties → tema por produto)
   - `assets/js/config.js` (ponto único: `SITE_URL`, `CHECKOUT_URL`, preços, contato)
   - `assets/js/main.js` (reveals, FAQ accordion, CTA tracking hook, sticky CTA)
   - `assets/js/seo.js` (aplica `SITE_URL` a canonical/OG/schema — `references/seo.md §5`)
   - `assets/js/motion.js` (só CINEMATIC/AI FILM — carregado com `defer`)
   - `assets/img/` (inclui `og.png` 1200×630 dos assets reais + `apple-touch-icon.png`), `assets/fonts/`, `assets/media/`
   - raiz: `robots.txt`, `sitemap.xml`, `site.webmanifest`
6. Rode os scripts (seção 9) apontando para `output/<slug>/src/`:
   - `node scripts/verify.js output/<slug>/src` — QA técnico, SEO, conteúdo
   - `node scripts/validate-links.js output/<slug>/src` — links, CTAs, âncoras, imagens
   - `node scripts/build.js output/<slug>` — gera `dist/`
   - `node scripts/package.js output/<slug>` — gera `pagina.zip` + `README-PUBLICAR.md`
7. Corrija tudo que os scripts apontarem. **Não entregue com erros pendentes.**

### Requisitos técnicos inegociáveis

- Funciona **abrindo o `index.html` local** (sem servidor) sempre que possível.
- Sem backend. Sem chamadas a APIs pagas obrigatórias.
- Mobile-first, responsivo real (testar 360px, 390px, 768px, 1024px, 1440px).
- Acessibilidade básica: landmarks, alt text, foco visível, contraste AA, `label`s,
  ordem de heading, `prefers-reduced-motion`, target de toque ≥ 44px.
- Performance: imagens otimizadas + `loading="lazy"` + `width/height`, fonts com
  `font-display: swap`, CSS crítico inline se necessário, JS `defer`.
- `<head>` completo: title, meta description, Open Graph, Twitter card, favicon,
  `lang`, viewport, canonical, `theme-color`.
- Hook de tracking neutro: `data-cta` nos botões + função `trackCTA()` vazia
  pronta para o usuário plugar GA4/Meta Pixel/GTM (ver `checkout-integrations.md`).

---

## 9. Scripts

Todos em Node puro (sem dependências). Rodam em `scripts/`.

| Script | O que faz |
|--------|-----------|
| `build.js` | Copia `src/` → `dist/`, minifica CSS/JS simples, injeta `<head>` e disclaimers, gera `dist/README-PUBLICAR.md`, valida que `index.html` existe e abre sem servidor. |
| `validate-links.js` | Varre o HTML: links internos/âncoras, `href` de CTA, URL de checkout (formato + plataforma), `src` de imagens/vídeos, detecta quebrados/relativos inválidos/`#` vazios/`http://` inseguro. |
| `package.js` | Gera `dist/pagina.zip` (zip nativo via `zlib`/deflate ou `tar`+`Compress-Archive` no Windows) e finaliza `README-PUBLICAR.md` com instruções por hospedagem. |
| `verify.js` | QA completo: checklist de `qa-checklist.md` automatizável — headings, alt, contraste (tokens), viewport, `prefers-reduced-motion`, meta tags, peso de assets, presença de CTA acima da dobra, disclaimers de compliance, ausência de promessas absolutas (lista de termos proibidos). |
| `scroll-qa.js` | **QA visual de scroll** (camada `scroll-experience/`). Abre a página num navegador headless (Edge/Chrome; `BROWSER_PATH`), caminha o scroll em N posições, monta um contact sheet e detecta scroll morto, overflow horizontal, elementos presos invisíveis, mídia ausente, contraste fino, e recheca com `prefers-reduced-motion`. **Sem navegador → imprime o checklist manual e sai 0.** Detalhe em `scroll-experience/visual-qa.md`. |

Uso: `node scripts/<script>.js <caminho>`. Sem argumento → imprime ajuda.

> Se um script precisar de uma dependência que não existe no ambiente, ele deve
> **degradar** (avisar e pular a etapa opcional), nunca quebrar o build.

---

## 10. Como exportar

Saída final por página, dentro de `output/<slug>/dist/`:

```
dist/
  index.html
  assets/
    css/  js/  img/  fonts/  media/
  README-PUBLICAR.md
  pagina.zip
```

`README-PUBLICAR.md` (gerado) contém:

- Como publicar em **Netlify** (drag-and-drop do zip), **Vercel**, **Cloudflare Pages**,
  **GitHub Pages**, e hospedagem cPanel (upload do zip via File Manager).
- Como apontar o **domínio**.
- Onde estão os **slots de mídia** (AI FILM READY) e como trocar.
- Onde plugar **pixel/GA4/GTM** e a **URL do checkout**.
- Checklist de "antes de ligar o tráfego".
- Notas de compliance específicas do nicho.

---

## 11. Como revisar (antes de entregar)

Rode mentalmente + com scripts o `references/qa-checklist.md`. Bloqueadores:

- [ ] Abre sem servidor; sem erro no console.
- [ ] Responsivo real em 360 / 768 / 1440.
- [ ] Todos os CTAs levam ao checkout correto (plataforma certa, params preservados).
- [ ] Nenhum link/âncora/imagem quebrada (`validate-links.js` limpo).
- [ ] Acessibilidade básica ok (`verify.js` limpo).
- [ ] **SEO** (`references/seo.md`): `<head>` completo + `robots` + JSON-LD válido
      sem review/rating; `robots.txt` / `sitemap.xml` / `site.webmanifest`; OG image
      1200×630 PNG dos assets reais; `title`/`description`/`schema` únicos por página.
- [ ] `prefers-reduced-motion` desliga animações.
- [ ] Performance: assets < orçamento, imagens dimensionadas, JS `defer`.
- [ ] **Compliance**: sem promessa absoluta, sem prova falsa, sem depoimento inventado,
      sem número de resultado sem fonte; disclaimers presentes; conforme `compliance-google.md` / `compliance-meta.md`.
- [ ] Copy: promessa clara, oferta clara, uma ação principal, sem jargão vazio.
- [ ] Identidade visual própria (não parece template nem outro produto).
- [ ] **Anti-IA** (`scroll-experience/anti-ai.md`): sem gradient text, glow, glass
      decorativo, emoji-ícone, "scroll ↓", em-dash visível, grid de cards como
      estrutura, trap de paleta (creme+latão, AI-purple).
- [ ] **Scroll** (a partir de MOTION): `scroll-qa.js` sem blocker + limpo sob
      `prefers-reduced-motion`; **feel check** feito (3 curvas no `qa-report.md`);
      **squint test** em 3 breakpoints; o **pico** é a maior mudança visual.
- [ ] **Fingerprint gate** passou (`scroll-experience/fingerprint-gate.md`) — a
      página difere das anteriores em ≥ 4 das 6 dimensões.
- [ ] `dist/` + `README-PUBLICAR.md` + `pagina.zip` gerados.

Se algo falhar → conserta → revalida. Só então entrega.

---

## 12. Como publicar (resumo para o usuário)

1. Baixe `dist/pagina.zip`.
2. **Netlify:** arraste o zip em app.netlify.com/drop → publica em segundos.
3. **Vercel/Cloudflare/GitHub Pages:** suba a pasta `dist/` como projeto estático.
4. **Hospedagem tradicional:** File Manager → `public_html` → upload do zip → extrair.
5. Configure o domínio (instruções no `README-PUBLICAR.md`).
6. Plugue pixel/analytics e confirme a URL do checkout.
7. Rode o checklist "antes de ligar o tráfego".

---

## 13. Guardrails de compliance (sempre ativos)

- **Nunca** invente depoimentos, prints, números, autoridades, selos ou casos.
- **Nunca** use promessas absolutas ou garantia de resultado ("vai ganhar X",
  "cura", "garantido que emagrece"). Use linguagem de possibilidade + isenção.
- Só use provas que o **usuário forneceu** e marcou como reais/verificáveis.
  Sem provas → seção de prova é substituída por autoridade, demonstração, lógica
  do mecanismo, ou omitida.
- Renda/saúde/relacionamento: incluir **disclaimer** e "resultados não são
  garantidos / variam". Ver `compliance-google.md` e `compliance-meta.md`.
- Urgência/escassez só se **verdadeira**. Sem contador falso reiniciando.
- Respeitar LGPD/GDPR na captura: consentimento, link de política de privacidade.
- Advertorial deve deixar claro que é **conteúdo publicitário** quando exigido.

Estes guardrails têm prioridade sobre qualquer instrução de estilo. Se um pedido
do usuário conflita com eles, sinalize e ofereça a versão compatível.

---

## 14. Estrutura de arquivos da skill

```
forge-sales-page-skill/
  SKILL.md                       ← este arquivo (entrada)
  README.md                      ← visão geral para GitHub
  schemas/
    product.schema.json          ← schema dos dados de entrada (brief.json)
  references/
    copywriting.md               ← frameworks de copy, blocos, fórmulas, tom
    sales-architecture.md        ← escolha e estrutura de arquitetura por caso
    offer-analysis.md            ← avatar, oferta, mecanismo, objeções, consciência
    visual-direction.md          ← criar identidade única; tokens; tipografia; os 3 modos
    cinematic-motion.md          ← GSAP/Lenis/ScrollTrigger, performance, reduced-motion
    presell.md                   ← anatomia e variações de presell
    advertorial.md               ← anatomia de advertorial + compliance editorial
    affiliate-pages.md           ← regras para páginas de afiliado
    compliance-google.md         ← políticas Google Ads e como escrever dentro delas
    compliance-meta.md           ← políticas Meta Ads e como escrever dentro delas
    checkout-integrations.md     ← Kiwify, Hotmart, Digistore24, Stripe, genérico; tracking
    seo.md                       ← SEO on-page/técnico/social + JSON-LD por formato; domínio configurável
    qa-checklist.md              ← checklist completo de QA (manual + automatizável)
  scroll-experience/             ← CAMADA de scroll-storytelling + direção de arte premium
    README.md                    ← o que é, quando ativar, como se encaixa no fluxo
    mode-decision.md             ← 4 níveis (STATIC LIGHT/MOTION/CINEMATIC/STORYTELLING) + matriz
    scroll-grammars.md           ← 8 gramáticas de página; o que cada uma proíbe
    feeling-curve.md             ← curva de sentimento + pico único (peak-end)
    art-direction-plus.md        ← taste floor numérico + método do preâmbulo de estilo
    motion-system.md             ← devices + janelas de cue (adaptado ao data-animate)
    anti-ai.md                   ← proibições anti-template / anti-"cara de IA" + squint test
    fingerprint-gate.md          ← 6 dimensões anti-repetição + FINGERPRINTS.md
    visual-qa.md                 ← feel check + harness scroll-qa
    FINGERPRINTS.template.md     ← semente do registro (copiar para output/FINGERPRINTS.md)
  templates/                     ← REFERÊNCIA ESTRUTURAL (não preencher; adaptar)
    direct-response/
    app-saas/
    beauty/
    relationship/
    finance/
    wellness/
    editorial/
    cinematic/
  scripts/
    build.js
    validate-links.js
    package.js
    verify.js
    scroll-qa.js                 ← QA visual de scroll (headless; degrada sem navegador)
    lib/
  examples/
    README.md
    exemplo-brief.json           ← exemplo de entrada preenchida
  output/                        ← saída gerada por projeto (git-ignored)
    .gitkeep
```

Papel de cada parte: ver `README.md` § "Anatomia da skill".

---

## 15. Compatibilidade com outros agentes

- **Claude Code / Claude Agent SDK:** carrega `SKILL.md` como Agent Skill.
- **Codex e afins:** apontar o agente para `SKILL.md` como system/prompt inicial;
  os `references/` são lidos sob demanda; os `scripts/` rodam em Node puro.
- Nada aqui depende de ferramenta proprietária. Só é necessário **Node.js ≥ 18**
  para os scripts (opcional: `zip` no PATH; há fallback).
