(() => {
  const motion = matchMedia('(prefers-reduced-motion: reduce)');
  if (motion.matches || !('IntersectionObserver' in window)) return;

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

  motion.addEventListener('change', () => {
    if (!motion.matches) return;
    introductions.disconnect();
    states.forEach(state => {
      state.model.classList.remove('product-scroll-hint');
    });
  });
})();
