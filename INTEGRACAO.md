# Loja Jan Rosê: guia de integração do novo layout

Este pacote é o front-end completo da nova loja do consultor. Foi feito para a equipe técnica da Jan Rosê aplicar sem retrabalho: **HTML, CSS e JavaScript puros, sem framework e sem build**. Funciona aberto direto no navegador (`index.html`).

## Estrutura

```
index.html            página única (casca); carrega dados e scripts
assets/loja.css       todo o visual; tokens de cor/fonte no :root
assets/loja.js        rotas, catálogo, filtros, busca, sacola, favoritos, checkout
data/produtos.json    catálogo (112 produtos agrupados, com variações)
data/produtos.js      o mesmo catálogo como window.PRODUTOS (para abrir sem servidor)
data/conteudo.js      textos ricos por código (notas olfativas, benefícios, fórmula)
img/p/<codigo>.webp   fotos oficiais otimizadas (900 px, WebP)
img/marca/logo.svg    logo oficial
_scripts/             coleta e geração dos dados (não vão para produção)
```

## Identidade (tokens em `assets/loja.css`)

| Token | Valor | Uso |
|---|---|---|
| `--roxo` | `#874BE1` | cor oficial do logo; botões e destaques |
| `--berinjela` | `#24133A` | seções escuras, rodapé |
| `--lilas` | `#F6F1FD` | fundo das fotos e seções claras |
| `--fundo` | `#FBF9F6` | fundo geral |
| Fontes | Fraunces (títulos) + Manrope (texto) | Google Fonts |

Para trocar uma cor no site inteiro, basta mudar o token.

## Formato do produto (`data/produtos.json`)

```json
{
  "cod": "1036",
  "nome": "Le Dulce",
  "cat": "perfumes",              // bem-estar | perfumes | rosto | corpo | cabelos | joias
  "genero": "fem",                // fem | masc | null
  "linha": "Deo Parfum",
  "preco": 49.9,                  // menor preço entre as variações
  "img": "img/p/1036.webp",
  "variacoes": [                  // opcional
    { "rotulo": "100 ml", "cod": "1036",  "preco": 189.9, "disponivel": true },
    { "rotulo": "15 ml",  "cod": "1036A", "preco": 49.9,  "disponivel": true }
  ]
}
```

Os campos batem com o que a loja atual já tem (código, nome, categoria, preço e imagem em `/uploads/products/images/`). Na integração, o back-end (Laravel) entrega este JSON num endpoint, por exemplo `GET /api/loja/{consultor}/produtos`, e o `index.html` passa a carregá-lo no lugar de `data/produtos.js`.

## Pontos de integração (todos em `assets/loja.js`)

| O quê | Onde | Hoje (proposta) | Na integração |
|---|---|---|---|
| Consultor da loja | `CONFIG.consultor` | fixo | vem do subdomínio (`dbraz.janrose.digital`) |
| Catálogo | `window.PRODUTOS` | arquivo estático | endpoint JSON da loja |
| Sacola | `adicionar()`, `alterarQtd()` | `localStorage` | carrinho da sessão atual (mesmas funções) |
| Checkout | `paginaCheckout()` / submit | demonstração, nada é enviado | enviar para o checkout e gateway atuais |
| Frete | `#frete` | CEP via ViaCEP, valor no fechamento | cálculo atual da empresa |
| Frete grátis | `CONFIG.freteGratisAcima` | 0 (barra oculta) | regra comercial real |
| Métricas | `track()` | envia para `dataLayer` | o GTM atual (`GTM-5JCH8RX2`) já recebe `view_item` e `add_to_cart` |

## O que já funciona

- Rotas: início, categoria, produto, busca, favoritos e checkout (links compartilháveis por `#/produto/<código>`).
- Busca com sugestões ao digitar, setas do teclado e Enter. Ignora acentos.
- Filtros de perfumaria por gênero, família olfativa, intensidade e preço. Ordenação.
- Variações de tamanho: perfumes 100/15 ml e aros de anel (indisponíveis riscados).
- Sacola em gaveta lateral com quantidades e subtotal. Favoritos. Os dois persistem no navegador.
- Checkout em 3 blocos com máscaras de CPF, celular e CEP, endereço preenchido pelo CEP e validação.
- Botão de WhatsApp do consultor com mensagem pronta por produto.
- Responsivo de 320 px a desktop. Barra de compra fixa no celular. Navegação por teclado e textos alternativos.

## Antes de publicar

1. Remover `<meta name="robots" content="noindex">` do `index.html`.
2. Trocar `?v=1` dos arquivos CSS e JS a cada versão (evita cache antigo).
3. Revisar os textos de `data/conteudo.js` com o time regulatório (suplementos seguem a RDC 243/2018).
