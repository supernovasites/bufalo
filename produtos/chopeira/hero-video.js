(() => {
  const video = document.getElementById('hero-video');
  if (!video) return;
  const mobile = window.matchMedia('(max-width: 760px)');
  const play = () => {
    video.muted = true;
    video.defaultMuted = true;
    video.controls = false;
    video.play().catch(() => {});
  };
  const load = () => {
    video.src = mobile.matches ? 'media/ontap-hero-mobile.mp4' : 'media/ontap-hero-desktop.mp4';
    video.load();
    play();
  };
  video.addEventListener('canplay', () => { if (!document.hidden) play(); });
  mobile.addEventListener('change', load);
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) video.pause();
    else play();
  });
  load();
})();
