# Leilão da Manada

A seção fica após o Açaí Bowl e antes das categorias. O produto inicial usa a foto enviada do cooler. O leilão nasce pausado e em R$ 0,00; o administrador abre os lances pelo painel.

## Operação

Na administração da live, em **Produto e lances**, configure o nome e a descrição. A foto selecionada é otimizada no navegador e enviada ao servidor. Marque **Receber lances** e salve para iniciar; desmarque e salve para pausar.

O visitante toca em **Dar Lance**, informa nome, telefone com DDD e cidade e confirma o valor mostrado. Cada lance aceito soma exatamente R$ 100,00. Se outro participante mudar o valor antes da confirmação, o servidor rejeita a proposta antiga e o visitante precisa confirmar o novo valor. Reenviar a mesma requisição não cria outro lance.

Nome, cidade, valor e horário dos dois últimos lances são públicos; o telefone é acessível somente na consulta autenticada. A página consulta as atualizações a cada três segundos enquanto a aba está visível. Novos lances destacam o valor e o último participante, respeitando a preferência de movimento reduzido.

**Zerar leilão** abre uma nova rodada em R$ 0,00, remove os participantes da seção pública e pausa os lances. A foto e a descrição permanecem. O histórico de todas as rodadas é preservado e pode ser consultado em páginas de 100 registros; os horários aparecem no fuso de Fortaleza.

## Persistência e verificações

As tabelas `live_auction` e `live_auction_bids` ficam no D1 existente (`LIVE_DB`). A migração `0013_live_auction.sql` é idempotente; o primeiro acesso também prepara as tabelas automaticamente. O incremento e a validação de rodada/preço/estado ocorrem em um único `INSERT … SELECT`. O servidor valida a sessão administrativa, a origem dos POSTs, os dados e a imagem, e limita tentativas de lance por origem de rede.

Testes: `node --test tests/live-auction.test.mjs tests/live-challenge-coupons.test.mjs tests/live-store-categories.test.mjs tests/live-product-cards.test.mjs`.

A prévia local usa o mesmo handler com banco SQLite em memória. Seus dados são de demonstração e não são enviados ao leilão publicado.
