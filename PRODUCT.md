# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Stack

Static site on Vercel: `public/` (vanilla JS SPA, hash routing, zero npm deps) +
serverless functions in `api/*.js` (ESM, `"type": "module"`). No framework
(`framework: null`). Page generation runs server-side; the generated pages are
standalone static HTML files with no runtime dependency on PageForge.

## Users

Freelancers, small agencies and closers who sell websites/landing pages. Two jobs
in one tool:

1. **Prospect** a real local business (niche + city), qualify it, diagnose its
   current site, and turn it into a briefing.
2. **Create** a conversion page (sales page, presell, advertorial, opt-in, SaaS,
   thank-you) from that briefing — or from a briefing typed from scratch — then
   preview, edit, QA, publish a demo, and hand over a proposal / e-mail /
   contract.

They work mostly on desktop while preparing outreach, and check status on mobile
between meetings.

## Product Purpose

Take a product (or a prospected lead) from briefing to a page that is ready to
publish and ready to sell, without the user writing copy, CSS or boilerplate.
Success = the user ships a page a client pays for, and never has to touch the
PageForge app for the page to keep working.

## Positioning

Not a template filler and not a generic "AI website builder". PageForge runs the
**Forge method** as a server-side expert system: it analyses offer, avatar,
mechanism, market sophistication and awareness stage; picks the architecture;
writes all conversion copy in the briefing's native language; derives a visual
identity specific to that product; and ships a page that already passes Google
Ads / Meta Ads policy and a deterministic design + technical QA. The prospecting
side is the same engine the "Máquina de Leads" project uses (Google Maps +
Instagram + AI on one key), ported into the product.

## Operating Context

- Generation pipeline: `BRIEFING → PLAN → RENDER (batched) → DESIGN QUALITY →
  ASSEMBLE → PREVIEW → VISUAL EDITOR → QA (Impeccable) → EXPORT / PUBLISH DEMO`.
- `PLAN` and `RENDER` are the only AI calls; everything downstream is
  deterministic (`api/_lib/theme.js`, `postprocess.js`, `assemble.js`,
  `design-quality.js`, `impeccable-qa.js`).
- Persistence is `localStorage` via the `PFStore` adapter (leads, projects,
  settings, UI state), designed to move to a cloud DB later without touching the
  UI.
- Commercial flow: demo publish (Vercel Blob, with export fallback), proposal,
  e-mail draft (never auto-sent), contract draft, CRM pipeline, follow-ups.

## Capabilities and Constraints

- Zero build-time npm dependencies; the knowledge corpus is compiled to
  `api/_lib/knowledge.generated.js` at deploy.
- Serverless function budget: 60s. Generation is split into short steps to stay
  inside it; the design/QA layers must remain deterministic and fast.
- API keys (`NVIDIA_API_KEY`, `AISA_KEY`, `BLOB_READ_WRITE_TOKEN`, …) live only in
  Vercel env vars. The frontend never receives, requests or stores a secret — it
  only reads status from `GET /api/integrations`.
- Every external-service feature has a MOCK/fallback and shows its state clearly.
- Generated pages: single self-contained HTML, no external images that can 404,
  no mandatory external dependencies, SEO head + JSON-LD (never Review/rating),
  UTM propagation on CTAs, `prefers-reduced-motion` path, AA contrast.

## Brand Commitments

- Name: **PageForge AI** (`PAGE` + `FORGE` + `AI` lockup).
- App palette: emerald `#10B981`, emerald-deep `#047857`, white `#FFFFFF`,
  ink `#0B0F0E`, ink-2 `#111827`. Green is reserved for CTAs and positive state;
  the base is white + graphite.
- App aesthetic: premium SaaS — emerald / white / graphite, professional,
  modern, high standard. Never purple. Never a redesign away from this identity.
- The **generated pages do not inherit the app's identity**: each page gets its
  own product-specific visual world (mode: Persuade), derived from the briefing.

## Evidence on Hand

- Real: the Forge method reference corpus (`SKILL.md`, `references/*.md`,
  `scroll-experience/*.md`), the Impeccable skill (`.agents/skills/impeccable/`),
  commercial templates ported from `maquina-de-leads/modelos/`.
- Not on hand, never to fabricate: customer names, testimonials, metrics,
  prices, fiscal data. The generator refuses to invent proof; the commercial
  builders leave missing fields blank for manual entry.

## Product Principles

1. **The page outlives the tool.** Every export is a standalone artifact.
2. **Never fabricate proof or claims.** Missing evidence → demonstration, logic,
   or omission — never invention.
3. **Own identity, not template.** Each generated page is designed for its
   product; the app never looks AI-generated and neither do its pages.
4. **Deterministic where it matters.** Design and QA are code, not another AI
   round — repeatable, testable, inside the time budget.
5. **Nothing breaks without a key.** Every integration degrades to a clearly
   labelled MOCK/fallback.
