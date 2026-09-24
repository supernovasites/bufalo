# Açaí Bowl — landing page

Página: /reserva/acaibowl/

Os arquivos index.html, styles.css e form.js contêm a interface. Após editar, rode node reserva/acaibowl/build-content.cjs para atualizar content.js, consumido pelas Pages Functions. Isso preserva o comando de publicação existente do projeto.

O vídeo e a capa ficam em assets/videos/acai-bowl.mp4 e assets/videos/video-poster.jpg.

O formulário envia JSON para /reserva/acaibowl/api/reserva. A função valida os campos e encaminha ao Apps Script de reservas; só responde com sucesso quando o Google confirma a gravação. Nenhum cadastro é salvo no repositório. Nome, Telefone, Email e Cidade são enviados às colunas A, B, C e D, respectivamente.

A coluna E, Data de cadastramento, é preenchida pelo Apps Script no momento da gravação com a data e hora do cadastro, no formato dd/MM/yyyy HH:mm:ss (exemplo: 23/09/2026 11:53:30).

A mensagem de confirmação registra reserva de interesse, sem cobrança. O formulário não envia mensagens automaticamente.
