# SEO — on-page, técnico e social (por página)

Roda na **Fase 6 (build)** e é validada na **Fase 6 (QA)**. Toda página que a
skill gera sai indexável, compartilhável e com dados estruturados coerentes com o
**conteúdo real**.

> **Regra de ouro:** cada página recebe SEO **próprio** — title, description,
> Open Graph, imagem social e schema diferentes por intenção, conteúdo e
> objetivo. **Nunca** repita o mesmo `title`/`description`/`@graph` entre páginas
> diferentes do mesmo projeto (vendas ≠ presell ≠ advertorial ≠ obrigado).

---

## 1. SEO on-page (no `<head>` e no corpo)

| Item | Regra |
|---|---|
| `<title>` | único, 50–60 caracteres, com o benefício + a marca. Não "Home". Advertorial: título editorial, não de oferta. |
| `<meta name="description">` | 120–160 car., ativa, com a promessa e um verbo. Uma por página. |
| `<link rel="canonical">` | absoluto, com o domínio real. **Configurável** — ver §5. |
| `<meta name="robots">` | vendas/presell/advertorial: `index, follow, max-image-preview:large`. Obrigado / captura pós‑conversão / páginas "modelo": `noindex, follow`. |
| `<html lang>` | o idioma real do conteúdo (`pt-BR`, `en`, `es`…). |
| `<meta name="viewport">` | `width=device-width, initial-scale=1`. |
| H1/H2/H3 | 1 `<h1>` (a promessa). H2 por seção, H3 aninhado. Sem pular nível. |
| `alt` das imagens | descritivo e específico ("Dashboard do X com pedidos do dia e faturamento"), não "imagem" nem o nome do arquivo. Decorativas: `alt=""`. |
| nomes de arquivo | `dashboard.png`, `og.png` — kebab-case, semântico. Não `IMG_2831.png`. |
| links internos | âncoras para as seções (`#planos`, `#faq`); rótulos com texto real, não "clique aqui". |
| CTAs | `<a>` para navegação/checkout, `<button>` para ação na página. `data-cta` para tracking. Texto = verbo + resultado. |
| URLs / âncoras | limpas, minúsculas, sem `?` de estado, sem `#` vazio. `cleanUrls` no host. |

## 2. SEO técnico (arquivos na raiz do site)

| Arquivo | Conteúdo |
|---|---|
| `robots.txt` | `User-agent: *` + `Allow: /` + `Sitemap:` absoluto. `Disallow` para pastas internas se existirem no deploy. |
| `sitemap.xml` | só as URLs **indexáveis** (não listar `noindex`). `<loc>` absoluto no formato do host (clean URLs). |
| `site.webmanifest` | `name`, `short_name`, `description`, `lang`, `start_url:"/"`, `theme_color`, `background_color`, `icons` (svg + 1 png ≥ 180). `display:"browser"` para landing (não "standalone" — não é app). |
| favicon | `favicon.svg` (`<link rel="icon" type="image/svg+xml">`) + `apple-touch-icon.png` 180×180. |

## 3. Social preview (Open Graph + Twitter/X)

`og:type` (`website` / `article` para advertorial) · `og:site_name` · `og:locale`
· `og:title` · `og:description` (podem diferir do `<title>`/description — mais
"social") · `og:url` (absoluto) · `og:image` + `og:image:width/height/type/alt`.

Twitter: `twitter:card=summary_large_image` · `twitter:title` ·
`twitter:description` · `twitter:image` · `twitter:image:alt`.

**Imagem social:** **1200×630 PNG ou JPG** (SVG **não** é lido pelos scrapers).
Montar a partir dos **assets reais** do produto (marca + 1 screenshot + headline),
não um placeholder. Compor num HTML de 1200×630 e exportar (o mesmo pipeline de
render da skill serve). Peso ≤ 300KB. Salvar em `assets/img/og.png`.

## 4. Dados estruturados (Schema.org / JSON-LD)

Um `<script type="application/ld+json">` com `@graph`. **Só schemas justificáveis
pelo conteúdo real da página.**

| Schema | Quando | Cuidado |
|---|---|---|
| `Organization` | sempre | `name`, `url`, `logo`. Sem endereço/telefone se forem placeholder. |
| `WebSite` | sempre | `url`, `name`, `inLanguage`, `publisher` → `@id` da Organization. |
| `WebPage` / `Article` | advertorial | `Article` só com `author`, `datePublished` reais. |
| `SoftwareApplication` / `Product` | SaaS / produto | `applicationCategory`, `offers` (um `Offer` por plano, `price` numérico, `priceCurrency`). |
| `Service` | serviço | `serviceType`, `areaServed`, `provider`. |
| `FAQPage` | **só se a página tem uma seção de FAQ real** | copiar as perguntas/respostas **verbatim** do corpo. Não inventar perguntas. |
| `BreadcrumbList` | se houver navegação hierárquica real | — |

**PROIBIDO** (compliance — ver `compliance-*.md`):
`AggregateRating`, `Review`, `ratingValue`, `reviewCount`, contagem de clientes,
"resultados", ou qualquer número que não esteja em `brief.proof` com
`verified: true`. Sem estrelas falsas.

- `@id` e todas as `url` usam o domínio (configurável — §5).
- `price` no schema = preço exibido na página (mesma fonte que a copy).
- Validar: `JSON.parse` tem que passar; testar depois no Rich Results Test.

## 5. Domínio configurável (canonical / OG / schema)

O domínio aparece em ~10 lugares (canonical, `og:url`, `og:image`,
`twitter:image`, `@id`/`url` do JSON-LD, `robots.txt`, `sitemap.xml`). Centralize:

- Uma chave **`SITE_URL`** no arquivo de config do projeto (o mesmo lugar de
  `CHECKOUT_URL`).
- Um `assets/js/seo.js` pequeno (defer, depois do config): se `SITE_URL` estiver
  preenchido e for `https://…`, reescreve `canonical`/`og:url`/`og:image`/
  `twitter:image` e faz `replace` do domínio-placeholder dentro do JSON-LD
  (validando com `JSON.parse` antes de aplicar). Se vazio, não faz nada.
- No HTML os valores ficam com um **placeholder** (`https://seudominio.com.br`)
  para o arquivo ser válido e para crawlers sem JS.
- `robots.txt` e `sitemap.xml` ficam com o placeholder + comentário "troque antes
  de publicar" (não dá para reescrever arquivo estático em runtime).
- `README-PUBLICAR.md` (gerado) lista os 3 lugares a trocar à mão:
  `config.js → SITE_URL`, `robots.txt`, `sitemap.xml`.

## 6. Analytics / tracking (pronto, sem IDs)

Nunca commitar IDs reais (GA4 `G-…`, GTM `GTM-…`, Pixel numérico). Deixar:

- Um comentário‑slot no `<head>` (`<!-- ANALYTICS: cole GA4 / GTM / Pixel aqui -->`).
- `data-cta` em todos os botões + `function trackCTA(name, el){}` com as linhas
  de GA4 / Meta / dataLayer **comentadas**.
- Página de obrigado: `trackConversion()` idem, e a página em `noindex`.
- Propagação de query string (`utm_*`, `src`, `aff`, `xcod`, `sck`) para a URL de
  checkout — já coberto em `checkout-integrations.md`.
- Documentar em `README-PUBLICAR.md`: onde colar cada snippet, e o aviso de
  cookies/consentimento (LGPD) se adicionar rastreamento.

## 7. SEO por formato (o que muda)

| Formato | title | robots | schema principal | og:type |
|---|---|---|---|---|
| Página de vendas | benefício + marca | index | `Product`/`SoftwareApplication` + `Offer` | website |
| Presell | curiosidade/ângulo, sem preço | index | `WebPage` (+ `FAQPage` se houver) | website |
| Advertorial | manchete editorial | index | `Article` (author + datePublished reais) | article |
| Página de captura | promessa da isca | index (ou noindex se for pós‑clique) | `WebPage` | website |
| SaaS / app | produto + categoria | index | `SoftwareApplication` + `Offer` por plano | website |
| Obrigado / upsell | "Confirmado" / entrega | **noindex, follow** | — | website |

## 8. QA de SEO (Fase 6)

- `[A]` `node scripts/verify.js <dist>` — seção "SEO técnico": `<meta robots>`,
  JSON-LD válido, sem `review`/`rating`, `robots.txt` + `sitemap.xml` +
  `site.webmanifest` presentes.
- `[A]` `node scripts/validate-links.js <dist>` — canonical/og:url/sitemap
  coerentes; imagens do OG existem.
- `[M]` `title`/`description` únicos vs. outras páginas do projeto.
- `[M]` OG image 1200×630 real, < 300KB, testada no Facebook Sharing Debugger /
  Twitter Card Validator (pós‑deploy).
- `[M]` JSON-LD testado no Google Rich Results Test (pós‑deploy).
- `[M]` `SITE_URL` documentado como pendência de publicação se ainda placeholder.

## 9. Saída da fase

`<head>` completo · `robots.txt` · `sitemap.xml` · `site.webmanifest` ·
`assets/img/og.png` · `assets/img/apple-touch-icon.png` · `assets/js/seo.js` ·
`SITE_URL` no config · JSON-LD no `<head>` · seção de SEO no `README-PUBLICAR.md`.
