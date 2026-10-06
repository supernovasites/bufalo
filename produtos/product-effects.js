(() => {
  const motion = matchMedia('(prefers-reduced-motion: reduce)');
  if (motion.matches || !('IntersectionObserver' in window)) return;

  const cards = [...document.querySelectorAll('.product-model .bottle-card')];
  const reveal = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('product-card-visible');
      reveal.unobserve(entry.target);
    });
  }, { threshold: 0.12 });
  cards.forEach((card, index) => {
    card.classList.add('product-card-pending');
    card.style.setProperty('--product-reveal-delay', `${(index % 4) * 70}ms`);
    reveal.observe(card);
  });

  const states = new Map();
  const introductions = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      const state = states.get(entry.target);
      state.model.classList.toggle('product-scroll-hint', entry.isIntersecting && !state.interacted);
    });
  }, { threshold: 0.5 });

  document.querySelectorAll('.product-model').forEach(model => {
    const rail = model.querySelector('.bottle-rail');
    if (!rail) return;
    const state = { model, rail, interacted: false };
    states.set(rail, state);
    const stopHint = () => {
      state.interacted = true;
      model.classList.remove('product-scroll-hint');
      introductions.unobserve(rail);
    };
    ['pointerdown', 'keydown', 'wheel', 'click', 'focusin'].forEach(type => {
      model.addEventListener(type, stopHint, { passive: true });
    });
    introductions.observe(rail);
  });

  // Reveal focused links immediately, including cards outside the horizontal viewport.
  cards.forEach(card => card.addEventListener('focus', () => {
    card.classList.add('product-card-visible');
    reveal.unobserve(card);
  }));
  motion.addEventListener('change', () => {
    if (!motion.matches) return;
    reveal.disconnect();
    introductions.disconnect();
    cards.forEach(card => card.classList.add('product-card-visible'));
    states.forEach(state => {
      state.model.classList.remove('product-scroll-hint');
    });
  });
})();
