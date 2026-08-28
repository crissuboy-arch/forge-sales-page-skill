# Fingerprint gate — anti‑repetição entre projetos

Roda na **Fase 3** (arquitetura), logo depois de escolher gramática e antes de
fechar a direção. Garante operacionalmente a regra de `visual-direction.md`: "se
a skill já gerou 3 páginas, a quarta não pode parecer nenhuma delas."

## 1. O registro

Um arquivo **`output/FINGERPRINTS.md`** (a pasta `output/` é git‑ignored — o
registro é **por conta/instalação**, não vai para o repo da skill). Semente em
`scroll-experience/FINGERPRINTS.template.md`.

Cada página gerada vira **uma linha** com 6 dimensões:

| Dim | Registra |
|---|---|
| 1 | **Gramática** (`scroll-grammars.md`) — qual das 8 |
| 2 | **Navegação** — tem? fixa/some/progress bar/nenhuma? qual o propósito? |
| 3 | **Device do hero** — greet estático / kinetic headline / scrub / sticky media / pôster tipográfico |
| 4 | **Sequência** — lista de devices por seção, nº de seções, soma aproximada de altura em vh |
| 5 | **Fechamento** — como a página termina (recap + CTA / oferta repetida / manifesto) e o container do CTA final |
| 6 | **Signature move** — a interação única desta página (§2) |

## 2. Signature move (obrigatório a partir de MOTION)

**Uma** interação sob medida, amarrada só a este projeto. Não é "mais um device
do kit com outro parâmetro".

Exemplos **válidos** (adaptados a página de vendas):
- Scroll‑as‑playhead desenhando uma trilha persistente que marca o caminho já
  percorrido (mapa da jornada de compra).
- Wordmark/logo do produto que se desmonta e se assenta com o ponteiro.
- Ilustração técnica SVG que se auto‑desenha conforme o scroll (o mecanismo do
  produto se montando).
- "Recibo" que acumula os itens da oferta com números **reais** conforme rola.
- Um único controle que regrada a página inteira (antes/depois, plano básico/pro,
  cenário sem/com o produto).

Exemplos **inválidos**: variação de parâmetro de um device existente, mais um
spotlight recolorido, "parallax mas mais forte".

## 3. O gate

Um novo build deve diferir de **cada linha existente** em **≥ 4 das 6 dimensões**
(sendo ≥ 3 das 5 primeiras — a dimensão 6 é sempre única por definição).

Se não passar:
- **Mude o plano, não o registro.** Alterar fingerprints antigos para caber
  invalida o sistema.
- Troque a dimensão que colidiu: outra gramática, outro device de hero, outra
  sequência, outro fechamento.

## 4. Casos comuns de colisão (do EXAMPLES do ScrollCraft, adaptados)

- Duas páginas de SaaS: ambas "superfície viva" + hero sticky‑media + fecho com
  tabela de planos. Colide em 1, 3 e 5 → refazer uma.
- Duas páginas de info‑produto: ambas long‑form clássica + reveal + fecho com CTA
  repetido. Colide em 1, 4 e 5 → dar a uma delas gramática "editorial em
  capítulos" ou "split stage".
- Advertoriais tendem a colidir sempre em 1 (editorial em capítulos). Diferencie
  em 2 (navegação), 3 (abertura) e 6 (signature move).

## 5. Escopo

O registro é por **conta/estúdio**, não por cliente. Se você gera páginas para
clientes diferentes, todas entram no mesmo `FINGERPRINTS.md` — o ponto é que
**o seu trabalho** não se repita, independente do cliente.

Produtos do mesmo cliente com identidade de marca definida: a **paleta e a
tipografia** podem repetir (é a marca), mas gramática, hero, sequência,
fechamento e signature move **não**.

## 6. Saída

Uma linha nova em `output/FINGERPRINTS.md` + a confirmação no `qa-report.md` de
que o gate passou (quais dimensões diferem das linhas mais próximas).
