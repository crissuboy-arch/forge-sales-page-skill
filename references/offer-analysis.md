# Análise de oferta, avatar, mecanismo e objeções

Fase 2 do fluxo. Produz o entendimento que guia arquitetura, copy e visual.
Salvar o resultado em `output/<slug>/analysis.md`.

---

## 1. Avatar (quem compra)

Extrair de `brief.audience` e refinar:

- **Identidade**: quem é (papel, contexto de vida, faixa etária aproximada).
- **Situação atual** vs **situação desejada** (o "gap").
- **Dor primária** (uma) + dores secundárias.
- **Desejos declarados** e **desejo profundo** (status, segurança, pertencimento, tempo, autonomia).
- **Medos e objeções** (seção 4).
- **Nível de consciência** (ver `sales-architecture.md` §1).
- **Vocabulário**: como essa pessoa descreve o problema com as próprias palavras
  (usar literalmente na copy).
- **Tentativas anteriores**: o que já tentou e por que falhou (base do "por que
  as soluções comuns não funcionam").
- **Momento de compra**: o que precisa ser verdade hoje para ela agir.

Se o brief for raso, **proponha** um avatar em 5 linhas e peça confirmação antes
de seguir.

---

## 2. Oferta (o que se vende)

### Value stack
Liste todos os componentes com entregável e valor percebido:

| Componente | Entrega | Valor percebido | Objeção que remove |
|---|---|---|---|
| Produto principal | ... | ... | ... |
| Bônus 1..n | ... | ... | ... |
| Garantia | ... | — | risco financeiro |
| Suporte/acesso/comunidade | ... | ... | "e se eu travar?" |

### Preço e ancoragem
- Preço real, moeda, parcelamento.
- Âncoras possíveis (em ordem de honestidade): custo de não resolver o problema >
  preço de alternativas (mentor, agência, tentativa e erro) > soma dos componentes
  (só se cada valor for defensável) > `anchorPrice` de/por.
- Nunca inflar valores de bônus de forma absurda — destrói credibilidade e viola
  políticas de anúncio.

### Formato e mecanismo de entrega
Curso gravado / ao vivo / SaaS / kit físico / serviço / comunidade / híbrido.
Tempo até o primeiro resultado ("quick win").

---

## 3. Mecanismo único (por que funciona)

O diferencial que separa este produto de "só mais um".

1. **Problema-raiz**: qual causa real o mercado ignora?
2. **Mecanismo do problema**: por que os métodos comuns atacam o sintoma, não a causa.
3. **Mecanismo da solução**: o "como" diferente — dê um **nome** a ele.
4. **Prova do mecanismo**: lógica, analogia, dado real (se houver), princípio conhecido.
5. **Por que agora**: o que mudou (tecnologia, contexto, descoberta) que torna
   isto possível/urgente.

Se `brief.uniqueMechanism` estiver vazio: derive um candidato da `description` +
`benefits` + `mainPromise` e **confirme com o usuário**. Não fabrique ciência.

Sofisticação de mercado (`marketSophistication` 1–5) define quanto peso o
mecanismo carrega na página — ver `copywriting.md` §2.

---

## 4. Objeções (o que trava a compra)

Catalogar e mapear onde cada uma é tratada na página:

| Objeção | Tipo | Onde tratar |
|---|---|---|
| "É caro / não tenho agora" | dinheiro | oferta, parcelamento, ancoragem, garantia, FAQ |
| "Não vou ter tempo" | esforço | mecanismo (atalho), "o que está dentro" (carga real), FAQ |
| "Já tentei e não funcionou" | ceticismo | seção "por que as soluções comuns falham" + mecanismo |
| "Funciona pra mim / meu caso?" | adequação | prova segmentada, "para quem é / não é", FAQ |
| "E se eu não conseguir?" | risco pessoal | garantia, suporte, quick win, bônus de implementação |
| "Não conheço / confio em vocês" | confiança | autoridade, prova, garantia, rodapé transparente |
| "Por que agora?" | inércia | urgência real, custo da inação, bônus por tempo limitado |
| "É golpe?" | segurança | checkout seguro, plataforma reconhecida, política, contato real |

Objeções específicas do `brief.objections` entram no FAQ com prioridade.

---

## 5. Estágio de consciência × sofisticação — o que a página lidera

| Consciência | A página abre falando de... |
|---|---|
| unaware | uma história/notícia que faz a pessoa reconhecer a dor |
| problem-aware | a dor e sua causa-raiz |
| solution-aware | por que as soluções que ela conhece falham + o mecanismo novo |
| product-aware | a oferta, a prova e o diferencial vs concorrentes |
| most-aware | preço, bônus, garantia, urgência |

---

## 6. Risco de compliance (early check)

Marcar agora, não no fim:

- `brief.compliance.sensitiveNiche` ou categorias health/finance/weight-loss/
  make-money/relationship → acionar `compliance-google.md` e `compliance-meta.md`
  desde a arquitetura.
- Provas: quantas têm `verified: true`? Se zero, planejar página sem seção de
  depoimentos.
- Promessa principal contém termo absoluto? Reescrever com o usuário antes da copy.

---

## 7. Saída da fase (`analysis.md`)

- Avatar em 1 parágrafo + bullets de dor/desejo/vocabulário.
- Value stack (tabela).
- Mecanismo único (5 pontos da seção 3) + status (fornecido / proposto e confirmado).
- Mapa de objeções (tabela).
- Estágio de consciência + o que a página vai liderar.
- Flags de compliance.
- 3–5 palavras-chave de marca para passar à direção visual.
