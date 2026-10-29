# Chopeiras · campanha ontap26

Página estática em `/produtos/chopeira/`. Usa os mesmos `assets/site-shell.css`, `assets/site-shell.js` e `assets/menu-search.css` da homepage. O HTML contém fallback dos componentes compartilhados. Não alterar o cabeçalho/rodapé apenas nesta página.

Composição inspirada na Trade Coffee, com identidade Búfalo preservada e corpo claro em verde acinzentado. A escolha por ocasião, a narrativa em três passos, o menu horizontal de modelos, os cuidados e as perguntas foram retirados a pedido do usuário. Os atalhos mostram somente produtos pretos. As fotos individuais são as fotos oficiais, sem cenários recriados, sem filtros de recorte e sem geração de produtos. As cores da On TAP 3,5 L, os dois kits e os dois Kundi estão agrupados em três rolagens laterais com setas, teclado e swipe. Os nove produtos mantêm ID, foto, CTA e link próprios. Os três cards de apresentação são links para os produtos. A seção do vídeo tem o título “Qualidade que se prova.”

## Catálogo e publicação

Os nove produtos de https://loja.bufalogrowler.com.br/chopeiras foram conferidos em 29/10/2026, sem paginação adicional. `products.json` registra nomes, IDs, URLs e fotos da fonte, além das sugestões editoriais. Cada produto tem seção e link próprios, inclusive as três cores da On TAP 3,5 L. Os combos incluem dois growlers e um dispensador; as capacidades anunciadas são somadas. A divergência entre o nome Kundi 2 L e a descrição técnica 1,9 L está explicitada.

Preços e estoque ficam na loja para evitar informação desatualizada. Ao adicionar/remover produtos, atualizar o HTML, o JSON embutido, o JSON de referência e o ItemList estruturado. Manter `dist/produtos/chopeira/` sincronizado, assim como `dist/assets/analytics.js`, os redirects e o sitemap. A hospedagem existente publica `dist` a partir de `main`.

## Banner

Banner atual: `images/mestre-integrated-original-brand.svg`. O kit integrado ao cenário fotográfico preto está em `mestre-integrated-clean.webp`, editado pelo gerador integrado para remover as marcas geradas. A arte original das duas logos vem da fotografia oficial incorporada no SVG, sem redesenho ou deformação; uma máscara de luminância separa o fundo do desenho original. Foto: https://cdn.awsli.com.br/800x800/1237/1237589/produto/397365368/mestre-cervejeiro-black-15bux68m3s.png. SHA-256: `f7285eaa7a6f4d5b0660ab27cc93c7e04291eefcebaa72ee4e4a230ae8f1de45`. O teste verifica a origem da imagem incorporada. Não foram geradas novas fotos individuais de produtos.

Prompt do banner final: preservar a composição do kit com dois growlers integrados ao estúdio preto, pedra molhada, névoa, luz prateada e reflexos âmbar; remover as logos geradas e deixar as frentes lisas para receber a arte original, sem letras ou novas peças. Os banners anteriores estão arquivados, mas não são carregados pelo topo. A tipografia é HTML acessível.

## Vídeo e credenciais

Original fornecido: `cherutti_editado_recomanda.MOV`, 64.137.492 bytes, 45,4 s, 1080 × 1920, HEVC. Versão web: `media/rafael-cheruti-growler.mp4`, 7.801.815 bytes, 720 × 1280, H.264 CRF 27, AAC 80 kb/s, 30 fps, faststart e sem metadados de edição. Redução aproximada de 88%, sem cortes de fala, alteração de áudio ou remoção das legendas incorporadas. Capa extraída em 38,5 s: `media/rafael-cheruti-capa.webp`.

Usa preload none, playsinline, botão destacado e reprodução somente após clique. Controles nativos disponíveis sem JavaScript; falha de reprodução mantém o botão. Bio curta: sommelier de cervejas, mestre em estilos e criador do Método Cerveja Descomplicada. Fonte consultada em 29/10/2026: https://hotmart.com/pt-br/marketplace/produtos/metodo-cerveja-descomplicada/M83432605I.

## Brinde

Popup com uma única imagem, sem borda ou galeria, inspirado no formato `bw-popup` da homepage. `images/bag-taphouse-popup.webp` mostra o growler com a bag em um tap house de fundo bem desfocado. Criado pelo gerador integrado, usando como referência a foto oficial do growler com bag da loja; prompt: manter o conjunto e a marca, trocar o fundo branco por balcão de madeira, torneiras e luzes âmbar desfocadas, tons petróleo, produto nítido e espaço escuro inferior sem texto. O botão petróleo está sobre a própria imagem, com “Ganhe a Bag na compra do Kit Mestre Cervejeiro”; apenas fecha a janela, não navega nem registra seleção de promoção. Oferta informada pelo proprietário, também exibida nos kits; não altera checkout. Abre uma vez por sessão, não interrompe vídeo/diálogo; reabre por “Conheça o brinde” e fecha por botão, Escape ou fundo, restaurando a rolagem.

## GA4 e UTMs

Usa exclusivamente o carregador da homepage, `G-FPEC1ZGMJQ`, sem um segundo `config` ou `page_view`. Grupo de conteúdo `chopeiras`, tipo de página `chopeira`. O carregador compartilhado mantém a lista de hosts públicos permitidos; nenhuma coleta é enviada por localhost ou prévias não autorizadas.

Eventos específicos:

- `view_item_list`: uma vez quando a primeira foto de produto fica pelo menos 50% visível; lista dos nove IDs.
- `view_item`: uma vez por produto, ao atingir 50% de visibilidade da sua foto.
- `select_item`: clique para ver o produto na loja, com ID, nome, lista e posição.
- `ontap_cta_click`: CTA do hero, sugestão de ocasião, navegação de modelos e saída para a categoria.
- `ontap_video_play`: reprodução efetiva, não apenas clique. `ontap_video_progress`: 25%, 50%, 75%, 100%, uma vez por carregamento.
- `view_promotion`: abertura da oferta `ontap26_bag`. O botão de fechar não registra seleção de promoção.
- `ontap_variant_scroll`: uso das setas da rolagem de variantes, com ID da lista e direção. Swipe e teclado permanecem nativos, sem coleta de gestos.
- `ontap_faq_open`: abertura de uma pergunta, por identificador fixo.
- `ontap_scroll`: marcos de 25%, 50%, 75% e 100%, uma vez por carregamento.

Todos incluem `campaign_id=ontap26`. O evento genérico `bufalo_store_click` da homepage continua funcionando. O clique de saída não é declarado como compra. A compra efetiva depende da medição e da atribuição configuradas na Loja Integrada. Não são enviados valores de formulários, telefone, e-mail ou texto livre.

Links comerciais desta página usam `utm_source=bufalo&utm_medium=landing_page&utm_campaign=ontap26`, com `utm_content` por produto/posição. Para divulgar a landing em redes sociais, por exemplo:

`https://www.bufalogrowler.com.br/produtos/chopeira/?utm_source=instagram&utm_medium=social&utm_campaign=ontap26`

A grafia correta do parâmetro é `utm_campaign`. Criar definições personalizadas com escopo de evento no GA4 para `campaign_id`, `cta_id`, `link_position`, `section_id` e `question_id` se esses campos forem usados nas Explorações. A criação da página não altera a administração da propriedade GA4.

Validação: `node tests/analytics.cjs`, `node tests/chopeira.cjs` e `node tests/chopeira-media.cjs`, além de inspeção responsiva, reprodução do vídeo e popup no navegador.
