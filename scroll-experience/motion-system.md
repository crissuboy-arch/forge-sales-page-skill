# Sistema de motion — devices, janelas de cue, orçamento

Complementa `references/cinematic-motion.md` (dono da stack, carregamento,
orçamento de performance, `prefers-reduced-motion` e fallback). Aqui está o
**vocabulário de efeitos** e como atrelá‑los à `feeling-curve.md`.

A implementação continua sendo **GSAP + ScrollTrigger + Lenis vendorizados** +
`assets/js/motion.js` com atributos `data-animate`. **Não** adotamos engine
externa nem `data-sc-*`.

## 1. Devices (o que existe)

| Device | Efeito | Nível mínimo (`mode-decision.md`) | Regra |
|---|---|---|---|
| **Reveal on enter** | fade + rise 12–24px ao entrar na viewport, uma vez | STATIC LIGHT | o default; use em quase tudo |
| **Stagger** | itens de uma lista aparecem em sequência | STATIC LIGHT | 30–80ms entre itens, máx. ~8 itens |
| **Parallax discreto** | fundo move 5–12% mais devagar | MOTION | nunca em texto; total ≤ ~200px; passou disso lê como bug |
| **Counter** | número sobe até o valor **real** | MOTION | só dados verificados (`brief.proof`); valor final = valor real; respeita reduced‑motion |
| **Kinetic headline** | título quebra em linhas/palavras com entrada escalonada | MOTION | **1 por página**, só no hero ou no pico; linhas sobem atrás de máscara preservando descendentes |
| **Wipe / reveal** | `clip-path` entrando de uma borda (up/down/left/right/iris) | MOTION | só para **momento de transformação**, não para introdução simples; use full‑bleed |
| **Pin + step** | seção fixa enquanto o conteúdo avança em passos | CINEMATIC | máx. **1–2** por página, spans curtos (≥ 1.2vh), sair do pin limpo, **desligar em mobile** |
| **Scrub** | sequência (frames/estado) atrelada ao progresso do scroll | CINEMATIC | máx. **1** por página; só desktop; precisa de fallback (imagem estática) |
| **Sticky media + scrolling copy** | mídia fixa de um lado, copy rola do outro | CINEMATIC | vira coluna única no mobile |
| **Pan (deriva lateral)** | scroll vertical → viagem lateral (timeline, lineup) | CINEMATIC | ~1vh por item + 1; em reduced‑motion vira scroll nativo com snap |
| **Pointer: tilt** | rotação 3D 5–9° em direção ao cursor | MOTION | só `(hover: hover) and (pointer: fine)`; off em reduced‑motion |
| **Pointer: magnet** | elemento deriva 0.2–0.35 em direção ao ponteiro | MOTION | idem tilt |
| **Pointer: spotlight** | luz segue o cursor via `--mx`/`--my` | MOTION | idem tilt |

**Assinatura de movimento:** escolher **1–2 devices** e ser consistente. Excesso
de efeitos diferentes = amador. O pico pode usar 1 device extra que não aparece
em nenhum outro lugar (é a "signature move" — ver `fingerprint-gate.md §2`).

## 2. Janelas de cue (adaptado ao `data-animate`)

Conceito emprestado do "cue contract" do ScrollCraft, reescrito para a stack
FORGE. Cada elemento animado tem uma janela de visibilidade em função do
progresso da sua seção (0 → 1):

| Forma | Comportamento | Onde usar |
|---|---|---|
| `entra em 0.2, segura até o fim` | 1 valor: fade‑in e mantém | **última seção** da página; conteúdo que não deve sumir |
| `entra 0.1, platô, sai 0.6` | 2 valores: in / hold / out | seções do **miolo** — todo elemento do miolo fecha antes do fim da seção |
| `cheio no início, some depois` ("greet") | opacidade total em 0, depois fade | **hero** e primeira dobra de seção pinada — evita tela de entrada vazia |

Regras:
- Cue do **hero** usa a forma "greet" (já visível, não faz o usuário esperar o
  LCP).
- Só a **última seção** pode "segurar" (1 valor). Todas as outras fecham com
  janela de 2 valores.
- Seção pinada precisa de **conteúdo de chão** (algo já visível) ou primeiro cue
  em "greet" — nunca abrir num pin com a tela vazia.
- Implementação: `ScrollTrigger` com `start`/`end` na seção + `scrub` para o
  miolo (só desktop), ou `toggleActions` para reveal simples. `motion.js` traduz
  `data-animate="0.1 0.6"` nesses parâmetros.

## 3. Ligando à feeling curve

De `feeling-curve.md §3`:

- Seção com emoção **calma** → só reveal + stagger. Sem parallax, sem pin.
- Seção de **transição** (curiosidade, virada, alívio) → cabe 1 wipe OU o único
  kinetic headline OU um reveal mais lento.
- **Pico** → concentra o orçamento: aqui vai o pin/scrub/sticky‑media (se o nível
  permitir) + o melhor asset + a signature move.
- Seção **sem emoção** na curva → **sem animação** (e provavelmente deve sair).

## 4. Orçamento (resumo — detalhe em `cinematic-motion.md §3`)

- LCP nunca depende de JS. Hero renderiza por HTML/CSS.
- Só `transform`/`opacity`. `will-change` só no elemento ativo, remover depois.
- Máx. ~3 timelines com `scrub`; máx. 2 pins, curtos.
- Total JS (libs + `motion.js`) ≤ ~45KB gz. Estourou → cortar Lenis primeiro.
- 60fps no scroll com CPU 4× throttle / device mid‑tier.
- Sem CLS causado por animação de entrada (elemento reserva espaço).

## 5. Fallback (obrigatório — `cinematic-motion.md §4–5`)

`prefers-reduced-motion` / Save‑Data / 2g‑3g / lib ausente → tudo no estado
final, imediatamente. `motion.js` começa com `if (!window.gsap) return;`. Sem JS
→ página completa. Nenhum conteúdo preso atrás de animação.

## 6. Saída

`assets/js/motion.js` implementando os devices escolhidos, com `data-animate`
carregando as janelas de cue. Lista dos devices usados + a signature move
registrada no `output/FINGERPRINTS.md` (dimensões 3, 4 e 6).
