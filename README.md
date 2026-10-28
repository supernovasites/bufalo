# Búfalo Growler

Site estático: https://bufalo.pages.dev/

- `index.html`: página inicial com banners interativos e link Ver todos para o catálogo.
- `catalogo.html`: 149 produtos em dez categorias, com busca, filtros e ordenação. Preços e disponibilidade consultados em 14/09/2026; o catálogo é uma fotografia dessa consulta e não sincroniza automaticamente com a loja.
- `assets/`: imagens e vídeos do site.
- `midia/`: biblioteca de imagens e PDFs com upload, links públicos, busca e lixeira; gerenciamento protegido pelo painel. Consulte o [guia da biblioteca](midia/README.md).
- `mkt/email/`: editor de templates, importação de contatos CSV/Excel e campanhas de email, protegido pela sessão de `/painel/`. A configuração do Resend e os limites de operação estão no [guia da área](mkt/email/README.md). O envio permanece bloqueado até configurar o provedor e ativá-lo explicitamente.

## Publicação automática

O Cloudflare Pages está conectado à branch main deste repositório. Novos commits disparam o deploy automaticamente.

Comando de build com as áreas administrativas e de email incluídas:

```sh
mkdir -p dist && cp index.html catalogo.html 404.html _redirects dist/ && cp -R assets dist/assets && cp -R produtos dist/produtos && cp -R mkt painel midia dist/
```

Diretório publicado: `dist`. Não há dependências de execução. Os links de compra direcionam à loja oficial.


A página de pré-reserva do Açaí Bowl está em `reserva/acaibowl/`, com formulário integrado ao Google Sheets (Nome, Telefone, Email e Cidade). Consulte o README dessa pasta para editar a página. O endereço anterior `/landingpage/` redireciona para `/reserva/acaibowl/`.

## Páginas de produtos

As páginas de copos e garrafas, incluindo HTML, CSS, vídeos e posters, ficam em `produtos/copos/` e `produtos/garrafas/`. Não há cópias em `assets/pages/` nem funções que dependam desse caminho. Os endereços antigos redirecionam permanentemente para `/produtos/`.

`dist/produtos/` contém o pacote publicado dessas páginas, seguindo a estrutura de publicação já usada por outras páginas do projeto. Ao editar as páginas, atualize também esse pacote enquanto o build do Cloudflare continuar usando o comando anterior. O comando acima copia `produtos/` durante o build.


## Busca de produtos

A lupa e o formulário do menu exibem sugestões de produtos cadastrados na Loja Integrada, sem IA. `GET /api/catalog-search?q=nome` consulta a busca pública da loja e retorna até seis produtos, com foto, nome e link. O catálogo verificado das categorias serve como contingência caso a loja não responda. O antigo endpoint de IA retorna 410 e não utiliza Workers AI.

`assets/menu-search.js` trata sugestões, teclado e buscas canceladas; `assets/menu-search.css` define as miniaturas e restringe atalhos flutuantes às páginas de produto. `assets/menu-categories.json` registra os produtos verificados em cada categoria.

## Cabeçalho e rodapé compartilhados

`assets/site-shell.js` é a fonte única dos modelos de cabeçalho, menu, faixa superior e rodapé. `assets/site-shell.css` é a fonte única dos estilos desses componentes. As páginas usam os marcadores `data-bg-header`, `data-bg-footer` e `data-bg-announcement`; os componentes são aplicados automaticamente ao carregar a página. Os HTMLs existentes permanecem como fallback sem JavaScript. Altere os arquivos compartilhados para atualizar homepage, catálogo, Círio, Manada ONE, copos, garrafas e live na mesma publicação. Não edite os fallbacks para mudanças de componentes. Para novas páginas, inclua esses marcadores e os mesmos links para CSS/JS absolutos. A busca usa `assets/menu-search.js` em todas as páginas com o cabeçalho compartilhado. Mantenha as cópias de `dist/assets` sincronizadas na publicação.

## Mesa de DJ

O botão **Abrir mesa de DJ** no card da Live em `/painel/` leva a `/live/mesadj/`. A página, seus arquivos e os áudios em `live/mesadj/sons/` exigem a sessão administrativa do painel. A mesa inclui Fundo do Chaves, Trilha de fundo da live e 11 efeitos sonoros fornecidos pela equipe, com reprodução e pausa, reinício, parada, busca na faixa, repetição, volume por faixa e volume geral. A Trilha espera do sorteio foi retirada da mesa. Os sons podem se sobrepor. Os atalhos 1 a 9 controlam as faixas 1 a 9; Shift + 1 a 4 controlam as faixas 10 a 13; Esc para todas. Nenhum áudio começa automaticamente. O som sai no dispositivo da operação; para entrar na transmissão, configure a captura desse áudio no aplicativo usado para transmitir a live. As cópias de `dist/live/mesadj/` devem acompanhar o pacote publicado.

A trilha longa da mesa está em `live/mesadj/sons/trilha-live.m4a`, convertida para AAC a 48 kb/s para ficar abaixo do limite de arquivo da hospedagem, com a duração completa de 59min55s. A interface organiza os 13 painéis compactos nas seções Sons de fundo (Fundo do Chaves e Trilha de fundo da live) e Efeitos sonoros (os 11 efeitos), sem discos decorativos; no celular, volume geral e parada ficam disponíveis durante a rolagem.

## Sorteios da live

Em `/painel/`, use **Abrir página de sorteio** para acessar `/live/sorteio/`, protegida pela mesma sessão administrativa. Cole até 5.000 nomes, um por linha, e clique em **Sortear**. **Sortear novamente** troca o candidato sem publicá-lo; **Confirmar sorteado** publica o nome e o troféu no primeiro espaço vazio: 1º às 15h15, 2º às 16h e 3º às 16h40. Os horários são informativos; a equipe conduz e confirma cada sorteio.

A confirmação abre uma comemoração com fogos dourados e uma fanfarra sintetizada no navegador, com opção de desligar o som e respeito à preferência de movimento reduzido. Nomes repetidos contam uma vez e ganhadores confirmados ficam fora dos sorteios seguintes. **Limpar nomes** apaga participantes e candidato; Cada ganhador tem seu próprio botão **Limpar sorteado**, que remove apenas aquele resultado da administração e da live. Os outros ganhadores e a lista de participantes são preservados; o próximo sorteio preenche o primeiro espaço vazio.

O estado fica no D1, com controle de versão contra operações simultâneas. A API pública expõe somente os ganhadores confirmados; lista e candidato exigem autenticação. A live consulta resultados a cada três segundos enquanto está visível. Os resultados permanecem até a equipe limpar, inclusive ao mudar a data da live. A tabela é criada no primeiro acesso, e `migrations/0015_live_raffle.sql` pode ser aplicada repetidamente. Mantenha os novos arquivos de `dist/live/sorteio/` e `dist/live/raffle*` no pacote publicado. Testes: `node --test tests/live-raffle.test.mjs`.

## Cupons do Desafio da Manada

Em `/live/admin`, a seção **Desafio da Manada** permite salvar um cupom para cada um dos quatro desafios. Os códigos são persistidos no D1 e revelados, com opção de copiar, após a conclusão do respectivo quebra-cabeça. Cada desafio possui um campo de desconto inteiro de 1% a 100%, usado na porcentagem, no preço e na economia exibidos. A recompensa informa 3 cupons disponíveis.

Até a primeira configuração, os quatro desafios usam o cupom do dia. Depois de salvar os cupons dos desafios, alterar o cupom do dia não os substitui. Páginas da live já abertas precisam ser recarregadas para receber os novos códigos.

As tabelas `live_challenge_coupons` e `live_challenge_discounts` são criadas no primeiro salvamento autenticado; as migrações idempotentes `0011_live_challenge_coupons.sql` e `0012_live_challenge_discounts.sql` também podem ser aplicadas pelo fluxo de migrations do projeto. Os descontos existentes permanecem em 20% até nova configuração. Cupom e percentual são salvos juntos em uma transação. Verificação: `node --test tests/live-challenge-coupons.test.mjs`.
