# PageForge ↔ Athena Control — integração somente-leitura

Segue o padrão validado nas integrações VitrinePro, Pink Logic, ScalaFlow e ExpertPRO.

## Endpoints

| Método | Rota | Auth |
|---|---|---|
| GET | `/api/integrations/health` | pública |
| GET | `/api/integrations/stats` | `Authorization: Bearer <PAGEFORGE_ATHENA_API_KEY>` |

Sem chave → **401**. Chave errada → **401**. Sem `PAGEFORGE_ATHENA_API_KEY`
no servidor → **503** (não é falha de auth).

## Indicadores reais (somente leitura, zero PII)

Fontes: as únicas persistências do projeto (Vercel Blob).

- `jobs.total` — jobs no ledger do Executor Bridge (`cris-os-jobs/`)
- `jobs.by_status` — `RECEIVED` / `NEEDS_INPUT` / `RUNNING` / `FAILED` / `COMPLETED`
- `jobs.failed_total` + `jobs.error_codes` — falhas e códigos operacionais
- `pages.types` — tipos por `asset_type` (ex.: `LANDING_PAGE`)
- `exports.published_total` — demos publicadas (prefixo `demos/`)
- `store_status` — `{ok, error_code, failed_tables}`; códigos seguros
  (`missing_env`, `timeout`, `dns_error`, `connection_error`, `auth_failed`, `unknown`)
- `generations_ui` / `projects` — sempre `null`, em `unavailable`
  (a interface `/api/generate` não persiste ledger; não existe entidade de projeto)
- `subscriptions` / `ai_usage` — sempre `null`, em `unavailable`

Sem `BLOB_READ_WRITE_TOKEN` no servidor: tudo `null` com
`store_status.error_code="missing_env"` — o `null` não é dado válido.
Nenhum Supabase foi adicionado; nenhum número é inventado.

## Chave exclusiva

```
PAGEFORGE_ATHENA_API_KEY=<64 hex do arquivo seguro>
```

- Arquivo: `PAGEFORGE_ATHENA_API_KEY.txt` (fora do Git, permissão 600).
- Vercel → Settings → Environment Variables → adicionar → **Redeploy**.
- Nunca no chat, no código ou nos logs. Comparação timing-safe
  (SHA-256 + `timingSafeEqual`, espelho de `api/_lib/cris-os-auth.js`).

## Cadastro no Athena Connect

- **Plataforma:** `PageForge`
- **Tipo:** `API`
- **URL:** `https://pageforge-ai-woad.vercel.app/api/integrations/stats`
- Guardar a chave no cofre da Athena e clicar **Verificar**.

## Testes

```bash
node scripts/test-athena-integration.mjs   # 36 testes, sem rede, sem credenciais
```

## Ficheiros

- `api/_lib/athena-auth.js` — Bearer timing-safe (fail-closed).
- `api/_lib/athena-stats.js` — agregados do Blob, isolamento por fonte,
  `null`s honestos quando o store não está configurado.
- `api/integrations/health.js` — pública.
- `api/integrations/stats.js` — protegida (`maxDuration: 30`).

Nada do motor de geração, do visual ou das integrações existentes foi alterado.

## Etapa 3 — futura automação (documentação, NÃO implementado)

O motor de geração já é acionável com segurança por um orquestrador
externo — o **Executor Bridge do CRIS OS** prova isso:

- `POST /api/integrations/cris-os/work-orders` recebe um `ProductionWorkOrder`,
  autentica via `Authorization: Bearer <CRIS_OS_BRIDGE_TOKEN>` (timing-safe),
  é idempotente por `work_order_id`, persiste o job no ledger
  (`api/_lib/jobs-store.js`, Vercel Blob) e chama **o mesmo motor da
  interface**: `generatePageForBrief(brief)` em `api/_lib/pageforge-engine.js`
  (plan → render → assemble → postprocess → design-quality → impeccable-qa).
- O artefato é publicado como demo (`api/_lib/blob.js`, `putDemo`) com
  backup durável antes da publicação.

Para a Athena solicitar criações no futuro ("cria uma sales page em inglês
para este produto"), o caminho seguro é um novo endpoint espelhando esse
bridge — ex. `POST /api/integrations/athena/generate` — com:

1. `Authorization: Bearer <PAGEFORGE_ATHENA_API_KEY>` (a mesma chave exclusiva);
2. Idempotência por ID de pedido (nunca gerar duas vezes o mesmo pedido);
3. Reutilização de `generatePageForBrief` — **nenhum segundo motor**;
4. Job ledger no mesmo store (acompanhamento de status/erro);
5. **Sem publicação automática**: o artefato volta como rascunho/demo
   e só é publicado com autorização explícita.

Nada disso está habilitado nesta etapa — é apenas o contrato documentado.
