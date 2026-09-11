# Búfalo Growler — site e painel

Página inicial responsiva, carrossel de fotos/vídeos a cada 2 segundos e painel com uploads, agendamento, acessos, origens e cliques.

## Publicação

Destino solicitado: https://bufalo.pages.dev e https://bufalo.pages.dev/admin.

No projeto Cloudflare Pages `bufalo`, conectado a este repositório:
- Branch de produção: `main`.
- Build: `node scripts/build.mjs`.
- Diretório de saída: `dist`.
- Compatibility date: `2026-09-11`.
- Binding D1: `DB`, banco `bufalo-site`.
- Binding R2: `MEDIA`, bucket `bufalo-banners`.
- Segredos: `ADMIN_PASSWORD_SALT` e `ADMIN_PASSWORD_HASH`.

Aplique as migrações em `migrations/` antes de publicar. O arquivo `wrangler.worker.jsonc` contém a configuração auxiliar D1/R2; preencha o ID real do banco antes de usá-lo. O upload via CLI usa `wrangler pages deploy dist --project-name bufalo` após executar o build. Credenciais, senhas, hashes reais, uploads e dados locais ficam fora do GitHub.

O login verifica PBKDF2-SHA256 com 100.000 iterações, salt aleatório e 32 bytes. Sessões opacas duram oito horas, usam cookies HttpOnly/SameSite/HTTPS e podem ser revogadas pelo botão Sair. São permitidas dez tentativas por IP a cada janela de quinze minutos. Sem autenticação configurada, o servidor bloqueia o painel e suas APIs.

## Prévia local

Instale dependências com `pnpm install --frozen-lockfile`. Configure `.dev.vars` a partir do exemplo e execute `node scripts/preview.mjs`. Página inicial em http://127.0.0.1:8787 e painel em /admin. D1 e R2 locais persistem em `.local-state`.

## Gerenciamento

Carregue JPG, PNG, WebP, GIF, MP4 ou WebM de até 30 MB na biblioteca. Crie um banner escolhendo mídia desktop e opcionalmente mobile, descrição, link e agendamento. Salve e recarregue o site para atualizar. Banners podem ser arquivados e restaurados. Vídeos tocam sem som por dois segundos a cada passagem. Há pausa manual e respeito a movimento reduzido. Não há transcodificação.

## Relatórios

A medição começa após consentimento. Registra sessões, páginas vistas, exposição/clique de banners, cliques externos, UTM, domínio de origem, dispositivo e país aproximado. Não registra IPs de visitantes nos relatórios. Sessões expiram após 30 minutos; exposições e cliques por banner são deduplicados por carregamento. Exportação CSV e histórico de alterações estão disponíveis.

Os dados medem interesse, não vendas. Não há integração de pedidos/Prax/GA4. Produtos, preços e imagens iniciais são uma cópia estática, sem sincronização com a loja. Os relatórios exibem no máximo 90 dias. A limpeza programada exige configurar separadamente um Worker com Cron; Pages não executa o handler scheduled incluído no código auxiliar.

## Validação

`node --test tests/*.test.mjs` cobre D1/R2, uploads, publicação, agendamento, métricas, CSRF, login, expiração, logout e bloqueio por tentativas. `node scripts/build.mjs` gera o pacote Pages em `dist`. A prévia desktop/mobile foi verificada em navegador.

Publicação inicial concluída em https://bufalo.pages.dev, por upload direto via Wrangler. O GitHub contém o código, mas a republicação automática não está configurada. D1 e senha estão configurados. Uploads aguardam ativação do R2 na conta.
