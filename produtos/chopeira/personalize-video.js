(() => {
  const video = document.getElementById('personalize-video');
  if (!video) return;

  let loaded = false;
  let visible = false;
  let starting = false;
  video.muted = true;
  video.defaultMuted = true;
  video.playsInline = true;
  video.controls = false;
  video.autoplay = false;
  video.loop = false;

  const load = () => {
    if (loaded) return;
    loaded = true;
    video.preload = 'auto';
    video.src = video.dataset.src;
    video.load();
  };
  const play = () => {
    if (!visible || document.hidden || starting || !video.paused) return;
    load();
    starting = true;
    // iOS may defer autoplay until the next real touch or page visibility change.
    Promise.resolve(video.play()).catch(() => {}).finally(() => { starting = false; });
  };
  const sync = () => {
    video.autoplay = visible && !document.hidden;
    if (video.autoplay) play();
    else video.pause();
  };
  const measure = () => {
    const rect = video.getBoundingClientRect();
    visible = rect.bottom > 0 && rect.top < window.innerHeight;
    sync();
  };

  if ('IntersectionObserver' in window) {
    // Fetch shortly before the section arrives, without competing with the hero.
    const preload = new IntersectionObserver(entries => {
      if (!entries.some(entry => entry.isIntersecting)) return;
      load();
      preload.disconnect();
    }, { rootMargin: '600px 0px' });
    preload.observe(video);
    new IntersectionObserver(entries => {
      visible = entries[0].isIntersecting;
      sync();
    }, { threshold: 0.01 }).observe(video);
  } else {
    window.addEventListener('scroll', measure, { passive: true });
    window.addEventListener('resize', measure, { passive: true });
  }

  const sound = document.getElementById('personalize-sound');
  if (sound) {
    sound.hidden = false;
    video.addEventListener('volumechange', () => {
      const label = video.muted ? 'Ativar som' : 'Silenciar';
      sound.setAttribute('aria-label', label);
      sound.title = label;
      sound.setAttribute('aria-pressed', String(!video.muted));
    });
    sound.addEventListener('click', () => {
      video.muted = !video.muted;
      if (!video.muted) play();
    });
  }

  ['loadeddata', 'canplay'].forEach(event => video.addEventListener(event, play));
  video.addEventListener('ended', () => {
    video.muted = true;
    video.pause();
    video.currentTime = 0;
    play();
  });
  video.addEventListener('play', () => { if (!visible || document.hidden) video.pause(); });
  document.addEventListener('visibilitychange', sync);
  window.addEventListener('pageshow', measure);
  document.addEventListener('pointerdown', play, { capture: true, passive: true });
  document.addEventListener('touchend', play, { capture: true, passive: true });
  document.addEventListener('keydown', play, { capture: true });
  measure();
})();
