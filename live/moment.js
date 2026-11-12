(() => {
  const image = document.getElementById('momento-image');
  if (!image) return;
  let busy = false, photos = [], index = -1, selection = null;
  function show(nextIndex) {
    const photo = photos[nextIndex];
    if (!photo) return;
    index = nextIndex;
    image.src = photo.url;
    image.alt = 'Foto '+photo.slot+' da manada no Momento BG';
    counter.textContent = (index+1)+' / '+photos.length;
  }
  const controls = document.createElement('div');
  controls.className = 'moment-slide-controls';
  controls.innerHTML = '<button type="button" aria-label="Foto anterior">‹</button><span class="moment-slide-counter"></span><button type="button" aria-label="Próxima foto">›</button>';
  image.parentElement.append(controls);
  const counter = controls.querySelector('span');
  const buttons = controls.querySelectorAll('button');
  buttons[0].addEventListener('click',()=>show((index-1+photos.length)%photos.length));
  buttons[1].addEventListener('click',()=>show((index+1)%photos.length));

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
        if (image.getAttribute('src') !== photos[target]?.url) show(target);
        else { index = target; counter.textContent = (index+1)+' / '+photos.length; }
      }
    } catch { /* Mantém a imagem atual enquanto a conexão se recupera. */ }
    finally { busy = false; }
  }
  update();
  setInterval(update,3000);
  setInterval(() => { if (!document.hidden && photos.length > 1) show((index+1)%photos.length); },5000);
  document.addEventListener('visibilitychange',update);
})();
