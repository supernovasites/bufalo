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
    if (!link) {
      const button = event.target.closest('button[data-occasion]');
      if (!button) return;
      const suggestions = {
        a_dois: ['266520163', 'Para uma conversa sem pressa. Conheça a On TAP 2 L e planeje a quantidade para o seu encontro.'],
        amigos: ['404795468', 'Uma opção de 3,5 L para o churrasco ou a noite de jogos. Explore também as cores laranja e creme.'],
        manada: ['397365368', 'Dois growlers de 3,5 L e um kit dispensador. Mais capacidade total para organizar os planos da turma.']
      };
      const choice = suggestions[button.dataset.occasion];
      if (!choice) return;
      const product = products.find(p => p.id === choice[0]);
      if (!product) return;
      document.querySelectorAll('button[data-occasion]').forEach(el => el.setAttribute('aria-pressed', String(el === button)));
      const result = document.getElementById('match-result');
      document.getElementById('match-image').src = 'images/' + product.id + '.webp';
      document.getElementById('match-name').textContent = product.name;
      document.getElementById('match-description').textContent = choice[1];
      document.getElementById('match-link').href = '#' + product.slug;
      result.hidden = false;
      track('ontap_occasion_select', {occasion_id: button.dataset.occasion, suggested_item_id: product.id, link_position: 'discovery'});
      return;
    }
    if (link.dataset.productLink) {
      const p = products.find(p => p.id === link.dataset.productLink);
      if (p) track('select_item', {item_list_id: 'ontap26_collection', item_list_name: 'Linha On TAP', link_position: link.dataset.placement, items: [item(p)]});
    }
    if (link.dataset.cta) track('ontap_cta_click', {cta_id: link.dataset.cta, link_position: link.dataset.placement, section_id: link.hash.slice(1)});
  });
  document.querySelectorAll('details[data-faq]').forEach(details => details.addEventListener('toggle', () => {
    if (details.open) track('ontap_faq_open', {question_id: details.dataset.faq});
  }));
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
