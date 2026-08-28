# Arquitetura de página — escolha e estrutura

Fase 3 do fluxo. Decide **qual formato** e **quais seções em que ordem**.

---

## 1. Variáveis de decisão

1. **Estágio de consciência** (`brief.audience.awarenessStage`) — Eugene Schwartz:
   - `unaware` — não sabe que tem o problema.
   - `problem-aware` — sente a dor, não conhece soluções.
   - `solution-aware` — conhece tipos de solução, não o seu produto.
   - `product-aware` — conhece seu produto, não comprou.
   - `most-aware` — só falta a oferta/gatilho.
2. **Temperatura do tráfego** (`brief.trafficType`):
   - frio: Meta Ads de prospecção, nativo, afiliado para lista fria.
   - morno: Google Ads de intenção, retarget leve, conteúdo orgânico.
   - quente: retarget, e-mail, lista, recompra.
3. **Ticket** (`brief.price.amount` + moeda): baixo / médio / alto / high-ticket.
4. **Complexidade da oferta**: precisa educar sobre o mecanismo? É contraintuitiva?
5. **Nicho sensível** (`brief.compliance`): mais contexto, mais isenção.

---

## 2. Matriz consciência × tráfego → formato

| | Frio | Morno | Quente |
|---|---|---|---|
| **unaware** | Advertorial forte OU presell-história → VSL/vendas | Advertorial → vendas | Presell curto → vendas |
| **problem-aware** | Advertorial → vendas | Advertorial curto OU presell → vendas | Vendas long-form |
| **solution-aware** | Presell (comparação/mecanismo) → vendas | Vendas long-form | Vendas short/long |
| **product-aware** | Vendas long-form | Vendas | Página de oferta curta |
| **most-aware** | Vendas | Página de oferta curta | Página de oferta curta + urgência real |

Captura (opt-in) entra **antes** de qualquer um dos acima quando a estratégia é
lista/lançamento/webinar. Obrigado entra **depois** da conversão.

---

## 3. Ajuste por ticket

| Ticket (BRL aprox.) | Padrão |
|---|---|
| até R$ 97 | Short/long-form, CTA acima da dobra, checkout direto, poucas seções, garantia simples. |
| R$ 97–497 | Long-form completa, prova média, bônus, garantia, FAQ. |
| R$ 497–1.997 | Long-form + VSL opcional + mais prova + mais autoridade + garantia forte. |
| > R$ 1.997 / mentoria | **Aplicação/agendamento** em vez de checkout. Página qualifica, não vende no clique. Seções: para quem é / para quem NÃO é, método, resultados (reais), como funciona o acompanhamento, CTA = "aplicar / agendar diagnóstico". |

Recorrente (SaaS): sempre incluir comparação de planos, FAQ de cobrança,
"cancele quando quiser", prova de retenção/uso.

---

## 4. Estruturas base (adaptar — nunca copiar seção a seção)

### 4.1 Página de vendas — long-form

1. **Hero**: headline, subheadline, prova rápida (1 linha), CTA primário, imagem/loop do produto.
2. **Dor / identificação** (espelho do avatar).
3. **Agitação** (custo de continuar assim) — curta.
4. **História / virada** (se marca pessoal) ou **"por que as soluções comuns falham"**.
5. **Mecanismo único** (nomeado, 3 razões, analogia, evidência).
6. **Apresentação do produto** + "o que está dentro" com resultado por item.
7. **Benefícios → resultado** (bullets de fascination).
8. **Prova** (só real; ordenada por força).
9. **Oferta**: value stack, ancoragem, preço, parcelamento, o que acontece ao clicar.
10. **Bônus** (empilhamento; cada um remove uma objeção).
11. **Garantia / reversão de risco**.
12. **FAQ / objeções** (5–8).
13. **Sobre o criador / autoridade** (se aplicável).
14. **Recapitulação da oferta** + CTA.
15. **Fechamento** + urgência real (ou nenhuma).
16. **Rodapé legal**: disclaimers, privacidade, termos, contato, CNPJ/ąnome, "este site não é afiliado a [plataformas de anúncio]".

CTA repetido após seções 5, 9, 11, 14.

### 4.2 Página de vendas — short-form (most-aware / ticket baixo / retarget)

Hero (promessa + CTA) → 3–5 bullets de resultado → prova curta → oferta + garantia
→ FAQ mínimo (3) → CTA final → rodapé. Uma tela e meia a três telas.

### 4.3 Presell
Ver `presell.md`. Resumo: hook editorial/história → agitação da dor → introdução
do "caminho" (sem vender) → transição para o produto → CTA que leva à página/checkout
do produtor **com parâmetros preservados**.

### 4.4 Advertorial
Ver `advertorial.md`. Resumo: manchete de notícia/descoberta → lead jornalístico
→ desenvolvimento com fontes/lógica → introdução do produto como parte da matéria
→ caixa de oferta → disclosure de publicidade → CTA.

### 4.5 Página de captura (opt-in)

1. Hero: promessa da isca (o que a pessoa recebe agora) + formulário curto (nome + e-mail, ou só e-mail).
2. 3 bullets do que tem dentro da isca.
3. Prova/autoridade curtíssima (1 elemento).
4. Reforço do CTA + linha de privacidade (LGPD/GDPR) + link da política.
5. Rodapé mínimo.

Sem menu, sem links de fuga. Formulário: `action` para o ESP (Mailchimp/ActiveCampaign/
ConvertKit/RD) ou `mailto` fallback; sempre com `required`, `type="email"`, mensagem de sucesso.
Se não houver ESP, deixar `data-form-endpoint` documentado no README.

### 4.6 Página SaaS/app
Ver `templates/app-saas/`. Hero com screenshot/loop do produto → prova social
(logos/usuários) → 3 blocos de valor (job-to-be-done) → como funciona em 3 passos
→ comparação de planos → FAQ (billing, segurança, migração) → CTA de trial/demo →
rodapé com status, docs, segurança.

### 4.7 Página de obrigado

1. Confirmação clara ("Pagamento aprovado" / "Cadastro confirmado").
2. **Próximos passos concretos**: onde acessar, prazo do e-mail, suporte, app de comunidade.
3. (Opcional) **Upsell / order bump one-click** se a plataforma suportar — 1 oferta, honesta, "não, obrigado" visível.
4. (Opcional) Pesquisa de origem (1 clique) ou vídeo de boas-vindas.
5. Sem distrações. Sem novo pitch pesado.

Adicionar `<meta name="robots" content="noindex">` e disparo de evento de conversão
(placeholder `trackConversion()`).

---

## 5. Above the fold — regras

- Promessa legível em < 5s. CTA visível sem rolar em mobile (ou a ≤ 1 rolagem curta).
- No máximo 1 ação primária. Links secundários (login, idioma) discretos.
- Prova imediata: 1 número real, 1 selo real, ou 1 frase de autoridade — se existir.
- Peso da dobra: idealmente < 150KB de imagem; hero em vídeo só com poster + lazy.

---

## 6. Navegação e âncoras

- Long-form: sem menu tradicional; opcional barra fina com 1 CTA sticky após a dobra.
- Âncoras internas para "ver a oferta" / "perguntas frequentes".
- Sticky CTA aparece depois que o CTA do hero sai da viewport; some perto do checkout.
- Rodapé sempre com links legais.

---

## 7. Saída da fase

Registrar em `output/<slug>/architecture.md`:
- formato escolhido + justificativa (as variáveis da seção 1);
- lista ordenada de seções com o objetivo de cada uma;
- posições dos CTAs;
- elementos condicionais (VSL? aplicação? order bump? captura antes?);
- exigências de compliance que afetam a estrutura.
