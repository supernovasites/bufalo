(() => {
  const dialog = document.getElementById('roots-story');
  const trigger = document.querySelector('.roots-trigger');
  if (!dialog || !trigger) return;
  let overflow;
  trigger.addEventListener('click', () => {
    overflow = document.body.style.overflow;
    dialog.showModal();
    document.body.style.overflow = 'hidden';
  });
  dialog.addEventListener('close', () => {
    document.body.style.overflow = overflow || '';
    trigger.focus({preventScroll: true});
  });
  dialog.addEventListener('click', (event) => {
    const rect = dialog.getBoundingClientRect();
    if (event.target === dialog && (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom)) dialog.close();
  });
})();
