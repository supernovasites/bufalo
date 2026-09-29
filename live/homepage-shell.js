(() => {
  const announcement = document.querySelector('body > .announcement');
  if (announcement) announcement.className = 'home-announcement';

  const heroCopy = document.querySelector('.hero-copy');
  if (heroCopy) {
    const eyebrow = heroCopy.querySelector('.eyebrow');
    const title = heroCopy.querySelector('h1');
    const description = heroCopy.querySelector('.sub');
    const actions = heroCopy.querySelector('.hero-actions');
    if (eyebrow) eyebrow.textContent = 'LIVE BÚFALO · OFERTAS EXCLUSIVAS';
    if (title) title.innerHTML = '<span class="offer-highlight">20% OFF</span> para levar a aventura com você.';
    if (description) description.innerHTML = '<strong>Uma condição especial para os 10 primeiros.</strong><br>Use o cupom LIVEBG3009 durante a live e escolha a Búfalo que vai acompanhar seus próximos momentos.';
    if (actions) actions.innerHTML = '<a class="button hero-link" href="#products-title">Comprar agora</a><a class="manadacash-hero-cta" href="#cadastro-live">ManadaCash</a>';
  }

  const oldHeader = document.querySelector('.wrap > header');
  if (oldHeader) {
    const header = document.createElement('header');
    header.className = 'home-header';
    header.innerHTML = `
      <div class="home-header-row">
        <button class="home-icon-button" id="home-open-menu" type="button" aria-label="Abrir menu">
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 6h18M3 12h18M3 18h18"/></svg>
        </button>
        <a class="home-logo" href="https://www.bufalogrowler.com.br/" aria-label="Búfalo Growler — início">
          <img src="https://cdn.awsli.com.br/400x300/1237/1237589/logo/21547a1296.png" alt="Búfalo Growler" width="64" height="64">
        </a>
        <div class="home-actions">
          <a class="home-icon-button" href="https://loja.bufalogrowler.com.br/buscar" target="_blank" rel="noopener" aria-label="Buscar produtos">
            <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="10" cy="10" r="6.5"/><path d="m15 15 6 6"/></svg>
          </a>
          <a class="home-icon-button" href="https://loja.bufalogrowler.com.br/carrinho/index" target="_blank" rel="noopener" aria-label="Abrir carrinho na loja oficial">
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 7h14l1 14H4L5 7Z M8 8V6a4 4 0 0 1 8 0v2"/></svg>
          </a>
        </div>
      </div>`;
    oldHeader.replaceWith(header);
  }

  document.querySelector('.category-nav')?.remove();

  const oldFooter = document.querySelector('.wrap > footer');
  if (oldFooter) {
    const footer = document.createElement('footer');
    footer.className = 'home-footer';
    footer.id = 'rodape';
    footer.innerHTML = `
      <div class="home-footer-inner">
        <div class="home-footer-signature">
          <a class="home-footer-brand" href="https://www.bufalogrowler.com.br/" aria-label="Búfalo Growler — voltar ao início"><img src="https://cdn.awsli.com.br/400x300/1237/1237589/logo/21547a1296.png" alt="Búfalo Growler" width="120" height="90" loading="lazy"></a>
          <div><p class="home-footer-kicker">COM VOCÊ, LÁ FORA.</p><h2>A vida pede<br>bons momentos<span>.</span></h2><p>Da primeira dose de café ao último brinde.<br>A Búfalo vai junto.</p></div>
          <a class="home-footer-instagram" href="https://www.instagram.com/bufalogrowler" target="_blank" rel="noopener">Encontre a manada no Instagram <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14m-6-6 6 6-6 6"/></svg></a>
        </div>
        <div class="home-footer-links">
          <nav aria-label="Explore a Búfalo"><h3>Escolha sua companhia</h3><a href="https://loja.bufalogrowler.com.br/garrafas" target="_blank" rel="noopener">Garrafas e growlers</a><a href="https://loja.bufalogrowler.com.br/copos-e-bowls" target="_blank" rel="noopener">Copos e bowls</a><a href="https://loja.bufalogrowler.com.br/acessorios" target="_blank" rel="noopener">Tampas e acessórios</a><a href="https://loja.bufalogrowler.com.br/camping-" target="_blank" rel="noopener">Praia e camping</a><a href="https://loja.bufalogrowler.com.br/cutelaria" target="_blank" rel="noopener">Cutelaria</a><a href="https://www.bufalogrowler.com.br/blog/">Blog Búfalo</a></nav>
          <nav aria-label="Ajuda com suas compras"><h3>Conte com a gente</h3><a href="https://loja.bufalogrowler.com.br/pagina/prazos-e-entregas.html" target="_blank" rel="noopener">Prazos e entregas</a><a href="https://loja.bufalogrowler.com.br/pagina/troca-e-devolucao.html" target="_blank" rel="noopener">Trocas e devoluções</a><a href="https://loja.bufalogrowler.com.br/pagina/formas-de-pagamento.html" target="_blank" rel="noopener">Formas de pagamento</a></nav>
          <div class="home-footer-contact"><h3>Uma boa conversa começa aqui</h3><a class="home-footer-whatsapp" href="https://wa.me/5591984973370" target="_blank" rel="noopener">Fale com a Búfalo <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14m-6-6 6 6-6 6"/></svg></a><a href="tel:+5591984973370">(91) 98497-3370</a><a href="mailto:contato@bufalogrowler.com.br">contato@bufalogrowler.com.br</a><p>Segunda a sexta · 8h às 18h</p></div>
        </div>
        <div class="home-footer-bottom"><span>© 2026 Búfalo Growler.</span><span>Feita para acompanhar você.</span><span>Compras na loja oficial.</span></div>
      </div>`;
    oldFooter.replaceWith(footer);
  }

  const dialog = document.createElement('dialog');
  dialog.className = 'home-menu-dialog';
  dialog.id = 'home-mobile-menu';
  dialog.innerHTML = `<header><strong>Explore a Búfalo</strong><button class="home-icon-button" id="home-close-menu" type="button" aria-label="Fechar menu">×</button></header><form role="search" action="https://loja.bufalogrowler.com.br/buscar" method="get" target="_blank"><input type="search" name="q" required placeholder="Buscar produtos" aria-label="Buscar produtos no menu"><button class="home-icon-button" aria-label="Pesquisar"><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="10" cy="10" r="6.5"/><path d="m15 15 6 6"/></svg></button></form><nav><a href="https://www.bufalogrowler.com.br/">Início</a><a href="https://loja.bufalogrowler.com.br/garrafas" target="_blank">Garrafas e growlers</a><a href="https://loja.bufalogrowler.com.br/copos-e-bowls" target="_blank">Copos e bowls</a><a href="https://loja.bufalogrowler.com.br/ofertas" target="_blank">Ofertas</a><a href="https://www.bufalogrowler.com.br/blog/">Blog Búfalo</a><a href="https://loja.bufalogrowler.com.br/conta/login" target="_blank">Minha conta</a></nav>`;
  document.body.append(dialog);
  document.querySelector('#home-open-menu')?.addEventListener('click', () => dialog.showModal());
  dialog.querySelector('#home-close-menu')?.addEventListener('click', () => dialog.close());
  dialog.addEventListener('click', event => { if (event.target === dialog) dialog.close(); });
})();
