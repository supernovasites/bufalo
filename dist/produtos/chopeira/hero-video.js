(() => {
  const video = document.getElementById('hero-video');
  if (!video) return;
  const play = () => {
    if (document.hidden || !video.paused) return;
    video.muted = true;
    video.defaultMuted = true;
    video.playsInline = true;
    video.controls = false;
    // Autoplay can be refused temporarily (notably while a modal opens on iOS).
    // Keep the poster and retry on readiness or the next genuine interaction.
    const attempt = video.play();
    if (attempt) attempt.catch(() => {});
  };
  ['loadeddata', 'canplay'].forEach(event => video.addEventListener(event, play));
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) video.pause();
    else play();
  });
  window.addEventListener('pageshow', play);
  // Capture a user gesture even when the modal makes the rest of the page inert.
  document.addEventListener('pointerdown', play, {capture: true, passive: true});
  document.addEventListener('keydown', play, {capture: true});
  document.getElementById('mestre-gift')?.addEventListener('close', play);
  play();
})();
