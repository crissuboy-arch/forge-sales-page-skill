# Presell — página-ponte antes do checkout

Presell = página que **aquece e qualifica** o tráfego antes de mandar para a
página de vendas ou checkout (próprio ou de produtor, no caso de afiliado).
Não vende explicitamente; prepara a crença.

---

## 1. Quando usar

- Tráfego **frio** (Meta Ads de prospecção, nativo, pop) para público
  `unaware` / `problem-aware` / `solution-aware`.
- **Afiliado**: quase sempre obrigatório — não se manda tráfego direto para a
  página do produtor (ver `affiliate-pages.md`).
- Oferta que precisa de contexto/educação antes de fazer sentido.
- Reduzir custo de anúncio: presell "filtra" quem clica no CTA final.

Não usar quando o público já é `product-aware`/`most-aware` — vá direto à venda.

---

## 2. Objetivos de uma presell

1. Criar **identificação** ("essa página está falando de mim").
2. Introduzir e validar o **mecanismo** (o "porquê funciona").
3. Quebrar a **crença limitante** principal ("já tentei tudo", "não é pra mim").
4. Gerar **micro-compromisso** e curiosidade → clique qualificado no CTA.
5. Passar o "pixel" e aquecer para retarget.

---

## 3. Formatos de presell (escolher pelo avatar)

| Formato | Descrição | Melhor para |
|---|---|---|
| **Carta de descoberta / história** | 1ª pessoa: "eu vivia X, descobri Y, mudou Z". Constrói o mecanismo pela narrativa. | marca pessoal, relacionamento, saúde, finanças pessoais |
| **Listicle** ("3 motivos pelos quais...", "5 sinais de que...") | conteúdo escaneável que leva a uma conclusão que exige a solução | Meta Ads frio, curiosidade, mobile |
| **Artigo-problema** (mini-advertorial) | educa sobre a causa-raiz do problema; termina apontando o caminho | problema-consciente, Google Ads (ver `advertorial.md`) |
| **Quiz-lite / diagnóstico** | 3–5 perguntas → "resultado" personalizado → recomendação | segmentação, engajamento, lead. Precisa de JS simples, sem backend |
| **Comparação** ("método antigo vs novo") | mostra por que o que ela conhece falha | solution-aware, mercado sofisticado |
| **Vídeo + contexto** (pré-VSL) | texto curto que enquadra e "vende o play" da VSL | funil de VSL |

---

## 4. Estrutura (carta/história — adaptar)

1. **Hook** (headline + 1ª linha): interrompe o scroll, promete uma revelação, não a venda.
2. **Cena inicial**: momento concreto da dor (na voz do avatar).
3. **Escalada**: o que ela tentou, por que falhou (valida o ceticismo).
4. **Ponto de virada**: a descoberta / o insight / a pessoa que mostrou o caminho.
5. **O mecanismo**: explicado de forma simples, com o nome. Por que é diferente.
6. **Prova leve**: 1–2 elementos reais (dado, antes/depois legítimo, terceiros). Sem stack de depoimentos.
7. **Transição**: "foi aí que encontrei [produto] / criei [produto]" — 1 parágrafo.
8. **CTA**: leva à página de vendas / checkout, com curiosidade ("veja como funciona"), **preservando todos os parâmetros de URL**.
9. **Rodapé**: disclaimers do nicho, disclosure de afiliado se aplicável, privacidade.

Listicle: trocar 2–5 por "os N pontos", cada um terminando em micro-tensão; item
final aponta para a solução.

---

## 5. Ponte para o checkout / página de vendas

- CTA aponta para `brief.checkoutUrl` **ou** para a página de vendas do produtor.
- **Preservar query string**: `utm_*`, `src`, `aff`, `xcod`, `sck`, etc.
  Implementar no `main.js`:
  ```js
  document.querySelectorAll('[data-cta]').forEach(a=>{
    const u = new URL(a.href);
    new URLSearchParams(location.search).forEach((v,k)=>u.searchParams.set(k,v));
    a.href = u.toString();
  });
  ```
- Não abrir em nova aba por padrão em mobile (perde contexto). Testar.
- Se afiliado: nunca copiar a copy/design do produtor; a presell é conteúdo próprio.

---

## 6. Compliance da presell

- Segue as mesmas regras de `compliance-google.md` / `compliance-meta.md`.
- História = **verdadeira**. Se for persona/composição, não afirmar como fato pessoal
  ("relato baseado em clientes", ou escrever em 3ª pessoa).
- Sem antes/depois irreal, sem "ganhei R$ X" sem prova, sem "curei".
- Disclosure de publicidade/afiliado quando exigido.
- Não usar "notícia falsa" / logos de veículos sem autorização (Google e Meta reprovam e é risco legal).

---

## 7. Técnica

- 1 objetivo, 1 CTA (repetido). Sem menu, sem links de fuga além do rodapé legal.
- Leve: presell frequentemente recebe o 1º clique pago — LCP baixo é dinheiro.
- Mobile-first radical: 80–95% do tráfego.
- Sticky CTA após o mecanismo.
- Quiz: estado em memória/`localStorage`, resultado por lógica de pontuação, sem servidor.

---

## 8. Saída

Gerar como formato próprio em `output/<slug>-presell/`. Se o projeto também tem
página de vendas, gerar as duas e documentar o fluxo no `README-PUBLICAR.md`
(qual URL vai no anúncio, qual é o destino do CTA).
