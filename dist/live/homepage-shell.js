(() => {
  const announcement = document.querySelector('body > .announcement');
  if (announcement) announcement.className = 'home-announcement';

  const heroCopy = document.querySelector('.hero-copy');
  if (heroCopy) {
    const eyebrow = heroCopy.querySelector('.eyebrow');
    const title = heroCopy.querySelector('h1');
    const description = heroCopy.querySelector('.sub');
    if (eyebrow) eyebrow.textContent = 'LIVE BÚFALO · OFERTAS EXCLUSIVAS';
    if (title) title.innerHTML = 'Escolha sua Búfalo e celebre com a Manada!';
    if (description) {
      description.textContent = 'Escolha a sua companhia para a próxima aventura com os preços da loja.';
    }
  }

  document.querySelector('.category-nav')?.remove();

})();
