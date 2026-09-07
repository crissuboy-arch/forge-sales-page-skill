// commercial.js — geração (sem IA) de proposta, rascunho de e-mail e contrato,
// a partir de dados REAIS do lead + settings. Templates adaptados de
// maquina-de-leads/modelos (capa-proposta-template.html, contrato-template.html)
// e gemini-prospector/skills/proposta-gmail.
//
// Regra: nunca inventar preço, prazo, escopo, dados fiscais. O que faltar volta
// em `missing` para preenchimento manual na interface.

function esc(s) {
  return String(s == null ? '' : s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
}
function firstName(s) {
  const parts = String(s || '').trim().split(/\s+/).filter(Boolean);
  const skip = /^(dr|dra|sr|sra|prof|profa|dr\.|dra\.|clínica|clinica|studio|espaço|espaco|centro|instituto)$/i;
  for (const p of parts) if (!skip.test(p.replace(/\.$/, ''))) return p;
  return parts[0] || 'você';
}
function digits(s) { return String(s || '').replace(/[^\d]/g, ''); }

/* ============================ PROPOSTA ============================ */
export function buildProposal(lead = {}, opts = {}) {
  const s = opts.settings || {};
  const nome = lead.nome || 'Cliente';
  const demoUrl = opts.demoUrl || lead.demoUrl || '';
  const siteAntigo = lead.siteAntigo || '';
  const autor = s.assinaturaNome || '';
  const apresentacao = s.assinaturaApresentacao || '';
  const whats = digits(s.assinaturaWhatsapp || lead.whatsapp || '');
  const preco = (opts.preco || s.precoPadrao || '').trim();
  const missing = [];
  if (!demoUrl) missing.push('demoUrl (publique a demo primeiro)');
  if (!autor) missing.push('assinaturaNome (Configurações)');

  const problema = opts.problema || lead.diagnostico || 'O site atual não acompanha o nível do seu atendimento: em telas pequenas fica difícil de ler e não tem uma chamada clara para o cliente entrar em contato.';
  const oportunidade = opts.oportunidade || `A maioria das pessoas que procura "${lead.nicho || 'seu serviço'} em ${lead.cidade || 'sua região'}" decide pelo primeiro contato. Um site rápido, claro e com botão de WhatsApp visível transforma essa busca em conversa.`;
  const solucao = opts.solucao || 'Nova versão do site com identidade própria, textos reescritos, layout mobile impecável, prova social com a sua nota do Google e CTA de WhatsApp em todas as seções. Entregue como arquivo único, publicável no seu domínio.';
  const proximoPasso = opts.proximoPasso || 'Dê uma olhada na demonstração (abra também no celular). Se fizer sentido, me chama no WhatsApp que eu te explico a publicação no seu domínio e tiro qualquer dúvida.';

  const html = `<!DOCTYPE html>
<html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex">
<title>Proposta — ${esc(nome)}</title>
<style>
:root{--ink:#16201d;--soft:#5b6660;--acc:#0f5f4f;--bg:#faf9f5;--line:#e6e2d8}
*{box-sizing:border-box;margin:0}body{background:var(--bg);color:var(--ink);font:400 16px/1.65 ui-serif,Georgia,serif;padding:0}
.wrap{max-width:52rem;margin:0 auto;padding:3rem 1.4rem 4rem}
h1{font:700 clamp(1.7rem,1.3rem+2vw,2.4rem)/1.15 ui-sans-serif,system-ui,sans-serif;letter-spacing:-.02em}
h2{font:700 1.15rem/1.3 ui-sans-serif,system-ui,sans-serif;margin:2rem 0 .5rem}
p{margin:.6rem 0}.kick{font:700 .78rem/1.4 ui-sans-serif,system-ui,sans-serif;letter-spacing:.14em;text-transform:uppercase;color:var(--acc)}
.card{background:#fff;border:1px solid var(--line);border-radius:14px;padding:1.3rem 1.5rem;margin:1rem 0}
.cols{display:grid;grid-template-columns:1fr 1fr;gap:1rem;margin:1rem 0}
.cols a{display:block;background:#fff;border:1px solid var(--line);border-radius:12px;padding:1rem 1.1rem;text-decoration:none;color:var(--ink)}
.cols b{display:block;font:700 .8rem/1.4 ui-sans-serif,system-ui,sans-serif;letter-spacing:.06em;text-transform:uppercase;color:var(--soft)}
.cols span{color:var(--acc);font-weight:600;word-break:break-all}
.demo{border:1px solid var(--line);border-radius:14px;overflow:hidden;margin:1rem 0}
.demo .bar{background:#f4f2ec;padding:.6rem 1rem;font:600 .8rem/1 ui-sans-serif,system-ui,sans-serif;color:var(--soft)}
.demo iframe{display:block;width:100%;height:70vh;border:0;background:#fff}
.cta{text-align:center;margin:2.5rem 0 0}
.btn{display:inline-block;background:var(--acc);color:#fff;text-decoration:none;font:700 1rem/1.3 ui-sans-serif,system-ui,sans-serif;padding:1rem 2rem;border-radius:999px}
.foot{margin-top:3rem;padding-top:1.2rem;border-top:1px solid var(--line);font-size:.85rem;color:var(--soft)}
@media(max-width:640px){.cols{grid-template-columns:1fr}}
</style></head><body><div class="wrap">
<p class="kick">Preparado para</p>
<h1>${esc(nome)} — proposta de nova versão do site</h1>
<p style="color:var(--soft)">${esc(apresentacao ? apresentacao + ' · ' : '')}${autor ? 'por ' + esc(autor) : ''}</p>

<h2>1. O site atual</h2>
<div class="card"><p>${siteAntigo ? 'Endereço atual: <a href="' + esc(siteAntigo) + '" style="color:var(--acc)">' + esc(siteAntigo) + '</a>' : 'Hoje o negócio não tem site próprio' + (lead.instagram ? ' (só Instagram @' + esc(lead.instagram) + ')' : '') + '.'}</p>
<p><strong>Problema / oportunidade:</strong> ${esc(problema)}</p>
<p>${esc(oportunidade)}</p></div>

<h2>2. A nova versão (demonstração no ar)</h2>
${demoUrl ? `<div class="demo"><div class="bar">${esc(demoUrl)}</div><iframe src="${esc(demoUrl)}" title="Nova versão" loading="lazy"></iframe></div>
<div class="cols"><a href="${esc(demoUrl)}" target="_blank" rel="noopener"><b>Ver a nova versão</b><span>${esc(demoUrl)}</span></a>${siteAntigo ? `<a href="${esc(siteAntigo)}" target="_blank" rel="noopener"><b>Comparar com o site atual</b><span>${esc(siteAntigo)}</span></a>` : ''}</div>` : '<div class="card"><p><em>Publique a demonstração para incluir aqui o link e o preview.</em></p></div>'}

<h2>3. O que está incluído</h2>
<div class="card"><p>${esc(solucao)}</p>${lead.nota && lead.avaliacoes ? `<p>Sua reputação real (nota ${esc(lead.nota)} no Google, ${esc(lead.avaliacoes)} avaliações) fica em destaque na página.</p>` : ''}</div>

<h2>4. Investimento</h2>
<div class="card"><p>${preco ? esc(preco) : 'A combinar na conversa — o valor depende do domínio, hospedagem e ajustes finais.'}</p></div>

<h2>5. Próximo passo</h2>
<div class="card"><p>${esc(proximoPasso)}</p></div>

<div class="cta"><a class="btn" href="${whats ? 'https://wa.me/' + whats + '?text=' + encodeURIComponent('Oi! Vi a proposta da nova versão do meu site e quero conversar.') : '#'}"${whats ? ' target="_blank" rel="noopener"' : ''}>Conversar no WhatsApp</a></div>

<p class="foot">Apresentação privada${autor ? ' criada por ' + esc(autor) : ''} para ${esc(nome)}. Nenhum dado é coletado nesta página. A demonstração fica no ar para avaliação sem compromisso.</p>
</div></body></html>`;

  return { html, missing, fields: { problema, oportunidade, solucao, proximoPasso, preco } };
}

/* ============================ E-MAIL ============================ */
export function gmailComposeUrl(to, subject, body) {
  const q = new URLSearchParams({ view: 'cm', fs: '1', to: to || '', su: subject || '', body: body || '' });
  return `https://mail.google.com/mail/?${q.toString()}`;
}
export function mailtoUrl(to, subject, body) {
  return `mailto:${encodeURIComponent(to || '')}?subject=${encodeURIComponent(subject || '')}&body=${encodeURIComponent(body || '')}`;
}

export function buildEmailDraft(lead = {}, opts = {}) {
  const s = opts.settings || {};
  const nome = lead.nome || 'você';
  const fn = firstName(nome);
  const link = opts.propostaUrl || opts.demoUrl || lead.demoUrl || '';
  const autor = s.assinaturaNome || 'Eu';
  const apres = s.assinaturaApresentacao || '';
  const whats = s.assinaturaWhatsapp || '';
  const missing = [];
  if (!lead.email) missing.push('e-mail do lead (use WhatsApp como alternativa)');
  if (!link) missing.push('link da demo/proposta (publique a demo)');

  const elogio = lead.nota && lead.avaliacoes
    ? `Encontrei ${nome} pelas avaliações no Google — nota ${lead.nota} com ${lead.avaliacoes} avaliações é um sinal claro de que o atendimento é levado a sério.`
    : `Encontrei ${nome} procurando ${lead.nicho || 'serviços'} ${lead.cidade ? 'em ' + lead.cidade : 'na região'} e a reputação chamou a atenção.`;
  const defeito = lead.diagnostico
    ? `Só notei uma coisa: ${lead.diagnostico.charAt(0).toLowerCase() + lead.diagnostico.slice(1)}. É o tipo de detalhe que faz o cliente desistir antes de ligar.`
    : `Só notei que o site atual não facilita o contato pelo celular, que é de onde a maioria das pessoas procura hoje.`;

  const subject = `${fn}, posso te mostrar uma coisa sobre o site?`.slice(0, 60);
  const body = [
    `Olá, ${fn}.`,
    '',
    elogio,
    '',
    defeito,
    '',
    `Fiz uma nova versão do site e ela já está no ar, só para você avaliar: ${link || '[publique a demo para gerar o link]'}`,
    '',
    'Abra também no celular e me responde só com a impressão — se não for a hora, sem problema.',
    '',
    autor + (apres ? `\n${apres}` : '') + (whats ? `\nWhatsApp: ${whats}` : ''),
  ].join('\n');

  return {
    subject,
    body,
    gmailUrl: gmailComposeUrl(lead.email || '', subject, body),
    mailto: mailtoUrl(lead.email || '', subject, body),
    missing,
  };
}

/* ============================ CONTRATO ============================ */
const CONTRACT_REQUIRED = [
  ['contratanteNome', 'Seu nome / razão social (Configurações)'],
  ['contratanteDoc', 'Seu CPF/CNPJ/NIF (Configurações)'],
  ['contratanteCidade', 'Sua cidade/UF (Configurações)'],
  ['preco', 'Valor acordado'],
  ['prazo', 'Prazo de entrega'],
  ['formaPagamento', 'Forma de pagamento'],
];

export function buildContract(lead = {}, opts = {}) {
  const s = opts.settings || {};
  const val = (k) => (opts[k] != null && String(opts[k]).trim()) || (s[k] != null && String(s[k]).trim()) || '';
  const data = {
    contratanteNome: val('contratanteNome'),
    contratanteDoc: val('contratanteDoc'),
    contratanteEndereco: val('contratanteEndereco'),
    contratanteCidade: val('contratanteCidade'),
    preco: opts.preco || s.precoPadrao || '',
    prazo: opts.prazo || s.prazoPadrao || '',
    formaPagamento: opts.formaPagamento || s.formaPagamento || '',
    rodadas: opts.rodadas || '1',
  };
  const missing = CONTRACT_REQUIRED.filter(([k]) => !data[k]).map(([, label]) => label);
  const clienteNome = lead.nome || '________________';
  const clienteDoc = opts.clienteDoc || '________________';
  const clienteEndereco = lead.endereco || opts.clienteEndereco || '________________';
  const cidadeForo = data.contratanteCidade || lead.cidade || '________________';
  const hoje = new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' });

  const html = `<!DOCTYPE html>
<html lang="pt-BR"><head><meta charset="utf-8"><title>Contrato — ${esc(clienteNome)}</title>
<style>@page{size:A4;margin:2.2cm}
body{font:12.5pt/1.65 Georgia,'Times New Roman',serif;color:#1a1a1a;background:#e9e7e1;padding:40px 14px;margin:0}
.folha{background:#fff;max-width:21cm;margin:0 auto;padding:2.2cm;box-shadow:0 12px 44px rgba(0,0,0,.15);border-radius:4px}
.bar{position:fixed;top:12px;right:14px}.bar button{border:0;border-radius:9px;padding:10px 18px;font:700 13px/1 Arial,sans-serif;background:#0f5f4f;color:#fff;cursor:pointer}
h1{font-size:15pt;text-align:center;text-transform:uppercase;letter-spacing:.05em;margin:0 0 26px}
h2{font-size:12.5pt;margin:20px 0 6px}p{margin:8px 0;text-align:justify}
.assin{margin-top:52px;display:flex;gap:40px;justify-content:space-between}.assin div{flex:1;text-align:center}.linha{border-top:1px solid #1a1a1a;padding-top:6px}
.aviso{margin-top:32px;font-size:9pt;color:#666;border-top:1px solid #ccc;padding-top:10px;font-family:Arial,sans-serif}
mark{background:#fff3cd;padding:0 2px}
@media print{.bar{display:none}body{background:#fff;padding:0}.folha{box-shadow:none;border-radius:0;max-width:none;padding:0}}
</style></head><body>
<div class="bar"><button onclick="window.print()">Imprimir / PDF</button></div>
<div class="folha">
<h1>Contrato de Prestação de Serviços<br>Criação de nova versão de site</h1>
<p><b>CONTRATANTE:</b> ${esc(clienteNome)}, inscrito(a) sob n.º ${esc(clienteDoc)}, com endereço em ${esc(clienteEndereco)}${lead.cidade ? ', ' + esc(lead.cidade) : ''}.</p>
<p><b>CONTRATADO(A):</b> ${data.contratanteNome ? esc(data.contratanteNome) : '<mark>[SEU NOME]</mark>'}, inscrito(a) sob n.º ${data.contratanteDoc ? esc(data.contratanteDoc) : '<mark>[SEU CPF/CNPJ]</mark>'}, com endereço em ${data.contratanteEndereco ? esc(data.contratanteEndereco) : '<mark>[SEU ENDEREÇO]</mark>'}${data.contratanteCidade ? ', ' + esc(data.contratanteCidade) : ''}.</p>
<p>As partes celebram o presente contrato de prestação de serviços, regido pelas cláusulas seguintes.</p>
<h2>Cláusula 1ª — Do objeto</h2>
<p>Criação de nova versão da página na internet do CONTRATANTE${lead.siteAntigo ? ' (' + esc(lead.siteAntigo) + ')' : ''}: redesign do layout com manutenção da identidade visual e das imagens fornecidas, redação aprimorada do conteúdo existente, adaptação para dispositivos móveis${lead.demoUrl ? ' e publicação inicial em ' + esc(lead.demoUrl) : ''}.</p>
<h2>Cláusula 2ª — Do valor e pagamento</h2>
<p>Pelos serviços da Cláusula 1ª, o CONTRATANTE pagará ao CONTRATADO(A) o valor de <b>${data.preco ? esc(data.preco) : '<mark>[VALOR ACORDADO]</mark>'}</b>, na forma: ${data.formaPagamento ? esc(data.formaPagamento) : '<mark>[FORMA DE PAGAMENTO]</mark>'}.</p>
<h2>Cláusula 3ª — Do prazo</h2>
<p>Entrega e publicação da versão final em até ${data.prazo ? esc(data.prazo) : '<mark>[PRAZO]</mark>'} a contar da assinatura e do fornecimento dos materiais e aprovações pelo CONTRATANTE. Incluída(s) ${esc(data.rodadas)} rodada(s) de ajustes após a entrega.</p>
<h2>Cláusula 4ª — Do conteúdo e responsabilidades</h2>
<p>O CONTRATANTE declara ser titular ou possuir autorização de uso de todos os textos, imagens, logotipo e informações fornecidos, responsabilizando-se pela veracidade das informações profissionais. O CONTRATADO(A) compromete-se a não inserir informações não fornecidas ou não aprovadas.</p>
<h2>Cláusula 5ª — Da hospedagem e domínio</h2>
<p>A contratação de domínio e hospedagem é de responsabilidade do CONTRATANTE, salvo acordo diverso por escrito. O CONTRATADO(A) entrega os arquivos da página e presta o suporte necessário à publicação.</p>
<h2>Cláusula 6ª — Da rescisão</h2>
<p>Rescindível por qualquer parte mediante comunicação por escrito. Havendo rescisão pelo CONTRATANTE após o início dos trabalhos, será devido o valor proporcional aos serviços já executados.</p>
<h2>Cláusula 7ª — Do foro</h2>
<p>Fica eleito o foro da comarca de ${esc(cidadeForo)} para dirimir controvérsias oriundas deste contrato.</p>
<p style="margin-top:36px">${esc(data.contratanteCidade || lead.cidade || '________')}, ${esc(hoje)}.</p>
<div class="assin"><div><div class="linha"></div><b>${esc(clienteNome)}</b><br>Contratante</div><div><div class="linha"></div><b>${data.contratanteNome ? esc(data.contratanteNome) : '[SEU NOME]'}</b><br>Contratado(a)</div></div>
<p class="aviso">Minuta base gerada automaticamente pela PageForge AI para facilitar a formalização. Campos em <mark>destaque</mark> precisam ser preenchidos. Recomenda-se revisão jurídica antes da assinatura.</p>
</div></body></html>`;

  return { html, missing, data };
}
