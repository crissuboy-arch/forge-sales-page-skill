# Advertorial — editorial que converte

Advertorial = página no formato de **matéria jornalística / artigo editorial** que
educa o leitor sobre um problema e apresenta o produto como parte da história.
Formato preferido para **Google Ads** e tráfego nativo com público
`problem-aware`.

---

## 1. Quando usar

- Google Ads (Search/Display/Discovery) e redes nativas (Taboola/Outbrain style).
- Público sente a dor mas é cético a "página de venda".
- Nicho que exige contexto: saúde, finanças pessoais, produtividade, relacionamento.
- Precisa "descer a guarda" antes da oferta.

Não usar quando o público já quer comprar (`product-aware`+) — parece rodeio.

---

## 2. Regras de honestidade (inegociável)

- **Não** imitar um veículo real (nome, logo, layout de jornal existente) sem
  autorização. Cria risco legal e reprova em Google/Meta.
- **Disclosure**: identificar como conteúdo publicitário/patrocinado quando
  exigido pela plataforma ou pela lei local (`brief.compliance.requiresAdvertorialDisclosure`).
  Rótulo visível no topo: "Publicidade" / "Conteúdo patrocinado" / "Anúncio".
- Fatos e estatísticas: só com **fonte citável**. Sem número inventado.
- Depoimentos: só `brief.proof` com `verified: true`, com atribuição real.
- Sem manchete de pânico falso, sem "URGENTE: cientistas chocados", sem fake countdown.
- Nicho saúde/finanças: disclaimers + "resultados variam / não é garantia / não é
  aconselhamento médico ou financeiro".

---

## 3. Estrutura (adaptar)

1. **Kicker / rótulo**: "Publicidade" + categoria ("Saúde", "Finanças").
2. **Manchete**: baseada em descoberta/ângulo, não em oferta.
   - `Por que [problema comum] pode ter menos a ver com [causa presumida] e mais com [causa-raiz do mecanismo]`
   - `[Avatar] estão adotando [abordagem] — e o que especialistas dizem sobre isso`
3. **Sub-deck**: 1 frase que contextualiza.
4. **Byline + dateline** (autor real ou "Equipe [marca]"; data).
5. **Lead jornalístico** (2–3 parágrafos): apresenta a questão, uma cena ou um dado.
6. **Desenvolvimento**:
   - o problema e por que as abordagens comuns não resolvem;
   - a causa-raiz (o mecanismo do problema);
   - o que mudou / a nova abordagem (mecanismo da solução), com fontes/lógica;
   - contexto de especialista ou princípio conhecido.
7. **Introdução do produto**: aparece como exemplo concreto da abordagem — "uma
   das opções que aplicam esse princípio é [produto], que faz X".
8. **Como funciona na prática**: 3 passos, o que a pessoa recebe.
9. **Prova** (real): caso, dado, antes/depois legítimo.
10. **Caixa de oferta** (visualmente destacada do corpo editorial): o que inclui,
    preço, garantia, bônus, CTA. Deixa claro que a partir daqui é oferta.
11. **FAQ curto** (3–5).
12. **CTA final**.
13. **Rodapé**: disclosure completo, disclaimers, privacidade, termos, contato,
    "esta página não é endossada por [Google/Meta/veículos]".

---

## 4. Voz e forma

- Tom de repórter/redator: informativo, terceira pessoa no corpo, citações entre aspas.
- Coluna estreita (~680px), tipografia de leitura, sem "cara de landing page"
  (sem CTA gigante colorido no meio do texto — só na caixa de oferta e no fim).
- Links contextuais discretos. 1–2 imagens editoriais com legenda.
- CTA sticky pode existir, discreto, aparecendo após a introdução do produto.

---

## 5. Compliance Google (resumo — ver `compliance-google.md`)

- Landing page precisa: navegação clara, contato, política de privacidade e
  termos acessíveis, sem conteúdo enganoso, correspondência com o anúncio.
- Sem "unrealistic claims", sem "clickbait", sem simulação de sistema/alerta.
- Categorias sensíveis (saúde, "get rich", relacionamento/"personal hardship")
  têm restrições — escrever dentro delas, não contorná-las.
- Se usar o formato de artigo, o **anúncio** também deve ser condizente (não
  prometer o que a página não entrega).

---

## 6. Saída

Formato `advertorial` em `output/<slug>-advertorial/`. Documentar no
`README-PUBLICAR.md` o texto exato do disclosure usado e as fontes citadas
(com URL) para o usuário conseguir defender a página numa revisão de conta.
