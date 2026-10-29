# Chopeiras · campanha ontap26

Página estática em `/produtos/chopeira/`. Usa os mesmos `assets/site-shell.css`, `assets/site-shell.js` e `assets/menu-search.css` da homepage. O HTML contém fallback dos componentes compartilhados. Não alterar o cabeçalho/rodapé apenas nesta página.

## Catálogo e publicação

Os nove produtos de https://loja.bufalogrowler.com.br/chopeiras foram conferidos em 29/10/2026, sem paginação adicional. `products.json` registra nomes, IDs, URLs e fotos da fonte, além das sugestões editoriais. Cada produto tem seção e link próprios, inclusive as três cores da On TAP 3,5 L. Os combos incluem dois growlers e um dispensador; as capacidades anunciadas são somadas. A divergência entre o nome Kundi 2 L e a descrição técnica 1,9 L está explicitada.

Preços e estoque ficam na loja para evitar informação desatualizada. Ao adicionar/remover produtos, atualizar o HTML, o JSON embutido, o JSON de referência e o ItemList estruturado. Manter `dist/produtos/chopeira/` sincronizado, assim como `dist/assets/analytics.js`, os redirects e o sitemap. A hospedagem existente publica `dist` a partir de `main`.

## Banner

Criado pelo gerador de imagens integrado (modo de edição), usando a foto de produto enviada pelo usuário. Prompt resumido: preservar a chopeira preta e seus componentes, retirar o fundo branco e os elementos promocionais, criar um estúdio preto enigmático com luz de contorno, névoa discreta e pedestal de pedra, produto à direita e espaço negativo à esquerda; sem texto gerado. A tipografia do banner é HTML acessível. WebP em 1536 × 1024 e 960 × 640, com preload responsivo. As fotos das seções são as fotos reais da loja; o hero é uma composição ilustrativa gerada a partir da referência.

## GA4 e UTMs

Usa exclusivamente o carregador da homepage, `G-FPEC1ZGMJQ`, sem um segundo `config` ou `page_view`. Grupo de conteúdo `chopeiras`, tipo de página `chopeira`. O carregador compartilhado mantém a lista de hosts públicos permitidos; nenhuma coleta é enviada por localhost ou prévias não autorizadas.

Eventos específicos:

- `view_item_list`: uma vez quando a primeira foto de produto fica pelo menos 50% visível; lista dos nove IDs.
- `view_item`: uma vez por produto, ao atingir 50% de visibilidade da sua foto.
- `select_item`: clique para ver o produto na loja, com ID, nome, lista e posição.
- `ontap_cta_click`: CTA do hero, sugestão de ocasião, navegação de modelos e saída para a categoria.
- `ontap_faq_open`: abertura de uma pergunta, por identificador fixo.
- `ontap_scroll`: marcos de 25%, 50%, 75% e 100%, uma vez por carregamento.

Todos incluem `campaign_id=ontap26`. O evento genérico `bufalo_store_click` da homepage continua funcionando. O clique de saída não é declarado como compra. A compra efetiva depende da medição e da atribuição configuradas na Loja Integrada. Não são enviados valores de formulários, telefone, e-mail ou texto livre.

Links comerciais desta página usam `utm_source=bufalo&utm_medium=landing_page&utm_campaign=ontap26`, com `utm_content` por produto/posição. Para divulgar a landing em redes sociais, por exemplo:

`https://www.bufalogrowler.com.br/produtos/chopeira/?utm_source=instagram&utm_medium=social&utm_campaign=ontap26`

A grafia correta do parâmetro é `utm_campaign`. Criar definições personalizadas com escopo de evento no GA4 para `campaign_id`, `cta_id`, `link_position`, `section_id` e `question_id` se esses campos forem usados nas Explorações. A criação da página não altera a administração da propriedade GA4.

Validação: `node tests/analytics.cjs` e `node tests/chopeira.cjs`, além de inspeção responsiva no navegador.
