(() => {
  const image = document.getElementById('momento-image');
  if (!image) return;
  let busy = false, revision = 0, pendingUrl = null;
  async function update() {
    if (busy || document.hidden) return;
    busy = true;
    try {
      const response = await fetch('/live/api/gallery', {cache:'no-store'});
      if (!response.ok) return;
      const {moment} = await response.json();
      if (!moment?.url || pendingUrl === moment.url) return;
      const current = ++revision;
      pendingUrl = null;
      if (image.getAttribute('src') === moment.url) return;
      pendingUrl = moment.url;
      const next = new Image();
      next.onload = () => {
        if (current !== revision) return;
        image.src = moment.url; image.alt = 'Foto da manada no Momento BG'; pendingUrl = null;
      };
      next.onerror = () => { if(current === revision) pendingUrl = null; };
      next.src = moment.url;
    } catch { /* Preserve a foto atual enquanto a conexão se recupera. */ }
    finally { busy = false; }
  }
  update(); setInterval(update,3000);
  document.addEventListener('visibilitychange', update);
})();
