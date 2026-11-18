(() => {
  const announcement = document.querySelector('body > .announcement');
  if (announcement) announcement.className = 'home-announcement';

  const heroCopy = document.querySelector('.hero-copy');
  if (heroCopy) {
    const eyebrow = heroCopy.querySelector('.eyebrow');
    if (eyebrow) eyebrow.textContent = 'LIVE BÚFALO · OFERTAS EXCLUSIVAS';
  }

  document.querySelector('.category-nav')?.remove();

})();
