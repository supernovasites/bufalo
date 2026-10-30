(() => {
  'use strict';
  const popup = document.getElementById('black26-popup');
  if (!popup) return;
  const calendar = new Intl.DateTimeFormat('en-US', {timeZone: 'America/Fortaleza', weekday: 'short'});
  const isWeekday = () => !['Sat', 'Sun'].includes(calendar.format(new Date()));
  if (!isWeekday()) return;
  const images = [
    ['black-bufalo-floresta', 'Black Búfalo: garrafas verde-oliva em cenário de floresta. Até 30% OFF.'],
    ['black-bufalo-pitaya', 'Black Búfalo: garrafas e copo Pitaya à beira da piscina. Até 30% OFF.'],
    ['black-bufalo-laranja-montanha', 'Black Búfalo: produtos laranja em expedição na montanha. Até 30% OFF.'],
    ['black-bufalo-citrus-futebol', 'Black Búfalo: produtos cítrus no campo de futebol. Até 30% OFF.']
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
  const closeOnWeekend = () => { if (popup.open && !isWeekday()) popup.close(); };
  document.addEventListener('visibilitychange', closeOnWeekend);
  // Fortaleza is UTC-3: recheck at local midnight if the page stays open overnight.
  const checkAtMidnight = () => {
    const now = new Date(), next = new Date(now);
    next.setUTCHours(3, 0, 0, 0);
    if (next <= now) next.setUTCDate(next.getUTCDate() + 1);
    setTimeout(() => { closeOnWeekend(); if (isWeekday()) checkAtMidnight(); }, next - now);
  };
  checkAtMidnight();
  setTimeout(() => {
    if (!isWeekday() || document.querySelector('dialog[open]')) return;
    previousOverflow = document.body.style.overflow;
    previousScroll = {left: window.scrollX, top: window.scrollY};
    popup.showModal();
    document.body.style.overflow = 'hidden';
    restoreScroll();
  }, 600);
})();
