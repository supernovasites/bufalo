(() => {
  const audio = document.getElementById('homepage-background-music');
  if (!audio) return;
  const tracks = ['/assets/music/cattails.mp3', '/assets/music/porch-blues.mp3', '/assets/music/niles-blues.mp3'];
  let index = Math.floor(Math.random() * tracks.length);
  try {
    const previous = localStorage.getItem('bufalo-homepage-last-start-track');
    if (previous !== null && /^[0-2]$/.test(previous)) index = (Number(previous) + 1) % tracks.length;
    localStorage.setItem('bufalo-homepage-last-start-track', String(index));
  } catch { /* Usa seleção aleatória quando o armazenamento não está disponível. */ }
  audio.src = tracks[index];
  let starting = false;
  audio.volume = 0.30;
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
