# Açaí Bowl — landing page

Página: /landingpage/

Os arquivos index.html, styles.css e form.js contêm a interface. Após editar, rode node landingpage/build-content.cjs para atualizar content.js, consumido pelas Pages Functions. Isso preserva o comando de publicação existente do projeto.

O vídeo e a capa ficam em assets/videos/acai-bowl.mp4 e assets/videos/video-poster.jpg.

O formulário envia JSON para /landingpage/api/reserva. A função valida os campos e encaminha ao Apps Script de reservas; só responde com sucesso quando o Google confirma a gravação. Nenhum cadastro é salvo no repositório. O Apps Script escreve Nome, Telefone e Email em A, B e C da planilha acaibowl (aba gid 0), mantém Cidade vazia e evita duplicidade de e-mail.

A mensagem de confirmação registra reserva de interesse, sem cobrança. O formulário não envia mensagens automaticamente.

