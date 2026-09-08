# Integração PROSPECÇÃO — Máquina de Leads → PageForge AI

PageForge AI passa a ter **dois modos**:

| Modo | O que faz | Estado |
|---|---|---|
| **Criador de Páginas** | briefing → IA (método Forge) → preview → export HTML/ZIP | preservado 100% |
| **Prospecção** | encontrar empresas → qualificar → diagnosticar → virar briefing | **Fase 1 (esta)** |

A **Máquina de Leads** (`crissuboy-arch/maquina-de-leads`, Python + AIsa + SQLite)
fornece **motor e lógica**; a PageForge fornece **produto e interface**. Nada foi
recriado do zero — a lógica de scoring, diagnóstico e o schema de lead foram
**portados** de `motor.py` / `engine.py`.

---

## Fluxo final desejado (visão)

```
PROSPECTAR → ENCONTRAR EMPRESAS → QUALIFICAR LEAD → ANALISAR SITE ATUAL →
SCORE/OPORTUNIDADE → CRIAR NOVA VERSÃO → PAGEFORGE RECEBE OS DADOS →
GERAR REDESIGN → EDITOR VISUAL → IMPECCABLE/QA → PREVIEW ANTES×DEPOIS →
PUBLICAR DEMONSTRAÇÃO → GERAR PROPOSTA → CRM
```

A Fase 1 entregou do início até **CRIAR NOVA VERSÃO → PageForge recebe os dados**.
A **Fase 2** acrescentou: redesign → **Impeccable QA** → **editor visual** →
**antes × depois** → export.
A **Fase 3** fecha o fluxo comercial: **publicar demo (URL pública)** →
**proposta** → **rascunho de e-mail** → **CRM/pipeline** → **follow-up** →
**contrato**.

---

## O que foi feito nesta Fase 1

### Backend (`api/`)
- `api/_lib/prospect.js` — schema de lead (compatível com a tabela `leads` da
  Máquina de Leads), `scoreLead()` (fórmula de `motor.py:score_lead`),
  `heuristicDiagnosis()`, `normalizeLead()`, `leadToBriefing()` (lead → briefing
  do Criador de Páginas, sem copiar/colar manual).
- `api/_lib/aisa.js` — provider da **AIsa** (aisa.one): chat OpenAI-compatível +
  Google Maps SERP + Instagram, na mesma chave `AISA_KEY`. Motor de
  `motor.py:buscar_negocios` portado. Modo de exemplo (`mockProspect`) quando não
  há chave — mesma ideia do `simular` de `motor.py`.
- `api/prospect.js` — `POST /api/prospect` (busca leads) · `GET` (health do
  motor) · `POST {action:"to-briefing"}` (lead → briefing).
- Chave **só no servidor** (`AISA_KEY` nas Environment Variables da Vercel).
  Nunca no navegador, no bundle ou no Git.

### Frontend (`public/`)
- Menu principal: **Dashboard · Criar Página · Prospecção · Leads · Projetos ·
  Configurações** (identidade PageForge preservada).
- `#/` Dashboard — KPIs (leads, oportunidades 🔥, com site, páginas criadas) +
  atalhos.
- `#/prospeccao` — busca por nicho + cidade + filtros; cards de lead com score
  0–100, temperatura (🔥/🌤️/❄️), nota do Google, site atual, contatos
  (WhatsApp/e-mail/Instagram), diagnóstico e **CRIAR NOVA VERSÃO**.
- `#/leads` — lista salva (mini-CRM), filtro por status, detalhe do lead
  (`#/lead/<slug>`), troca de status.
- `#/projetos` — páginas geradas (reabrir no preview).
- `#/config` — estado dos motores (NVIDIA para páginas, AIsa para prospecção),
  export/limpeza de dados locais.
- `public/assets/js/store.js` — **adapter** de armazenamento (`list/get/upsert/
  remove/clear`). Hoje localStorage; a interface está pronta para trocar por
  backend/nuvem numa fase seguinte **sem mexer na UI**.
- `public/assets/js/prospect.js` — toda a lógica de prospecção/leads.
- `app.js` — router estendido, `toBuilder(brief)` (lead → wizard pré-preenchido),
  `saveProject()` (toda página gerada entra em Projetos e marca o lead como
  `redesenhado`).

---

## Comparação com `gemini-prospector` (mapa de recursos)

Mesma lógica da Máquina de Leads, empacotada como plugin do Antigravity (7
skills). Recursos úteis observados, **ainda ausentes** aqui e candidatos a fases
seguintes:

- avaliação do site do lead com **navegador headless** (Playwright) — hoje o
  diagnóstico é heurística + 1 chamada de IA;
- skill de **contrato** e de **deploy HostGator/GitHub Pages**;
- **comparador antes/depois** como página publicável.

Nenhum deles é bloqueante para a Fase 1.

---

## Checklist Fase 1

- [x] PageForge atual preservado (Criador de Páginas intacto, 30 testes passam)
- [x] estrutura da Máquina de Leads estudada (`motor.py`, `engine.py`, schema `leads`)
- [x] recursos do Gemini Prospector comparados (mapa acima)
- [x] módulo Prospecção criado (área principal + menu)
- [x] lista/dashboard de leads
- [x] score / status
- [x] diagnóstico (heurístico + IA via AIsa)
- [x] botão **Criar Nova Versão**
- [x] lead → briefing do PageForge (automático, sem copiar/colar)

## Fase 2 — editor visual · antes×depois · Impeccable (feito)

### Editor visual (`public/assets/js/editor.js`)
Portado de `maquina-de-leads/modelos/editor-visual.md` e estendido. Opera direto
no `contentDocument` do `<iframe>` de preview (same-origin); o HTML exportado sai
**limpo** (nenhum artefato). Recursos:
- editar texto / título / CTA (contenteditable)
- editar link (URL) — Alt+clique ou clique em `<a>`
- trocar imagem (arquivo → base64)
- cores (`--accent`, `--ink`, `--bg`, `--surface`, `--accent-ink`) e fontes (painel)
- mostrar/ocultar seção · reordenar seção (↑ ↓)
- **desfazer / refazer** (pilha de snapshots) · **salvar** (grava no projeto)

### Antes × Depois (`#/compare`)
Portado de `maquina-de-leads/modelos/comparador-template.html`. Dentro do
preview/lead: **Site atual** × **Nova versão** com abas Antes / Depois / Lado a
lado. Sem site → mensagem "maior oportunidade".

### Impeccable QA (`api/_lib/impeccable-qa.js`)
Impeccable instalado via `npx skills add https://github.com/pbakaus/impeccable`
(fica em `.agents/skills/`, git-ignorado — ferramenta de agente). O produto tem
uma **camada de acabamento determinística** que codifica o `audit.md` do
Impeccable (Apache-2.0): 5 dimensões (acessibilidade, performance, responsivo,
theming, integridade), score **/20**, severidade **P0–P3**. Roda **uma vez** no
`assemble` (e sob demanda no botão **QA**) e aplica **uma rodada** de correções
seguras: `alt=""`, `viewport`, `prefers-reduced-motion`, `img{max-width:100%}`,
`loading="lazy"`, remoção de kicker/eyebrow acima de heading (ban do craft-floor).
Fluxo: **PageForge gera → postprocess → Impeccable QA → resultado final**.

## Fase 3 — fluxo comercial (feito)

### Publicar demo (`api/demo.js` · `api/demo-serve.js` · `api/_lib/blob.js`)
Botão **PUBLICAR DEMO** no detalhe do lead → a última página gerada/editada
ganha uma URL pública individual **`/demo/<slug>`** (rewrite no `vercel.json` →
`/api/demo-serve`). Storage: **Vercel Blob** via REST, sem dependência
(`BLOB_READ_WRITE_TOKEN`). A demo abre sem login, é mobile, preserva o redesign
final editado, não expõe painel/editor, tem os CTAs funcionando, é
**republicável** e marca o lead como `demo-publicada`. Sem token: degrada com
mensagem clara + fallback de Exportar HTML/ZIP (não bloqueia o resto). Em dev
(`PAGEFORGE_MOCK=1`) usa memória.

### Proposta (`api/commercial.js` action `proposal`)
**GERAR PROPOSTA** → HTML (template adaptado de
`maquina-de-leads/modelos/capa-proposta-template.html`) pré-preenchido com dados
reais: empresa, nicho, cidade, diagnóstico, oportunidade, **URL da demo** (com
preview), contatos. Estrutura: SITE ATUAL → problema/oportunidade → NOVA VERSÃO →
URL → o que está incluído → próximo passo (WhatsApp). **Editável** antes de usar.
Preço só se configurado (`precoPadrao`); nunca inventado. Pode ser publicada como
demo própria.

### Rascunho de e-mail (`api/commercial.js` action `email`)
**CRIAR RASCUNHO DE E-MAIL** — NÃO envia. Gera assunto (≤60 car.) + corpo
personalizado (rapport com a nota real, 1–2 defeitos objetivos, **1 link só**,
zero preço, assinatura do config), com **link do Gmail Compose** e `mailto:`
como fallback. "Marcar como enviada" → status `proposta-enviada` + follow-up +3d.
Gmail API: preparado, não configurado — não bloqueia nada.

### CRM / Pipeline (`api/_lib/prospect.js` · `public/assets/js/commercial.js`)
Pipeline: `novo → qualificado → redesign-criado → demo-publicada →
proposta-pronta → proposta-enviada → follow-up → negociacao → fechado / perdido`
(aliases dos status antigos preservados). Cada mudança grava
`lead.historico[{status, at, nota}]`. Por lead: observações, próxima ação, data
de follow-up, link da demo, proposta, contrato, contatos. Sem CRM empresarial.

### Follow-up (`#/followups`)
Lista os leads com `proximaAcaoData` vencida ou em `proposta-enviada`/`follow-up`
sem data. Botão de rascunho de follow-up (Gmail) + "marcar feito". Sem disparo
automático.

### Contrato (`api/commercial.js` action `contract`)
**GERAR CONTRATO** — minuta (template adaptado de
`maquina-de-leads/modelos/contrato-template.html`). Pré-preenche só dados reais
(cliente do lead + `contratante*` e padrões do config). O que falta aparece em
`missing` + campos manuais na interface e fica <mark>destacado</mark> no
documento. Sem assinatura eletrônica. Editável, salva no lead, abre para
imprimir/PDF.

### Dashboard
KPIs do funil completo: Encontrados · Qualificados · Redesigns · Demos
publicadas · Propostas prontas · Propostas enviadas · Follow-ups · Negociações ·
Fechados. Cada um linka para a lista/seção.

### Configurações
Aba com os campos de assinatura (nome, apresentação, WhatsApp, domínio) e
contrato (razão social, CPF/CNPJ, endereço, cidade) + padrões (preço, prazo,
forma de pagamento). Só no navegador.

## Task 4 — experiência e estrutura completas (feito)

Fechamento de toda a experiência **antes** de configurar as IAs reais. Tudo o
que depende de API externa usa **MOCK/FALLBACK**; nenhuma chave é pedida ou
guardada no navegador.

### Onboarding (`public/index.html` · `app.js`)
Modal no primeiro uso com os dois caminhos (**CRIAR UMA PÁGINA** ×
**ENCONTRAR CLIENTES**), passos de cada fluxo e **"Não mostrar novamente"**.
Não reaparece se já houver leads/páginas salvos. Reabrível em Configurações →
*Rever tutorial inicial*.

### Dashboard como central de trabalho (`prospect.js: renderDashboard`)
KPIs do funil + painéis **Próximas ações** (sugestão de passo por estágio),
**Follow-ups de hoje**, **Leads quentes** e **Projetos recentes** + ações
rápidas (Criar página · Prospectar · Ver leads). Estado vazio quando não há
nada.

### Tela completa do lead (`prospect.js: renderLeadDetail`)
Cabeçalho com **badge do estágio atual** + trilha de progresso. Navegação de
seções: **Visão geral · Contatos · Diagnóstico · Site atual · Redesign ·
Proposta/E-mail/Contrato · Histórico**. Ações principais: CRIAR NOVA VERSÃO,
EDITAR PÁGINA, QA, ANTES × DEPOIS, PUBLICAR DEMO, GERAR PROPOSTA, CRIAR E-MAIL,
AGENDAR FOLLOW-UP, GERAR CONTRATO. Prévia do site atual embutida (com aviso de
fallback quando o site bloqueia iframe) e miniatura do redesign.

### Projetos / Páginas (`prospect.js: renderProjetos`)
Lista com tipo, origem, lead relacionado, datas, QA, demo. Ações: **Abrir ·
Editar · Antes/Depois · Duplicar · Exportar · Publicar/Republicar · Excluir**.
Reabrir um projeto restaura o trabalho no preview/editor.

### Persistência e recuperação (`store.js`)
`PFStore` ganhou `settings` (perfil, prospecção, páginas, comercial, publicação,
contrato) e `ui` (onboarding, última rota) via `makeDoc` — mesmo contrato
estável para trocar por nuvem depois. Autosave no briefing e nas Configurações.
Backup **Exportar/Importar JSON** completo.

### Configurações (`prospect.js: renderConfig` → `#cfgRoot`)
Seções **Meu perfil · Prospecção · Páginas · Comercial · Publicação · Contrato**
com autosave. **Integrações**: cards de status (`/api/integrations`) para
NVIDIA, AIsa, Gemini, OpenAI, Groq, Gmail, Vercel Blob —
`CONFIGURADO / NÃO CONFIGURADO / MODO EXEMPLO`. O endpoint só checa
**presença** da variável de ambiente no servidor; **nunca** devolve valor de
chave.

### Estados da interface
Loading, vazio, erro (com *tentar de novo*), sucesso, sem configuração
(modo exemplo com selo **MOCK/EXEMPLO** nos leads), sem resultados, offline
(banner), confirmação de exclusão (modal), autosave. Sem telas em branco.

### Navegação e acabamento
Menu consistente (Dashboard · Criar Página · Prospecção · Leads · Projetos ·
Follow-ups · Configurações) + **breadcrumbs** em todas as telas internas + botões
*voltar*. Padrão visual esmeralda / branco / grafite aplicado como camada de
acabamento (Impeccable) — hierarquia, espaçamento, tipografia, contraste,
cards, formulários, responsividade. Sem overflow horizontal em nenhuma view
(desktop / tablet / mobile).

### Endpoint novo
- `api/integrations.js` — `GET /api/integrations` → status das 7 integrações,
  presença de env var apenas, sem vazar valor.

### Testes
- `scripts/app-selftest.mjs` — 38/38.
- e2e MOCK completo (desktop + mobile 390px): onboarding → dashboard →
  prospectar → lead → diagnóstico → criar nova versão → builder → gerar →
  preview → editor → salvar → QA → demo (URL pública preserva a edição) →
  proposta → e-mail → follow-up → contrato → projetos (duplicar) →
  configurações (autosave + integrações) → fechar/reabrir (recupera trabalho).
  **36/36, 0 erros de console.**
- Fase 3 e2e — sem regressão (21/21).

## Auditoria final única (feito)

Uma passagem completa pelo produto (onboarding → dashboard → Criar Página →
Prospecção → Leads → detalhe do lead → diagnóstico → Criar Nova Versão →
builder → preview → editor visual → salvar/reabrir → QA → Antes × Depois →
Projetos → Demo → proposta → e-mail → follow-up → contrato → pipeline →
configurações → export/import HTML/ZIP), desktop + tablet + mobile 390px.

**Correções aplicadas nesta rodada:**
- Contraste: `--text-faint` escurecido (`#8b938e` → `#6b736e`, ~4.7:1 sobre o
  fundo) para meta-textos passarem no AA.
- Acessibilidade de modais: onboarding e diálogo de confirmação agora movem o
  foco para dentro, prendem o Tab e devolvem o foco ao fechar (Escape já
  fechava).
- `prefers-reduced-motion`: a navegação de seções do lead usa rolagem
  instantânea quando o usuário pede menos movimento.
- Estado inconsistente: o cabeçalho do lead (badge de estágio / trilha /
  "Demo publicada") passa a atualizar na hora após publicar demo, salvar
  proposta, marcar e-mail enviado ou mudar o pipeline — sem recarregar
  (`PFProspect.refreshLeadHeader`).
- Beco sem saída: "PUBLICAR DEMO" na barra de ações do lead fica **desabilitado
  com dica** enquanto não existe página gerada, em vez de não fazer nada.
- Breadcrumbs de preview/Antes×Depois agora refletem a origem real
  (lead ou projeto), não um "Projetos" fixo.
- Config: enquanto o servidor responde, os cards de integração mostram
  "Consultando o servidor…" em vez de uma mensagem de erro precoce.
- Removida uma chamada redundante de render do dashboard por navegação.

**Sem pendências estruturais.** Tudo o que resta depende exclusivamente de
credencial/serviço externo (ver abaixo).

**Retestes:** `app-selftest` 38/38 · auditoria e2e 53/53 (desktop+tablet+mobile,
0 overflow, 0 erro de console) · Fase 3 e2e 21/21 · Task 4 e2e 36/36.

## Camada de design (Impeccable) — feito

O Impeccable (github.com/pbakaus/impeccable, skill oficial v4.2.2) está instalado
via `npx skills add` em `.agents/skills/impeccable/` (git-ignorado; `skills-lock.json`
versionado). Todas as ~23 capacidades (`shape · init · document · extract ·
critique · audit · polish · bolder · quieter · distill · harden · onboard ·
animate · colorize · typeset · layout · delight · overdrive · clarify · adapt ·
optimize · live`) estão disponíveis para o agente de desenvolvimento.

### Contexto de design permanente (versionado)
- **`PRODUCT.md`** — verdade do produto (schema oficial `impeccable:product-schema 1`).
- **`DESIGN.md`** — sistema visual do **app** (modo Operate, esmeralda/branco/grafite,
  frontmatter de tokens no formato DESIGN.md). Deixa explícito que **as páginas
  geradas NÃO herdam a identidade do app**.
- **`.impeccable/config.json`** — `buildPath: code` (sem geração de imagem neste
  ambiente). Artefatos de sessão (`build/`, `review/`, `mocks/`, `live/`)
  git-ignorados.

### A camada aplicada às PÁGINAS que a PageForge gera
O Impeccable não serve só para auditar o dashboard — ele fortalece principalmente
o que a PageForge cria/redesenha:

- **Prompts** (`api/_lib/prompt.js` → `IMPECCABLE_CRAFT`): o essencial de
  craft-floor / layout / typeset / colorize / animate entra nos prompts de
  **PLAN**, **RENDER** e ajuste — como regras, não como 23 botões. Primeira dobra
  é tese; hierarquia pelo squint test; ritmo de espaço; degraus de tipografia;
  accent com papel; prova > afirmação; lista de banidos absolutos.
- **DESIGN QUALITY** (`api/_lib/design-quality.js`, determinístico, sem IA) —
  novo passo do pipeline entre RENDER e ASSEMBLE:
  `BRIEFING → PLAN → RENDER → **DESIGN QUALITY** → ASSEMBLE → PREVIEW → EDITOR → QA → EXPORT`
  1. **Perfil de design** do caso: modo do visitante (persuade/read/operate) +
     seleção só das capacidades que importam para aquela página (layout, typeset,
     audit, harden, polish sempre; colorize/adapt/animate/bolder/quieter/clarify/
     critique/distill conforme o que for detectado).
  2. **Auditoria anti-genérico** (craft-floor): AI-purple, card como estrutura /
     card dentro de card, grade de mosaico, números 01/02/03 decorativos, eyebrow
     acima de heading, glow/halo, hard shadow, border-left colorido > 1px, raio
     exagerado / pílula em bloco grande, emoji no lugar de ícone, monospace como
     traje, Impact/Arial Black como voz, ritmo de espaço repetido, hierarquia de
     h1 fraca, métricas sem fonte.
  3. **Correções seguras** (só banimento absoluto): achata o gradiente
     "AI-purple" para cor sólida; o resto vira score `/10` + achados P0–P3.
- O `impeccable-qa.js` (5 dimensões técnicas, score `/20`) segue **depois** do
  DESIGN QUALITY.
- **Preview**: o relatório de QA mostra os dois blocos —
  `Impeccable QA: X/20` e `Design (Impeccable): X/10 · modo · capacidades`.
  Persistido no projeto; reaparece ao reabrir; recalculável pelo botão QA.

### Retestes
`app-selftest` **42/42** (4 novos: perfil/modo, anti-genérico + achatar
gradiente, mock limpo passa, craft-floor nos prompts). Auditoria e2e **53/53**,
Fase 3 **21/21**, Task 4 **36/36** — sem regressão, 0 erro de console.

### Pendências que dependem exclusivamente de API/credencial (NÃO são bug)

- [ ] provider de IA definitivo — geração real de páginas (NVIDIA já tem chave; Gemini/OpenAI/Groq com `api/_lib/providers.js` pronto)
- [ ] `AISA_KEY` — prospecção real (hoje MOCK claramente sinalizado)
- [ ] `BLOB_READ_WRITE_TOKEN` — demo com URL pública persistente (hoje memória em dev / Exportar HTML/ZIP como alternativa)
- [ ] `GMAIL_CLIENT_ID` — envio automático de e-mail (hoje rascunho manual via Gmail Compose / mailto)
- [ ] assinatura eletrônica do contrato
- [ ] domínio próprio para a demo (hoje `<host>/demo/<slug>`)
- [ ] armazenamento em nuvem dos leads/projetos (o adapter `PFStore` já isola isso)

---

## Configuração

`.env` (server-side, via Environment Variables da Vercel):

```
NVIDIA_API_KEY=   # Criador de Páginas
AISA_KEY=         # Prospecção (aisa.one — Maps + Instagram + IA numa chave)
```

Sem `AISA_KEY`, a área de Prospecção abre em **modo de exemplo** (leads
simulados) — todo o fluxo até o builder funciona para demonstração.
