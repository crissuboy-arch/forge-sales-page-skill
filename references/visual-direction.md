# Direção visual — identidade única por produto

Fase 4 do fluxo. Cria a cara da página **do zero para este produto**. Salvar em
`output/<slug>/style.md` + os tokens no CSS.

> Regra absoluta: nenhum produto reutiliza a identidade de outro. Se a skill já
> gerou 3 páginas, a quarta não pode parecer nenhuma delas. Templates NÃO têm
> identidade visual — só estrutura.

---

## 1. Style ticket (preencher antes de qualquer CSS)

```md
# Style ticket — <produto>

## Palavras-chave de marca (3–5)
ex.: "clínico, silencioso, preciso"  |  "quente, artesanal, humano"  |  "noturno, elétrico, urgente"

## Personalidade
- Arquétipo: (Sábio / Herói / Cuidador / Fora-da-lei / Mago / Criador / ...)
- Voz visual: (sóbria / calorosa / técnica / editorial / ousada)
- Referências que EVITAR (anti-briefing): ...

## Cor
- Marca:        #......   (uso: acentos, títulos, detalhes)
- CTA:          #......   (contraste AA≥4.5 sobre o fundo do botão; NÃO igual a links comuns)
- Fundo:        #......   (claro) / #...... (dark, se houver)
- Superfície:   #......   (cards)
- Texto:        #...... / #...... (secundário)
- Sucesso / Erro / Aviso: #...... / #...... / #......
- Todos os pares testados para AA (texto normal 4.5:1, grande 3:1).

## Tipografia
- Display: <fonte> — pesos: ...
- Texto:   <fonte> — pesos: 400/500/700
- Fonte de sistema como fallback stack completo.
- Escala (rem): 0.875 / 1 / 1.125 / 1.375 / 1.75 / 2.25 / 3 / 4 (ajustar)
- Medida de leitura: 60–72ch. Altura de linha texto: 1.6–1.75.

## Forma e espaço
- Raio: 0 / 4 / 8 / 16 / full — escolher 1–2.
- Sombra: nível 0–3 (sutil; evitar "drop shadow" genérico de template).
- Grid base: 4px. Espaçamentos: 4/8/12/16/24/32/48/64/96/128.
- Largura máx. do container: 1120–1280px; coluna de texto ~680px.

## Imagem
- Estilo: (fotográfico realista / 3D / ilustração / editorial b&w / minimal / colagem)
- Tratamento: (grão, duotone, alto contraste, luz natural, isolado em fundo, ...)
- Fonte dos assets: fornecidos pelo usuário / placeholders neutros (documentar).

## Movimento (assinatura)
- ex.: "fade + rise 12px, 400ms, ease-out; sem parallax" 
- ou "cortes de scroll com pin; parallax lento 8%; contadores"
- Sempre: respeitar prefers-reduced-motion.

## Layout signature
- 1 decisão que torna a página reconhecível: ex. régua tipográfica gigante,
  numeração de seções, borda viva, faixa diagonal, moldura editorial, etc.
```

---

## 2. Como derivar a identidade do brief

| Sinal no brief | Direção |
|---|---|
| Nicho finanças/jurídico/B2B | menos cor, mais tipografia, grid rígido, provas em destaque |
| Beleza/lifestyle | espaço generoso, foto sensorial, serif de alto contraste, paleta suave |
| Fitness/energia/urgência | contraste alto, sans condensada, CTA vibrante, ritmo rápido |
| Espiritual/bem-estar | paleta terrosa/neutra, muito respiro, movimento lento, serif humanista |
| Tech/SaaS | dark opcional, mono para detalhes, screenshots, gradientes discretos |
| Relacionamento | tom quente, foto humana, tipografia próxima, sem frieza corporativa |
| Editorial/advertorial | parece publicação: coluna estreita, byline, dateline, sem "cara de landing" |
| `styleNotes` com referências | honrar direção pedida; ainda assim diferenciar de concorrentes |
| `brand` preenchido | usar paleta/fonte/logo do usuário; criar o resto em volta |

---

## 3. Tokens CSS (implementação)

Toda a identidade vive em custom properties no `:root` para ser trocável por produto:

```css
:root {
  /* cor */
  --c-brand: #____;
  --c-cta: #____;
  --c-cta-ink: #____;
  --c-bg: #____;
  --c-surface: #____;
  --c-ink: #____;
  --c-ink-soft: #____;
  --c-line: #____;
  --c-ok: #____; --c-err: #____; --c-warn: #____;

  /* tipografia */
  --font-display: "____", Georgia, serif;
  --font-text: "____", system-ui, -apple-system, Segoe UI, Roboto, sans-serif;
  --step--1: clamp(.85rem, .8rem + .2vw, .95rem);
  --step-0:  clamp(1rem, .95rem + .25vw, 1.125rem);
  --step-1:  clamp(1.2rem, 1rem + .6vw, 1.4rem);
  --step-2:  clamp(1.5rem, 1.2rem + 1vw, 2rem);
  --step-3:  clamp(2rem, 1.5rem + 2vw, 3rem);
  --step-4:  clamp(2.6rem, 1.8rem + 3.5vw, 4.25rem);

  /* forma/espaço */
  --radius: 12px;
  --shadow-1: 0 1px 2px rgba(0,0,0,.06), 0 4px 16px rgba(0,0,0,.06);
  --space: 8px;
  --container: 1180px;
  --measure: 42rem;
  --ease: cubic-bezier(.2,.7,.2,1);
}

@media (prefers-color-scheme: dark) { :root[data-theme="auto"] { /* overrides */ } }
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after { animation-duration: .001ms !important; transition-duration: .001ms !important; scroll-behavior: auto !important; }
}
```

Regras:
- Nunca cores hardcoded fora do `:root` (exceto `transparent`/`currentColor`).
- Componentes usam os tokens; trocar produto = trocar o bloco `:root`.
- Dark mode é opcional; se entregar, testar contraste nos dois.

---

## 4. Os 3 modos visuais — o que muda

### PREMIUM STATIC
- Stack: HTML + 1 CSS + 1 JS (`main.js`, vanilla, < 8KB).
- Animações: só CSS + `IntersectionObserver` para reveal (add classe `.in`).
- Fonts: no máx. 2 famílias, `font-display: swap`, subset se possível, `preconnect`.
- Imagens: responsivas (`srcset`/`sizes`), `loading="lazy"`, `decoding="async"`, `width`/`height`.
- Meta de performance: LCP < 2.0s em 4G, CLS < 0.05, JS total < 20KB, sem libs externas.

### CINEMATIC CODE
- Base = PREMIUM STATIC + `motion.js` (defer) com GSAP + ScrollTrigger + Lenis.
- Ver `cinematic-motion.md` para padrões, orçamento e fallback.
- Regra: a página **conta a mesma história e converte igual com JS desligado**.
- Libs vendorizadas em `assets/vendor/` OU CDN com `defer` + SRI + versão pinada.
- Nunca animar propriedades que causam layout (use `transform`/`opacity`).

### AI FILM READY
- Base = CINEMATIC CODE (ou STATIC) + **slots de mídia**:
  - `assets/media/hero.mp4` (+ `hero.webm`), `assets/media/hero-poster.jpg`.
  - `<video autoplay muted playsinline loop preload="none" poster="...">` com
    `<img>` de fallback dentro e `data-media-slot` marcando o elemento.
  - Se o arquivo não existir → CSS mostra o poster/gradiente; nada quebra.
- `README-PUBLICAR.md` lista cada slot: dimensão, aspect ratio, duração alvo,
  peso máx. (hero ≤ 3MB, b-roll ≤ 1.5MB), codec (H.264 + VP9/AV1), fps, onde
  colocar o arquivo, e que a página funciona sem eles.
- Desliga vídeo sob `prefers-reduced-motion`, Save-Data, ou `connection.effectiveType` 2g/3g.
- Nenhuma API de geração é chamada. A skill só prepara o terreno.

---

## 5. Acessibilidade visual (sempre)

- Contraste AA em todo texto e em ícones informativos.
- Foco visível custom (`:focus-visible`) — nunca `outline: none` sem substituto.
- Não comunicar só por cor (adicionar rótulo/ícone).
- Tamanho de toque ≥ 44×44px. Espaçamento entre alvos.
- Tipografia mínima 16px no corpo em mobile. Zoom até 200% sem quebra.
- Respeitar `prefers-reduced-motion` e `prefers-contrast`.

---

## 6. Saída da fase

`output/<slug>/style.md` completo (seção 1 preenchida) + bloco `:root` pronto
para o CSS + lista de fonts a carregar + lista de assets/slots necessários.
