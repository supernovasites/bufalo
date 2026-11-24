# Retorno da equipe

- /retorno/: entrada com Retorno Chopeira e Retorno NPS.
- /retorno/retornochopeira/: atendimento original da pesquisa de saída, com mensagens e resultados preservados.
- /retorno/retornonps/: avaliações NPS, dados de contato, fotos protegidas e confirmação manual dos 500 pontos.

Todas as páginas usam /assets/site-shell.css, /assets/menu-search.css e /assets/site-shell.js. Não possuem cabeçalho ou rodapé próprios. O CSS de trabalho fica em /retorno/workspace.css e não altera os componentes compartilhados.

O middleware exige as sessões existentes do painel (administrador A ou colaborador C). Sem login, redireciona para /painel/?next=...; a volta aceita somente os três destinos de Retorno. Colaboradores com senha inicial precisam alterá-la no início de Retorno antes de acessar os atendimentos.

GET /retorno/api/nps lista as respostas com paginação de 50, busca por nome/e-mail/telefone e filtro de crédito. GET /retorno/api/nps-photo exige a mesma sessão. POST /retorno/api/nps-credit registra a confirmação do crédito manual, sem transferir pontos. Exige Origin do próprio site. Identidade e data são calculadas no servidor; o valor registrado é 500 pontos. A chave única por avaliação torna a marcação idempotente e mantém o primeiro funcionário e data. Não há opção de desmarcar para evitar perder esse registro.

Tabela chopeira_nps_credits criada no primeiro acesso, ou por migrations/0023_chopeira_nps_credits.sql. As avaliações históricas sem marcação aparecem como pendentes; registros originais são preservados. Respostas são identificadas pelo UUID da avaliação.

Sincronizar os arquivos estáticos de retorno/ e painel/ em dist/. Functions e migrations ficam na raiz. Validação: node tests/retorno-team.test.mjs.
