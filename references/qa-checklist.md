# QA Checklist — antes de entregar

Fase 6/11 do fluxo. `[A]` = automatizado por `verify.js`/`validate-links.js`;
`[M]` = verificação manual do agente. **Nenhum item `blocker` pode ficar aberto.**

---

## 1. Estrutural / técnico

- `[A]` `index.html` existe e abre **sem servidor** (paths relativos, sem `/` absoluto).
- `[A]` HTML válido: 1 `<h1>`, hierarquia de headings sem pular nível, `lang` no `<html>`.
- `[A]` `<head>`: `<title>` (≤ 60 car.), meta description (≤ 160), viewport, charset,
  canonical, Open Graph (title, description, image, url, type), Twitter card, `theme-color`, favicon.
- `[A]` Sem erros no console (checagem estática de padrões comuns; `[M]` abrir e olhar o console).
- `[A]` Nenhum link/âncora quebrado; nenhuma imagem/vídeo com `src` inválido.
- `[A]` Nenhum recurso `http://` (só `https://` ou relativo).
- `[M]` Sem lorem ipsum, sem `TODO`, sem texto de template, sem `[placeholder]` esquecido.

## 2. Responsivo

- `[M]` Testar 360, 390, 414, 768, 1024, 1280, 1440px.
- `[M]` Sem scroll horizontal. Sem sobreposição. Imagens não estouram o container.
- `[M]` CTA visível/alcançável acima da dobra em mobile (ou ≤ 1 rolagem curta).
- `[M]` Sticky CTA aparece após o hero e não cobre conteúdo essencial.
- `[A]` `<img>` com `width`/`height` (evita CLS); `srcset`/`sizes` quando faz sentido.
- `[M]` Menu/idioma/login (se houver) usáveis no toque.

## 3. Acessibilidade básica

- `[A]` Todo `<img>` informativo tem `alt`; decorativas com `alt=""`.
- `[A]` Contraste AA nos tokens de texto/CTA (checagem de razão sobre os tokens do `:root`).
- `[A]` Landmarks: `header`, `main`, `footer`; seções com heading.
- `[A]` Inputs com `<label>` associado; `type` correto; `required` onde devido.
- `[M]` Foco visível em todos os interativos; ordem de tab lógica; skip-link opcional.
- `[A]` `prefers-reduced-motion`: bloco CSS presente; JS de motion respeita.
- `[M]` Navegação por teclado no FAQ (accordion), no menu e nos CTAs.
- `[A]` Alvos de toque ≥ 44px (checagem de `min-height`/`padding` nos `.btn`).

## 4. Performance

- `[A]` JS total (sem libs) ≤ ~20KB; com libs (CINEMATIC) ≤ ~45KB gz.
- `[A]` Imagens: nenhuma > 400KB; hero > 250KB sinaliza; formatos modernos sugeridos.
- `[A]` Fonts: ≤ 2 famílias, `font-display: swap`, `preconnect` para o provedor.
- `[A]` `<script>` com `defer`/`async`; nada bloqueante no `<head>` além de CSS crítico.
- `[A]` `loading="lazy"` em imagens abaixo da dobra; hero **sem** lazy.
- `[M]` Lighthouse mobile: Perf ≥ 90 (STATIC ≥ 95), A11y ≥ 95, Best Practices ≥ 95, SEO ≥ 95.
- `[M]` LCP < 2.5s (meta STATIC < 2.0s), CLS < 0.1 (meta < 0.05), INP ok.

## 5. Motion (só CINEMATIC / AI FILM READY)

- `[M]` 60fps no scroll com CPU 4× throttle.
- `[A]` `motion.js` checa `window.gsap` e sai limpo se ausente.
- `[M]` JS desligado → página completa e funcional (fallback estático).
- `[A]` Libs pinadas + SRI (CDN) ou vendorizadas em `assets/vendor/`.
- `[M]` Save-Data / conexão lenta → motion e vídeo desligados.
- `[A]` Animações só em `transform`/`opacity`.

## 6. AI FILM READY (slots de mídia)

- `[A]` `<video>` com `muted playsinline loop preload="none" poster`.
- `[A]` `<img>` de fallback dentro do `<video>` / poster estático presente.
- `[M]` Remover o `.mp4` → página cai para poster/gradiente sem quebra.
- `[A]` Cada slot documentado no `README-PUBLICAR.md` (dimensão, duração, peso, codec, local).

## 7. Checkout / CTAs

- `[A]` `checkoutUrl` https e coerente com `checkoutPlatform`.
- `[A]` Todos os `[data-cta]` → mesma URL final.
- `[A]` Snippet de propagação de query string presente.
- `[M]` Testar clique: parâmetros `utm/src/aff/xcod/sck` chegam na URL de destino.
- `[M]` Microcopy de segurança/garantia sob o botão.
- `[A]` Página de obrigado: `noindex` + `trackConversion()` presente.

## 8. Copy

- `[M]` Promessa principal clara e única no hero.
- `[M]` Uma ação primária; CTAs consistentes; verbo + resultado.
- `[M]` Todos os blocos da arquitetura presentes e na ordem definida.
- `[M]` Objeções do `brief` tratadas (FAQ ou corpo).
- `[M]` Sem jargão vazio; especificidade onde possível; voz do avatar.
- `[M]` Idioma nativo, locale correto (moeda, data, número).

## 9. Compliance (blocker)

- `[A]` Varredura de termos proibidos/arriscados (`compliance-google.md` §6, `compliance-meta.md` §7).
- `[M]` Sem promessa absoluta / garantia de resultado.
- `[M]` Sem depoimento, print, número ou autoridade **não** presente em `brief.proof` com `verified: true`.
- `[M]` Urgência/escassez só se real (sem contador que reinicia).
- `[A]` Nicho sensível → disclaimers contextuais + bloco de isenção no rodapé presentes.
- `[A]` Links legais no rodapé: Privacidade, Termos, Reembolso (quando aplicável).
- `[A]` Identificação do vendedor + contato real.
- `[M]` Advertorial → rótulo de publicidade + disclosure; fontes citadas com URL.
- `[M]` Afiliado → disclosure de comissão visível.
- `[M]` Meta: copy de dor sem 2ª pessoa acusatória (atributos pessoais).
- `[A]` Captura → aviso de privacidade + consentimento + link da política.

## 10. Identidade visual

- `[M]` A página **não** parece um template nem outra página já gerada.
- `[M]` `style.md` preenchido; tokens no `:root`; nenhuma cor hardcoded fora do `:root`.
- `[M]` Tipografia, paleta, forma e movimento coerentes com as palavras-chave de marca.
- `[M]` Identidade do usuário (se fornecida) respeitada; sem mistura com outro produto.

## 11. Empacotamento

- `[A]` `dist/index.html` + `dist/assets/` gerados.
- `[A]` `dist/README-PUBLICAR.md` gerado e completo (hospedagens, domínio, slots, tracking, checklist pré-tráfego, notas de compliance).
- `[A]` `dist/pagina.zip` gerado e abre.
- `[M]` Abrir o zip num diretório limpo e conferir que `index.html` funciona.

---

## Severidades

- **blocker**: seções 1, 7, 9, 11 + "sem scroll horizontal" + "abre sem servidor" + reduced-motion.
- **high**: performance abaixo da meta, a11y com falhas, responsivo com quebra visível.
- **medium**: microcopy, otimização de imagem, refinamento de motion.

Registrar o resultado em `output/<slug>/qa-report.md`.
