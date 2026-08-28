# Curva de sentimento + o pico único

Roda entre a **Fase 5 (copy)** e a **Fase 4 (direção)** — na prática, logo depois
de ter os blocos de copy e antes de decidir qualquer animação.

> O movimento serve a narrativa e a conversão. Nunca se adiciona animação para
> "ficar bonito". A curva de sentimento é o instrumento que garante isso.

## 1. O que é

Uma sequência de **estados emocionais**, um por seção da página, escrita **antes**
de qualquer device de scroll existir. Cada linha tem duas colunas:

```
| # | Seção            | EMOÇÃO pretendida     | Causa (o elemento que dispara)          |
|---|------------------|-----------------------|-----------------------------------------|
| 1 | Hero             | reconhecimento tenso  | headline nomeia a dor exata + subheadline |
| 2 | Agitação         | desconforto           | cena concreta do custo de não resolver  |
| 3 | Virada / mecanismo| curiosidade / alívio  | "existe um jeito diferente" + o mecanismo |
| 4 | Produto por dentro| confiança             | screenshots reais, o que está incluído  |
| 5 | Prova            | segurança             | depoimento/caso real (só se verificável)|
| 6 | A OFERTA (pico)  | desejo + urgência real| empilhamento de valor → preço → CTA     |
| 7 | Garantia/FAQ     | permissão             | reversão de risco, objeções respondidas |
| 8 | CTA final        | decisão               | recapitulação curta + 1 ação            |
```

Regras:

- **A coluna EMOÇÃO é a restrição.** A coluna Causa é o **único** lugar onde um
  nome de device pode aparecer — e aparece **em segundo**, porque a emoção
  escolhe o device, nunca o contrário.
- **Seções adjacentes não podem ter a mesma emoção.** Se duas seguidas produzem
  o mesmo sentimento, uma das duas é enchimento — cortar ou fundir.
- Emoção ganha sentido por **contraste**: alívio precisa de tensão antes; desejo
  precisa de um vale antes; confiança precisa de dúvida resolvida.
- Vocabulário de emoção (não de marketing): *tensão, desconforto, curiosidade,
  alívio, reconhecimento, confiança, dúvida, segurança, desejo, permissão,
  urgência, decisão, orgulho de pertencer.* Evitar "empolgação" genérica.

## 2. O pico único (peak‑end)

As pessoas lembram de uma página por **dois momentos**: o **pico** e o **fim**. O
miolo vira impressão vaga. Portanto:

- **Exatamente um** pico por página. "Uma página com três picos não tem nenhum."
- Em página de vendas o pico é quase sempre **a oferta** (empilhamento de valor →
  ancoragem → preço → CTA) OU **a revelação do mecanismo**, se o mecanismo for o
  argumento central. Escolha um.
- O pico recebe três recursos dedicados:
  1. **O orçamento de asset** — o melhor visual da página vive aqui (a melhor
     composição de screenshots, o único vídeo, a única ilustração rica).
  2. **Silêncio antes** — a seção anterior ao pico é curta, calma, com espaço
     em branco, para a mudança registrar.
  3. **Mais espaço de scroll** — o pico ocupa mais altura e, se houver motion
     narrativo, é onde entra o pin/scrub (se o nível permitir). O resto da
     página usa reveals simples.
- **O fim precisa resolver.** A última tela para em algo definido (CTA + micro‑
  recapitulação), não se dissolve num rodapé. O rodapé vem depois, visualmente
  separado, e não compete com o pico.

## 3. Como a curva vira decisão de motion

Depois da curva pronta, para cada seção:

- Emoção **calma/racional** (confiança, permissão, segurança) → reveal simples,
  stagger curto. Nada de pin, nada de parallax.
- Emoção de **transição** (curiosidade, alívio, virada) → aqui cabe um reveal
  mais deliberado, um wipe (`clip-path`), ou o único line‑reveal de headline.
- **Pico** → onde o orçamento de motion se concentra. Fora do pico, motion é
  quase invisível de propósito.
- Se uma seção não tem emoção clara na curva → ela **não recebe animação
  nenhuma** (e provavelmente devia ser cortada).

## 4. Feel check (verificação — Fase 6)

**Depois** de construir, sem reler o brief:

1. Role a página uma vez, em ritmo de leitura normal.
2. Escreva **uma palavra por seção** com o que você sentiu (nada, se a seção não
   produziu emoção).
3. Abra a curva pretendida e compare.

> Onde divergem, **a página está errada, não o brief.** A experiência construída
> é a autoridade.

Checagens específicas do feel check:

- O pico é a **maior mudança visual** e tem **mais espaço de scroll**?
- A seção **antes** do pico cria contraste (silêncio)?
- A tela **final** para em conteúdo estável (CTA visível, sem trailing)?

Registrar as **três curvas** no `output/<slug>/qa-report.md`: pretendida, sentida,
e as mudanças feitas.

## 5. Saída da fase

No `output/<slug>/style.md` (ou `copy.md`): a tabela da curva preenchida + 1
linha identificando o pico e por quê. Isso alimenta `motion-system.md` (o que
animar e onde) e o `fingerprint-gate.md` (dimensões 4 e 5).
