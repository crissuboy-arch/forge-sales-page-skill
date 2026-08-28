# Copywriting — frameworks, blocos e execução

Objetivo: escrever **toda a copy** de uma página de conversão a partir do
`brief.json`, adaptada ao produto, ao avatar e ao estágio de consciência. Este
arquivo é o manual da fase 5 do fluxo.

---

## 1. Princípios

1. **Uma ideia central por página.** Tudo serve à promessa principal. Se uma
   frase não move o leitor em direção ao CTA, corte.
2. **Especificidade vence adjetivo.** "Em 21 dias" > "rápido". "R$ 3.480 em 3
   meses" (se real e fornecido) > "muito dinheiro".
3. **Escreva para uma pessoa.** Segunda pessoa do singular. O avatar do `brief`.
4. **Clareza antes de esperteza.** O leitor decide em segundos se continua.
5. **Prova antes de pedir.** Nunca peça a compra antes de justificar a crença.
6. **Voz do cliente.** Use as palavras que o avatar usa para descrever a dor
   (do `brief.audience.mainPain` e das objeções).
7. **Ritmo.** Frases curtas para tensão. Parágrafos de 1–3 linhas. Subtítulos
   que contam a história sozinhos (teste do "scan").

---

## 2. Escolha do framework macro

| Framework | Usar quando | Esqueleto |
|-----------|-------------|-----------|
| **PAS** (Problema–Agitação–Solução) | Público problema-consciente; dor emocional forte | Nomear a dor → aprofundar consequências → apresentar o mecanismo como saída |
| **AIDA** | Público solução/produto-consciente; oferta direta | Atenção (promessa) → Interesse (mecanismo/benefícios) → Desejo (prova+oferta) → Ação |
| **Star–Story–Solution** | Marca pessoal, mentoria, narrativa de virada | Personagem → jornada e descoberta → o método que nasceu disso |
| **4 P's** (Promise–Picture–Proof–Push) | Landing curta, tráfego morno, retarget | Promessa → visualização do resultado → prova → chamada com urgência real |
| **Advertorial / Lead editorial** | Google Ads, nativo, problema-consciente | Ver `advertorial.md` |
| **Presell (ponte)** | Tráfego frio antes do checkout do produtor | Ver `presell.md` |

A **sofisticação de mercado** (`brief.audience.marketSophistication`) ajusta:

- Nível 1–2: basta **afirmar** o benefício com clareza.
- Nível 3: liderar pelo **mecanismo único** ("como funciona diferente").
- Nível 4: mecanismo + **prova superior** + quebra de padrão.
- Nível 5: **identidade** ("isto é para quem é X") + reposicionar a categoria.

---

## 3. Blocos de copy (banco) — o que cada um precisa entregar

### Headline (above the fold)
- Comunica **promessa + para quem + (idealmente) o mecanismo ou o prazo**.
- Fórmulas de partida (adaptar, nunca colar):
  - `[Resultado desejado] sem [dor/objeção principal] — mesmo que [circunstância limitante]`
  - `O método [nome/mecanismo] que ajuda [avatar] a [resultado] em [prazo]`
  - `Como [avatar] estão [resultado] usando [mecanismo], sem [método antigo ruim]`
  - `Para [avatar] que já tentou [X] e ainda [dor]`
- Evitar: superlativo vazio ("o melhor"), promessa absoluta ("garantido"),
  clickbait que a página não cumpre.

### Subheadline
- Uma frase que **sustenta a headline** com o "como" ou a prova mais forte.
- Responde: "por que isso seria verdade para mim?"

### Lead / abertura (primeiros 2–4 parágrafos)
- Entra pela dor (PAS) ou pela cena/história (SSS) ou pela notícia (advertorial).
- Objetivo único: fazer rolar o scroll. Nenhuma venda ainda.

### Identificação da dor
- 3–5 frases-espelho na voz do avatar. "Você já..." / "Talvez você..."
- Consequência prática + custo emocional. Sem exagero grosseiro.

### Agitação
- O que acontece se nada mudar (custo da inação). Curto. Sem chantagem.

### Mecanismo único
- Nomeie o mecanismo. Explique **por que o método antigo falha** e **por que este
  é diferente** (a "grande brecha"). 3 razões no máximo.
- Analogia simples + 1 evidência lógica. Se houver dado real, usar.

### Apresentação do produto
- O que é (formato: curso, software, kit, comunidade), como se acessa, quanto
  tempo leva, o que a pessoa faz na prática.
- Lista "o que está dentro" — módulos/recursos com **resultado de cada um**.

### Benefícios → resultado
- Traduza cada `benefit` do brief em: **recurso → o que faz → o que muda na vida**.
  - Ex.: "Templates de anúncio (recurso) → você monta a campanha em 20 min
    (funcionalidade) → posta ainda hoje em vez de travar uma semana (resultado)".
- Bullets de "fascination": específicos, curiosos, verificáveis.

### Prova
- **Somente `brief.proof` com `verified: true`.**
- Ordene por força: resultado numérico verificável > caso detalhado > depoimento
  nominal > autoridade/mídia > selo.
- Sem provas: substitua por **demonstração** (mostrar o produto funcionando),
  **lógica do mecanismo**, **credenciais do criador**, ou **garantia forte**.
  Nunca invente. Ver `compliance-*.md`.

### Oferta
- Empacote: entregável principal + bônus + garantia + acesso/suporte.
- **Ancoragem**: valor dos componentes (se defensável) → preço real → forma de
  pagamento. Se `anchorPrice` existe, mostrar de/por com honestidade.
- Deixe o **próximo passo físico** explícito ("clique no botão, você vai para o
  checkout seguro da [plataforma]").

### Bônus
- Cada bônus: nome + o problema específico que resolve + valor percebido (se
  fornecido) + por que é relevante **agora**.
- Bônus deve remover uma objeção ("mas eu não sei fazer X") ou acelerar o resultado.

### Garantia / reversão de risco
- Reafirme os termos do `brief.guarantee`. Linguagem simples.
- Assuma o risco no lugar do cliente. Sem letras miúdas contraditórias.
- Sem garantia no brief → foque em quebra de risco por outros meios (trial,
  amostra, "comece pelo módulo 1") e **não prometa reembolso**.

### FAQ / objeções
- 5–8 perguntas. Cada uma = uma objeção real (`brief.objections` + as clássicas:
  preço, tempo, "funciona para mim?", "e se eu não conseguir?", suporte, acesso,
  reembolso, "por que agora?").
- Resposta: valida a preocupação → reframe → prova/mecanismo → mini-CTA.

### CTAs
- Verbo + resultado, não "comprar": "Quero [resultado]", "Começar agora",
  "Garantir minha vaga" (só se vagas forem reais).
- Repetir o CTA a cada ~1.5 tela em long-form. Sempre o mesmo destino.
- Microcopy sob o botão: pagamento seguro, plataforma, garantia, o que acontece a seguir.

### Fechamento
- Recapitula a escolha: continuar como está × pegar o atalho.
- Última visão do resultado. Urgência **verdadeira** (data de fim de bônus,
  turma, lote) ou nenhuma.
- Assinatura do criador quando houver marca pessoal.

---

## 4. Tom por nicho (ponto de partida, ajustar ao brief)

| Nicho | Tom | Cuidado |
|-------|-----|---------|
| Finanças / investir | Sóbrio, baseado em processo, transparente sobre risco | Nunca garantir retorno; disclaimer obrigatório |
| Emagrecimento / saúde | Empático, sem vergonha, focado em hábito | Sem "cura", sem antes/depois irreal, disclaimer médico |
| Relacionamento | Acolhedor, íntimo, respeitoso | Sem manipulação, sem generalização de gênero, sem promessa de reconquista garantida |
| Negócios / marketing | Direto, orientado a números, prático | Cuidado com renda; "resultados variam" |
| Beleza / skincare | Sensorial, estético, ritualístico | Claims cosméticos ≠ terapêuticos |
| Espiritualidade / bem-estar | Calmo, elevado, não dogmático | Sem promessa de resultado material |
| SaaS / produtividade | Claro, funcional, orientado a jobs-to-be-done | Não superprometer automação |
| Educação / cursos | Encorajador, orientado a progresso | Sem "fica expert em X dias" |

---

## 5. Idioma

- Escreva **nativo** no `brief.language` — não traduza literalmente.
- pt-BR: você (não "tu"), sem gerundismo, sem anglicismo desnecessário.
- en: contrações, voz ativa, frases curtas.
- es: usted/tú conforme mercado; evitar falsos cognatos.
- Moeda, formato de data e número seguem o locale.

---

## 6. Entregável da fase de copy

Salvar em `output/<slug>/copy.md` com **todos** os blocos rotulados, na ordem da
arquitetura escolhida, incluindo:

- todas as variações de CTA e microcopy;
- alt text de cada imagem prevista;
- `<title>`, meta description, OG title/description;
- textos legais/disclaimers exigidos pelo nicho.

O build (fase 6) só consome `copy.md` — não improvise texto no HTML.
