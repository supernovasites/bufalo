# Pesquisa NPS da chopeira

URL pública: /produtos/chopeira/npschopeira/. Nota obrigatória de 0 a 10, avaliação em texto (até 3.000 caracteres), nome, e-mail, telefone com DDD e autorização de registro. Foto opcional; o navegador aceita JPG/PNG/WebP até 15 MB e converte para JPEG de até 220 KB, removendo metadados. O servidor limita o corpo a 250 KB e verifica a assinatura do arquivo.

POST /api/chopeira-nps registra dados em LIVE_DB, nas tabelas chopeira_nps e chopeira_nps_photos. Criação idempotente do schema no primeiro acesso; migrations/0020_chopeira_nps.sql também pode ser aplicada. Resposta e foto são gravadas na mesma transação. UUID evita duplicação por repetição de envio. Limite de 10 respostas por hora por hash diário de IP; IP bruto não é salvo.

Em /painel/estatisticas/, selecionar Chopeira mostra a seção Avaliações da chopeira · NPS. Respeita filtros de período (data de Belém) e dispositivo; paginação de 50 respostas. NPS = % promotores (9–10) menos % detratores (0–6), arredondado ao inteiro. Sem respostas, mostra travessão. Neutros: 7–8. Fotos, dados e textos ficam restritos à sessão administrativa existente; colaboradores C não acessam esses dados. Nenhuma avaliação é publicada em página pública.

Manter cópias estáticas em dist sincronizadas. As Functions não são copiadas para dist; são compiladas pelo Cloudflare Pages. Testes: node --test tests/chopeira-nps.test.mjs.

## Autorização de divulgação (24/11/2026)
Novos envios exigem consentVersion review-publication-20261124. O texto aceito e a data ficam na tabela chopeira_nps_consents, na mesma transação da resposta. O painel distingue avaliações autorizadas das anteriores. A autorização permite divulgar a avaliação como referência para outros compradores; não publica automaticamente avaliações nem fotos e mantém e-mail e telefone privados. Respostas anteriores não recebem autorização retroativa.
