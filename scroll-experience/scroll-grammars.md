# Gramáticas de página — variedade estrutural

Roda na **Fase 3** (arquitetura), depois de escolher o formato (vendas / presell
/ advertorial / captura / SaaS / obrigado) e antes da direção visual.

> "Cinco seções que se comportam igual são uma seção mostrada cinco vezes."

O **formato** responde *o que a página faz*. A **gramática** responde *como o
scroll se comporta ao longo dela*. Duas páginas de vendas do mesmo formato podem
ter gramáticas diferentes — e devem, se forem de produtos diferentes.

## As 8 gramáticas

Escolha **uma**. Cada uma **proíbe** o que as outras pedem — é isso que gera
variedade real entre projetos.

### 1. Long‑form clássica (vertical rítmica)
A estrutura padrão de `SKILL.md §5`: blocos empilhados, reveal‑on‑enter, ritmo de
respiração (seções curtas × longas alternadas). O "cavalo de batalha".
**Proíbe:** pins longos, scrub de hero, scroll horizontal. **Boa para:** a maioria
das páginas de vendas de ticket baixo/médio, remarketing, público consciente.

### 2. Editorial em capítulos (≈ advertorial)
Substância longa organizada como páginas que viram, com **intertítulos de
"ponto final"** entre capítulos. Cada capítulo é uma micro‑história.
**Proíbe:** gradientes de drift contínuo, hero full‑bleed com scrub, crossfade de
tipografia pinada. **Boa para:** advertorial, high‑ticket que precisa construir
crença, produto com mecanismo que exige explicação.

### 3. Superfície viva (≈ demo de SaaS/app)
A **interface do produto rodando na página** — não um screenshot. Painéis
populam, o estado avança conforme rola. "Operando algo."
**Proíbe:** cromo de marketing pesado, fotografia full‑bleed, headline cinética.
**Boa para:** SaaS, app, ferramenta visual — onde ver funcionar É o argumento.
Compliance: se os dados na tela são de demonstração, **rotular** ("dados de
teste"); nunca apresentar como resultado real. Ver `anti-ai.md`.

### 4. Pôster tipográfico (≈ oferta curta / most‑aware)
O **tipo é a imagem**. Mídia mínima ou nenhuma. Palavras chegam em pesos e
escalas muito diferentes; a escala cria o ritmo.
**Proíbe:** chão fotográfico, scrubs, movimento decorativo. **Boa para:** oferta
curta para lista quente, recompra, "só falta o preço", manifesto de marca.

### 5. Galeria / catálogo
Coleção percorrível de objetos com rótulo consistente. "Andar por uma sala" —
deriva lateral discreta + scroll vertical.
**Proíbe:** claim de hero singular, copy sobre scrim, persuasão nos rótulos.
**Boa para:** produto físico com variantes, portfólio de casos, "o que está
incluído" quando são muitos itens concretos.

### 6. Palco dividido (≈ us‑vs‑them / antes‑depois conceitual)
Duas colunas em tensão, resolvidas pelo scroll. "Ver uma balança pender" — os
dois lados se movem em direção a um colapso/resolução.
**Proíbe:** elementos full‑bleed, colunas decorativas. **Boa para:** comparação
com a categoria, "jeito antigo × jeito novo", problema × solução.

### 7. Cutlist rítmica
Atos curtos com **cortes secos**, em velocidade, **sem pin**. 12–20 seções, "um
corte por segundo".
**Proíbe:** atos acima de ~1,4 vh, pins. **Boa para:** produto de ritmo rápido
(fitness, energia), público jovem, lista de benefícios que ganha em cadência.

### 8. Filmic one‑shot (≈ VSL em página)
Narrativa linear com scroll contínuo. "Um filme que você empurra" — sem marcadores
de sequência visíveis.
**Proíbe:** números de capítulo, cortes duros, múltiplos pontos de entrada.
**Boa para:** transformação/jornada com forte carga emocional, lançamento,
storytelling de fundador. É a gramática mais cara em atenção e produção.

## Mapa formato → gramáticas naturais

| Formato (SKILL.md §4) | Gramáticas que combinam |
|---|---|
| Página de vendas long‑form | 1 (default), 2, 6, 8 |
| Presell | 2, 8, 6 |
| Advertorial | 2 (quase sempre), 1 |
| Página de captura | 1 curta, 4 |
| SaaS / app | 3, 1, 4 |
| Página de obrigado / upsell | 1 curta, 4 |
| Oferta curta (most‑aware) | 4, 7 |

## Como escolher

1. Formato já está definido (Fase 3).
2. Liste 2–3 gramáticas candidatas do mapa acima.
3. Elimine as que brigam com a **direção de arte** e com o **nível de scroll**
   (`mode-decision.md`) — pôster tipográfico não faz sentido em STATIC LIGHT;
   filmic one‑shot exige CINEMATIC/STORYTELLING + orçamento de asset.
4. Passe pelo **fingerprint gate** (`fingerprint-gate.md`): a gramática é a
   dimensão 1 do registro. Se a última página do mesmo tipo usou a gramática X,
   prefira outra.
5. Declare no `style.md` e escreva a **feeling curve** (`feeling-curve.md`) já
   dentro da gramática escolhida.

## Regra de consistência

Escolhida a gramática, **a página inteira obedece a ela**. Misturar "editorial em
capítulos" com "cutlist rítmica" no meio da página = amador. O único desvio
permitido é o **pico** (`feeling-curve.md`), que pode quebrar o ritmo de
propósito — uma vez.
