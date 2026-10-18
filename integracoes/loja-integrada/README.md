# Interface da loja

`assets/loja-integrada-shell.js` e `.css` reproduzem o cabeçalho centralizado e os cinco atalhos da homepage sobre o Grand Store. A integração é adicionada como um código HTML separado, no rodapé, em **Todas as páginas exceto checkout**:

```html
<link rel="stylesheet" href="https://www.bufalogrowler.com.br/assets/site-shell.css">
<link rel="stylesheet" href="https://www.bufalogrowler.com.br/assets/loja-integrada-shell.css">
<script src="https://www.bufalogrowler.com.br/assets/loja-integrada-shell.js" defer></script>
```

O código não remove elementos nem altera scripts, preços, estoque, carrinho ou personalização. Após montar a interface, esconde apenas o cabeçalho e os atalhos anteriores. O novo menu conserva as categorias nativas e os acessos à conta, pedidos, favoritos e redes sociais. ManadaCash aciona o botão do programa instalado; caso ainda não esteja carregado, usa o acesso da homepage. Compre com IA abre o assistente da homepage em outra aba, mantendo a página do produto aberta.

As fotos da galeria ficam limitadas a 360 px no desktop e 260 px no celular; miniaturas, zoom e atributos nativos são mantidos. O checkout permanece com seus controles próprios. Para reverter, remova apenas este bloco HTML no painel da Loja Integrada. O tema e os demais códigos continuam instalados.
