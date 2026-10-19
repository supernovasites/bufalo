# Revisão dos cards da home e categorias — 19/10/2026

- Conferidos 130 destinos únicos de produtos e categorias na loja oficial, com 127 respostas válidas e três produtos removidos (404).
- Atualizados preços e parcelas de 136 cards estáticos, além dos produtos renderizados nas abas de térmicos, camping e achados. Os preços foram lidos das ofertas compráveis da loja, incluindo promoções.
- Caneca Bhadawari 710 ml adicionada aos Achados do mês, com sete cores, preço promocional de R$ 152,00, preço anterior de R$ 190,00 e até 6x de R$ 25,33.
- Seis produtos sem oferta disponível permanecem identificados como indisponíveis no catálogo, sem preço antigo apresentado como oferta e com acesso à categoria correspondente. Produtos indisponíveis foram retirados das abas dinâmicas da home.
- Cores indisponíveis foram retiradas dos seletores quando a loja fornece os respectivos IDs. A imagem inicial corresponde à primeira cor disponível.
- Conferidas 309 imagens reais da CDN; substituídas imagens removidas do Surti e da bolsa universal por fotos válidas dos respectivos produtos.
- `/categorias` e `/categorias/` passam a servir o catálogo existente; CSS e JS usam caminhos absolutos para funcionar nos dois endereços.
- Pacote local `dist` sincronizado. Sua geração permanece no fluxo existente do Cloudflare Pages.

Validação: sintaxe dos scripts das duas páginas; execução do renderizador dos três cards de achados; estrutura e seleção inicial dos 128 cards de catálogo; cinco testes de busca e componentes compartilhados. A inspeção visual via navegador não pôde ser realizada: a ferramenta de navegador falhou na inicialização. Preços e estoque representam a consulta desta data; não foi criada sincronização automática.
