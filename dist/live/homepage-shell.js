(() => {
  const announcement = document.querySelector('body > .announcement');
  if (announcement) announcement.className = 'home-announcement';

  const heroCopy = document.querySelector('.hero-copy');
  if (heroCopy) {
    const eyebrow = heroCopy.querySelector('.eyebrow');
    const title = heroCopy.querySelector('h1');
    const description = heroCopy.querySelector('.sub');
    if (eyebrow) eyebrow.textContent = 'LIVE BÚFALO · OFERTAS EXCLUSIVAS';
    if (title) title.innerHTML = '10 cupons de <span class="offer-highlight">20% OFF</span> para celebrar com a Manada!';
    if (description) {
      const coupon = document.getElementById('code')?.textContent.trim();
      description.innerHTML = 'Use o cupom <span class="live-coupon-code"></span> durante a live e escolha a Búfalo que vai acompanhar seus próximos momentos.';
      description.querySelector('.live-coupon-code').textContent = coupon || '';
    }
  }

  document.querySelector('.category-nav')?.remove();

})();
