# Revisão dos cards da live — 13/10/2026

- Inventário: 150 cards de catálogo, distribuídos em 27 carrosséis, mais os quatro cards de recompensa dos desafios.
- Conferidos 78 destinos de produtos na loja oficial: 76 respondem corretamente; Copo Surti 600 ml e Boné Trucker Manada BG retornam 404 e não constam no sitemap atual. Seus cards foram preservados, marcados como indisponíveis e apontam para as categorias oficiais correspondentes.
- Verificadas 218 URLs de imagens e variações: 212 responderam corretamente e seis imagens removidas foram substituídas por imagens válidas do mesmo modelo. Nas cores descontinuadas, a imagem é identificada como ilustrativa.
- Atualizados Banni de R$ 99,00 para R$ 140,00 (R$ 112,00 com 20%) e Unibag de R$ 96,00 para R$ 120,00 (R$ 96,00 com 20%), incluindo os preços usados pelos seletores de cor.
- Nove cards indisponíveis continuam visíveis: Banni Chetwode Blue, Niliravi Chetwode Blue, Guará Barley White, Silo Branco, Mediterrâneo Preto, duas cores do Surti, Boné Manada BG e Boné Trucker Camuflagem Branco. A indisponibilidade é indicada no card e a oferta/cupom foi retirada desses itens.
- Links da foto e da compra foram separados nos cards que envolviam todo o conteúdo em um link. Copiar cupom cancela a navegação antes da operação assíncrona.
- As setas dos carrosséis se atualizam quando a organização das categorias move cards entre listas. Trocas de cor respeitam o desconto informado no próprio card.
- Os preços e a disponibilidade são um retrato da consulta de 13/10/2026; não há sincronização automática com estoque da loja.

Validação automatizada: `node --test tests/live-product-cards.test.mjs tests/live-challenge-coupons.test.mjs` (13 testes). Arquivos `live/` e `dist/live/` sincronizados.
