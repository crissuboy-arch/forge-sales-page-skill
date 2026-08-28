# examples/

## `exemplo-brief.json`

Um `brief.json` preenchido de ponta a ponta (produto fictício "Método Raiz
Calma") que serve de referência para a **fase 1–2** do fluxo. Mostra:

- todos os campos do `schemas/product.schema.json`;
- como registrar `proof` com `verified: true` e **fonte**;
- um nicho sensível (`health`) com `compliance` marcado;
- `styleNotes` com referências e **anti-briefing** ("nada 'fofo' ou 'místico'");
- `checkoutParams` e `checkoutUrl` coerentes com a plataforma.

### Como usar num teste real da skill

```bash
mkdir -p output/raiz-calma
cp examples/exemplo-brief.json output/raiz-calma/brief.json
# ... o agente gera output/raiz-calma/src/ seguindo o SKILL.md ...
node scripts/verify.js         output/raiz-calma/src
node scripts/validate-links.js output/raiz-calma/src
node scripts/build.js          output/raiz-calma
node scripts/package.js        output/raiz-calma
```

> A skill **não** vem com uma página de exemplo pronta — de propósito. O objetivo
> é que cada página nasça da análise, não de um modelo. Este brief existe só para
> exercitar o fluxo e os scripts.

## Sugestão de outros briefs para testar

- Um SaaS B2B (`pageFormat: saas`, `visualMode: premium-static`, tráfego `organic`).
- Um curso de finanças para Google Ads (`pageFormat: advertorial`, `compliance.categories: ["finance"]`).
- Um produto físico de beleza para Meta Ads (`pageFormat: presell` + `sales`).
- Um lançamento premium com `visualMode: cinematic-code`.

Cada um deve produzir uma **direção visual diferente** — é o teste principal.
