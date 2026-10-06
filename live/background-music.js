(() => {
  const audio = document.getElementById('live-background-music');
  if (!audio) return;
  const tracks = ['/assets/music/bama-country.mp3', '/assets/music/guts-and-bourbon.mp3'];
  let index = 0;
  let starting = false;
  audio.volume = 0.18;
  const gestures = ['pointerdown', 'keydown', 'touchend'];
  const clearGestures = () => gestures.forEach(event => document.removeEventListener(event, start));
  async function start() {
    if (starting || !audio.paused) return;
    starting = true;
    try { await audio.play(); clearGestures(); }
    catch { /* Navegadores podem exigir uma interação antes de permitir som. */ }
    finally { starting = false; }
  }
  audio.addEventListener('ended', () => {
    index = (index + 1) % tracks.length;
    audio.src = tracks[index];
    start();
  });
  gestures.forEach(event => document.addEventListener(event, start, {passive: true}));
  start();
})();
