# Categorias da live — revisão de 13/10/2026

As categorias agora seguem os 14 endereços fornecidos: chopeiras, nagpro, pandhar, cutelaria, mochilas, cadeiras, camisas-shorts, souvenir-e-jogos, alcas-e-bags, tampas-e-acessorios, adesivos, garrafas, copos-bg e carabinho-kids.

Foram consultadas as 14 páginas de categoria e 123 páginas distintas de produto. Foram encontrados 121 modelos com estoque e 387 combinações únicas de produto/cor/modelo disponíveis. Produtos pertencentes a mais de uma categoria aparecem nas categorias correspondentes: a página exibe 409 cards em 45 carrosséis.

Cada cor ou modelo tem um card próprio, com imagem, nome da variação, preço, desconto de 20%, cupom configurado no painel e link para a loja. Os tamanhos de uma mesma cor são agrupados no card e incluem somente combinações com estoque. Quando os tamanhos possuem preços diferentes, o preço é identificado como “a partir de”.

As variações foram incluídas somente quando a oferta específica do SKU informa `InStock`. Os seis SKUs explicitamente sem estoque foram excluídos; o registro está em `live-catalog-exclusions-2026-10-13.json`. Tábua de Corte Premium e Kit Frescobol MD não aparecem por estarem sem estoque. Cores antigas ausentes das grades atuais também não são transportadas do catálogo anterior.

As imagens das variações vêm da associação de imagem/cor da loja ou da correspondência de cor anteriormente validada. As 385 URLs inicialmente levantadas responderam 200; a foto alternativa do modelo de camiseta verde também foi conferida na loja. Quando a loja oferece apenas uma foto para várias cores, o card identifica a imagem como ilustrativa.

`live/catalog-data.json` contém o inventário revisado, sem SKUs indisponíveis. Para reconstruir os HTMLs após revisar esse inventário, execute `node scripts/build-live-catalog.mjs`. O HTML é estático, funciona sem uma consulta adicional e não depende do antigo reorganizador `category-groups.js`. As cópias em `dist/live/` são sincronizadas no build do catálogo; o CSS deve ser sincronizado quando editado.

Esta revisão é um retrato da consulta. Não há sincronização automática de estoque ou preço com a loja.

Validação: `node --test tests/live-store-categories.test.mjs tests/live-product-cards.test.mjs tests/live-challenge-coupons.test.mjs` — 16 testes.
