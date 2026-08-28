# Compliance — Meta Ads (Facebook / Instagram)

Checklist operacional para páginas que recebem tráfego de Meta Ads. Baseado nas
Políticas de Publicidade da Meta (públicas). Não é aconselhamento jurídico;
confirme a política vigente.

---

## 1. Políticas que mais afetam a landing page

| Política | O que evita |
|---|---|
| **Atributos pessoais (Personal Attributes)** | textos que afirmam/insinuam que você **conhece** um atributo do usuário: "Você está com sobrepeso?", "Sofre de depressão?", "Está endividado?", "Solteiro há muito tempo?" — na página e no anúncio |
| **Alegações enganosas / exageradas** | resultados irreais, "antes/depois" com expectativa irreal, promessas de renda/saúde garantida |
| **Produtos e serviços de saúde** | peso, "antes e depois", partes do corpo com zoom, promoção de imagem corporal negativa, suplementos milagrosos |
| **Práticas comerciais enganosas** | esconder recorrência, cobrança-surpresa, "grátis" que não é grátis, oferta que a página não cumpre |
| **Funcionalidade inexistente** | simular botão de play, notificação, cursor, "seu antivírus expirou" |
| **Conteúdo sensacionalista / chocante** | linguagem de choque, imagens perturbadoras |
| **Fantasias não realistas / clickbait** | manchete que a página não entrega |
| **Circumvenção do sistema** | cloaking, redirects, domínios "queimados", LP diferente da revisada |

---

## 2. Regra de ouro dos Atributos Pessoais

Não escrever de um jeito que **presuma** algo sobre o leitor.

- ❌ "Você está acima do peso e cansado de dietas?"
- ✅ "Dietas restritivas costumam falhar. Existe outra abordagem."
- ❌ "Cansado de ser rejeitado nos matches?"
- ✅ "Muita gente sente que o app de namoro virou um jogo perdido. Veja o que muda a conversa."
- ❌ "Suas dívidas não param de crescer?"
- ✅ "Sair do vermelho pede um método, não força de vontade."

Falar do **problema em geral / na terceira pessoa / como fenômeno**, nunca
apontando o dedo para o leitor.

---

## 3. Saúde, peso e imagem corporal

- Sem "antes e depois" que sugira resultado garantido/rápido/irreal.
- Sem fotos de partes isoladas do corpo (barriga com zoom, "pele antes/depois").
- Sem linguagem que estigmatize o corpo ("perca essa gordura feia").
- Foco em hábito, bem-estar, constância — não em número na balança prometido.
- Disclaimer: resultados variam; não substitui acompanhamento profissional.
- Suplementos: sem claim terapêutico; seguir regulação local (ANVISA/FDA).

---

## 4. Requisitos da landing page

- **Mesma URL/domínio** e mesmo conteúdo que a Meta revisou (sem cloaking).
- Carrega rápido, mobile-first, sem pop-up intrusivo imediato, sem redirect.
- **Preço e recorrência** claros antes do checkout; política de reembolso.
- **Contato** real + **Política de Privacidade** (link) + Termos.
- Coleta de dados: consentimento e finalidade (LGPD/GDPR); se usa Pixel/CAPI,
  mencionar no aviso de privacidade/cookies.
- Correspondência anúncio ↔ página (promessa, oferta, preço).
- Sem elementos que imitem a UI do Facebook/Instagram.

---

## 5. Reescritas compatíveis

- "Ganhe R$ 5 mil/mês trabalhando de casa" → "Um caminho para estruturar uma
  renda extra online. Quanto você faz depende do seu esforço e mercado."
- "Elimine a flacidez em 2 semanas" → "Exercícios para apoiar firmeza e
  disposição, com constância. Resultados variam."
- "Reconquiste seu ex — funciona sempre" → "Ferramentas de comunicação para
  lidar melhor com um término. Nada garante reconciliação."
- Contador falso → prazo real ou nenhum.
- "Como visto na mídia" → só com prova e link.

---

## 6. Blocos automáticos (quando nicho sensível)

Iguais aos de `compliance-google.md` §5, mais:

- Revisar **toda** a copy de dor para remover 2ª pessoa acusatória (atributos pessoais).
- Aviso de cookies/pixel se houver rastreamento (Meta Pixel/CAPI).
- Em saúde/peso: nenhuma imagem de antes/depois sem contexto e disclaimer; de
  preferência, nenhuma.
- Frase: "Este site não é afiliado ao Facebook/Meta nem endossado por eles.
  Facebook e Instagram são marcas da Meta Platforms, Inc."

---

## 7. Termos/padrões que o `verify.js` sinaliza (contexto Meta)

Segunda pessoa + atributo: `você está (gordo|acima do peso|endividado|sozinho|deprimido|falido)`,
`cansado de ser`, `sofre de`, `sua barriga`, `seu peso`, `suas dívidas` (em
headline/lead) — além da lista de `compliance-google.md` §6. O agente revisa e
reescreve na terceira pessoa / como fenômeno.
