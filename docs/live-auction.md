# Oferta da Manada

A seção fica no final do conteúdo da live, antes do rodapé. O botão **Ir para a Oferta da Manada** no topo leva até ela. O produto inicial usa a foto enviada do cooler; a descrição configurada aparece abaixo da foto. A oferta nasce pausada e com valor inicial padrão de R$ 0,00.

## Operação

Na administração da live, em **Produto e propostas**, configure o nome, a descrição e o valor inicial. A foto selecionada é otimizada no navegador e enviada ao servidor. Marque **Receber propostas** e salve para iniciar; desmarque e salve para pausar. O controle de ativar/desativar a página fica na última seção do painel.

Sem propostas na rodada, o valor inicial é aplicado ao salvar. Havendo propostas, o preço corrente permanece e o novo valor inicial só vale após reiniciar. A primeira proposta é sempre o valor inicial acrescido de R$ 100,00 (por exemplo, início em R$ 500,00 → primeira proposta de R$ 600,00).

O visitante toca em **Eu quero** e preenche nome, telefone com DDD e cidade no formulário integrado logo abaixo da oferta. Cada proposta aceita soma exatamente R$ 100,00. Se outro participante mudar o valor antes da confirmação, o servidor rejeita a proposta antiga e o visitante precisa confirmar o novo valor. Reenviar a mesma requisição não cria outra proposta.

Nome, cidade, valor e horário das duas últimas propostas são públicos; o telefone é acessível somente na consulta autenticada. A página consulta as atualizações a cada três segundos enquanto a aba está visível. Novas propostas destacam o valor e o último participante, respeitando a preferência de movimento reduzido.

**Reiniciar oferta** abre uma nova rodada no valor inicial configurado, remove os participantes da seção pública e pausa as propostas. A foto e a descrição permanecem. O histórico de todas as rodadas é preservado e pode ser consultado em páginas de 100 registros; os horários aparecem no fuso de Fortaleza. A coluna **Produto da proposta** conserva o nome do produto no momento da proposta. Os telefones abrem o WhatsApp do participante, com código 55 para números brasileiros informados com DDD.

## Persistência e verificações

As tabelas `live_auction`, `live_auction_bids` e `live_auction_pricing` ficam no D1 existente (`LIVE_DB`). As migrações `0013_live_auction.sql` e `0014_live_auction_pricing.sql` são idempotentes; o primeiro acesso também prepara as tabelas automaticamente. O incremento e a validação de rodada/preço/estado ocorrem em um único `INSERT … SELECT`. O servidor valida a sessão administrativa, a origem dos POSTs, os dados e a imagem, e limita tentativas de proposta por origem de rede.

Testes: `node --test tests/live-auction.test.mjs tests/live-challenge-coupons.test.mjs tests/live-store-categories.test.mjs tests/live-product-cards.test.mjs`.

A prévia local usa o mesmo handler com banco SQLite em memória. Seus dados são de demonstração e não são enviados à oferta publicada.
