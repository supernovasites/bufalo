(() => {
  'use strict';
  const popup = document.getElementById('black26-popup');
  if (!popup) return;
  const calendar = new Intl.DateTimeFormat('en-US', {timeZone: 'America/Fortaleza', weekday: 'short'});
  const isWeekday = () => !['Sat', 'Sun'].includes(calendar.format(new Date()));
  if (!isWeekday()) return;
  const sessionKey = 'bufalo_black26_popup_seen';
  const hasSeen = () => {
    try { if (document.cookie.split(';').some(cookie => cookie.trim() === sessionKey + '=1')) return true; } catch {}
    try { return sessionStorage.getItem(sessionKey) === '1'; } catch { return false; }
  };
  if (hasSeen()) return;

  const images = [
    ['caneca-bhadawari-710ml--425416', 'Caneca Bhadawari 710 ml Tiffany, de R$ 190 por R$ 152, 20% OFF'],
    ['copo-banni-350ml--37093', 'Copo Banni 350 ml Preto, de R$ 140 por R$ 99, 29% OFF'],
    ['copo-nilliravi-900ml--426573', 'Copo Niliravi 900 ml Pitaya, de R$ 190 por R$ 152, 20% OFF'],
    ['garrafa-buba-355ml---493930', 'Garrafa Buba 355 ml Amarelo e Preto, de R$ 170 por R$ 119, 30% OFF']
  ];
  const [file, description] = images[Math.floor(Math.random() * images.length)];
  const image = popup.querySelector('img');
  image.alt = 'Black Búfalo. ' + description + '.';
  image.src = '/assets/campaigns/black26/' + file + '.webp';

  let previousOverflow;
  popup.querySelector('[data-black26-close]').addEventListener('click', () => popup.close());
  popup.addEventListener('click', event => {
    const bounds = popup.getBoundingClientRect();
    if (event.target === popup && (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom)) popup.close();
  });
  popup.addEventListener('close', () => {
    document.body.style.overflow = previousOverflow || '';
  });
  const closeOnWeekend = () => { if (popup.open && !isWeekday()) popup.close(); };
  document.addEventListener('visibilitychange', closeOnWeekend);
  // Fortaleza is UTC-3: recheck at local midnight if the page stays open overnight.
  const checkAtMidnight = () => {
    const now = new Date(), next = new Date(now);
    next.setUTCHours(3, 0, 0, 0);
    if (next <= now) next.setUTCDate(next.getUTCDate() + 1);
    setTimeout(() => { closeOnWeekend(); if (isWeekday()) checkAtMidnight(); }, next - now);
  };
  checkAtMidnight();
  setTimeout(() => {
    if (!isWeekday() || hasSeen() || document.querySelector('dialog[open]')) return;
    previousOverflow = document.body.style.overflow;
    popup.showModal();
    // No expires/max-age: this cookie lasts for the browser session and covers other tabs.
    try { document.cookie = sessionKey + '=1; Path=/; SameSite=Lax' + (location.protocol === 'https:' ? '; Secure' : ''); } catch {}
    try { sessionStorage.setItem(sessionKey, '1'); } catch {}
    document.body.style.overflow = 'hidden';
  }, 600);
})();
