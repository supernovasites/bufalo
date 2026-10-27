(() => {
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
  document.addEventListener('click', event => {
    const link = event.target.closest('.product .product-cta');
    if (!link || event.defaultPrevented || event.button !== 0) return;
    const coupon = document.getElementById('code')?.textContent.trim();
    if (!coupon || coupon.includes('__LIVE_')) return;
    const report = copied => {
      const feedback = document.getElementById('feedback');
      if (feedback) feedback.textContent = copied ? 'Cupom '+coupon+' copiado. Use na finalização da compra.' : 'Use o cupom '+coupon+' na finalização da compra.';
    };
    const fallback = () => {
      const field = document.createElement('textarea');
      field.value = coupon;
      field.style.cssText = 'position:fixed;opacity:0;pointer-events:none';
      document.body.append(field);
      field.select();
      let copied = false;
      try { copied = document.execCommand('copy'); } catch {}
      field.remove();
      report(copied);
    };
    if (navigator.clipboard?.writeText) navigator.clipboard.writeText(coupon).then(() => report(true), fallback);
    else fallback();
    // Keep native anchor navigation: clipboard permission must never block buying.
  });
})();
