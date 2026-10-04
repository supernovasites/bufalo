# Melhorias do Google Analytics — Búfalo Growler

Data: 04/10/2026. Propriedade: G-FPEC1ZGMJQ.

## Resultado

Medição compartilhada em 12 documentos públicos: homepage, catálogo, live e encerramento, Manada One e encerramento, ManadaCash, Círio, blog, artigo, reserva de Açaí Bowl e página 404. Painéis administrativos e o widget de ManadaCash ficam fora da medição de clientes. Os hosts autorizados continuam sendo bufalogrowler.com.br, www.bufalogrowler.com.br e bufalo.pages.dev; previews e localhost não enviam eventos.

## Melhorias

- Um único script de Analytics, com proteção contra inicialização duplicada e identificação de página por `content_group` e `page_type`.
- Parâmetros UTM e identificadores de publicidade aceitos são preservados na URL enviada ao GA4. Campos de cadastro, buscas e mensagens não entram nos novos eventos. Artigos são diferenciados pelo identificador `post`.
- `view_item_list`: produtos com pelo menos 50% do card visível. Uma impressão por produto/lista por carregamento, inclusive cards inseridos dinamicamente e listas com rolagem lateral. Não confundir com visualização de detalhes (`view_item`).
- `select_item`: seleção de produto com ID derivado do endereço da loja, nome, marca, lista e variante quando disponível.
- Mantidos `bufalo_store_click`, `bufalo_whatsapp_click` e `bufalo_instagram_click`, agora com página e posição do clique. Um clique em produto gera seleção e encaminhamento à loja: são duas perspectivas da mesma ação, não dois compradores.
- `view_promotion`, `select_promotion` e `promotion_close`: abertura, clique e fechamento dos popups da chopeira, Marajó Dry e ManadaCash. Os dois primeiros são nomes recomendados pelo GA4; fechamento é evento personalizado.
- `coupon_copy`: somente depois de a cópia funcionar nos controles instrumentados da home, live e Manada One.
- `category_select`, `catalog_click` e `search_submit`: categoria, acesso ao catálogo e tentativa de busca, sem enviar texto de pesquisa.
- `lead_form_start` e `lead_form_submit`: início e tentativa de envio, separados do resultado.
- `generate_lead`: confirmação de nova inscrição na live ou reserva de Açaí Bowl após resposta positiva do servidor. Presença de membro existente ou cadastro já registrado usa `registration_confirmed`, evitando contar novamente como novo lead. Reserva com falha de confirmação usa `form_error`.
- Cópias públicas já versionadas em `dist` receberam os ajustes correspondentes, preservando suas diferenças de conteúdo.

## Como interpretar

| Objetivo | Evento ou dimensão |
|---|---|
| Comparar páginas | `content_group`, caminho e título da página |
| Produtos que apareceram ao visitante | `view_item_list`, ID/nome do item e lista |
| Produtos selecionados | `select_item` |
| Encaminhamentos à loja | `bufalo_store_click` |
| Intenção de contato | `bufalo_whatsapp_click` |
| Interesse em campanhas | `view_promotion` e `select_promotion` |
| Uso de cupom | `coupon_copy` (cópia, não resgate em compra) |
| Novos cadastros confirmados | `generate_lead` |
| Presença de membro existente | `registration_confirmed` |

## Validação e limites

- 37 verificações automatizadas de hosts, administração, atribuição, parâmetros, cobertura, duplicação de inicialização, impressões, cliques e popups.
- Versão gerada no servidor da reserva de Açaí Bowl sincronizada com HTML e formulário; paridade coberta pelos testes.
- Sintaxe verificada em 36 blocos JavaScript inline, no novo script compartilhado e no formulário alterado; diff revisado.
- Testes de comportamento usam DOM simulado. O navegador Chromium não pôde ser instalado neste ambiente, portanto não houve teste visual nem inspeção das requisições reais ao coletor GA4.
- Configurações da propriedade GA4 não foram alteradas: marcar `generate_lead` como evento principal e cadastrar dimensões personalizadas de escopo evento (`page_type`, `link_position`, `form_id`, `lead_type`, `category_id`, `coupon`) é trabalho no painel do Analytics. `content_group` e dimensões padrão de e-commerce já têm significado próprio no GA4.
- Compra, receita, carrinho e checkout não foram inventados nem inferidos de cliques. Dependem da plataforma externa da loja e da validação de sua integração com a mesma propriedade, incluindo configuração entre domínios quando necessária.
- `timing_complete`, `view_catalog` e `view_item` da captura não são enviados pelo código encontrado neste repositório; sua origem e configuração precisam ser verificadas na loja, no Tag Manager ou em outra integração.
- A sanitização cobre a configuração e os novos eventos deste repositório. Eventos da medição otimizada e tags externas são controlados também pelo painel GA4/GTM e devem ser revisados ali para parâmetros sensíveis.
- Os dados históricos não são reclassificados: os novos eventos e agrupamentos valem após a publicação.
