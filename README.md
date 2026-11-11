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

`assets/site-shell.js` é a fonte única dos modelos de cabeçalho, menu, faixa superior e rodapé. `assets/site-shell.css` é a fonte única dos estilos desses componentes. As páginas usam os marcadores `data-bg-header`, `data-bg-footer` e `data-bg-announcement`; os componentes são aplicados automaticamente ao carregar a página. Os HTMLs usam espaços de montagem para os componentes compartilhados. Altere os arquivos compartilhados para atualizar homepage, catálogo, Círio, Manada ONE, copos, garrafas e live na mesma publicação. Não crie versões particulares do cabeçalho e rodapé nas páginas. Para novas páginas, inclua esses marcadores e os mesmos links para CSS/JS absolutos. A busca usa `assets/menu-search.js` em todas as páginas com o cabeçalho compartilhado. Mantenha as cópias de `dist/assets` sincronizadas na publicação.

## Mesa de DJ

O botão **Abrir mesa de DJ** no card da Live em `/painel/` leva a `/live/mesadj/`. A página, seus arquivos e os áudios em `live/mesadj/sons/` exigem a sessão administrativa do painel. A mesa inclui Foguinho · Gaby Amarantos (Karaokê), Fundo do Chaves, Trilha de fundo da live e 11 efeitos sonoros fornecidos pela equipe, com reprodução e pausa, reinício, parada, busca na faixa, repetição, volume por faixa e volume geral. A Trilha espera do sorteio foi retirada da mesa. Os sons podem se sobrepor. Os atalhos 1 a 9 controlam as faixas 1 a 9; Shift + 1 a 5 controlam as faixas 10 a 14; Esc para todas. O Foguinho inicia com a repetição dos primeiros 30 segundos ativada: após clicar em Tocar, volta ao início automaticamente a cada 30 segundos até pausar ou parar. Desmarcar a repetição permite tocar a faixa completa. Nenhum áudio começa automaticamente. O som sai no dispositivo da operação; para entrar na transmissão, configure a captura desse áudio no aplicativo usado para transmitir a live. As cópias de `dist/live/mesadj/` devem acompanhar o pacote publicado.

A trilha longa da mesa está em `live/mesadj/sons/trilha-live.m4a`, convertida para AAC a 48 kb/s para ficar abaixo do limite de arquivo da hospedagem, com a duração completa de 59min55s. A interface organiza os 14 painéis compactos nas seções Sons de fundo (Foguinho no início, Fundo do Chaves e Trilha de fundo da live) e Efeitos sonoros (os 11 efeitos), sem discos decorativos; no celular, volume geral e parada ficam disponíveis durante a rolagem.

## Sorteios da live

Em `/painel/`, use **Abrir página de sorteio** para acessar `/live/sorteio/`, protegida pela mesma sessão administrativa. Cole até 5.000 nomes, um por linha, e clique em **Sortear**. **Sortear novamente** troca o candidato sem publicá-lo; **Confirmar sorteado** publica o nome e o troféu no primeiro espaço vazio: 1º às 15h15, 2º às 16h e 3º às 16h40. Os horários são informativos; a equipe conduz e confirma cada sorteio.

A confirmação abre uma comemoração com fogos dourados e uma fanfarra sintetizada no navegador, com opção de desligar o som e respeito à preferência de movimento reduzido. Nomes repetidos contam uma vez e ganhadores confirmados ficam fora dos sorteios seguintes. **Limpar nomes** apaga participantes e candidato; Cada ganhador tem seu próprio botão **Limpar sorteado**, que remove apenas aquele resultado da administração e da live. Os outros ganhadores e a lista de participantes são preservados; o próximo sorteio preenche o primeiro espaço vazio.

O estado fica no D1, com controle de versão contra operações simultâneas. A API pública expõe somente os ganhadores confirmados; lista e candidato exigem autenticação. A live consulta resultados a cada três segundos enquanto está visível. Os resultados permanecem até a equipe limpar, inclusive ao mudar a data da live. A tabela é criada no primeiro acesso, e `migrations/0015_live_raffle.sql` pode ser aplicada repetidamente. Mantenha os novos arquivos de `dist/live/sorteio/` e `dist/live/raffle*` no pacote publicado. Testes: `node --test tests/live-raffle.test.mjs`.

## Cupons do Desafio da Manada

Em `/live/admin`, a seção **Desafio da Manada** permite salvar um cupom para cada um dos quatro desafios. Os códigos são persistidos no D1 e revelados, com opção de copiar, após a conclusão do respectivo quebra-cabeça. Cada desafio possui um campo de desconto inteiro de 1% a 100%, usado na porcentagem, no preço e na economia exibidos. A recompensa informa 3 cupons disponíveis.

Até a primeira configuração, os quatro desafios usam o cupom do dia. Depois de salvar os cupons dos desafios, alterar o cupom do dia não os substitui. Páginas da live já abertas precisam ser recarregadas para receber os novos códigos.

As tabelas `live_challenge_coupons` e `live_challenge_discounts` são criadas no primeiro salvamento autenticado; as migrações idempotentes `0011_live_challenge_coupons.sql` e `0012_live_challenge_discounts.sql` também podem ser aplicadas pelo fluxo de migrations do projeto. Os descontos existentes permanecem em 20% até nova configuração. Cupom e percentual são salvos juntos em uma transação. Verificação: `node --test tests/live-challenge-coupons.test.mjs`.

## Cabeçalho e rodapé em todas as páginas públicas

Homepage, catálogo, blog/artigos, produtos, campanhas, Live (ativa e encerrada), Manada ONE, ManadaCash, playground e pré-reserva usam os mesmos componentes de `assets/site-shell.js` e `assets/site-shell.css`. A marcação das páginas contém apenas os espaços `data-bg-header` e `data-bg-footer`; o componente inclui a faixa compartilhada de mensagens, menu, conta, busca, carrinho e bandeiras de pagamento. Não crie cópias locais desses componentes. Atualize os arquivos compartilhados para refletir a mudança em todas as páginas, inclusive a homepage.

Carregue `/assets/site-shell.css` com `data-bg-shell-style` e `/assets/site-shell.js` sem versões fixas no endereço. O servidor obriga revalidação desses arquivos para que páginas antigas recebam as atualizações. Inclua os mesmos dois recursos e espaços em novas páginas públicas. Os painéis operacionais, o checkout e as rotas que apenas redirecionam mantêm suas interfaces específicas.

Verificação: `node --test tests/site-shell.test.mjs`.

## Retorno de atendimentos e colaboradores

Em /retorno/, a equipe entra com as mesmas credenciais de /painel/. O administrador existente é perfil A; PANEL_NAME pode definir seu nome de exibição. Em /painel/usuarios/, somente A cadastra e altera colaboradores C (nome, usuário, senha e situação). C utiliza uma sessão exclusiva, sem autorização para os demais painéis e APIs administrativos. Editar ou desativar um colaborador encerra suas sessões. Senhas C usam PBKDF2-SHA256 com salt individual; não são retornadas pela API.

Retorno separa contatos por origem/produto (atualmente a pesquisa de Chopeira), com paginação. A mensagem aceita [nome cliente] e [nome funcionário], usando o nome do usuário autenticado. Abrir WhatsApp prepara a conversa; o funcionário confirma o envio no WhatsApp. Isso não marca atendimento como respondido. Salvar um resultado não vazio registra o atendimento, nome do funcionário e data, e muda o status para Respondido. O resultado pode ser editado. Nas estatísticas, ao selecionar Chopeira, os contatos e seus resultados permanecem visíveis, com link para /retorno/.

As tabelas team_users, team_sessions, chopeira_survey_attendance e chopeira_attendance_staff são criadas automaticamente sem remover pesquisas ou sessões administrativas existentes. Inclua retorno/ e painel/usuarios/ no pacote dist. Verificação: node --test tests/retorno-team.test.mjs tests/chopeira-survey.test.mjs tests/site-statistics.test.mjs.

Novos colaboradores recebem sempre a senha inicial 1234. Em /painel/usuarios/, o administrador pode redefinir a senha para esse padrão, encerrando todas as sessões do colaborador. O login exige senha pessoal de 10 a 128 caracteres antes de liberar os contatos, inclusive por API. Cadastros existentes mantêm sua senha até uma redefinição.

A gestão de colaboradores não exibe mais o controle Usuário ativo: novos cadastros e edições ficam ativos. Somente administradores A cadastram, editam, redefinem senha e removem colaboradores C. Remover um colaborador encerra suas sessões e exclui seu acesso, preservando resultados e nomes no histórico de atendimentos.

## Visibilidade da seção ManadaCash na live

Em `/live/admin`, o card **Seção ManadaCash** permite ocultar ou exibir a seção de presença (Primeiro Cadastro / Já sou da Manada). A configuração é persistida no D1, exige sessão administrativa e aparece na página pública após recarregar. Por padrão, a seção permanece visível. A tabela `live_manadacash` é criada no primeiro salvamento. O botão flutuante de consulta de pontos continua independente.
## Fotos do Momento BG

Em `/live/admin`, carregue até cinco imagens individualmente, com prévia e progresso de envio. Marque **Exibir no Momento BG** na foto salva que deseja mostrar. A seleção é persistida no D1 e a live aberta a consulta a cada três segundos, mantendo uma única imagem visível. As proporções originais são preservadas. Enviar outra foto para um espaço não selecionado não altera a foto ao vivo; substituir o espaço selecionado atualiza a imagem exibida. A foto anterior permanece até a primeira seleção.

A tabela de seleção é criada no primeiro salvamento autenticado; `migrations/0019_live_moment.sql` também pode ser aplicada repetidamente. Verificação: `node --test tests/live-moment.test.mjs`.

A Mesa DJ inclui blink-182 · I Miss You e Game of Thrones · Main Theme (Extended) em Sons de fundo, com volume máximo de 3% e atalhos 5 e 6.
