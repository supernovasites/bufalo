# Búfalo Growler

Site estático: https://bufalo.pages.dev/

- `index.html`: página inicial com banners interativos e link Ver todos para o catálogo.
- `catalogo.html`: 149 produtos em dez categorias, com busca, filtros e ordenação. Preços e disponibilidade consultados em 14/09/2026; o catálogo é uma fotografia dessa consulta e não sincroniza automaticamente com a loja.
- `assets/`: imagens e vídeos do site.

## Publicação automática

O Cloudflare Pages está conectado à branch main deste repositório. Novos commits disparam o deploy automaticamente.

Comando de build configurado no Cloudflare:

```sh
mkdir -p dist && cp index.html catalogo.html 404.html _redirects dist/ && cp -R assets dist/assets && cp -R produtos dist/produtos
```

Diretório publicado: `dist`. Não há dependências de execução. Os links de compra direcionam à loja oficial.


A página de pré-reserva do Açaí Bowl está em `reserva/acaibowl/`, com formulário integrado ao Google Sheets (Nome, Telefone, Email e Cidade). Consulte o README dessa pasta para editar a página. O endereço anterior `/landingpage/` redireciona para `/reserva/acaibowl/`.

## Páginas de produtos

As páginas de copos e garrafas, incluindo HTML, CSS, vídeos e posters, ficam em `produtos/copos/` e `produtos/garrafas/`. Não há cópias em `assets/pages/` nem funções que dependam desse caminho. Os endereços antigos redirecionam permanentemente para `/produtos/`.

`dist/produtos/` contém o pacote publicado dessas páginas, seguindo a estrutura de publicação já usada por outras páginas do projeto. Ao editar as páginas, atualize também esse pacote enquanto o build do Cloudflare continuar usando o comando anterior. O comando acima copia `produtos/` durante o build.


## Assistente de compras

A homepage abre um diálogo pelo botão de conversa com IA. O endpoint `POST /api/shop-assistant` usa o binding Cloudflare Workers AI `AI`, declarado no `wrangler.jsonc`, e o modelo `@cf/meta/llama-3.3-70b-instruct-fp8-fast`. As recomendações retornam somente IDs existentes; imagens e links de compra vêm do catálogo, nunca do modelo. Sem o binding ou durante falhas, a interface identifica o modo de busca local no catálogo. Não há armazenamento de conversas.

A base de 128 produtos foi extraída de `catalogo/index.html`; atualizar `functions/_lib/shop-products.js` e a constante `products` no script `bg-assistant-script` da homepage quando o catálogo mudar. Não há consulta em tempo real de preço ou estoque. A interface pede confirmação na loja e não exibe preços do catálogo.

Verificação: `node --test tests/shop-assistant.test.mjs`. Limite de mensagem: 600 caracteres; histórico enviado: até 7 mensagens; proteção de rajada de 12 chamadas por minuto por IP e isolate (não é um limite global). Workers AI requer disponibilidade/cota na conta Cloudflare; verificar o endpoint após a publicação. Eventos GA4: `ai_assistant_open`, `ai_assistant_search`, `ai_assistant_results`, `ai_product_click`; não enviam o conteúdo das conversas.

O assistente oferece o WhatsApp do menu flutuante quando a IA falha, não encontra produtos, não tem informação suficiente ou quando o cliente pede atendimento humano. O link é o mesmo do menu, sem enviar automaticamente o histórico. Evento: `ai_whatsapp_click`.

## Cabeçalho e rodapé compartilhados

`assets/site-shell.js` é a fonte única dos modelos de cabeçalho, menu, faixa superior e rodapé. `assets/site-shell.css` é a fonte única dos estilos desses componentes. As páginas usam os marcadores `data-bg-header`, `data-bg-footer` e `data-bg-announcement`; os componentes são aplicados automaticamente ao carregar a página. Os HTMLs existentes permanecem como fallback sem JavaScript. Altere os arquivos compartilhados para atualizar homepage, catálogo, Círio, Manada ONE, copos, garrafas e live na mesma publicação. Não edite os fallbacks para mudanças de componentes. Para novas páginas, inclua esses marcadores e os mesmos links para CSS/JS absolutos. O assistente usa `assets/shop-assistant.js` em todas as páginas. Mantenha as cópias de `dist/assets` sincronizadas na publicação.

## Cupons do Desafio da Manada

Em `/live/admin`, a seção **Desafio da Manada** permite salvar um cupom para cada um dos quatro desafios. Os códigos são persistidos no D1 e revelados, com opção de copiar, após a conclusão do respectivo quebra-cabeça. O desconto visual dos desafios continua em 20%.

Até a primeira configuração, os quatro desafios usam o cupom do dia. Depois de salvar os cupons dos desafios, alterar o cupom do dia não os substitui. Páginas da live já abertas precisam ser recarregadas para receber os novos códigos.

A tabela `live_challenge_coupons` é criada no primeiro salvamento autenticado; a migração idempotente `0011_live_challenge_coupons.sql` também pode ser aplicada pelo fluxo de migrations do projeto. Verificação: `node --test tests/live-challenge-coupons.test.mjs`.
