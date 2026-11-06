(() => {
  'use strict';
  document.querySelectorAll('#growlers-kundi-rail .ontap-product').forEach(card => {
    const image=card.querySelector('.product-visual img');
    const label=card.querySelector('[data-kundi-color-label]');
    const link=card.querySelector('[data-product-link]');
    const options=card.querySelectorAll('[data-kundi-color]');
    if(!image||!label||!link||!options.length)return;
    options.forEach(button=>button.addEventListener('click',()=>{
      image.src=button.dataset.image;
      image.alt=card.querySelector('h2').textContent+' na cor '+button.dataset.kundiColor.toLowerCase();
      label.textContent=button.dataset.kundiColor;
      options.forEach(option=>option.setAttribute('aria-pressed',String(option===button)));
      const url=new URL(link.href);
      url.searchParams.set('sku',button.dataset.sku);
      link.href=url.href;
      link.dataset.selectedVariant=button.dataset.variantProduct;
    }));
  });
})();
