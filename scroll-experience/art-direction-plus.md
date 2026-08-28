# Direção de arte — taste floor + preâmbulo de estilo

Complementa `references/visual-direction.md` (que continua sendo o dono do style
ticket e dos tokens). Aqui ficam os **pisos numéricos** e o **método de preâmbulo
de estilo** para geração de imagem. Vale para os 4 níveis de scroll.

## 1. Taste floor — pisos não‑negociáveis

### Tipografia
- **Máx. 2 famílias.** Uma display + uma texto. Fallback stack completo.
- **Inter como default é desencorajado** — virou assinatura de saída de IA. Use
  se for a marca do cliente; senão escolha outra grotesque/humanista.
- **Serif não é "premium" por padrão.** Só quando a marca é editorial de verdade
  ou o cliente pede.
- Medida de leitura do corpo: **45–75 caracteres** (alvo ~62ch).
- Line‑height: **0.94–1.06** para display; **1.6** para corpo.
- `text-wrap: balance` em títulos; `pretty` em parágrafos.
- Display não passa de **~6rem** fora de um momento de hero genuíno.
- **< 700px de viewport**: hero desce para ~3.4rem mínimo (não deixar a headline
  estourar a tela em mobile).
- Compensação de light‑on‑dark: texto claro sobre fundo escuro precisa de ajuste
  em 3 eixos — peso um pouco menor, tracking um pouco maior, e cor não 100% branca.

### Cor — 6 papéis + 1 acento
```
canvas   — o fundo da página
surface  — cards, blocos elevados
ink      — texto principal
ink-soft — texto secundário (TINGIDO com a matiz do canvas, nunca #888 chapado)
accent   — 1 cor, só uma, para CTA e ênfase
accent-ink — o texto que vai sobre o accent
```
- **Sem preto puro.** Mínimo off‑black (ex.: `#0b0f14`).
- Contraste: corpo ≥ 4.5:1, texto grande ≥ 3:1, controles ≥ 3:1.
- Exceção: página com cortes duros claro/escuro pode usar **accent de dois
  pontos** — uma matiz, duas luminosidades, cada uma casada com o fundo local.
- Ao redefinir `--c-ink` num subtree, **reafirmar `color`** no elemento — texto
  herdado mantém o valor do body senão.

### Profundidade — 5 ferramentas, usadas juntas
1. Sombra com offset + blur, **tingida com a matiz do canvas** (não preto puro).
2. Edge light: 1px de highlight no topo do elemento.
3. Escala + blur + contraste **diminuem com a distância** (o que está "atrás"
   é menor, mais suave).
4. **Sobreposição** cria mais profundidade que sombra — deixe elementos
   encostarem/cobrirem.
5. Grão a **4–5%** de opacidade sobre a página inteira.
- Máx. **3 níveis de elevação**.

### Espaçamento e ritmo
- Base 4px. Escala: 4/8/12/16/24/32/48/64/96/128.
- **Ritmo vem do contraste entre apertado e generoso**, nunca de um valor
  repetido.
- **Mais espaço acima dos títulos do que abaixo.**
- Padding de seção fluido (escala com viewport). Gutters escalam com viewport.
- Agrupe por **proximidade** antes de recorrer a um container/card.
- Alinhamento óptico, não matemático.

### Texto sobre mídia
- **Prefira mascarar a imagem para longe do texto** a jogar um scrim por cima.
- Se precisar de scrim: canto (densidade do tamanho da copy), faixa (transparente
  acima de ~58%), ou coluna (densidade só sob a coluna de texto).
- O scrim **não pode ser filho** do texto que protege.
- Em `<img>`: sobrescreva **`width` e `height` juntos, ou nenhum** — normalmente
  `width: 100%; height: auto`.

### Movimento (piso — o teto está em `cinematic-motion.md`)
- Só `transform` e `opacity`; `clip-path` para wipes. Nunca width/height/margin/
  padding/top/left.
- Sem `ease-in` em UI. Use ease‑out: `cubic-bezier(0.23, 1, 0.32, 1)`.
- Transições de UI: hover 120–180ms, botões 100–160ms.
- Entrada de elemento: de `scale(0.95) + opacity:0` — **nunca de `scale(0)`**.
- Feedback de clique: `scale(0.97)` ou `translateY(1px)`.
- Stagger de grupo: 30–80ms.
- Hover só sob `(hover: hover) and (pointer: fine)`.
- Reduced motion: menos transições, mais suaves; manter opacity, tirar mudança de
  posição.

### Estados
Todo elemento interativo precisa de **hover, focus‑visible, active e disabled**.
"Uma página só com o estado de repouso está pela metade." `:focus-visible`
sempre visível e na cor de accent. Texto de botão em 1 linha no desktop; CTA
primário em 1–3 palavras.

## 2. O squint test (parte do QA)

Desfoque a página até o detalhe sumir. O grupo **primário**, o **secundário** e os
**grandes blocos** têm que continuar identificáveis. "Se tudo vira um campo
cinza uniforme, o problema é hierarquia." Rodar em 3 breakpoints (360 / 768 /
1440).

## 3. Método do preâmbulo de estilo (para AI FILM READY / slots de imagem)

Quando a página vai receber imagem gerada (hero, b‑roll, texturas), escreva **um
bloco de direção de arte** e **cole‑o verbatim em todo prompt de imagem** — nunca
parafraseie, isso fragmenta a identidade.

Todo preâmbulo tem 5 elementos:

1. **Meio e lente** — "35mm anamórfica", "100mm macro". Define profundidade de
   campo e perspectiva.
2. **Posição da luz** — conte as fontes e posicione ("key a 45° à esquerda, fill
   suave à direita, rim atrás"). Nada de "boa iluminação".
3. **Grade de cor** — a paleta em 3 termos concretos ("carvão profundo, âmbar
   quente, dessaturado").
4. **Textura** — grão, halação, condensação, imperfeições que sinalizam
   fotografia e não geração.
5. **Restrições negativas** — o que a imagem **não** pode ser ("NÃO render 3D,
   NÃO clay/low‑poly, NÃO stock sorridente").

Regras:
- **Fotografia realista é o default** para produto. Ilustração só se a marca é
  genuinamente ilustrada.
- **Evitar o "clay diorama" low‑poly** — sinaliza "não é real" e derruba a venda.
- **Nomeie o espaço vazio em toda cena** — diga onde há área negativa para a copy
  sentar sem precisar cortar depois.
- Texto **nunca** assado na imagem — todo texto é HTML real. Ver `anti-ai.md`.

## 4. Saída da fase

O style ticket de `visual-direction.md` continua sendo a saída principal. Esta
camada acrescenta: o **preâmbulo de estilo** (se houver imagem gerada) salvo em
`output/<slug>/style-preamble.txt`, e o resultado do **squint test** no
`qa-report.md`.
