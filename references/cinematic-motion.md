# Motion cinematográfico — GSAP, ScrollTrigger, Lenis

Guia do modo **CINEMATIC CODE** (e da camada de motion do AI FILM READY).
Motion é tempero, não prato. Só entra quando a **história** justifica e a
**performance** aguenta.

---

## 1. Quando usar motion narrativo

Usar se **2+** forem verdade:
- Marca premium / ticket médio-alto / público estético.
- Produto com narrativa (transformação, antes/depois legítimo, bastidores, processo).
- Landing de lançamento onde o "uau" ajuda a reter atenção.
- O usuário pediu explicitamente.

Não usar (ficar em PREMIUM STATIC) se:
- Tráfego pago de alto volume com CPC caro (velocidade > espetáculo).
- Nicho sério/compliance sensível (parece menos confiável).
- Prazo curto, avatar mobile de conexão fraca, ticket baixo.

---

## 2. Stack e carregamento

| Lib | Uso | Peso aprox. |
|---|---|---|
| **GSAP core** | tweens, timelines | ~23KB gz |
| **ScrollTrigger** | animação atrelada ao scroll, pin, scrub | ~11KB gz |
| **Lenis** | smooth scroll (inércia) | ~3KB gz |

Carregamento:
```html
<!-- no fim do <body>, todos defer -->
<script defer src="assets/vendor/gsap.min.js"></script>
<script defer src="assets/vendor/ScrollTrigger.min.js"></script>
<script defer src="assets/vendor/lenis.min.js"></script>
<script defer src="assets/js/motion.js"></script>
```
- **Vendorizar** em `assets/vendor/` (baixado no build) OU CDN pinado
  (`cdnjs`/`jsdelivr`) com versão exata + `integrity` (SRI) + `crossorigin`.
- Nunca `@latest`. Nunca bloquear render. Nunca no `<head>` sem defer.
- `motion.js` deve checar `if (!window.gsap) return;` e sair limpo.

---

## 3. Guard rails de performance (orçamento)

- **LCP não pode depender de JS.** Hero renderiza por HTML/CSS; motion só realça.
- Animar **apenas** `transform` e `opacity`. Nunca `top/left/width/height/margin`.
- `will-change` só no elemento ativo, remover depois.
- ScrollTrigger: `scrub: true` só em telas grandes; em mobile usar reveal simples.
- Máx. ~3 timelines com `scrub` na página. Pins: no máximo 2, curtos.
- `ScrollTrigger.config({ ignoreMobileResize: true })`; `gsap.ticker.lagSmoothing(0)` com cautela.
- Testar em CPU 4× throttle / mobile mid-tier: manter ~60fps, sem jank no scroll.
- Total JS (libs + motion.js) alvo ≤ 45KB gz. Se estourar, cortar Lenis.

---

## 4. prefers-reduced-motion (obrigatório)

```js
const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
if (reduce) {
  document.documentElement.classList.add('no-motion');
  // não iniciar Lenis, não criar ScrollTriggers com scrub;
  // revelar tudo imediatamente (estado final).
} else {
  initLenis();
  initScrollAnimations();
}
```
- CSS: `.no-motion [data-animate]{opacity:1;transform:none;}`
- Também degradar sob `navigator.connection.saveData` ou `effectiveType` `slow-2g/2g/3g`.
- Botão opcional "reduzir animações" que seta `localStorage` e recarrega o estado.

---

## 5. Fallback estático (JS desligado / erro de lib)

- Todo elemento animado começa **visível** por CSS; o JS só adiciona a partida
  a partir de um estado neutro **quando confirma** que a lib carregou:
  ```css
  [data-animate]{opacity:1;transform:none;}
  .js-motion [data-animate]{opacity:0;transform:translateY(12px);}
  ```
  `document.documentElement.classList.add('js-motion')` só roda dentro do
  `motion.js` **após** checar `window.gsap`.
- Sem JS → página completa, legível, com todas as seções e CTAs. Nada de conteúdo
  "preso" atrás de animação.

---

## 6. Padrões de scroll (biblioteca de efeitos)

| Padrão | Descrição | Cuidado |
|---|---|---|
| **Reveal on enter** | fade + rise 12–24px quando entra na viewport | o padrão default; use em quase tudo |
| **Staggered list** | bullets/benefícios aparecem em sequência (stagger 0.06) | não passar de ~8 itens |
| **Pin + step** | seção fixa enquanto o texto/estado avança em passos | máx. 1–2; sair do pin limpo; desligar em mobile |
| **Parallax discreto** | fundo move 5–12% mais devagar | nunca em texto; nunca > 15% |
| **Counter** | número sobe até o valor real (só dados verificados) | respeitar reduced-motion; valor final = valor real |
| **Horizontal scroll** | trilho lateral para "passos" ou galeria | pesado; só desktop; indicar progresso; ter fallback vertical |
| **Text mask / line reveal** | linhas do título sobem por baixo de máscara | só no hero; não atrasar LCP (texto já no DOM) |
| **Sticky media + scrolling copy** | imagem/vídeo fixa à direita, copy rola à esquerda | vira coluna única no mobile |

Assinatura de movimento: escolher **1–2** padrões e ser consistente. Excesso de
efeitos diferentes = amador.

---

## 7. Lenis (smooth scroll) — setup mínimo

```js
function initLenis(){
  const lenis = new Lenis({ duration: 1.05, easing: t => Math.min(1, 1.001 - Math.pow(2, -10*t)) });
  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add(t => lenis.raf(t * 1000));
  gsap.ticker.lagSmoothing(0);
}
```
- Não usar Lenis se `reduce` ou mobile de baixo desempenho.
- Garantir que âncoras (`#oferta`) ainda funcionam (`lenis.scrollTo`).
- Não quebrar `position: sticky` do CTA.

---

## 8. AI FILM READY — motion + mídia

- Hero `<video>` entra como camada de fundo; texto e CTA sempre por cima em HTML.
- Trocar `poster` estático → vídeo só depois de `loadeddata` e se não `reduce`/`saveData`.
- B-roll em seções: `<video>` com `IntersectionObserver` que dá `play()`/`pause()`.
- Sem arquivo de vídeo presente → `motion.js` detecta 404/`error` e mantém poster.
- Nunca autoplay com som. Sempre `muted playsinline`.

---

## 9. Checklist de motion (parte do QA)

- [ ] LCP não regrediu vs versão estática.
- [ ] 60fps no scroll em device mid-tier (throttle 4×).
- [ ] `prefers-reduced-motion` → zero animação, conteúdo completo.
- [ ] Save-Data / 3g → motion e vídeo desligados.
- [ ] JS desligado → página inteira funcional.
- [ ] Sem CLS causado por animação de entrada.
- [ ] Libs pinadas + SRI (se CDN) ou vendorizadas.
- [ ] `motion.js` sai limpo se a lib falhar.
- [ ] Âncoras e sticky CTA funcionam com Lenis ligado.
