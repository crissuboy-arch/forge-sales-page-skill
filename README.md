# PageForge AI

**Transforme uma ideia em uma página pronta para vender.**

Plataforma web de IA que transforma o briefing de um produto em **sales pages,
presells, advertoriais e páginas de conversão** profissionais — escritas,
desenhadas e validadas, exportáveis como HTML estático que funciona em qualquer
hospedagem.

```
ABRIR PAGEFORGE AI → CRIAR NOVA PÁGINA → BRIEFING → TIPO → ESTILO →
GERAR COM IA → PREVIEW → EDITAR / REGERAR → EXPORTAR
```

A PageForge AI é o **builder**. Cada página gerada recebe a **própria direção de
arte** — não a identidade verde daqui. O builder e as páginas geradas são coisas
separadas: a página exportada é um arquivo independente.

---

## O cérebro

O motor de geração é a **Forge Sales Page Skill** (neste mesmo repositório:
`SKILL.md`, `references/`, `scroll-experience/`, `templates/`, `scripts/`). O
build compila esse conhecimento em `api/_lib/knowledge.generated.js`, e as
funções serverless o usam como sistema especialista:

- análise de oferta, avatar, mecanismo, objeções e estágio de consciência;
- arquitetura de vendas por caso (consciência × tráfego × ticket);
- copywriting de conversão no idioma do briefing;
- direção de arte única por produto + regras anti-“cara de IA”;
- SEO on-page/técnico/social + JSON-LD válido (sem `Review`/`AggregateRating`);
- compliance Google Ads e Meta Ads;
- camada de scroll: STATIC → MOTION → CINEMATIC → SCROLL STORYTELLING;
- QA e exportação (`index.html` + `robots.txt` + `sitemap.xml` +
  `site.webmanifest` + `README-PUBLICAR.md` + zip).

A skill continua utilizável de forma isolada por agentes (Claude Code, Codex) —
ver `SKILL.md`. Os scripts de QA seguem em `scripts/` (`npm run skill:*`).

---

## Arquitetura

```
api/
  generate.js            POST — briefing → página completa (full ou regeneração de seção)
  health.js              GET  — estado do provider de IA (nunca vaza a chave)
  _lib/
    providers.js         AIProvider desacoplado → NVIDIA (1º provider)
    knowledge.js         curador: seleciona as fatias do cérebro por formato/modo
    knowledge.generated.js   compilado de SKILL.md + references/ + scroll-experience/
    prompt.js            monta system + user (identidade PageForge AI + contrato de saída)
    sanitize.js          normaliza/valida o briefing; preserva #aff=
    postprocess.js       extrai HTML, endurece <head>, remove schema falso, QA leve
    mock.js              gerador de exemplo (só com PAGEFORGE_MOCK=1)
    http.js              helpers das funções serverless
public/                  o builder (estático)
  index.html  assets/css  assets/js  robots.txt  sitemap.xml  site.webmanifest
scripts/
  build-knowledge.mjs    compila o cérebro (roda no build da Vercel)
  app-selftest.mjs       testes da camada PageForge AI (Node puro, offline)
  verify.js validate-links.js scroll-qa.js build.js package.js   (QA da skill)
```

**Provider de IA — camada desacoplada.** Hoje só NVIDIA
(`https://integrate.api.nvidia.com/v1`, compatível com OpenAI). Para adicionar
OpenAI / Gemini / Groq no futuro: implementar a interface `chat()` em
`api/_lib/providers.js` e registrar no mapa `PROVIDERS` — sem tocar no resto.

---

## Configuração

```bash
cp .env.example .env          # e preencha:
# NVIDIA_API_KEY=nvapi-...
```

Opcionais (têm default, não vão no `.env.example`):

| Variável | Default | Uso |
|---|---|---|
| `NVIDIA_MODEL` | `meta/llama-3.3-70b-instruct` | trocar o modelo NVIDIA |
| `NVIDIA_BASE_URL` | `https://integrate.api.nvidia.com/v1` | endpoint compatível alternativo |
| `AI_PROVIDER` | `nvidia` | provider ativo |
| `PAGEFORGE_MOCK` | — | `1` = modo exemplo sem IA (só dev) |

**A chave é usada apenas no servidor** (funções `api/`). Nunca vai para o
frontend, o bundle, os logs ou o Git (`.env*` está no `.gitignore`).

Se `NVIDIA_API_KEY` estiver ausente: o builder inteiro funciona; só a geração
retorna uma mensagem clara de configuração.

---

## Rodar local

```bash
npm run build            # compila o cérebro
npm test                 # testes da camada de IA (offline)

# opção A — só o front + mock (sem Vercel CLI):
PAGEFORGE_MOCK=1 npx vercel dev        # se tiver a CLI
# opção B — servir /public e apontar /api para funções da Vercel:
npx vercel dev
```

Deploy: **Vercel** (Framework: Other · Output: `public` · Build:
`node scripts/build-knowledge.mjs`). Configurar `NVIDIA_API_KEY` em
Project → Settings → Environment Variables.

---

## Segurança / compliance embutidos

- Chamadas de IA server-side; segredo só no servidor; input validado e limitado;
  timeout de 56s; mensagens amigáveis; proteção contra chave ausente.
- Guardrails da skill sempre ativos: sem depoimento/estatística/autoridade
  inventada, sem promessa absoluta, disclaimers em nicho sensível, urgência só
  se real, `Review`/`AggregateRating` removidos do JSON-LD automaticamente.
- V1 sem banco de dados: rascunho fica em `localStorage`. Arquitetura pronta
  para adicionar persistência depois sem reconstruir o builder.

## Licença

MIT (`LICENSE`).
