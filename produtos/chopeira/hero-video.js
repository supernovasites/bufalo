(() => {
  const video = document.getElementById('hero-video');
  const button = document.getElementById('hero-motion');
  if (!video || !button) return;
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  const mobile = window.matchMedia('(max-width: 760px)');
  let manualPause = false;
  const label = () => { button.textContent = video.paused ? 'Reproduzir vídeo' : 'Pausar vídeo'; };
  const play = () => { video.muted = true; video.play().catch(label); };
  button.hidden = false;
  const load = () => {
    video.pause();
    video.src = mobile.matches ? 'media/ontap-hero-mobile.mp4' : 'media/ontap-hero-desktop.mp4';
    video.load();
    if (!reduced.matches && !manualPause && !navigator.connection?.saveData) play();
    label();
  };
  button.addEventListener('click', () => {
    if (!video.src) load();
    if (video.paused) { manualPause = false; play(); } else { manualPause = true; video.pause(); }
  });
  video.addEventListener('play', label); video.addEventListener('pause', label);
  mobile.addEventListener('change', () => { if (video.src) load(); });
  reduced.addEventListener('change', () => { if (reduced.matches) video.pause(); });
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) video.pause();
    else if (!manualPause && !reduced.matches && video.src) play();
  });
  if (!reduced.matches && !navigator.connection?.saveData) load();
  label();
})();
