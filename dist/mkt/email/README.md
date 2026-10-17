# Email marketing da Búfalo

Área administrativa em `/mkt/email/`, acessível pelo cartão **Email marketing** de `/painel/`. Usa o cookie de sessão do painel, validado no servidor contra `LIVE_DB`. Páginas, scripts, arquivos de modelo e APIs administrativas exigem essa sessão. Descadastro e webhook são as únicas rotas públicas; seus tokens e assinaturas são validados. A área não carrega analytics de visitantes.

## O que está disponível

- Editor por campos de texto, imagem e botão; três modelos (produto, editorial e carta), personalização `{{nome}}`, prévia em desktop/celular e exportação de HTML.
- Templates reutilizáveis e campanhas em rascunho persistidos no D1. Não aceita HTML arbitrário; texto e nomes são escapados no HTML gerado.
- Exclusão recuperável de templates, com confirmação e restauração em “Templates excluídos”. A exclusão não modifica cópias usadas em campanhas.
- Aba Resultados: dashboards gerais e por campanha, comparação das 100 campanhas mais recentes, funil, evolução diária, links, filtros, paginação, histórico por destinatário e exportação CSV dos resultados filtrados. Atualização a cada 30 segundos enquanto visível, sem iniciar envios.
- Importação local de CSV, XLSX e XLS, seleção da aba e mapeamento das colunas. Cabeçalho na primeira linha. Até 2 MB e 5.000 contatos por arquivo. CSV aceita vírgula, ponto e vírgula, tabulação, BOM e campos entre aspas; há fallback Windows-1252 para arquivos legados.
- Validação sintática conservadora de emails, normalização para minúsculas, deduplicação e relatório de linhas inválidas. Não há comprovação de existência da caixa postal.
- Importação em blocos de 250 registros, com retomada e deduplicação no servidor. Apenas nome, email, origem e registro da autorização são armazenados; a planilha original não é enviada nem conservada.
- Contatos descadastrados, rejeitados ou que reclamaram nunca são reativados pela reimportação.
- Teste para um único endereço, revisão final com confirmação `ENVIAR`, fila persistida, pausa/retomada e relatório de aceitação, entrega, rejeição e reclamação.

## Configuração do Resend e Cloudflare

O cadastro no Resend pelo GitHub identifica a conta, mas não configura o envio deste sistema. Cadastre os valores abaixo **somente nas variáveis/segredos de produção do projeto Cloudflare Pages `bufalo`**. Não grave chaves no Git, em arquivos públicos ou no JavaScript do navegador.

| Variável | Valor |
| --- | --- |
| `RESEND_API_KEY` (segredo) | Chave do Resend com permissão de envio, limitada ao domínio usado quando possível. |
| `MKT_FROM_EMAIL` | Caixa no domínio/subdomínio verificado no Resend, por exemplo `novidades@seu-dominio-verificado`. |
| `MKT_REPLY_TO` | Email monitorado pela equipe para respostas. |
| `MKT_COMPANY_ADDRESS` | Endereço postal da empresa que aparecerá no rodapé. |
| `MKT_PUBLIC_ORIGIN` | `https://www.bufalogrowler.com.br` (padrão). Sem barra final. |
| `RESEND_WEBHOOK_SECRET` (segredo) | Segredo `whsec_…` do webhook criado no Resend. |
| `MKT_ENABLED` | `true` somente depois de configurar e testar o remetente. Qualquer outro valor bloqueia testes e disparos. |

1. Adicione um domínio de envio no Resend e publique no DNS os registros fornecidos por ele. Aguarde a verificação de SPF/DKIM. Configure DMARC de acordo com os demais serviços de email do domínio. Use remetente compatível com o domínio ou subdomínio efetivamente verificado.
2. Crie uma chave de envio e cadastre-a como segredo `RESEND_API_KEY` no Cloudflare Pages.
3. No Resend, crie um webhook HTTPS para `https://www.bufalogrowler.com.br/mkt/email/webhook`, com os eventos `email.sent`, `email.delivered`, `email.delivery_delayed`, `email.bounced`, `email.complained`, `email.failed`, `email.suppressed`, `email.opened` e `email.clicked`. Cadastre o segredo de assinatura no Cloudflare. Para métricas de interação, habilite também o rastreamento de abertura e clique no domínio de envio. O código não altera essas preferências da conta Resend.
4. Preencha os demais valores e publique um novo deployment para as configurações entrarem em vigor. Não coloque os segredos no ambiente de preview. O código também bloqueia envio fora do domínio canônico e em branches de preview.
5. Acesse pelo painel, salve um template, importe uma lista de teste autorizada e envie um email de teste. Confira assunto, links, caixa de spam, remetente e aparência em aplicativos reais.
6. Faça a primeira campanha para uma lista pequena da equipe, confirme as entregas pelo webhook e valide o descadastro. Só então aumente os volumes respeitando os limites do plano Resend e a reputação do domínio.

O sistema não consulta DNS nem o status de verificação no Resend. A indicação “Envio configurado” significa que os valores necessários estão presentes; a confirmação de aceitação vem do provedor. Nenhum email é disparado durante build, abertura da página, importação ou salvamento.

## Funcionamento dos lotes

- O disparo congela conteúdo e destinatários ativos em uma campanha. Campanhas iniciadas ficam imutáveis; para uma nova mensagem, crie outra campanha.
- Cada pedido processa até 10 emails, com um destinatário por mensagem. Não usa listas em `To`/`Cc`/`Bcc` compartilhadas.
- A aba administrativa chama o próximo lote a cada 1,2 segundo. **É necessário manter a aba aberta.** Ao fechá-la, os lotes ainda não iniciados aguardam a retomada. Não há agendamento nem Worker cron nesta versão.
- Há trava de processamento global no D1. Pausar impede novos lotes; um lote já aceito pelo provedor pode terminar.
- O corpo e o identificador de cada lote são salvos antes da chamada ao Resend. Se uma resposta for perdida, uma nova tentativa usa exatamente o mesmo corpo e `Idempotency-Key`. Não repetimos automaticamente chamadas que falharam; o operador deve conferir o aviso e retomar.
- Respostas incertas ficam bloqueadas depois de 23 horas (abaixo da janela de 24 horas do Resend) ou caso um contato do lote seja suprimido. **Não apague a tentativa para forçar reenvio.** Confira os emails no Resend antes de uma conciliação manual no banco. Essa decisão impede duplicação e desrespeito a um descadastro quando o resultado de um pedido é desconhecido.
- Um HTTP 429 ou erro de configuração preserva o lote. Ajuste a conta/limite, aguarde e retome. Não há promessa de envio além da cota do provedor.
- “Aceito” não significa “entregue”. Os resultados finais dependem dos webhooks. A assinatura HMAC/Svix é verificada com tolerância de cinco minutos; eventos repetidos são idempotentes. Eventos que chegam antes da conciliação do lote recebem erro temporário para repetição pelo provedor. Sem aberturas/cliques individuais ou pixels de rastreamento nesta versão.
- O corpo HTML usa tabelas de apresentação e CSS inline, oferece versão de texto e texto alternativo das imagens. A aparência real depende do cliente de email.

## Descadastro e dados pessoais

Todo email de campanha inclui link individual com token aleatório e os cabeçalhos `List-Unsubscribe` e `List-Unsubscribe-Post`. GET apenas mostra a confirmação, protegendo contra scanners de links; POST registra o descadastro sem exigir login. O token não contém o email. O próximo lote reconsulta supressões globais.

Registre a origem e a autorização real dos contatos; a confirmação no painel documenta a declaração do operador, mas não substitui os comprovantes de consentimento ou outra base aplicável. Não importe listas compradas. Respeite solicitações de acesso/exclusão conforme a política da empresa; a primeira versão não tem exclusão em massa no painel. A equipe deve definir prazo de retenção e procedimento de remoção no D1. Preserve uma supressão mínima, quando aplicável, para impedir reimportação de descadastros. Não exporte dados pessoais para issues/PRs ou logs.

## Banco e publicação

Reutiliza o binding `LIVE_DB`. A migration idempotente `migrations/0015_email_marketing.sql` cria tabelas `mkt_*`, sem alterar as tabelas existentes. A API autenticada também inicializa esse esquema na primeira utilização, seguindo o padrão do repositório. `functions/_lib/email-schema.js` contém a mesma SQL para execução no Worker; o teste verifica paridade.

Mantenha os arquivos de `mkt/email/`, `painel/index.html` e `assets/vendor/` sincronizados em `dist/` enquanto a publicação usar o pacote estático rastreado. `_redirects` deve ser copiado para `dist/`. A lógica de backend fica em `functions/mkt/email/_middleware.js` e `functions/_lib/email-marketing.js`.

## Verificação

```sh
node --test tests/email-marketing.test.mjs
node --test tests/analytics.cjs
git diff --check
```

Os testes usam SQLite em memória e um provedor simulado: autenticação, origem, conteúdo, importação CSV/Excel real, supressões, persistência, congelamento, lotes, travas, idempotência e verificação de assinatura. Não enviam emails reais. A biblioteca SheetJS 0.20.3 é vendorizada em `assets/vendor/`, com licença Apache 2.0; não é carregada de CDN durante o uso do painel.

Referências de integração: [SheetJS no navegador](https://docs.sheetjs.com/docs/getting-started/installation/standalone/), [Resend: envio em lote](https://resend.com/docs/api-reference/emails/send-batch-emails), [idempotência](https://resend.com/docs/dashboard/emails/idempotency-keys), [assinaturas de webhook](https://resend.com/docs/webhooks/verify-webhooks-requests) e [descadastro](https://resend.com/docs/dashboard/emails/add-unsubscribe-to-transactional-emails).

## Leitura dos resultados

Os dados de `mkt_recipients` preservam os status das campanhas existentes. A migração aditiva `0016_email_results.sql` cria o histórico `mkt_activity` e a exclusão recuperável `mkt_archived_templates`, sem modificar registros antigos. O middleware garante a criação idempotente dessas tabelas também no primeiro acesso.

O histórico registra aceitação de novos lotes e eventos assinados, deduplicados pelo ID Svix. Aberturas/cliques únicos contam destinatários com pelo menos um evento; totais contam eventos distintos. O gráfico diário conta pessoas únicas por dia e usa UTC−3. A taxa de entrega, rejeição e reclamação usa aceitos como denominador; abertura/clique usa entregues. A taxa de clique entre aberturas usa cliques únicos/aberturas únicas. Eventos independentes ou faltantes podem produzir taxas acima de 100%; não são artificialmente limitadas.

Entrega é aceitação pelo servidor, sem comprovar caixa de entrada ou leitura. Privacidade e robôs afetam métricas de interação. Histórico detalhado anterior à atualização não pode ser reconstruído; datas desconhecidas aparecem como travessão. Descadastros mostram a situação atual na base sem atribuição causal à campanha. Não há integração de vendas, receita, conversões ou respostas.

Os eventos conservam somente tipo, campanha, destinatário, horário e detalhe necessário. IP e user-agent não são armazenados; URLs de cliques perdem query e fragmento. O CSV usa os filtros atuais e neutraliza fórmulas em células. Relatórios, exportações e exclusões continuam protegidos pela sessão do painel; mutações exigem mesma origem. Excluir um template apenas o arquiva; restauração não afeta campanhas.
