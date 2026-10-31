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
