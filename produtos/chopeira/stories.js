(() => {
  const stage = document.getElementById('manada-stories-stage');
  if (!stage) return;
  const section = stage.closest('.manada-stories');
  const items = JSON.parse(document.getElementById('manada-stories-items').textContent);
  const count = section.querySelector('.manada-stories-count');
  const progress = section.querySelector('.manada-stories-progress');
  const wrap = n => (n + items.length) % items.length;
  const videoIndices = items.flatMap((item, i) => item.type === 'video' ? [i] : []);
  const initialIndex = videoIndices.length ? videoIndices[Math.floor(Math.random() * videoIndices.length)] : 0;
  let index = initialIndex, inView = false, dragging = false, pointer = null;
  let frame = 0, elapsed = 0, since = null, generation = 0;
  const failed = new Set();
  const cards = items.map((item, i) => {
    const card = document.createElement('button');
    card.type = 'button'; card.className = 'manada-story';
    card.setAttribute('aria-label', `Ver story ${i + 1} de ${items.length}`);
    const poster = document.createElement('img');
    poster.src = item.poster || item.src; poster.alt = item.alt;
    poster.width = 540; poster.height = 960;
    poster.loading = Math.min(wrap(i - initialIndex), wrap(initialIndex - i)) <= 2 ? 'eager' : 'lazy';
    poster.draggable = false; card.append(poster);
    card.addEventListener('click', () => { if (i !== index && !dragging) go(i); });
    stage.append(card);
    return {card, poster, video: null};
  });
  function active() { return inView && !document.hidden && !dragging && !document.querySelector('dialog[open]'); }
  function stopClock() {
    if (since !== null) elapsed += performance.now() - since;
    since = null; cancelAnimationFrame(frame);
  }
  function paint(value) { progress.style.setProperty('--story-progress', `${Math.min(100, Math.max(0, value))}%`); }
  function tick() {
    if (!active()) return;
    const video = cards[index].video;
    if (items[index].type === 'image') {
      const time = elapsed + (since !== null ? performance.now() - since : 0);
      paint(time / 30);
      if (time >= 3000) { go(index + 1); return; }
    } else if (video && Number.isFinite(video.duration) && video.duration > 0) paint(video.currentTime / video.duration * 100);
    frame = requestAnimationFrame(tick);
  }
  function play() {
    stopClock();
    const entry = cards[index];
    if (!active()) { entry.video?.pause(); return; }
    if (items[index].type === 'image') {
      if (!entry.poster.complete || !entry.poster.naturalWidth) return;
      since = performance.now();
    } else if (entry.video?.paused) {
      entry.video.muted = true;
      const attempt = entry.video.play();
      if (attempt) attempt.catch(() => {});
    }
    frame = requestAnimationFrame(tick);
  }
  function layout() {
    cards.forEach((entry, i) => {
      let offset = wrap(i - index);
      if (offset > items.length / 2) offset -= items.length;
      const visible = Math.abs(offset) <= 2;
      entry.card.hidden = !visible;
      entry.card.dataset.position = String(offset);
      entry.card.tabIndex = Math.abs(offset) === 1 ? 0 : -1;
      entry.card.setAttribute('aria-hidden', String(!visible || Math.abs(offset) === 2));
      if (offset === 0) entry.card.setAttribute('aria-current', 'true');
      else entry.card.removeAttribute('aria-current');
    });
    count.textContent = `${String(index + 1).padStart(2, '0')} / ${String(items.length).padStart(2, '0')}`;
    stage.setAttribute('aria-label', `Stories da comunidade Búfalo. Story ${index + 1} de ${items.length}. Arraste para a esquerda para avançar.`);
  }
  function go(next) {
    stopClock(); cards[index].video?.pause();
    // Release the old decoder and download; side cards only use their poster.
    if (cards[index].video) { cards[index].video.removeAttribute('src'); cards[index].video.load(); cards[index].video.remove(); cards[index].video = null; }
    index = wrap(next); elapsed = 0; paint(0); generation++;
    layout();
    const entry = cards[index], item = items[index], token = generation;
    const skip = () => {
      if (token !== generation) return;
      failed.add(index);
      if (failed.size < items.length) {
        let nextIndex = wrap(index + 1);
        while (failed.has(nextIndex)) nextIndex = wrap(nextIndex + 1);
        go(nextIndex);
      }
    };
    entry.poster.onload = () => { if (token === generation) play(); };
    entry.poster.onerror = skip;
    if (item.type === 'video') {
      const video = document.createElement('video'); entry.video = video;
      video.muted = true; video.defaultMuted = true; video.playsInline = true;
      video.preload = 'auto'; video.controls = false;
      video.setAttribute('muted', ''); video.setAttribute('playsinline', '');
      video.setAttribute('disablepictureinpicture', '');
      video.setAttribute('aria-label', item.alt); video.poster = item.poster;
      video.addEventListener('playing', () => { if (token === generation) entry.card.classList.add('is-playing'); });
      video.addEventListener('canplay', () => { if (token === generation) play(); });
      video.addEventListener('ended', () => { if (token === generation) go(index + 1); });
      video.addEventListener('error', skip);
      video.src = item.src; entry.card.append(video);
    }
    cards.forEach(entry => entry.card.classList.remove('is-playing'));
    play();
  }
  stage.addEventListener('pointerdown', event => {
    if (event.button !== 0) return;
    pointer = {id: event.pointerId, x: event.clientX, y: event.clientY};
  });
  stage.addEventListener('pointermove', event => {
    if (!pointer || pointer.id !== event.pointerId) return;
    const dx = event.clientX - pointer.x, dy = event.clientY - pointer.y;
    if (!dragging && Math.abs(dx) > 12 && Math.abs(dx) > Math.abs(dy) * 1.25) {
      dragging = true; stage.setPointerCapture(event.pointerId); play();
    }
    if (dragging) { event.preventDefault(); stage.style.setProperty('--story-drag', `${Math.max(-110, Math.min(110, dx))}px`); }
  });
  function release(event) {
    if (!pointer || pointer.id !== event.pointerId) return;
    const dx = event.clientX - pointer.x, wasDragging = dragging;
    pointer = null; stage.style.removeProperty('--story-drag');
    if (stage.hasPointerCapture(event.pointerId)) stage.releasePointerCapture(event.pointerId);
    if (wasDragging && event.type !== 'pointercancel' && Math.abs(dx) >= 45) go(index + (dx < 0 ? 1 : -1));
    // Suppress the synthetic click after a swipe.
    setTimeout(() => { dragging = false; play(); }, 0);
  }
  stage.addEventListener('pointerup', release);
  stage.addEventListener('pointercancel', release);
  stage.addEventListener('dragstart', event => event.preventDefault());
  stage.addEventListener('keydown', event => {
    if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') { event.preventDefault(); go(index + (event.key === 'ArrowLeft' ? -1 : 1)); }
  });
  document.addEventListener('visibilitychange', play);
  document.addEventListener('pointerdown', play, {capture: true, passive: true});
  document.addEventListener('keydown', play, {capture: true});
  window.addEventListener('pageshow', play);
  document.querySelectorAll('dialog').forEach(dialog => {
    new MutationObserver(play).observe(dialog, {attributes: true, attributeFilter: ['open']});
  });
  new IntersectionObserver(entries => { inView = entries[0].isIntersecting && entries[0].intersectionRatio >= 0.35; play(); }, {threshold: 0.35}).observe(stage);
  go(initialIndex);
})();
