// Gera dist/README-PUBLICAR.md a partir do brief.json.
import fs from 'node:fs';
import path from 'node:path';
import { walk, fmtBytes } from './util.js';

export function writeReadme(distDir, brief, { finalize = false } = {}) {
  const name = brief?.name || 'sua página';
  const platform = brief?.checkoutPlatform || 'generic';
  const checkoutUrl = brief?.checkoutUrl || '(defina a URL do checkout)';
  const domain = brief?.domain || '(seu domínio)';
  const lang = brief?.language || 'pt-BR';
  const visual = brief?.visualMode || 'auto';
  const format = brief?.pageFormat || 'auto';

  const mediaSlots = detectMediaSlots(distDir);
  const zipInfo = finalize ? zipLine(distDir) : '';

  const platformNotes = {
    kiwify: 'URL de checkout Kiwify. Parâmetro de origem: `?src=`. Configure Pixel/GA no painel Kiwify e a página de obrigado no produto.',
    hotmart: 'URL Hotmart. Preserve `src`, `sck`, `xcod` (afiliado). Configure a "página de agradecimento" no painel do produtor.',
    digistore24: 'URL Digistore24. Preserve `aff` e `campaignkey`. Thank-you page recebe `orderid` na query.',
    stripe: 'Use um **Payment Link** (`buy.stripe.com/...`). Configure `success_url` para a página de obrigado. Deixe a recorrência explícita se for assinatura.',
    generic: 'URL genérica de checkout. A página preserva a query string (utm/src/aff) nos CTAs.',
  }[platform] || 'Configure a URL do checkout.';

  const md = `# Como publicar — ${name}

Pacote estático gerado pela **FORGE SALES PAGE SKILL**. Não precisa de backend.

- **Formato:** ${format}
- **Modo visual:** ${visual}
- **Idioma:** ${lang}
- **Checkout:** ${platform} → \`${checkoutUrl}\`
${zipInfo}

---

## 1. Publicar (escolha uma opção)

### Netlify (mais rápido)
1. Acesse https://app.netlify.com/drop
2. Arraste o arquivo \`pagina.zip\` (ou a pasta inteira) para a área indicada.
3. A página fica no ar em segundos com uma URL \`*.netlify.app\`.
4. Em *Site settings → Domain management*, aponte seu domínio \`${domain}\`.

### Vercel
1. \`npm i -g vercel\` → \`vercel\` na pasta \`dist/\` (ou importe o repositório).
2. Framework preset: **Other**. Output: a própria pasta.
3. Adicione o domínio em *Settings → Domains*.

### Cloudflare Pages
1. *Workers & Pages → Create → Pages → Upload assets*.
2. Suba a pasta \`dist/\`.
3. *Custom domains* → adicione \`${domain}\`.

### GitHub Pages
1. Crie um repositório e suba o conteúdo de \`dist/\` na branch \`main\` (ou \`gh-pages\`).
2. *Settings → Pages* → Source: a branch, pasta \`/ (root)\`.
3. Configure o domínio em *Custom domain*.

### Hospedagem tradicional (cPanel / Hostinger / etc.)
1. *Gerenciador de Arquivos* → pasta \`public_html\` (ou subpasta do domínio).
2. *Upload* → envie \`pagina.zip\`.
3. Clique com o botão direito → *Extract*. Confirme que \`index.html\` ficou na raiz.
4. Acesse \`https://${domain}\`.

---

## 2. Apontar o domínio

- **Netlify/Vercel/Cloudflare:** siga o assistente de domínio do painel; normalmente
  um registro \`CNAME\` (ou \`A\`/\`ALIAS\`) no seu provedor de DNS.
- **Hospedagem própria:** o domínio já aponta para o servidor; só coloque os
  arquivos na pasta certa.
- Force HTTPS (todos os painéis acima emitem certificado grátis automaticamente).

---

## 3. Checkout

${platformNotes}

- A URL usada nos botões: \`${checkoutUrl}\`
- Os CTAs **preservam a query string** da página (utm, src, aff, gclid, fbclid...)
  automaticamente — não é preciso configurar nada.
- Teste: abra a página com \`?utm_source=teste&src=teste\` e clique no botão;
  confirme que os parâmetros chegam no checkout.

---

## 4. Analytics / Pixel

Abra \`index.html\` (ou \`assets/js/main.js\`) e localize o marcador
\`<!-- FORGE:ANALYTICS -->\` no \`<head>\`. Cole ali o snippet do:

- **GA4:** tag \`gtag.js\` com seu \`G-XXXXXXX\`.
- **Meta Pixel:** \`fbq('init', 'SEU_PIXEL_ID')\`.
- **GTM:** container \`GTM-XXXXXXX\` (head + noscript no body).

Os eventos já estão preparados no código (\`trackCTA\`, \`trackConversion\`):
descomente as linhas do provedor que você usar em \`assets/js/main.js\`.

> Se você adicionar qualquer script de terceiros, mantenha o aviso de cookies /
> privacidade visível (LGPD/GDPR) e o link para a Política de Privacidade.

---

## 5. Slots de mídia (modo AI FILM READY)

${mediaSlots.length
  ? mediaSlots.map(s => `- \`${s.rel}\` — ${s.hint}`).join('\n') +
    `\n\nColoque os arquivos de vídeo nesses caminhos. Enquanto não existirem, a
página usa o \`poster\` estático e continua funcionando normalmente.
Recomendações: hero ≤ 3 MB, b-roll ≤ 1,5 MB, H.264 (.mp4) + VP9/AV1 (.webm),
\`muted\`, sem áudio, loop curto (6–12 s).`
  : '_Nenhum slot de vídeo nesta página._'}

---

## 6. Antes de ligar o tráfego (checklist)

- [ ] Página abre em \`https://${domain}\` com cadeado (HTTPS).
- [ ] Testada no celular e no desktop.
- [ ] Todos os botões levam ao checkout certo, com os parâmetros preservados.
- [ ] Pixel/GA4/GTM instalados e disparando (use o *Meta Pixel Helper* / *GA DebugView*).
- [ ] Página de obrigado configurada como \`success_url\` / "página de agradecimento".
- [ ] Links legais funcionando: Política de Privacidade, Termos, Reembolso.
- [ ] Nenhuma imagem quebrada, nenhum link morto.
- [ ] Texto revisado (sem placeholder, sem erro de português/idioma).
- [ ] Compliance conferido para o canal de tráfego (${brief?.trafficType || 'defina'}).

---

## 7. Compliance — observações

${complianceNotes(brief)}

---

_Gerado automaticamente. Ajuste o que precisar antes de publicar._
`;

  fs.writeFileSync(path.join(distDir, 'README-PUBLICAR.md'), md);
}

function detectMediaSlots(distDir) {
  const idx = path.join(distDir, 'index.html');
  if (!fs.existsSync(idx)) return [];
  const html = fs.readFileSync(idx, 'utf8');
  const slots = [];
  for (const m of html.matchAll(/<(?:video|source)\b[^>]*\b(?:src|data-media-slot)\s*=\s*["']([^"']+\.(?:mp4|webm|mov))["']/gi)) {
    const rel = m[1].replace(/^\.?\//, '');
    if (!slots.find(s => s.rel === rel)) {
      const abs = path.join(distDir, rel);
      slots.push({
        rel,
        hint: fs.existsSync(abs) ? `presente (${fmtBytes(fs.statSync(abs).size)})` : 'ausente — usar poster até ter o arquivo',
      });
    }
  }
  return slots;
}

function zipLine(distDir) {
  const zip = path.join(distDir, 'pagina.zip');
  if (!fs.existsSync(zip)) return '';
  return `- **Pacote:** \`pagina.zip\` (${fmtBytes(fs.statSync(zip).size)})`;
}

function complianceNotes(brief) {
  if (!brief) return '- Defina o `brief.json` para gerar observações específicas do nicho.';
  const out = [];
  const cats = brief.compliance?.categories || [];
  const traffic = brief.trafficType;
  if (traffic === 'google-ads') out.push('- **Google Ads:** a página precisa de contato, Política de Privacidade e Termos acessíveis, preço claro e correspondência com o anúncio. Ver `references/compliance-google.md`.');
  if (traffic === 'meta-ads') out.push('- **Meta Ads:** revise a copy de dor para não usar 2ª pessoa acusatória (atributos pessoais). Sem "antes/depois" irreal. Ver `references/compliance-meta.md`.');
  if (traffic === 'affiliate') out.push('- **Afiliado:** disclosure de comissão visível; não copiar a página do produtor; preservar link de afiliado.');
  if (cats.includes('health') || cats.includes('weight-loss')) out.push('- **Saúde/emagrecimento:** disclaimer médico injetado. Sem promessa de cura ou resultado garantido.');
  if (cats.includes('finance') || cats.includes('make-money')) out.push('- **Finanças/renda:** disclaimer de risco injetado. Sem "renda garantida" / "lucro certo".');
  if (brief.compliance?.requiresAdvertorialDisclosure) out.push('- **Advertorial:** rótulo "Publicidade" deve estar visível no topo; cite as fontes das estatísticas.');
  if (!out.length) out.push('- Nicho sem restrições específicas sinalizadas. Ainda assim: sem promessa absoluta, sem prova/depoimento inventado, urgência só se real.');
  return out.join('\n');
}
