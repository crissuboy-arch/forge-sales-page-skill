---
name: PageForge AI
description: The builder app — premium SaaS, emerald on white and graphite.
colors:
  emerald: "#10b981"
  emerald-deep: "#047857"
  emerald-ink: "#043c2c"
  ink: "#0b0f0e"
  ink-2: "#111827"
  bg: "#f6f7f7"
  surface: "#ffffff"
  line: "#e3e6e5"
  line-2: "#eef0ef"
  text: "#101614"
  text-soft: "#59635e"
  text-faint: "#6b736e"
  danger: "#b42318"
  warn: "#a1610a"
typography:
  display:
    fontFamily: "Inter, ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, sans-serif"
    fontSize: "clamp(1.7rem, 1.3rem + 1.8vw, 2.4rem)"
    fontWeight: 700
    lineHeight: 1.15
    letterSpacing: "-0.02em"
  body:
    fontFamily: "Inter, ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, sans-serif"
    fontSize: "16px"
    fontWeight: 400
    lineHeight: 1.6
    letterSpacing: "normal"
  label:
    fontFamily: "{typography.body.fontFamily}"
    fontSize: "0.82rem"
    fontWeight: 700
    letterSpacing: "0.07em"
rounded:
  sm: "9px"
  md: "12px"
  pill: "999px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "16px"
  lg: "24px"
components:
  button-primary:
    backgroundColor: "{colors.emerald}"
    textColor: "#04241a"
    rounded: "{rounded.pill}"
    padding: "0 1.25rem"
    height: "46px"
  button-primary-hover:
    backgroundColor: "{colors.emerald-deep}"
    textColor: "{colors.surface}"
  button-ghost:
    backgroundColor: "transparent"
    textColor: "{colors.text}"
    rounded: "{rounded.pill}"
  panel:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.text}"
    rounded: "{rounded.md}"
    padding: "clamp(1.2rem, 3vw, 2rem)"
  chip:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.text}"
    rounded: "{rounded.pill}"
    padding: "0.35rem 0.8rem"
---

# PageForge AI — design system

## Overview

This file describes the **builder app** (dashboard, prospecting, lead detail,
projects, config, wizard, preview). Visitor mode: **Operate** — the user is doing
a job; scanability, stable density and predictable structure outrank expression.
Brand lives in precise details (emerald reserved for action and positive state,
tinted graphite text, one shadow token, pill controls).

The **pages PageForge generates** are a different world entirely: mode
**Persuade**, one product-specific visual identity per page, built server-side
from `api/_lib/theme.js` tokens + `api/_lib/design-quality.js` craft rules. Do not
apply this file to generated output.

North star: *the workshop bench* — a clean, well-lit surface where every tool has
its place. Nothing decorative; everything legible at a glance.

## Colors

- **Emerald** (`#10b981` / deep `#047857`) is the only saturated color. It marks
  the primary action, an active nav item, "done" pipeline stages and positive
  KPIs. It is never a background wash, never a gradient, never decoration.
- **Ground** is `#f6f7f7`; **surface** (cards, panels, inputs) is white with a
  `#e3e6e5` hairline.
- **Text** ramps `#101614` → `#59635e` (soft) → `#6b736e` (faint, meta only, AA
  on ground). Secondary text on the emerald button is `#04241a`, not gray.
- **Status**: `danger #b42318`, `warn #a1610a`, each with a pale tint background
  for badges. Status is never color-only — it always carries a word.
- Dark surfaces (`--ink`, footer, editor bar) invert to white text at ~85%.

## Typography

One family: **Inter** (system-sans fallback stack, must hold without the webfont).
Roles: display (headings, weight 700, tracking `-0.02em`), body (16px / 1.6),
label (0.82rem, 700, tracking `+0.07em`, uppercase — used for KPI labels, section
eyebrows in Operate context, and card headers). Headings use `clamp()` for fluid
scale. Body measure is bounded by the panel width, not full-bleed.

## Layout

- Container max `1160px`, side padding `24px` (`18px` under 560px).
- Page rhythm: `1rem`–`1.2rem` between sibling cards, `2rem`–`3rem` between major
  regions. More space above a heading than below it.
- Grids are `repeat(auto-fit/auto-fill, minmax(...))` — they collapse to one
  column on mobile. KPI strip: 9 → 3 → 2 columns at 1100 / 600px.
- Sticky: top bar (62px), preview toolbar (72px), lead section-nav (68px).
- Breakpoints: 1100, 960, 900 (nav → dropdown), 720, 560. No horizontal overflow
  at any width; wide content scrolls inside its own container.

## Elevation & Depth

Flat by default. One shadow token: `--shadow-1` (`0 1px 2px` + `0 8px 24px`, both
very low alpha) for cards and the top bar; `--shadow-2` for modals/popovers.
Elevation is declared **once** — a hairline border *or* a shadow, and the card
pattern uses both deliberately (1px line + soft shadow) as its single elevation
statement, not repeated per nested element. No glows, no colored halos, no
`0 0` shadows.

## Shapes

Radius scale: `9px` (inputs, small blocks), `12px` (cards, panels, modals),
`999px` (pills — buttons, chips, filters, badges, toggles). Pills are for
controls only; content blocks stay at 12px. Borders are `1px`; a thicker or
colored left border is not part of the system.

## Components

- **button-primary**: emerald, `#04241a` text, pill, 46px min height; hover →
  emerald-deep + white, `translateY(-1px)`.
- **button-ghost**: transparent, `#e3e6e5` border, ink text; hover → ink border.
- **chip**: pill, white, hairline; `chip--on` = pale emerald; `chip--danger` =
  pale danger. Used for filters, tags, small toggles.
- **panel / .panel**: white, hairline, 12px, `--shadow-1`, fluid padding.
- **kpi**: number (1.9rem, 800) over label (0.82rem, uppercase); links to its
  list.
- **intg-card / notice**: left border 4px in the status color — the one place a
  colored left border is allowed, as a status rail, ≤4px.
- **modal**: backdrop blur + `--shadow-2`; focus moves in, Tab is trapped, Escape
  closes, focus returns.
- **stage-badge / pipeline pipe**: pill; `on` = ink fill, `done` = pale emerald.

## Do's and Don'ts

**Do**

- Reserve emerald for action and positive state; let graphite + white carry the
  rest.
- Tint secondary text from the ink ramp; keep it AA on its surface.
- Use one shadow token and one spacing rhythm across the app.
- Give every status a word, not just a color.
- Keep pills for controls, 12px for content, 1px borders.

**Don't**

- Don't turn the app purple, add gradients, or wash a region in emerald.
- Don't nest cards, or use a same-size card grid as the primary page structure.
- Don't add glows, `0 0` shadows, or a colored border thicker than the 4px status
  rail.
- Don't put an eyebrow/kicker above a page `<h1>` (the KPI/card label role is a
  different, allowed use inside Operate chrome).
- Don't animate decoratively; motion is for feedback, state and the reveal only,
  and always has a `prefers-reduced-motion` path.
- Don't apply this system to generated pages.
