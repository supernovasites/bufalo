# Busca e medição de compra com IA

## Base de referências

`assets/product-search.js` é a fonte única de sinônimos, apelidos, ocasiões e tolerância a erros. `buildReferenceIndex(products)` gera uma base ligada aos 128 IDs reais do catálogo. `assets/product-references.json` é o snapshot legível dessa base; regenere após alterar catálogo/referências. As referências são termos de descoberta, nunca especificações técnicas ou confirmação de compatibilidade.

A mesma busca funciona na API e no navegador. Considera histórico, cor/capacidade, nomes aproximados e produtos já rejeitados. Modelos e restrições reconhecidos prevalecem sobre IDs propostos pelo modelo de IA. Recomendações preservam links e imagens do catálogo. Uma tampa sem modelo exige esclarecimento. A ausência de correspondência mostra exemplos concretos.

Após os cards: “Essas opções atendem ao que você procura?” com “Sim” e “Não era isso”. O segundo botão exclui sugestões rejeitadas da conversa atual e orienta o novo pedido. Feedback não treina automaticamente o modelo e não altera a base compartilhada; a qualidade fica mensurável no GA4 para orientar revisões da base. Não se armazenam conversas ou nomes digitados.

## GA4 — G-FPEC1ZGMJQ

| Evento | Mede |
| --- | --- |
| ai_assistant_open | Abertura do assistente |
| ai_assistant_search | Busca; tamanho do pedido e número da rodada, sem o texto |
| ai_assistant_results | Quantidade de resultados, modo IA/catálogo e tipo de correspondência |
| ai_search_no_results | Busca sem resultado |
| ai_search_feedback | Validação yes/no das opções |
| ai_product_click | Clique para a loja com ID/nome do produto |
| ai_whatsapp_click | Encaminhamento para WhatsApp |
| view_item_list | Exibição da lista `compra_ia` |
| select_item | Seleção do produto da lista `compra_ia` |

Parâmetros comuns: `ai_search_id` (identificador aleatório da busca), `ai_surface` (página). Parâmetros adicionais: `feedback`, `search_mode`, `match_type`, `result_count`, `search_turn`, `item_category`. O identificador correlaciona busca/resultados/feedback/cliques, sem identificar o visitante. Não registre identificadores aleatórios como dimensões personalizadas para evitar alta cardinalidade.

Para relatórios na propriedade: crie dimensões de evento para `feedback`, `search_mode`, `match_type`, `ai_surface` e `search_turn`. Use uma exploração: abertura → busca → resultados → validação positiva → clique. Taxa de aceitação = feedback yes / total de feedback; taxa sem resultado = ai_search_no_results / ai_assistant_search; taxa de clique = buscas com clique / buscas com resultados. Não confundir contagem de eventos com número de usuários.

As URLs de produto recebem `bg_ai=1` e `bg_ai_search` sem sobrescrever UTMs. O evento `select_item` mede intenção, não venda. Para receita atribuída à IA, a loja precisa enviar `purchase` com transaction_id/valor/itens e preservar a indicação de IA até o pedido; isso não pode ser concluído apenas no repositório institucional. Não há acesso administrativo ao GA4 nesta tarefa, portanto dimensões/eventos principais precisam ser configurados na propriedade quando desejado. Valide a chegada dos eventos em Tempo real/DebugView.

Referências oficiais: https://developers.google.com/analytics/devguides/collection/ga4/ecommerce e https://support.google.com/analytics/answer/10071811.

## Verificação

`node --test tests/shop-assistant.test.mjs`. Sincronizar JS/JSON de `assets` com `dist/assets` ao publicar.
