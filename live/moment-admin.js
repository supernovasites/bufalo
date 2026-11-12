(() => {
  const container = document.getElementById('gallery-slots');
  if (!container) return;
  const feedback = document.getElementById('gallery-feedback');
  const slots = [];
  let state = {photos:[],moment:{}}, selecting = false;
  async function refresh() {
    const response = await fetch('/live/api/gallery', {cache:'no-store'});
    if (!response.ok) throw new Error('Não foi possível carregar as fotos. Recarregue a página.');
    state = await response.json(); render();
  }
  function render() { slots.forEach(slot => slot.render()); }
  for (let slot = 1; slot <= 3; slot++) {
    const form = document.createElement('form');
    form.className = 'gallery-slot';
    form.innerHTML = `<h3>Foto ${slot}</h3><img alt="Prévia da foto ${slot}" hidden><div class="gallery-empty">Sem foto</div><label for="gallery-file-${slot}">Carregar imagem ${slot}</label><input id="gallery-file-${slot}" type="file" accept="image/jpeg,image/png,image/webp"><button type="submit" class="btn" disabled>Enviar foto ${slot}</button><progress max="100" value="0" aria-label="Carregamento da foto ${slot}" hidden></progress><p class="slot-feedback" role="status" aria-live="polite"></p><label class="gallery-select"><input type="radio" name="moment-photo" value="${slot}" disabled> Exibir no Momento BG</label>`;
    const fileInput = form.querySelector('input[type=file]'), radio = form.querySelector('input[type=radio]');
    const img = form.querySelector('img'), empty = form.querySelector('.gallery-empty');
    const button = form.querySelector('button'), status = form.querySelector('.slot-feedback'), progress = form.querySelector('progress');
    let blob = null, objectUrl = null, busy = false, revision = 0;
    slots.push({render() {
      const saved = state.photos.find(photo => photo.slot === slot);
      if (saved && !blob && !busy) {
        const src = '/live/api/gallery/'+slot+'?v='+encodeURIComponent(saved.photo_version);
        if (img.getAttribute('src') !== src) img.src = src;
        img.hidden = false; empty.hidden = true;
      } else if (!saved && !blob && !busy) {
        img.hidden = true; empty.hidden = false;
      }
      radio.checked = state.moment.slot === slot;
      radio.disabled = !saved || selecting || busy || !!blob;
      form.classList.toggle('is-selected', radio.checked);
    }});
    fileInput.addEventListener('change', async () => {
      const current = ++revision;
      blob = null; busy = false; button.disabled = true; radio.disabled = true; progress.hidden = true;
      const file = fileInput.files[0];
      if (!file) { status.textContent = ''; render(); return; }
      if (!['image/jpeg','image/png','image/webp'].includes(file.type) || file.size > 10*1024*1024) {
        status.textContent = 'Use JPG, PNG ou WebP de até 10 MB.'; render(); return;
      }
      status.textContent = 'Preparando imagem…'; busy = true;
      try {
        const bitmap = await createImageBitmap(file);
        const scale = Math.min(1, 1920 / Math.max(bitmap.width, bitmap.height));
        const canvas = document.createElement('canvas');
        canvas.width = Math.max(1, Math.round(bitmap.width*scale));
        canvas.height = Math.max(1, Math.round(bitmap.height*scale));
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = '#fff'; ctx.fillRect(0,0,canvas.width,canvas.height);
        ctx.drawImage(bitmap,0,0,canvas.width,canvas.height); bitmap.close();
        let prepared;
        for (const quality of [.86,.72,.56,.4]) {
          prepared = await new Promise(resolve => canvas.toBlob(resolve,'image/jpeg',quality));
          if (prepared && prepared.size <= 800000) break;
        }
        if (current !== revision) return;
        if (!prepared || prepared.size > 800000) throw new Error('Escolha uma imagem menor.');
        blob = prepared;
        if (objectUrl) URL.revokeObjectURL(objectUrl);
        objectUrl = URL.createObjectURL(blob); img.src = objectUrl; img.hidden = false; empty.hidden = true;
        button.disabled = false; status.textContent = 'Imagem pronta para enviar.';
      } catch (error) { if(current === revision) status.textContent = 'Não foi possível preparar a foto. '+error.message; }
      finally { if(current === revision) { busy = false; render(); } }
    });
    form.addEventListener('submit', async event => {
      event.preventDefault();
      if (!blob || busy) return;
      busy = true; fileInput.disabled = true; button.disabled = true;
      progress.hidden = false; progress.value = 0; status.textContent = 'Enviando imagem…'; render();
      try {
        await new Promise((resolve,reject) => {
          const xhr = new XMLHttpRequest();
          xhr.open('POST','/live/api/gallery/'+slot);
          xhr.setRequestHeader('Content-Type',blob.type); xhr.timeout = 60000;
          xhr.upload.onprogress = event => {
            if (event.lengthComputable) {
              progress.value = Math.round(event.loaded/event.total*100);
              status.textContent = progress.value === 100 ? 'Salvando imagem…' : 'Enviando: '+progress.value+'%';
            }
          };
          xhr.onload = () => {
            let data = {}; try { data = JSON.parse(xhr.responseText); } catch {}
            if (xhr.status >= 200 && xhr.status < 300) resolve(data);
            else { if(xhr.status === 401) window.location.replace('/painel/'); reject(new Error(data.error || 'Não foi possível enviar a foto.')); }
          };
          xhr.onerror = () => reject(new Error('Falha na conexão. Tente enviar novamente.'));
          xhr.ontimeout = () => reject(new Error('O envio demorou demais. Tente novamente.'));
          xhr.send(blob);
        });
        blob = null; fileInput.value = ''; progress.value = 100; busy = false;
        await refresh();
        status.textContent = state.moment.slot === slot ? 'Foto salva e exibida no Momento BG.' : 'Foto salva. Marque abaixo para exibir na live.';
      } catch (error) { status.textContent = error.message; }
      finally { busy = false; fileInput.disabled = false; button.disabled = !blob; render(); }
    });
    radio.addEventListener('change', async () => {
      if (selecting) return;
      selecting = true; feedback.textContent = 'Atualizando foto da live…'; render();
      try {
        const response = await fetch('/live/api/gallery/select', {method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({slot})});
        const data = await response.json();
        if (!response.ok) { if(response.status === 401)window.location.replace('/painel/'); throw new Error(data.error || 'Não foi possível selecionar a foto.'); }
        state = data; feedback.textContent = 'Foto '+slot+' selecionada. Apenas ela será exibida no Momento BG.';
      } catch(error) { feedback.textContent = error.message; }
      finally { selecting = false; render(); }
    });
    container.append(form);
  }
  refresh().catch(error => { feedback.textContent = error.message; });
})();
