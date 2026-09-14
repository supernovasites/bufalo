(() => {
  const timer = document.getElementById('live-timer');
  const label = document.getElementById('countdown-label');
  const status = document.getElementById('countdown-status');
  let deadline;
  let interval;

  function update() {
    const remaining = Math.max(0, Math.ceil((deadline - Date.now()) / 1000));
    timer.textContent = `${String(Math.floor(remaining / 60)).padStart(2, '0')}:${String(remaining % 60).padStart(2, '0')}`;
    if (remaining === 0) {
      clearInterval(interval);
      label.textContent = 'TEMPO ENCERRADO';
      status.textContent = 'A contagem de oito minutos terminou.';
    }
  }

  function start() {
    clearInterval(interval);
    deadline = Date.now() + 8 * 60 * 1000;
    label.textContent = 'CONTAGEM DA LIVE';
    status.textContent = '';
    update();
    interval = setInterval(update, 250);
  }

  start();
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) update();
  });
  window.addEventListener('pageshow', event => {
    if (event.persisted) start();
  });
})();
