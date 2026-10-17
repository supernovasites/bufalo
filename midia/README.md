# Biblioteca de mídia

Gerenciador em `/midia/`, acessível pelo cartão **Biblioteca de mídia** em `/painel/`. O mesmo `admin_session` do painel protege página, scripts, listagem, upload, exclusão e restauração. As mutações exigem `Origin` igual ao domínio da requisição. A página não carrega analytics.

Uploads: JPG, PNG, WebP, GIF e PDF; até 10 arquivos por seleção. JPG/PNG/WebP são reprocessados localmente com canvas (até 1.600 px, mantendo proporção e transparência em WebP), removendo metadados EXIF. Entrada de até 15 MB e 40 megapixels; saída armazenada de até 1.500.000 bytes. GIF e PDF são conservados, com esse mesmo limite de saída. O servidor também limita o stream e verifica a assinatura do conteúdo e o MIME. SVG, HTML e executáveis não são aceitos.

Cada arquivo recebe um UUID e URL `/midia/arquivos/<uuid>.<ext>`. Esse endereço é público para permitir uso no site e nos emails. Não use para documentos privados. Imagens são servidas com MIME fixo, `nosniff` e CSP restritiva; PDFs são downloads com `Content-Disposition: attachment`. Nomes de arquivos não determinam caminhos. O cabeçalho `Cache-Control: public, max-age=0, must-revalidate` permite que uma exclusão seja verificada no acesso seguinte; cópias já baixadas ou conservadas por aplicativos de email não podem ser revogadas.

A ação Excluir, após confirmação, move o arquivo para a lixeira e torna seu link indisponível. Restaurar recupera o mesmo UUID e URL. Esta versão não faz eliminação definitiva nem limpeza automática da lixeira. Arquivos apagados continuam ocupando espaço, indicado na interface.

Armazenamento: D1 `LIVE_DB`, aproveitando a conexão existente do projeto, em tabela própria `media_files`. Não é necessário configurar um bucket ou serviço adicional. Limite inicial da biblioteca: 50.000.000 bytes incluindo a lixeira, conferido atomicamente no INSERT. A migração aditiva `0017_media_library.sql` é idempotente e também garantida pelo middleware no primeiro acesso. A página gerencia os uploads desta biblioteca; imagens antigas de `assets/`, blog e live mantêm seus fluxos próprios.

Ao editar a página, sincronize `midia/` com `dist/midia/` e `painel/index.html` com `dist/painel/index.html`, enquanto o Cloudflare usar o build legado. Para volumes grandes ou vídeos, migre o armazenamento para um bucket R2 com o mesmo controle de acesso administrativo.

Verificação: `node --test tests/media-library.test.mjs`. Cobre sessão, CSRF, limites, MIME/assinaturas, URLs, resposta HEAD, PDFs como download, filtros, paginação, cota e exclusão/restauração. Nenhum arquivo real é enviado pelos testes automatizados.
