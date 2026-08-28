# Páginas de afiliado

Quando `brief.trafficType === "affiliate"`, o afiliado promove um produto de
terceiro. Regras específicas para não queimar link, conta e reputação.

---

## 1. Princípios

1. **Sempre presell.** Não mandar tráfego pago direto para a página do produtor
   (Google e Meta reprovam "bridge" ausente; conversão despenca; e muitos
   produtores proíbem tráfego direto). Ver `presell.md`.
2. **Conteúdo próprio.** Não copiar copy, design, headline ou depoimentos da
   página do produtor. A página do afiliado é editorial/opinativa/experiência.
3. **Disclosure obrigatório.** Deixar claro que há comissão: rótulo visível
   ("Este conteúdo contém links de afiliado. Podemos receber comissão."),
   no topo e/ou no rodapé — exigência de FTC, do CDC/Senacon e das plataformas.
4. **Preservar parâmetros de rastreio** (`aff`, `src`, `xcod`, `sck`, `utm_*`,
   `hotmart_id`, etc.) em **todos** os CTAs (ver snippet em `presell.md` §5).
5. **Sem marca no domínio.** Não registrar/usar domínio com o nome da marca do
   produtor ou de veículos de imprensa.

---

## 2. Formatos que funcionam para afiliado

| Formato | Uso |
|---|---|
| **Review / análise honesta** | "Testei [produto] por 30 dias — o que achei". Prós, contras, para quem serve. |
| **Presell-história** | experiência pessoal (real) que leva ao produto. |
| **Comparativo** | "[Produto A] vs [Produto B] vs [Produto C]" — tabela + recomendação. |
| **Listicle / guia** | "As 5 melhores opções de X em 2026" com o produto-alvo em destaque. |
| **Advertorial** | matéria-problema → o produto como solução (ver `advertorial.md`). |

Em todos: o CTA leva à página de vendas **do produtor** (ou checkout direto se o
produtor permite e fornece o link), com os parâmetros preservados.

---

## 3. Estrutura de uma página de review (adaptar)

1. Rótulo de afiliado + título honesto.
2. Resumo rápido (caixa "veredito"): nota, para quem é, para quem não é, preço, link.
3. O problema que o produto resolve.
4. O que é / como funciona / o que vem dentro (do material público do produtor).
5. Experiência de uso ou análise do mecanismo (própria, honesta).
6. Prós e contras (contras reais — aumenta a confiança).
7. Preço, garantia e bônus **do produtor** (não inventar bônus que você não entrega;
   se o afiliado oferece bônus próprio, explicar como recebê-lo).
8. Para quem vale / não vale a pena.
9. FAQ.
10. CTA final + disclosure completo + rodapé legal.

---

## 4. O que NÃO fazer

- Não prometer resultados no lugar do produtor.
- Não usar depoimentos que você não pode comprovar.
- Não simular "notícia" com veículo real.
- Não esconder que é conteúdo pago/comissionado.
- Não usar contador de escassez falso ("oferta acaba em 10 min" reiniciando).
- Não clonar a página do produtor com o seu link por cima.
- Não usar a logo do produtor de forma que sugira ser o site oficial.

---

## 5. Bônus de afiliado (se houver)

Se o afiliado entrega bônus próprios:
- Listar cada bônus, o problema que resolve e como será entregue.
- Explicar o processo: "compre pelo botão abaixo → envie o comprovante para
  [e-mail/form] → receba os bônus em até X h". Sem automação obrigatória.
- Não inflar valor de forma irreal.

---

## 6. Compliance

Segue `compliance-google.md` e `compliance-meta.md` integralmente, **mais**:
- Disclosure de relação comercial (afiliado) — visível, não escondido no rodapé em fonte 8px.
- Política de privacidade e termos próprios da página do afiliado.
- Deixar claro que o suporte/entrega/reembolso é responsabilidade do produtor e da
  plataforma (Hotmart/Kiwify/Digistore24), com o canal correto.

---

## 7. Saída

`output/<slug>-affiliate/` com o formato escolhido. `README-PUBLICAR.md` deve
registrar: link de afiliado usado, parâmetros preservados, texto do disclosure,
e o fluxo (anúncio → presell/review → página do produtor).
