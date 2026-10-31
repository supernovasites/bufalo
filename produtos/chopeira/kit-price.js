/* Kit 7L: weekend promotion follows Brasilia time, wherever the visitor is. */
(() => {
  const price = document.querySelector('[data-kit7-price]');
  if (!price) return;
  const promotion = document.querySelector('[data-kit7-promotion]');
  const clock = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'America/Sao_Paulo', weekday: 'short',
    hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23'
  });
  const currency = new Intl.NumberFormat('pt-BR', {style: 'currency', currency: 'BRL'});
  const regularPrice = 1930, weekendDiscount = 255;
  let timer;
  function refresh() {
    clearTimeout(timer);
    const local = Object.fromEntries(clock.formatToParts(new Date()).map(part => [part.type, part.value]));
    const weekend = local.weekday === 'Sat' || local.weekday === 'Sun';
    price.textContent = currency.format(regularPrice - (weekend ? weekendDiscount : 0));
    promotion.hidden = !weekend;
    // Refresh at midnight even if the page stays open across the day change.
    const seconds = Number(local.hour) * 3600 + Number(local.minute) * 60 + Number(local.second);
    timer = setTimeout(refresh, (86400 - seconds) * 1000 + 100);
  }
  document.addEventListener('visibilitychange', () => { if (!document.hidden) refresh(); });
  window.addEventListener('pageshow', refresh);
  refresh();
})();

/* Búfalo Weekend: Saturday and Sunday prices for On TAP 2 L and 3,5 L, Brasília timezone. */
(() => {
  const offers = [...document.querySelectorAll('.ontap-weekend-offer[data-regular-price][data-weekend-price]')].map(container => ({
    price: container.querySelector('.product-price'),
    promotion: container.querySelector('.ontap-weekend-tag'),
    original: container.querySelector('.ontap-weekend-original'),
    regularPrice: Number(container.dataset.regularPrice),
    weekendPrice: Number(container.dataset.weekendPrice)
  })).filter(offer => offer.price && offer.promotion && offer.original &&
    Number.isFinite(offer.regularPrice) && Number.isFinite(offer.weekendPrice));
  if (!offers.length) return;

  const clock = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'America/Sao_Paulo', weekday: 'short',
    hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23'
  });
  const currency = new Intl.NumberFormat('pt-BR', {style: 'currency', currency: 'BRL'});
  let timer;
  function refresh() {
    clearTimeout(timer);
    const local = Object.fromEntries(clock.formatToParts(new Date()).map(part => [part.type, part.value]));
    const weekend = local.weekday === 'Sat' || local.weekday === 'Sun';
    for (const offer of offers) {
      offer.price.textContent = currency.format(weekend ? offer.weekendPrice : offer.regularPrice);
      offer.promotion.hidden = !weekend;
      offer.original.hidden = !weekend;
      offer.price.classList.toggle('is-weekend-price', weekend);
    }
    // Recheck at Brasília midnight, including pages left open.
    const seconds = Number(local.hour) * 3600 + Number(local.minute) * 60 + Number(local.second);
    timer = setTimeout(refresh, (86400 - seconds) * 1000 + 150);
  }
  document.addEventListener('visibilitychange', () => { if (!document.hidden) refresh(); });
  window.addEventListener('pageshow', refresh);
  refresh();
})();
