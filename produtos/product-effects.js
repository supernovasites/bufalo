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
      clearTimeout(state.timer);
      state.model.classList.toggle('product-scroll-hint', entry.isIntersecting && !state.interacted);
      if (!entry.isIntersecting || state.started || state.interacted || motion.matches) return;
      // Wait for the cards to finish appearing, then move by exactly one card.
      state.timer = setTimeout(() => {
        if (document.hidden || state.interacted || motion.matches) return;
        state.started = true;
        const card = state.rail.querySelector('.bottle-card');
        const remaining = state.rail.scrollWidth - state.rail.clientWidth - state.rail.scrollLeft;
        if (!card || remaining <= 2 || state.rail.scrollLeft > 2) return;
        const gap = parseFloat(getComputedStyle(state.rail).columnGap) || 0;
        state.rail.scrollBy({ left: Math.min(card.offsetWidth + gap, remaining), behavior: 'smooth' });
      }, 900);
    });
  }, { threshold: 0.5 });

  document.querySelectorAll('.product-model').forEach(model => {
    const rail = model.querySelector('.bottle-rail');
    if (!rail) return;
    const state = { model, rail, timer: null, started: false, interacted: false };
    states.set(rail, state);
    const stopHint = () => {
      state.interacted = true;
      clearTimeout(state.timer);
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
      clearTimeout(state.timer);
      state.model.classList.remove('product-scroll-hint');
    });
  });
})();
