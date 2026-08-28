# cinematic/ — modo CINEMATIC CODE / AI FILM READY

Camada de **motion narrativo** e **slots de mídia** sobre qualquer vertical.
Ler `references/cinematic-motion.md` antes.

## Quando usar
- Marca premium, ticket médio/alto, público que valoriza estética.
- Produto com narrativa forte (transformação, processo, bastidores).
- Landing de lançamento.
- **Não** para tráfego pago de alto volume com CPC caro / nicho sério / prazo curto.

## O que este template acrescenta
1. `assets/js/motion.js` (carregado com `defer`, depois das libs).
2. Libs em `assets/vendor/` (GSAP + ScrollTrigger + Lenis) — vendorizadas ou CDN pinada + SRI.
3. Atributos `data-animate` nos elementos que entram com movimento.
4. `<video>` de fundo com `poster` + `<img>` fallback + `data-media-slot` (AI FILM READY).
5. Bloco CSS `prefers-reduced-motion` + classe `.no-motion` / `.js-motion`.

## Regras inegociáveis
- LCP **não** depende de JS. Hero renderiza por HTML/CSS.
- Animar só `transform` e `opacity`.
- `prefers-reduced-motion` / Save-Data / 3g → sem motion, sem vídeo, conteúdo completo.
- JS desligado ou lib com erro → página inteira funcional (fallback estático).
- `motion.js` começa com `if (!window.gsap) return;`.
- Máx. ~2 pins, ~3 timelines com scrub. Total JS+libs ≤ ~45KB gz.
- `<video>` sempre `muted playsinline loop preload="none"`, nunca autoplay com som.

## Slots de mídia (AI FILM READY)
Documentar cada um no `README-PUBLICAR.md` (o `build.js`/`package.js` detecta e lista):
dimensão, aspect ratio, duração alvo (6–12s), peso máx. (hero ≤ 3MB, b-roll ≤ 1,5MB),
codec (H.264 .mp4 + VP9/AV1 .webm), e o caminho do arquivo. A página funciona sem eles.
