# scroll-experience/ — camada de inteligência de scroll & direção de arte

Camada **reutilizável** da FORGE SALES PAGE SKILL. Destila os princípios úteis de
scroll‑storytelling e direção de arte premium (referência: ScrollCraft —
`github.com/inematds/scroll-craft`) e os transforma em **regras operacionais**
que a skill aplica ao gerar páginas.

> **Não é uma engine.** Não copiamos runtime, `data-sc-*`, ffmpeg, playwright, API
> de geração de imagem, nem o modo "continuous world". A stack de motion continua
> sendo a de `references/cinematic-motion.md` (GSAP + ScrollTrigger + Lenis
> vendorizados). Aqui mora a **decisão**: que estrutura, que emoção, que
> movimento, e como provar que funcionou.

## O que esta camada adiciona ao fluxo

A FORGE SALES PAGE SKILL continua sendo a **orquestradora**:

```
PRODUTO → OFERTA → COPY → ARQUITETURA DE VENDA
                              ↓
                    ┌── SCROLL GRAMMAR      (scroll-grammars.md)
                    ├── FEELING CURVE + PICO (feeling-curve.md)
   DIREÇÃO VISUAL ──┤   + taste floor / preâmbulo (art-direction-plus.md)
                    ├── MOTION SYSTEM        (motion-system.md)
                    ├── ANTI‑TEMPLATE / ANTI‑IA (anti-ai.md)
                    └── FINGERPRINT GATE     (fingerprint-gate.md)
                              ↓
                    COMPLIANCE → BUILD → QA
                              ↓
              FEEL CHECK + SQUINT TEST + scroll-qa (visual-qa.md)
```

## Quando ativar (e quanto)

Ver `mode-decision.md`. Nem toda página precisa de scroll pesado. A camada define
4 níveis: **STATIC LIGHT · MOTION · CINEMATIC · SCROLL STORYTELLING**. Os
princípios de direção de arte e anti‑IA valem para **todos**; grammar/feeling
curve/pico/fingerprint valem a partir de **MOTION**; o harness `scroll-qa` só é
obrigatório em **CINEMATIC** e **SCROLL STORYTELLING**.

## Arquivos

| Arquivo | Fase da skill | Conteúdo |
|---|---|---|
| `mode-decision.md` | 3–4 (arquitetura/direção) | os 4 níveis + matriz de decisão |
| `scroll-grammars.md` | 3 (arquitetura) | 8 gramáticas de página adaptadas a vendas; o que cada uma proíbe |
| `feeling-curve.md` | 5 (copy) → 4 (direção) | curva de sentimento por seção + regra do pico único (peak‑end) |
| `art-direction-plus.md` | 4 (direção) | taste floor numérico + método do preâmbulo de estilo (imagens) |
| `motion-system.md` | 4 → 6 (build) | devices, janelas de cue adaptadas a `data-animate`, pointer devices, orçamento |
| `anti-ai.md` | 4 e 6 | lista consolidada de proibições, traps nomeados, squint test |
| `fingerprint-gate.md` | 3 (arquitetura) | 6 dimensões + como manter `FINGERPRINTS.md` (git‑ignored, por conta) |
| `visual-qa.md` | 6 (QA) | feel check + `scripts/scroll-qa.js` (harness headless opcional) |
| `FINGERPRINTS.template.md` | — | semente do registro anti‑repetição; copie para `output/FINGERPRINTS.md` |

## O que continua em outros arquivos (não duplicar aqui)

- Stack, carregamento, orçamento de performance, `prefers-reduced-motion`,
  fallback estático de motion → `references/cinematic-motion.md`.
- Style ticket, tokens CSS, derivação de identidade → `references/visual-direction.md`.
- Checklist geral de QA → `references/qa-checklist.md` (esta camada acrescenta
  itens, não substitui).
- Compliance (prova real, sem número inventado, sem dashboard falso) →
  `references/compliance-*.md`. A regra "só números reais" dos counters e o
  "nada de dashboard falso apresentado como prova" já são compliance — aqui
  apenas reforçamos no contexto visual.
