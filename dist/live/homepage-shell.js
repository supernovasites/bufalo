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
    if (description) {
      const coupon = document.getElementById('code')?.textContent.trim();
      description.innerHTML = '<strong>Uma condição especial para os 10 primeiros.</strong><br>Use o cupom <span class="live-coupon-code"></span> durante a live e escolha a Búfalo que vai acompanhar seus próximos momentos.';
      description.querySelector('.live-coupon-code').textContent = coupon || '';
    }
    if (actions) actions.innerHTML = '<a class="button hero-link" href="#products-title">Comprar agora</a><a class="manadacash-hero-cta" href="#cadastro-live">ManadaCash</a>';
  }

  document.querySelector('.category-nav')?.remove();

})();
