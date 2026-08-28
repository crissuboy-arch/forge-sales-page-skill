# templates/ — referência estrutural (NÃO são gabaritos)

> Estes arquivos existem para **lembrar a estrutura** de cada tipo de página e as
> armadilhas de cada vertical. A IA **não preenche** um template: ela lê o
> `analysis.md` + `style.md` + `copy.md` e **constrói** o HTML/CSS/JS do zero,
> com identidade visual própria.
>
> `reference.html` = esqueleto semântico **sem identidade visual** (só landmarks,
> ordem de seções e comentários apontando para `references/`). Serve para conferir
> se nenhuma seção essencial ficou de fora.

## Como usar

1. Escolha o formato (`sales-architecture.md`) e a vertical mais próxima.
2. Abra o `reference.html` da pasta e o `README.md` dela.
3. Use como **checklist de seções** e nota de contexto — depois descarte e escreva a página real.

## Verticais

| Pasta | Quando | Observações principais |
|-------|--------|------------------------|
| `direct-response/` | Página de vendas clássica long-form (curso, mentoria, info-produto) | Esqueleto mais completo; base para as demais. |
| `app-saas/` | Produto recorrente, trial/demo, comparação de planos | Screenshot/loop do produto, planos, FAQ de billing, "cancele quando quiser". |
| `beauty/` | Beleza, skincare, cosméticos, estética | Claims cosméticos ≠ terapêuticos; foto sensorial; ritual; ingredientes. |
| `relationship/` | Relacionamento, namoro, reconquista, comunicação | Sem manipulação, sem promessa de reconquista; Meta: cuidado com atributos pessoais. |
| `finance/` | Investir, renda extra, finanças pessoais, negócios | Disclaimer de risco obrigatório; sem "renda garantida"; identificação/CNPJ. |
| `wellness/` | Saúde, emagrecimento, suplementos, fitness, mente | Disclaimer médico; sem "cura"; sem antes/depois irreal (Meta). |
| `editorial/` | Advertorial / presell em formato de matéria | Byline, dateline, rótulo "Publicidade", fontes citadas, coluna estreita. |
| `cinematic/` | Qualquer vertical no modo CINEMATIC CODE / AI FILM READY | Camada de motion (GSAP/Lenis) + slots de mídia; fallback estático completo. |

## Formatos vs verticais

Formato (vendas / presell / advertorial / captura / saas / obrigado) é ortogonal à
vertical. Ex.: um produto de `wellness` com tráfego Google Ads → estrutura de
`editorial/` (advertorial) + contexto de `wellness/` (disclaimers).
