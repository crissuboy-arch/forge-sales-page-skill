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

A Fase 1 entrega do início até **CRIAR NOVA VERSÃO → PageForge recebe os dados**.

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

### Pendente (fases seguintes — NÃO fazer agora)

- [ ] editor visual avançado
- [ ] Impeccable (camada de design/refinamento/QA)
- [ ] comparação antes/depois publicável
- [ ] publicação na Vercel da demonstração do lead
- [ ] proposta por Gmail
- [ ] CRM avançado (follow-up, agenda, histórico)
- [ ] provider de IA definitivo (NVIDIA + Gemini/OpenAI/Groq — a camada
      `api/_lib/providers.js` já está preparada)
- [ ] armazenamento em nuvem (o adapter `PFStore` já isola isso)

---

## Configuração

`.env` (server-side, via Environment Variables da Vercel):

```
NVIDIA_API_KEY=   # Criador de Páginas
AISA_KEY=         # Prospecção (aisa.one — Maps + Instagram + IA numa chave)
```

Sem `AISA_KEY`, a área de Prospecção abre em **modo de exemplo** (leads
simulados) — todo o fluxo até o builder funciona para demonstração.
