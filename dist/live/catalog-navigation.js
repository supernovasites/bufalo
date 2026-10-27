(() => {
  const nav = document.querySelector('.live-catalog-nav');
  if (nav) {
    const anchor = document.createElement('div');
    nav.before(anchor);
    const pin = () => {
      const rect = anchor.getBoundingClientRect();
      const fixed = rect.top < 0;
      anchor.style.height = fixed ? `${nav.offsetHeight}px` : '0px';
      nav.classList.toggle('is-floating', fixed);
      nav.style.left = fixed ? `${rect.left}px` : '';
      nav.style.width = fixed ? `${rect.width}px` : '';
    };
    const syncHeight = () => document.documentElement.style.setProperty('--catalog-nav-height', `${nav.offsetHeight}px`);
    new ResizeObserver(syncHeight).observe(nav);
    syncHeight();
    const links = [...nav.querySelectorAll('a')];
    const sections = links.map(link => document.querySelector(link.getAttribute('href')));
    let pending = false;
    const update = () => {
      pending = false;
      pin();
      let current = -1;
      sections.forEach((section, index) => {
        if (section && section.getBoundingClientRect().top <= nav.offsetHeight + 24) current = index;
      });
      links.forEach((link, index) => {
        if (index === current) link.setAttribute('aria-current', 'location');
        else link.removeAttribute('aria-current');
      });
    };
    window.addEventListener('scroll', () => {
      if (!pending) { pending = true; requestAnimationFrame(update); }
    }, {passive: true});
    update();
    window.addEventListener('resize', () => { pin(); syncHeight(); });
  }
  const parseMoney = text => Number(text.replace(/[^\d,.-]/g, '').replace(/\./g, '').replace(',', '.'));
  const format = value => value.toLocaleString('pt-BR', {style:'currency', currency:'BRL'});
  const refreshSavings = () => {
    document.querySelectorAll('.product').forEach(card => {
      const old = card.querySelector('.old s');
      const price = card.querySelector('.price');
      const image = card.querySelector('.product-image');
      if (!old || !price || !image) return;
      const saving = Math.round((parseMoney(old.textContent) - parseMoney(price.textContent)) * 100) / 100;
      if (!Number.isFinite(saving) || saving <= 0) return;
      let badge = image.querySelector('.badge');
      if (!badge) { badge = document.createElement('span'); badge.className = 'badge'; image.prepend(badge); }
      const label = `Economize ${format(saving)}`;
      if (badge.textContent !== label) badge.textContent = label;
      badge.classList.add('catalog-saving-badge');
    });
  };
  let queued = false;
  new MutationObserver(() => {
    if (queued) return;
    queued = true;
    requestAnimationFrame(() => { queued = false; refreshSavings(); });
  }).observe(document.querySelector('main') || document.body, {subtree:true, childList:true, characterData:true});
  refreshSavings();
  document.addEventListener('click', async event => {
    const link = event.target.closest('.product .product-cta');
    if (!link || event.defaultPrevented || event.button !== 0 || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
    const coupon = document.getElementById('code')?.textContent.trim();
    if (!coupon || coupon.includes('__LIVE_')) return;
    event.preventDefault();
    const destination = link.href;
    const tab = link.target === '_blank' ? window.open('about:blank', '_blank') : null;
    if (tab) tab.opener = null;
    let copied = false;
    try { await navigator.clipboard.writeText(coupon); copied = true; } catch {
      const field = document.createElement('textarea');
      field.value = coupon;
      field.style.cssText = 'position:fixed;opacity:0;pointer-events:none';
      document.body.append(field);
      field.select();
      try { copied = document.execCommand('copy'); } catch {}
      field.remove();
    }
    const feedback = document.getElementById('feedback');
    if (feedback) feedback.textContent = copied ? `Cupom ${coupon} copiado. Use na finalização da compra.` : `Use o cupom ${coupon} na finalização da compra.`;
    if (tab) tab.location.href = destination;
    else window.location.assign(destination);
  });
})();
