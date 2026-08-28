# scripts/

Utilitários em **Node puro** (sem dependências, Node ≥ 18). Todos aceitam um
caminho e imprimem ajuda quando chamados sem argumento.

| Script | Uso | O que faz |
|--------|-----|-----------|
| `verify.js` | `node scripts/verify.js output/<slug>/src` | QA automatizado: `<head>`, headings, alt, contraste dos tokens, `prefers-reduced-motion`, `defer`, lazy, peso de assets, CTA above the fold, hooks de tracking, varredura de termos e blocos de compliance. Sai com código 1 se houver **blockers**. |
| `validate-links.js` | `node scripts/validate-links.js output/<slug>/src` | Audita links internos, âncoras, CTAs, `src` de imagens/vídeos, recursos `http://`, propagação de query string e coerência `checkoutUrl` × `checkoutPlatform`. Sai com 1 se houver erros. |
| `build.js` | `node scripts/build.js output/<slug>` | Copia `src/` → `dist/`, minifica CSS/JS próprios de forma conservadora, injeta marcador de analytics e disclaimers de compliance (via `brief.json`), valida portabilidade (sem caminhos absolutos) e gera `dist/README-PUBLICAR.md` base. |
| `package.js` | `node scripts/package.js output/<slug>` | Gera `dist/pagina.zip` (ZIP nativo via `zlib`) e finaliza `dist/README-PUBLICAR.md`. |

Ordem típica:

```bash
node scripts/verify.js         output/meu-produto/src
node scripts/validate-links.js output/meu-produto/src
node scripts/build.js          output/meu-produto
node scripts/package.js        output/meu-produto
```

## lib/

- `util.js` — helpers (resolução de caminho, walk, cópia, contraste WCAG, formatação).
- `zip.js` — escritor de ZIP mínimo (deflate) em Node puro.
- `readme.js` — geração do `README-PUBLICAR.md` a partir do `brief.json`.

## Degradação

Se algo opcional não estiver disponível no ambiente, o script **avisa e continua**
(ou orienta o fallback manual). Nenhum passo opcional derruba o build.
