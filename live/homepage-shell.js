(() => {
  const announcement = document.querySelector('body > .announcement');
  if (announcement) announcement.className = 'home-announcement';

  const heroCopy = document.querySelector('.hero-copy');
  if (heroCopy) {
    const eyebrow = heroCopy.querySelector('.eyebrow');
    const description = heroCopy.querySelector('.sub');
    if (eyebrow) eyebrow.textContent = 'LIVE BÚFALO · OFERTAS EXCLUSIVAS';
    if (description) {
      description.textContent = 'Escolha a sua companhia para a próxima aventura com os preços da loja.';
    }
  }

  document.querySelector('.category-nav')?.remove();

})();
