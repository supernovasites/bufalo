(() => {
  const video = document.getElementById('hero-video');
  if (!video) return;
  const play = () => {
    video.muted = true;
    video.defaultMuted = true;
    video.controls = false;
    video.play().catch(() => {});
  };
  const load = () => {
    video.src = 'media/ontap-hero-1080p.mp4';
    video.load();
    play();
  };
  video.addEventListener('canplay', () => { if (!document.hidden) play(); });
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) video.pause();
    else play();
  });
  load();
})();
