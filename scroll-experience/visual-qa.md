# QA visual de scroll

Roda na **Fase 6**, depois do build e junto do `references/qa-checklist.md`
(que continua sendo o checklist geral). Esta parte cuida do que só aparece
**rolando a página**.

Dois instrumentos: o **feel check** (humano, obrigatório) e o **harness
headless** (`scripts/scroll-qa.js`, obrigatório em CINEMATIC e SCROLL
STORYTELLING, recomendado em MOTION).

## 1. Feel check (humano) — ver também `feeling-curve.md §4`

Sem reler o brief:
1. Role a página uma vez em ritmo de leitura.
2. Uma palavra de emoção por seção (nada, se não sentiu nada).
3. Compare com a curva pretendida. Onde divergem, a página está errada.

Checar: o pico é a maior mudança visual e tem mais scroll? A seção antes do pico
cria silêncio? A tela final para em conteúdo estável?

Registrar as 3 curvas (pretendida / sentida / mudanças) no `qa-report.md`.

## 2. Squint test — ver `anti-ai.md §7`

Desfoque até o detalhe sumir. Primário, secundário e grandes blocos continuam
identificáveis? Rodar em 360 / 768 / 1440.

## 3. Harness headless — `scripts/scroll-qa.js`

```bash
node scripts/scroll-qa.js output/<slug>/dist            # mobile 390×844, 12 posições
node scripts/scroll-qa.js output/<slug>/dist --viewport=1440x900 --shots=16   # desktop
```

Precisa de **Edge ou Chrome** no sistema (ou `BROWSER_PATH`). **Sem navegador**,
o script imprime este checklist manual e sai com código 0 — nunca quebra o build.

### O que ele faz

- Sobe um servidor estático local (necessário para `type=module`, blobs, fontes).
- Emula a viewport, espera `document.fonts.ready`.
- Caminha o scroll em **N posições proporcionais** à altura do documento.
- Screenshot de cada posição → monta `scroll-qa-sheet.png` (contact sheet).
- Recarrega com `prefers-reduced-motion: reduce` e recheca.
- Escreve `scroll-qa-report.md`.

### O que ele detecta

| Achado | Severidade | Como |
|---|---|---|
| **Scroll morto** | high | 3 posições consecutivas ~99.5% idênticas enquanto `scrollY` mudou > 20px e não é o fim da página |
| **Overflow horizontal** | **blocker** | `documentElement.scrollWidth > clientWidth + 1`; lista os elementos que passam da borda |
| **Elemento preso invisível** | **blocker** | `[data-animate]` / `.reveal` dentro da viewport com `opacity < 0.08` |
| **Opacity presa no meio** | high | mesmo seletor, já passou de 60% da tela, ainda `< 0.85` |
| **Mídia ausente** | **blocker** | `<img>` com `naturalWidth === 0` ou `<video>` com `error`/`readyState 0` |
| **Contraste fino** | medium | cor computada do texto × `background-color` computado do ancestral < 4.5:1 (3:1 p/ texto grande) — só sobre cor sólida, não sobre imagem |
| **Reduced‑motion preso** | **blocker** | com `prefers-reduced-motion` emulado, ainda há elemento invisível no meio da página |

Exit code **1** se houver qualquer **blocker**; senão **0**.

### O que ele NÃO faz (verificação manual continua)

- Contraste de texto **sobre imagem / gradiente / scrim** — o harness só mede
  sobre `background-color` sólido. Olhar o contact sheet.
- Julgamento de narrativa (isso é o feel check).
- 60fps / jank de scroll — usar o DevTools em device mid‑tier com CPU 4× throttle.
- Se o "pico" é de fato o momento mais forte — olho humano no contact sheet.

## 4. Integração com o QA geral

No `references/qa-checklist.md`, o bloco **5. Motion** ganha:

- `[A]` `scroll-qa.js` sem blocker (ou justificado).
- `[A]` `scroll-qa.js` com `prefers-reduced-motion` limpo.
- `[M]` feel check feito, 3 curvas no `qa-report.md`.
- `[M]` squint test em 3 breakpoints.
- `[M]` contact sheet revisado (contraste sobre mídia, força do pico).

Blocker: overflow horizontal, elemento preso invisível, mídia ausente,
reduced‑motion preso. Os demais são **high** (corrigir ou justificar).

## 5. Saída

`output/<slug>/scroll-qa-sheet.png` + `output/<slug>/scroll-qa-report.md` +
as 3 curvas do feel check e o resultado do squint test no `qa-report.md`.
