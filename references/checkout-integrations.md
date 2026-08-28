# Integrações de checkout e rastreamento

Como conectar os CTAs ao checkout certo, preservar parâmetros e deixar o
rastreamento pronto — tudo sem backend.

---

## 1. Padrão comum a todas as plataformas

- Todo botão de compra: `<a class="btn-cta" data-cta="primary" href="<checkoutUrl>">`.
- `main.js` propaga a query string atual para todos os `[data-cta]`
  (utm, src, aff, xcod, sck, gclid, fbclid...):
  ```js
  const carry = new URLSearchParams(location.search);
  document.querySelectorAll('a[data-cta]').forEach(a => {
    try {
      const u = new URL(a.getAttribute('href'), location.href);
      carry.forEach((v,k) => { if(!u.searchParams.has(k)) u.searchParams.set(k,v); });
      a.setAttribute('href', u.toString());
    } catch {}
  });
  ```
- `trackCTA(name)` chamado no `click` de cada CTA (ver §7). Nunca bloquear a navegação.
- Abrir na **mesma aba** (mobile). `rel="noopener"` se `target="_blank"` for
  usado no desktop.
- Microcopy sob o botão: "Pagamento seguro via [plataforma] · Garantia de X dias".

---

## 2. Kiwify

- URL típica: `https://pay.kiwify.com.br/<código>` ou domínio próprio de checkout.
- Parâmetros aceitos: `?src=` (origem), `&utm_*`. Kiwify repassa `src` para os
  relatórios e webhooks.
- Order bump / upsell: configurados no painel Kiwify (não na página). A página só
  linka o checkout; o bump aparece no próprio checkout.
- Após a compra, Kiwify redireciona para a URL de obrigado definida no produto —
  a "página de obrigado" gerada pela skill pode ser essa URL.
- Rastreamento: Kiwify tem campo para Pixel da Meta e GA no painel; a página
  ainda assim dispara seus próprios eventos de `InitiateCheckout` no clique.

---

## 3. Hotmart

- URL típica: `https://pay.hotmart.com/<código>` ou `https://<produtor>.hotmart.com`.
- Parâmetros de afiliado/rastreio: `?src=`, `&sck=`, `&xcod=`. **Sempre preservar.**
  - `src` — origem livre. `sck` — código de rastreio secundário. `xcod` — código do afiliado (não alterar).
- Checkout transparente (HotPay) vs pop-up: a página só aponta o link; o formato é do produtor.
- Order bump/upsell (Hotmart "Order Bump" / funil): no painel do produtor.
- Obrigado: Hotmart permite URL de "página de agradecimento"; usar a página da skill.
- Pixel: painel Hotmart tem integração; página dispara evento próprio no clique.

---

## 4. Digistore24

- URL típica: `https://www.digistore24.com/redir/<id>/<afiliado>/` ou
  `https://<vendor>.digistore24.com/product/<id>`.
- Parâmetros: `?aff=<id-afiliado>`, `&campaignkey=`, `&aid=`. Preservar `aff` e `campaignkey`.
- Suporta `campaignkey` para relatório por campanha — mapear `utm_campaign` → `campaignkey` se o usuário quiser:
  ```js
  const ck = carry.get('utm_campaign'); if (ck) u.searchParams.set('campaignkey', ck);
  ```
- Order bump / upsell / downsell: configurados no funil Digistore24.
- Thank-you page: Digistore24 envia `{orderid}` e outros na URL de obrigado (thankyou-URL) — a página de obrigado pode ler via `URLSearchParams` para exibir o número do pedido.

---

## 5. Stripe (Payment Link / Checkout)

- **Sem backend** → usar **Payment Links** (`https://buy.stripe.com/<id>`).
- Pré-preencher e-mail: `?prefilled_email=`. Passar referência: `?client_reference_id=<valor>`
  (bom para casar com analytics). UTM não é repassado nativamente — usar
  `client_reference_id` para carregar a origem.
- `success_url` / `cancel_url`: configurados ao criar o Payment Link (aponte
  `success_url` para a página de obrigado da skill).
- Assinatura: criar o Payment Link como recorrente; a página deve deixar a
  recorrência explícita (política de compliance).
- Sem Payment Link (precisa de Checkout Session dinâmica) → aí exige um endpoint;
  documentar no README que isso foge do escopo "sem backend" e sugerir Payment Link.

---

## 6. URL genérica

- Qualquer `href` https válido. `validate-links.js` confere só formato e esquema.
- Preservar query string mesmo assim (útil para GHL, Cartpanda, Ticto, Monetizze,
  Eduzz, PerfectPay, etc.).
- Monetizze/Eduzz/Ticto: costumam usar `?a=` ou `/<código-afiliado>` — se o
  usuário informar, tratar como o `aff` do Digistore24.

---

## 7. Rastreamento (pronto, desligado por padrão)

`main.js` expõe hooks vazios; o usuário pluga o ID no `README-PUBLICAR.md`:

```js
function trackCTA(name, el){
  // GA4:   gtag && gtag('event','select_cta',{cta:name});
  // Meta:  fbq && fbq('track','InitiateCheckout',{content_name:name});
  // GTM:   dataLayer && dataLayer.push({event:'cta_click', cta:name});
}
function trackView(section){ /* opcional: view de seção via IntersectionObserver */ }
function trackConversion(){ /* usar só na página de obrigado */ }
```

- Snippets de GA4 / Meta Pixel / GTM ficam **comentados** no `<head>` com um
  marcador `<!-- FORGE:ANALYTICS -->` e instruções.
- Nada de terceiros carrega sem o usuário colar o ID → performance e privacidade
  preservadas por padrão.
- Consent Mode / aviso de cookies: incluir banner simples (sem lib) quando houver
  qualquer script de terceiros e/ou nicho/território que exija (LGPD/GDPR).

---

## 8. Página de obrigado + eventos

- `<meta name="robots" content="noindex">`.
- Ler parâmetros do pedido da plataforma (`orderid`, `client_reference_id`, `transaction`)
  e exibir "Pedido #..." quando disponível.
- Disparar `trackConversion()` (e `Purchase` do Pixel, `purchase` do GA4) 1 vez,
  com deduplicação simples via `sessionStorage`.
- Instruções de acesso ao produto + suporte + próximos passos.

---

## 9. Checklist de checkout (entra no QA)

- [ ] `checkoutUrl` é https e bate com `checkoutPlatform`.
- [ ] Todos os `[data-cta]` apontam para a mesma URL final.
- [ ] Query string (utm/src/aff/xcod/sck/gclid/fbclid) preservada no clique.
- [ ] Recorrência/preço explícitos antes do clique (se aplicável).
- [ ] `success_url`/página de obrigado configurada e documentada.
- [ ] Hooks de tracking presentes e sem quebrar navegação.
- [ ] Nenhum script de terceiro carregando sem ID configurado.
