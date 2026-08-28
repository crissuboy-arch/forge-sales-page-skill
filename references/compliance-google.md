# Compliance — Google Ads

Objetivo: escrever páginas que **passam na revisão do Google Ads** e sustentam a
conta a longo prazo. Não é aconselhamento jurídico; é uma checklist operacional
baseada nas políticas públicas do Google. Verifique a política vigente antes de
lançar.

---

## 1. Políticas que mais reprovam landing pages

| Política | O que evita |
|---|---|
| **Destino inválido / experiência da LP** | página que não carrega, sem valor, redireciona demais, muitos pop-ups, conteúdo "em construção", 404 |
| **Deturpação (Misrepresentation)** | promessas irreais, "enriqueça rápido", omitir informação relevante (preço, cobrança recorrente, quem é o vendedor), fake scarcity, fake news, testemunhos falsos |
| **Práticas comerciais inaceitáveis** | enganar sobre identidade, produto ou intenção; cobrança-surpresa |
| **Conteúdo enganoso / clickbait** | manchete que a página não cumpre, "alertas do sistema" falsos, simular notícia de veículo real |
| **Saúde e medicamentos** | claims de cura, tratamento de doenças, substâncias reguladas, suplementos com promessa terapêutica |
| **Serviços financeiros** | falta de disclosure (custos, taxas, riscos, CNPJ), promessa de retorno, "renda garantida" |
| **Dificuldades pessoais (personal hardship)** | segmentar/explorar vulnerabilidade emocional (dívida, peso, relacionamento) de forma predatória |

---

## 2. Requisitos mínimos da landing page

- Carrega rápido, sem malware, sem redirect enganoso, mesma URL do domínio anunciado.
- **Navegação clara** e **informações de contato** reais (e-mail e/ou form).
- **Política de Privacidade** e **Termos de Uso** acessíveis (link no rodapé).
- Se coleta dados: informar o quê e por quê; consentimento; base legal (LGPD).
- **Preço visível e completo**: valor, moeda, se é recorrente (e periodicidade),
  o que está incluído, condições de reembolso.
- Identidade do vendedor: nome/razão social, e (BR) CNPJ quando aplicável.
- Conteúdo condiz com o anúncio (headline do anúncio = promessa da página).
- Sem exigir login/pagamento para ver a proposta.

---

## 3. Escrevendo claims dentro da política

**Proibido / arriscado** → **Reescrita compatível**

- "Ganhe R$ 10.000/mês garantido" → "Veja o método que estruturamos para
  organizar as finanças do negócio. Resultados dependem de execução e contexto e
  não são garantidos."
- "Cura a ansiedade em 7 dias" → "Práticas diárias para ajudar a lidar melhor com
  a ansiedade no dia a dia. Não substitui acompanhamento profissional."
- "Emagreça 10kg sem esforço" → "Um plano de hábitos para apoiar quem quer
  emagrecer com mais constância. Resultados variam."
- "Cientistas chocados descobrem..." → título factual sobre o mecanismo, com fonte.
- "Última chance — acaba em 10:00" (contador falso) → prazo real (data/lote) ou
  remover a urgência.
- "Como visto na [Veículo]" sem base → só se houver menção real, com link.

Princípios: **possibilidade, não certeza**; **processo, não resultado
prometido**; **isenção clara**; **sem explorar medo**.

---

## 4. Categorias sensíveis — o que a página precisa ter

### Saúde / bem-estar / suplementos
- Sem claim de diagnóstico, cura, prevenção ou tratamento de doença.
- Disclaimer: "Conteúdo educativo. Não substitui avaliação médica. Procure um
  profissional de saúde."
- Sem antes/depois com promessa; sem "resultado típico" irreal.

### Finanças / investimento / "fazer dinheiro"
- Disclaimer de risco: "Investimentos envolvem risco, inclusive de perda do
  capital. Retornos passados não garantem retornos futuros. Isto não é
  recomendação de investimento."
- Divulgar custos, taxas e a recorrência. Identificação e CNPJ.
- Sem "renda garantida", "lucro certo", "sem risco".

### Relacionamento / dificuldades pessoais
- Sem prometer reconquista/"faça-o voltar garantido".
- Tom de apoio, não de manipulação. Sem exploração de sofrimento.

### Trials e recorrência
- "Grátis" só se for realmente grátis. Deixar claro quando começa a cobrança,
  quanto, e como cancelar **antes** de coletar o pagamento.

---

## 5. Blocos que a skill deve inserir automaticamente

Quando `brief.compliance.sensitiveNiche` ou categoria correspondente:

- **Disclaimer contextual** perto da promessa principal e da oferta.
- **Bloco de isenção** no rodapé (resultados variam / não é aconselhamento X).
- **Links legais**: Política de Privacidade, Termos de Uso, Política de Reembolso.
- **Identificação**: nome/razão social + contato + (se houver) CNPJ.
- **Rótulo de publicidade** em advertorial (ver `advertorial.md`).
- Frase "Este site não é parte do Google/YouTube nem é endossado por eles.
  Google é marca da Google LLC." (padrão em nichos de renda; ajustar).

`verify.js` checa a presença desses blocos quando o brief marca nicho sensível.

---

## 6. Lista de termos que disparam alerta (o `verify.js` sinaliza)

`garantido`, `garantia de resultado`, `100%`, `sem risco`, `renda garantida`,
`lucro certo`, `fique rico`, `enriqueça`, `cura`, `curar`, `elimina de vez`,
`resultado imediato`, `sem esforço`, `milagroso`, `aprovado pela ANVISA` (sem
prova), `cientificamente comprovado` (sem fonte), `como visto na Globo/Forbes/...`
(sem prova), `última chance` + contador reiniciável.

Sinalizar ≠ proibir automaticamente: alguns são aceitáveis com contexto/fonte. O
agente revisa cada ocorrência com o usuário.
