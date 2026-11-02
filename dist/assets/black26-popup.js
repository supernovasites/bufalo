(() => {
  'use strict';
  const popup = document.getElementById('black26-popup');
  if (!popup) return;
  const images = [
    ['black-bufalo-acai-bowl', 'Black Búfalo: Açaí Bowl. Grátis colher personalizada.'],
    ['black-bufalo-tulipa-confraria', 'Black Búfalo: Tulipa Confraria.'],
    ['black-bufalo-pitaya', 'Black Búfalo: coleção Rosa Pitaya. Até 30% OFF.']
  ];
  let currentImage = Math.floor(Math.random() * images.length);
  try {
    const previous = sessionStorage.getItem('bufalo_black26_banner');
    if (previous !== null && /^\d+$/.test(previous) && Number(previous) < images.length) currentImage = (Number(previous) + 1) % images.length;
    sessionStorage.setItem('bufalo_black26_banner', String(currentImage));
  } catch {}
  const image = popup.querySelector('img');
  const showImage = () => {
    const [file, description] = images[currentImage];
    image.alt = description;
    image.src = '/assets/campaigns/black26/' + file + '.webp';
  };
  showImage();

  let previousOverflow, previousScroll;
  const restoreScroll = () => { if (previousScroll) window.scrollTo({...previousScroll, behavior: 'instant'}); };
  popup.querySelector('[data-black26-close]').addEventListener('click', () => popup.close());
  popup.addEventListener('click', event => {
    const bounds = popup.getBoundingClientRect();
    if (event.target === popup && (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom)) popup.close();
  });
  popup.addEventListener('close', () => {
    document.body.style.overflow = previousOverflow || '';
    restoreScroll();
  });
  setTimeout(() => {
    if (document.querySelector('dialog[open]')) return;
    previousOverflow = document.body.style.overflow;
    previousScroll = {left: window.scrollX, top: window.scrollY};
    popup.showModal();
    document.body.style.overflow = 'hidden';
    restoreScroll();
  }, 600);
})();
