/* Page measurements use the homepage's GA4 instance; never a second config. */
(() => {
  'use strict';
  const products = JSON.parse(document.getElementById('ontap-products').textContent);
  const item = p => ({item_id: p.id, item_name: p.name, item_brand: 'Búfalo', item_category: 'Chopeiras', item_list_id: 'ontap26_collection', item_list_name: 'Linha On TAP', index: products.indexOf(p)});
  function track(name, params = {}) {
    if (!window.bufaloAnalytics || typeof window.gtag !== 'function') return;
    window.gtag('event', name, {send_to: 'G-FPEC1ZGMJQ', content_group: 'chopeiras', page_type: 'chopeira', campaign_id: 'ontap26', ...params, transport_type: 'beacon'});
  }
  let listViewed = false;
  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver(entries => {
      for (const entry of entries) {
        if (!entry.isIntersecting || entry.intersectionRatio < 0.5) continue;
        if (!listViewed) {
          track('view_item_list', {item_list_id: 'ontap26_collection', item_list_name: 'Linha On TAP', items: products.map(item)});
          listViewed = true;
        }
        const p = products.find(p => p.id === entry.target.closest('[data-product-id]').dataset.productId);
        if (p) track('view_item', {items: [item(p)]});
        observer.unobserve(entry.target);
      }
    }, {threshold: 0.5});
    document.querySelectorAll('.ontap-product .product-visual').forEach(el => observer.observe(el));
  }
  document.addEventListener('click', event => {
    const link = event.target.closest('a');
    if (!link) return;
    if (link.dataset.productLink) {
      const p = products.find(p => p.id === link.dataset.productLink);
      if (p) track('select_item', {item_list_id: 'ontap26_collection', item_list_name: 'Linha On TAP', link_position: link.dataset.placement, items: [item(p)]});
    }
    if (link.dataset.cta) track('ontap_cta_click', {cta_id: link.dataset.cta, link_position: link.dataset.placement, section_id: link.hash.slice(1)});
  });
  document.querySelectorAll('details[data-faq]').forEach(details => details.addEventListener('toggle', () => {
    if (details.open) track('ontap_faq_open', {question_id: details.dataset.faq});
  }));
  const video = document.getElementById('cheruti-video');
  document.querySelectorAll('[data-rail-step]').forEach(button => button.addEventListener('click', () => {
    const rail = document.getElementById(button.dataset.rail);
    if (!rail?.firstElementChild) return;
    const gap = parseFloat(window.getComputedStyle(rail).columnGap) || 0;
    const distance = rail.firstElementChild.getBoundingClientRect().width + gap;
    rail.scrollBy({left: distance * Number(button.dataset.railStep), behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth'});
    track('ontap_variant_scroll', {item_list_id: button.dataset.rail, direction: button.dataset.railStep === '1' ? 'next' : 'previous'});
  }));
  const play = document.getElementById('cheruti-play');
  if (video && play) {
    video.controls = false;
    play.hidden = false;
    play.addEventListener('click', async () => {
      video.controls = true;
      try { await video.play(); } catch { play.hidden = false; }
    });
    video.addEventListener('playing', () => {
      play.hidden = true;
      track('ontap_video_play', {video_id: 'rafael_cheruti_growler'});
    });
    const progress = new Set();
    function measureVideo(percent) {
      for (const value of [25, 50, 75, 100]) if (percent >= value && !progress.has(value)) {
        progress.add(value); track('ontap_video_progress', {video_id: 'rafael_cheruti_growler', video_percent: value});
      }
    }
    video.addEventListener('timeupdate', () => {
      if (Number.isFinite(video.duration) && video.duration > 0) measureVideo(video.currentTime / video.duration * 100);
    });
    video.addEventListener('ended', () => {measureVideo(100); play.hidden = false;});
  }
  const milestones = new Set();
  let pending = false;
  function measureScroll() {
    pending = false;
    const total = document.documentElement.scrollHeight - window.innerHeight;
    if (total <= 0) return;
    const percent = Math.min(100, Math.round(window.scrollY / total * 100));
    for (const value of [25, 50, 75, 100]) if (percent >= value && !milestones.has(value)) {
      milestones.add(value); track('ontap_scroll', {percent_scrolled: value});
    }
  }
  window.addEventListener('scroll', () => {
    if (!pending) {pending = true; requestAnimationFrame(measureScroll);}
  }, {passive: true});
})();

/* Keep both real color variations inside each kit card. */
(() => {
  document.querySelectorAll('[data-kit-color]').forEach(button => {
    button.addEventListener('click', () => {
      const card = button.closest('.ontap-product');
      const image = card.querySelector('.product-visual img');
      image.src = button.dataset.image;
      image.alt = card.querySelector('h2').textContent + ' · ' + button.dataset.colorName;
      card.querySelector('[data-kit-color-label]').textContent = button.dataset.colorName;
      card.querySelectorAll('[data-kit-color]').forEach(option => option.setAttribute('aria-pressed', String(option === button)));
      const link = card.querySelector('[data-product-link]');
      const url = new URL(link.href);
      url.searchParams.set('variacao', button.dataset.variantId);
      link.href = url.href;
    });
  });
})();

(() => {
  const slideshow = document.querySelector('.mestre-kit-slideshow');
  if (!slideshow) return;
  const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
  let ready = false;
  function update() {
    slideshow.classList.toggle('is-rotating', ready && !motion.matches);
  }
  // Keep the first photo visible if either image fails to load.
  Promise.all([...slideshow.querySelectorAll('img')].map(img => img.decode()))
    .then(() => { ready = true; update(); }).catch(() => {});
  motion.addEventListener('change', update);
})();

/* Prévia interativa das cores originais da Bag Tiracolo. A seleção comercial é confirmada na loja. */
(() => {
  const card = document.getElementById('bag-tiracolo');
  if (!card) return;
  const image = card.querySelector('#bag-color-image');
  const label = card.querySelector('[data-bag-color-label]');
  const options = card.querySelectorAll('[data-bag-color]');
  if (!image || !label || options.length === 0) return;
  options.forEach(button => button.addEventListener('click', () => {
    const color = button.dataset.bagColor;
    const source = button.dataset.image;
    if (!color || !source) return;
    image.src = source;
    image.alt = 'Bag Tiracolo para chopeira Búfalo na cor ' + color.toLowerCase() + ', imagem ilustrativa';
    label.textContent = color;
    options.forEach(option => option.setAttribute('aria-pressed', String(option === button)));
  }));
})();
