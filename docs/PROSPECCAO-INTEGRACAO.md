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

### Pendente (fases seguintes — NÃO fazer agora)

- [ ] envio automático de e-mail (Gmail API) — hoje é rascunho manual
- [ ] assinatura eletrônica do contrato
- [ ] domínio próprio para a demo (hoje `<host>/demo/<slug>`)
- [ ] provider de IA definitivo (NVIDIA + Gemini/OpenAI/Groq — `api/_lib/providers.js` pronto)
- [ ] armazenamento em nuvem dos leads/projetos (o adapter `PFStore` já isola isso)
- [ ] auditoria final completa

---

## Configuração

`.env` (server-side, via Environment Variables da Vercel):

```
NVIDIA_API_KEY=   # Criador de Páginas
AISA_KEY=         # Prospecção (aisa.one — Maps + Instagram + IA numa chave)
```

Sem `AISA_KEY`, a área de Prospecção abre em **modo de exemplo** (leads
simulados) — todo o fluxo até o builder funciona para demonstração.
