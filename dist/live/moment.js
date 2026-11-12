(() => {
  const image = document.getElementById('momento-image');
  if (!image) return;
  let busy = false, photos = [], index = -1, selection = null, pendingUrl = null, revision = 0;
  function show(nextIndex) {
    const photo = photos[nextIndex];
    if (!photo) return;
    index = nextIndex;
    const current = ++revision;
    pendingUrl = null;
    if (image.getAttribute('src') === photo.url) return;
    pendingUrl = photo.url;
    const next = new Image();
    next.onload = () => {
      if (current !== revision) return;
      image.src = photo.url;
      image.alt = 'Foto '+photo.slot+' da manada no Momento BG';
      pendingUrl = null;
    };
    next.onerror = () => { if (current === revision) pendingUrl = null; };
    next.src = photo.url;
  }
  async function update() {
    if (busy || document.hidden) return;
    busy = true;
    try {
      const response = await fetch('/live/api/gallery', {cache:'no-store'});
      if (!response.ok) return;
      const data = await response.json();
      const previousSlot = photos[index]?.slot;
      photos = (data.photos || []).filter(photo => photo.slot >= 1 && photo.slot <= 3)
        .sort((a,b) => a.slot-b.slot)
        .map(photo => ({...photo,url:'/live/api/gallery/'+photo.slot+'?v='+encodeURIComponent(photo.photo_version)}));
      if (!photos.length && data.moment?.url) photos = [data.moment];
      const selected = JSON.stringify([data.moment?.slot,data.moment?.photo_version]);
      if (selection !== selected) {
        selection = selected;
        const selectedIndex = photos.findIndex(photo => photo.slot === data.moment?.slot);
        show(selectedIndex < 0 ? 0 : selectedIndex);
      } else {
        const currentIndex = photos.findIndex(photo => photo.slot === previousSlot);
        const target = currentIndex < 0 ? 0 : currentIndex;
        if (!pendingUrl && image.getAttribute('src') !== photos[target]?.url) show(target);
        else index = target;
      }
    } catch { /* Mantém a imagem atual enquanto a conexão se recupera. */ }
    finally { busy = false; }
  }
  update();
  setInterval(update,3000);
  setInterval(() => { if (!document.hidden && !pendingUrl && photos.length > 1) show((index+1)%photos.length); },5000);
  document.addEventListener('visibilitychange',update);
})();
