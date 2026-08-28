# Anti‑template / anti‑"cara de IA"

Vale para **todos** os níveis, inclusive páginas STATIC sem esta camada. Roda na
**Fase 4** (direção, como anti‑briefing) e na **Fase 6** (QA, como varredura).

> Objetivo: a página não pode ser reconhecível como "site gerado por IA" nem como
> template. Direção de arte própria por produto (`visual-direction.md`) + esta
> lista de proibições.

## 1. Proibições de estrutura

- ❌ **Grade de cards idênticos como estrutura da página** (a sequência infinita
  de features iguais). Cards são para conteúdo genuinamente paralelo e curto.
- ❌ Cards aninhados (card dentro de card).
- ❌ Três colunas de feature exatamente iguais.
- ❌ "Split header": headline gigante de um lado + parágrafo flutuante do outro,
  sem relação visual.
- ❌ Layout idêntico ao de outra página já gerada pela skill (ver
  `fingerprint-gate.md`).

## 2. Proibições de rótulo / microtexto

- ❌ **Eyebrow (kicker) acima de toda seção.** Use com parcimônia, 2–3 no máximo
  na página inteira.
- ❌ **Indicadores de scroll**: "scroll", "role para baixo", "↓", mouse animado.
- ❌ Faixas de texto decorativo repetido (marquee de palavras soltas).
- ❌ Números de seção — a menos que a sequência seja informação real (passos).
- ❌ **Em‑dash (—) em texto visível.** Use vírgula, parêntese, ou reescreva.
- ❌ Verbos de enchimento: "seamless", "unleash", "revolutionize", "elevate",
  "supercharge", "transformador" vazio, "descomplicado" clichê.

## 3. Proibições de superfície

- ❌ **Gradient text** (texto com `background-clip: text` colorido).
- ❌ Neon, `box-shadow` de glow externo, `text-shadow` brilhante.
- ❌ **Glassmorphism como decoração** (blur + transparência em tudo).
- ❌ Monospace "de fantasia" (usar mono só para código/dado técnico real).
- ❌ Emoji no lugar de ícone.
- ❌ Cursor custom.
- ❌ Bordas arredondadas gigantes em tudo (`border-radius` > 24px em blocos
  grandes vira "cara de template").

## 4. Traps de paleta nomeados

- ❌ **Creme quente + latão/argila** ("cara de artesanal premium" de e‑commerce
  genérico).
- ❌ **Gradiente violeta → azul com glow neon** (o "AI‑purple" — assinatura nº 1
  de landing gerada).
- ❌ Fundo preto puro `#000` + texto branco puro `#fff` (ver `art-direction-plus.md`).
- ❌ Paleta de "todas as cores" (mais de 1 accent).

## 5. Proibições de hero

- ❌ Hero que **estoura a viewport** (headline não cabe, ou empurra o CTA para
  fora).
- ❌ **Mais de 4 elementos de texto no hero** (eyebrow + h1 + sub + 2 bullets +
  badge + … = poluição).
- ❌ Hero genérico "de IA": pessoa sorridente de stock, mockup 3D flutuante,
  gradiente + formas abstratas, "grid de pontos".

## 6. Proibições de conteúdo / compliance (reforço)

- ❌ **Estatística inventada** / número sem fonte (counters só com `brief.proof`
  verificado).
- ❌ **Dashboard/print falso apresentado como prova real.** Se a tela é
  demonstração, rotular ("dados de teste / demonstração"). Ver `compliance-*.md`.
- ❌ Depoimento, selo, logo de imprensa, "como visto em" que o cliente não
  forneceu e marcou como real.
- ❌ **Texto assado dentro de imagem.** Todo texto é HTML real — para SEO,
  acessibilidade, tradução e para o QA de contraste conseguir medir.
- ❌ Contador de urgência que reinicia; "últimas vagas" sem escassez real.

## 7. Squint test (obrigatório no QA)

Desfoque a página até o detalhe sumir (ou reduza a miniatura). Devem continuar
identificáveis: o **grupo primário** (a promessa + CTA), o **secundário**, e os
**grandes blocos**. Se tudo vira um campo cinza uniforme → problema de
hierarquia, não de estilo. Rodar em 360 / 768 / 1440.

## 8. Varredura automatizável (`verify.js` / `scroll-qa.js`)

Termos e padrões que a varredura sinaliza (revisar cada ocorrência):

```
texto visível:  "scroll" "role para baixo" "↓ " " — " (em-dash entre espaços)
                "seamless" "unleash" "revolutionize" "supercharge"
CSS:            background-clip: text  |  -webkit-text-fill-color: transparent
                text-shadow: ... (com alpha alto)  |  filter: blur() em texto
                cursor: url(  |  cursor: none
                linear-gradient(...#a0f|#b0f|#c0f...) + box-shadow glow  (AI-purple)
HTML:           > 4 filhos de texto direto em .hero
                > 3 blocos .card irmãos com a mesma estrutura como seção principal
imagem:         <img> em seção de "prova" sem entrada correspondente em brief.proof
```

## 9. Saída

Resultado da varredura + do squint test no `output/<slug>/qa-report.md`. Qualquer
proibição das seções 6 (compliance) é **blocker**. As demais são **high** — a
skill corrige antes de entregar, ou justifica no relatório por que é intencional.
