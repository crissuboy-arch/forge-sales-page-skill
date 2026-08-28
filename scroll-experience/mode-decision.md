# Decisão de modo — quanto scroll esta página precisa

Roda na **Fase 3–4** (arquitetura + direção). A skill declara a escolha no início
da entrega, como já faz com formato e modo visual.

Os 3 modos visuais de `SKILL.md §6` (PREMIUM STATIC / CINEMATIC CODE / AI FILM
READY) definem a **stack técnica**. Esta camada acrescenta uma escala de
**intensidade de scroll**, ortogonal, com 4 níveis:

| Nível | O que é | Stack (§6) | grammar/feeling/pico/fingerprint | harness `scroll-qa` |
|---|---|---|---|---|
| **STATIC LIGHT** | Reveal‑on‑enter por CSS/IntersectionObserver. Sem GSAP. | PREMIUM STATIC | opcional (recomendado feeling curve) | não |
| **MOTION** | GSAP para reveals + stagger + 1 parallax discreto. Sem pin, sem scrub. | CINEMATIC CODE | **sim** | recomendado |
| **CINEMATIC** | + 1–2 pins curtos, 1 sequência com scrub, sticky‑media. | CINEMATIC CODE | **sim** | **obrigatório** |
| **SCROLL STORYTELLING** | A página é a narrativa: grammar forte (filmic one‑shot, split stage…), pico dominante, signature move central. | CINEMATIC CODE / AI FILM READY | **sim** | **obrigatório** |

`anti-ai.md` e `art-direction-plus.md` valem para **os 4 níveis** (e para páginas
STATIC sem esta camada).

## Matriz de decisão

Comece em **STATIC LIGHT**. Suba de nível só quando 2+ sinais empurram para cima.

| Sinal | ↓ mais estático | ↑ mais scroll |
|---|---|---|
| **Tipo de produto** | ferramenta utilitária, commodity, serviço local | marca com narrativa (transformação, processo, bastidores), lançamento |
| **Ticket** | < R$100 | > R$1.000 / high‑ticket / mentoria |
| **Volume de conteúdo** | oferta cabe em 1–2 telas | história longa, muitos módulos, várias provas |
| **Necessidade de demonstração** | nenhuma / 1 screenshot | produto que só faz sentido "vendo funcionar" (SaaS, app, ferramenta visual) |
| **Público** | comprador apressado, B2B racional, nicho sério | público que valoriza estética, consumidor final, topo de funil |
| **Performance / tráfego** | Google/Meta Ads de alto volume, CPC caro | tráfego orgânico, e‑mail, remarketing, público morno/quente |
| **Mobile** | maioria mobile, conexão fraca, avatar 3G | desktop relevante, público com aparelho bom |
| **Objetivo de conversão** | clique rápido no checkout | construir crença antes da oferta (presell, advertorial, high‑ticket) |

### Regras rígidas

- **Nicho sensível** (saúde, finanças, relacionamento, emagrecimento): máximo
  **MOTION**. Scroll teatral reduz confiança e atrai escrutínio de compliance.
- **Tráfego pago de alto volume com CPC caro**: máximo **MOTION**. Velocidade
  vence espetáculo — a página tem que ganhar o leilão de atenção em 1s.
- **Advertorial**: no máximo **STATIC LIGHT / MOTION**. Ele imita publicação
  editorial; scroll cinematográfico quebra a ilusão.
- **Página de captura / obrigado**: **STATIC LIGHT**. Uma ação, sem teatro.
- **SCROLL STORYTELLING** exige orçamento real de assets (footage, ilustração,
  ou screenshots ricos). Sem material, **não** subir a este nível — vira caixa
  vazia com animação.

### Downgrade automático em runtime (sempre)

Independente do nível escolhido, a página **desce sozinha** para o comportamento
STATIC LIGHT quando: `prefers-reduced-motion: reduce`, `navigator.connection.saveData`,
`effectiveType` 2g/3g, ou a lib de motion falhou. Ver `references/cinematic-motion.md §4–5`.

## Saída da decisão

No `output/<slug>/style.md`, uma linha:

```
Nível de scroll: MOTION — ticket médio (R$497), narrativa de transformação,
público orgânico/e-mail. Não subimos a CINEMATIC porque ~70% do tráfego é mobile.
```

E a entrada correspondente em `output/FINGERPRINTS.md` (ver `fingerprint-gate.md`).
