(() => {
  const updatePreview = () => {
    document.querySelector('.rewards .benefits .cash')?.remove();

    const rewards = document.querySelector('.rewards');
    const photo = document.querySelector('.momento-photo');
    if (rewards && photo) rewards.append(photo);

    const intro = document.querySelector('.rewards-copy > p:not(.eyebrow)');
    if (intro) intro.textContent = 'Entre na conversa com a manada e compartilhe seus melhores momentos da live.';

    const registration = document.querySelector('#cadastro-live');
    if (registration) {
      registration.querySelector('h2').textContent = 'Sua presença vale 500 pontos';
      const copy = registration.querySelector('.lead-capture-copy > p:not(.eyebrow):not(.lead-capture-note)');
      if (copy && registration.querySelector('#registration-success')?.hidden !== false) copy.textContent = 'Escolha como participar do ManadaCash. O formulário aparece após selecionar uma opção.';
    }

    const format = value => value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    const readPrice = value => Number(value?.replace(/[^\d,]/g, '').replace(',', '.'));
    document.querySelectorAll('.product').forEach(card => {
      const regular = card.querySelector('.old s');
      const offer = card.querySelector('.price');
      if (!regular || !offer) return;
      const selected = card.querySelector('.growler-swatch[aria-pressed="true"]');
      const base = selected?.dataset.price ? Number(selected.dataset.price) : readPrice(regular.textContent);
      if (!Number.isFinite(base) || base <= 0) return;
      regular.textContent = format(base);
      offer.textContent = format(Math.round(base * 80) / 100);
      const badge = card.querySelector('.badge');
      if (badge) badge.textContent = '−20%';
    });

    const topButton = document.createElement('button');
    topButton.type = 'button';
    topButton.className = 'back-to-top';
    topButton.setAttribute('aria-label', 'Voltar ao início da página');
    topButton.innerHTML = '<span aria-hidden="true">↑</span>';
    document.body.append(topButton);
    const toggle = () => topButton.classList.toggle('is-visible', window.scrollY > 400);
    window.addEventListener('scroll', toggle, { passive: true });
    toggle();
    topButton.addEventListener('click', () => window.scrollTo({ top: 0, behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' }));
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', updatePreview, { once: true });
  else updatePreview();
})();
