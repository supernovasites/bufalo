# Interface da loja

A lupa ao lado do carrinho abre o menu e foca a busca. `assets/menu-search.js` consulta `GET /api/catalog-search` enquanto o cliente digita e exibe sugestões de produtos da Loja Integrada. Não há assistente de IA. Cada categoria exibe uma foto de produto verificado no respectivo destino, registrada em `assets/menu-categories.json`. Carregue também `assets/menu-search.css` no bloco da integração. O menu flutuante é montado somente quando a página nativa tem a classe `pagina-produto`; não aparece em categorias, busca, conta ou carrinho.

O menu de categorias segue a lista de 14 categorias definida para o site. O cabeçalho da loja mostra apenas menu, logo e carrinho; a lupa exibe o rótulo “Ache Aqui” nos cabeçalhos compartilhados. `assets/cart-count.js` acompanha a quantidade nativa (`#cabecalho .qtd-carrinho`) e atualiza o selo do carrinho. Na homepage e nas páginas com o cabeçalho compartilhado, uma iframe oculta da própria loja transmite somente a quantidade, com validação de origem, janela e token da solicitação. A consulta é renovada ao retornar à página. Nenhum dado de produtos, cliente ou sessão é transmitido ao site. Se a loja não puder ser consultada, o site mantém o ícone sem inventar uma quantidade.

`assets/loja-integrada-shell.js` e `.css` reproduzem o cabeçalho centralizado e os cinco atalhos da homepage sobre o Grand Store. A integração é adicionada como um código HTML separado, no rodapé, em **Todas as páginas exceto checkout**:

```html
<link rel="stylesheet" href="https://www.bufalogrowler.com.br/assets/site-shell.css">
<link rel="stylesheet" href="https://www.bufalogrowler.com.br/assets/loja-integrada-shell.css">
<script src="https://www.bufalogrowler.com.br/assets/loja-integrada-shell.js" defer></script>
```

O código não remove elementos nem altera scripts, preços, estoque, carrinho ou personalização. Após montar a interface, esconde apenas o cabeçalho e os atalhos anteriores. O novo menu conserva as categorias nativas e os acessos à conta, pedidos, favoritos e redes sociais. ManadaCash aciona o botão do programa instalado; caso ainda não esteja carregado, usa o acesso da homepage.

As fotos da galeria ficam limitadas a 360 px no desktop e 260 px no celular; miniaturas, zoom e atributos nativos são mantidos. O checkout permanece com seus controles próprios. Para reverter, remova apenas este bloco HTML no painel da Loja Integrada. O tema e os demais códigos continuam instalados.

## Carrinho e checkout

No CSS Avançado, importe `https://www.bufalogrowler.com.br/assets/loja-integrada-commerce.css?v=20261018-commerce` antes das demais regras, preservando o CSS existente. Essa camada modifica somente a apresentação de `body.pagina-carrinho` e `body.carrinho-checkout`; os formulários, pagamentos e validações permanecem nativos. O checkout usa seu próprio cabeçalho e não recebe o script do shell.

Na homepage, `data-bg-home` restaura os mesmos cinco atalhos da loja, sem destaque no ManadaCash. As demais páginas continuam sem o menu flutuante.
