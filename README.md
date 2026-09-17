# Búfalo Growler

Site estático: https://bufalo.pages.dev/

- `index.html`: página inicial com banners interativos e link Ver todos para o catálogo.
- `catalogo.html`: 149 produtos em dez categorias, com busca, filtros e ordenação. Preços e disponibilidade consultados em 14/09/2026; o catálogo é uma fotografia dessa consulta e não sincroniza automaticamente com a loja.
- `assets/`: imagens e vídeos do site.

## Publicação automática

O Cloudflare Pages está conectado à branch main deste repositório. Novos commits disparam o deploy automaticamente.

Comando de build configurado no Cloudflare:

```sh
mkdir -p dist && cp index.html catalogo.html 404.html _redirects dist/ && cp -R assets dist/assets
```

Diretório publicado: `dist`. Não há dependências de execução. Os links de compra direcionam à loja oficial.


A página de pré-reserva do Açaí Bowl está em `reserva/acaibowl/`, com formulário integrado ao Google Sheets (Nome, Telefone, Email e Cidade). Consulte o README dessa pasta para editar a página. O endereço anterior `/landingpage/` redireciona para `/reserva/acaibowl/`.
