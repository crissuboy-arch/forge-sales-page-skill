# direct-response/ — página de vendas long-form

Base para venda direta de info-produto, curso, mentoria, serviço ou produto
físico com checkout no clique.

## Quando usar
- Público `solution-aware` → `most-aware`.
- Tráfego morno/quente, retarget, e-mail, orgânico.
- Ticket baixo/médio com checkout direto (ticket alto → trocar CTA por aplicação;
  ver `references/sales-architecture.md` §3).

## Seções essenciais
Ver `reference.html`. Nenhuma pode faltar sem justificativa:
hero · dor · agitação · virada · mecanismo · produto · benefícios · prova ·
oferta · bônus · garantia · FAQ · autoridade · recap+CTA · fechamento · rodapé legal.

## CTAs
Posições mínimas: hero, após o mecanismo, na oferta, após a garantia, no recap.
Todos com `data-cta` e o **mesmo destino** (a `checkoutUrl`).

## Armadilhas
- Escrever a oferta antes de justificar a crença (mecanismo + prova).
- "Value stack" com valores de bônus irreais → mata credibilidade e fere políticas de anúncio.
- Depoimentos sem `verified:true` no `brief`.
- Urgência falsa / contador que reinicia.
- Long-form que repete a mesma ideia — cada seção precisa **avançar** o argumento.

## Direção visual
Criar do zero (`references/visual-direction.md`). Long-form pede hierarquia
tipográfica forte, boa medida de leitura (~65ch), respiro entre seções, e um
"layout signature" que torne a página reconhecível sem parecer template.
