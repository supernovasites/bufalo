# Búfalo Growler

Site estático publicado em https://bufalo.pages.dev/.

Edite index.html: CSS, produtos, cabeçalho e comportamento do carrossel estão no próprio HTML. O cabeçalho tem logo centralizada, menu à esquerda e busca e sacola à direita.

O banner inclui uma foto vertical e dois vídeos MP4 com áudio na pasta assets/. A troca ocorre a cada 5 segundos; use “Pausar troca” para assistir ao vídeo inteiro. O navegador pode exigir um clique para iniciar áudio. As mídias mantêm as proporções, sem cortes.

Sem painel administrativo, login, banco de dados ou coleta própria de acessos/cliques. Os links de compra e as imagens dos produtos apontam para a loja oficial.

## Publicação

Não há build nem dependências de execução. Prepare dist/ com index.html, 404.html, _redirects e a pasta assets/ completa. Publique com:

```sh
npx wrangler pages deploy dist --project-name bufalo --branch main
```

O envio ao GitHub não publica automaticamente na Cloudflare. A pasta dist/ não é versionada.
