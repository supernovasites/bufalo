/* Búfalo GA4: public pages only. Version 2026-10-04. */
(() => {
  'use strict';
  const hosts = ['bufalo.pages.dev', 'bufalogrowler.com.br', 'www.bufalogrowler.com.br'];
  const path = location.pathname;
  if (!hosts.includes(location.hostname) || /\/(admin|painel)(?:[/.]|$)/.test(path) || /\/assets\//.test(path) || window.bufaloAnalytics) return;
  const measurementId = 'G-FPEC1ZGMJQ';
  const groups = [['/produtos/copos', 'copos'], ['/produtos/garrafas', 'garrafas'], ['/catalogo', 'catalogo'], ['/live', 'live'], ['/manadaone', 'manadaone'], ['/manadacash', 'manadacash'], ['/campanhas/cirio', 'cirio'], ['/reserva/acaibowl', 'reserva_acai'], ['/blog', 'blog']];
  const group = groups.find(([prefix]) => path.startsWith(prefix))?.[1] || (path === '/' || path === '/index.html' ? 'home' : 'outras');
  const safeValue = value => String(value || '').replace(/[^a-zA-Z0-9_\- .]/g, '').slice(0, 100);
  // Keep attribution identifiers, never form fields, search queries or WhatsApp text.
  function safeLocation(raw) {
    try {
      const input = new URL(raw, location.href), output = new URL(input.origin + input.pathname);
      for (const key of ['utm_source', 'utm_medium', 'utm_campaign', 'utm_id', 'utm_content', 'utm_term', 'gclid', 'dclid', 'gbraid', 'wbraid']) {
        const value = input.searchParams.get(key);
        if (value && /^[a-zA-Z0-9_ .~%+\-]{1,200}$/.test(value) && !/\b\d{10,15}\b/.test(value)) output.searchParams.set(key, value);
      }
      // Article identifier distinguishes posts served by the same HTML template.
      const post = input.searchParams.get('post');
      if (post && /^[a-z0-9-]{1,100}$/.test(post)) output.searchParams.set('post', post);
      return output.href;
    } catch { return ''; }
  }
  window.dataLayer = window.dataLayer || [];
  window.gtag = window.gtag || function () { window.dataLayer.push(arguments); };
  const context = {content_group: group, page_type: document.documentElement.dataset.pageType || (/encerrada/.test(path) ? 'encerrada' : group)};
  function track(name, params = {}) {
    window.gtag('event', name, {...context, ...params, send_to: measurementId, transport_type: 'beacon'});
  }
  // Only accept explicitly implemented business outcomes; never copy form values.
  window.bufaloAnalytics = Object.freeze({
    version: '2026-10-04',
    track(name, params = {}) {
      if (!['generate_lead', 'registration_confirmed', 'coupon_copy', 'form_error'].includes(name)) return;
      const clean = {};
      for (const key of ['form_id', 'lead_type', 'coupon', 'error_type']) if (params[key]) clean[key] = safeValue(params[key]);
      track(name, clean);
    }
  });
  window.gtag('js', new Date());
  window.gtag('config', measurementId, {
    ...context, page_location: safeLocation(location.href), page_referrer: safeLocation(document.referrer),
    allow_google_signals: false, allow_ad_personalization_signals: false
  });
  const script = document.createElement('script');
  script.async = true;
  script.src = 'https://www.googletagmanager.com/gtag/js?id=' + measurementId;
  document.head.appendChild(script);

  const cardSelector = '.card, article.product, .one-card';
  function listFor(card) {
    const section = card.closest('section, [role="tabpanel"]');
    const rail = card.closest('.products, .catalog-rail, .one-products, .one-apparel, .product-row');
    const id = safeValue(rail?.id || section?.id || group + '_produtos');
    return {item_list_id: id, item_list_name: (section?.querySelector('h2')?.textContent.trim() || rail?.getAttribute('aria-label') || id).slice(0, 100)};
  }
  function itemFor(card) {
    const link = card.matches('a[href]') ? card : card.querySelector('a[href*="loja.bufalogrowler.com.br"]');
    if (!link) return null;
    let url;
    try { url = new URL(link.href, location.href); } catch { return null; }
    if (url.hostname !== 'loja.bufalogrowler.com.br' || url.pathname === '/') return null;
    const id = url.pathname.replace(/^\/+|\/+$/g, '');
    if (!/^[a-zA-Z0-9_-]+$/.test(id)) return null;
    const name = card.dataset.productName || card.querySelector('h3, h2')?.textContent.trim() || link.getAttribute('aria-label');
    if (!name) return null;
    const item = {item_id: id, item_name: name.slice(0, 100), item_brand: 'Búfalo Growler', ...listFor(card)};
    // Variant only from product swatches, never customer-entered values.
    const color = card.querySelector('[aria-pressed="true"][data-color-label], [aria-pressed="true"][data-color-name]');
    if (color) item.item_variant = (color.dataset.colorLabel || color.dataset.colorName).slice(0, 100);
    return item;
  }
  function position(element) {
    const section = element.closest('dialog, section, header, footer, nav');
    return safeValue(section?.id || section?.tagName.toLowerCase() || 'page');
  }
  const promotions = {
    'bufalo-weekend': 'Chopeira Búfalo 2L',
    'marajo-dry-popup': 'É Círio outra vez',
    'mc-popup': 'ManadaCash',
    'preview-modal': 'ManadaCash'
  };
  function promoFor(element) {
    const dialog = element.closest('dialog, [role="dialog"]');
    if (!dialog || !promotions[dialog.id]) return null;
    return {promotion_id: dialog.dataset?.promotionId || dialog.id, promotion_name: promotions[dialog.id], creative_slot: ['bufalo-weekend', 'marajo-dry-popup'].includes(dialog.id) ? 'popup_abertura' : 'popup_fidelidade'};
  }
  document.addEventListener('click', event => {
    const target = event.target instanceof Element ? event.target : event.target.parentElement;
    const cash = target?.closest('[data-open-mc], .dock-cash, .desktop-cash-link, .mc-launcher');
    if (cash) track('bufalo_manadacash_click', {link_position: position(cash)});
    const link = target?.closest('a[href]');
    if (link) {
      let url;
      try { url = new URL(link.href, location.href); } catch { return; }
      const host = url.hostname;
      const name = ['wa.me', 'api.whatsapp.com', 'web.whatsapp.com'].includes(host) ? 'bufalo_whatsapp_click' : host === 'loja.bufalogrowler.com.br' ? 'bufalo_store_click' : ['instagram.com', 'www.instagram.com'].includes(host) ? 'bufalo_instagram_click' : null;
      if (name) track(name, {link_domain: host, link_path: name === 'bufalo_store_click' ? url.pathname : '/', link_position: position(link)});
      const card = link.closest(cardSelector), item = card && itemFor(card);
      if (item && host === 'loja.bufalogrowler.com.br') track('select_item', {...listFor(card), items: [item]});
      const promo = promoFor(link);
      if (promo) track('select_promotion', promo);
      if (hosts.includes(host) && /^\/catalogo(?:\/|$)/.test(url.pathname)) track('catalog_click', {link_position: position(link)});
    }
    const tab = target?.closest('[role="tab"], .category-index-links a');
    if (tab) track('category_select', {category_id: safeValue(tab.dataset.thermal || tab.dataset.category || tab.id || tab.hash?.slice(1)), link_position: position(tab)});
  });
  const startedForms = new WeakSet();
  document.addEventListener('focusin', event => {
    const form = event.target.closest?.('form');
    if (!form?.id || form.getAttribute('role') === 'search' || startedForms.has(form)) return;
    startedForms.add(form);
    track('lead_form_start', {form_id: safeValue(form.id)});
  });
  document.addEventListener('submit', event => {
    const form = event.target;
    if (form.getAttribute('role') === 'search') {
      track('search_submit', {link_position: position(form)}); // no search text
    } else if (form.id) {
      track('lead_form_submit', {form_id: safeValue(form.id)}); // attempt, not conversion
    }
  });

  function observeContent() {
    const impressions = new Set(), registered = new WeakSet(), openPromos = new WeakSet();
    const observer = typeof IntersectionObserver === 'function' ? new IntersectionObserver(entries => {
      const lists = new Map();
      for (const entry of entries) {
        if (!entry.isIntersecting || entry.intersectionRatio < 0.5) continue;
        const card = entry.target, item = itemFor(card);
        if (!item || card.closest('[hidden]')) continue;
        const key = item.item_list_id + ':' + item.item_id;
        if (impressions.has(key)) continue;
        impressions.add(key);
        const list = lists.get(item.item_list_id) || { ...listFor(card), items: [] };
        list.items.push(item); lists.set(item.item_list_id, list);
      }
      for (const list of lists.values()) track('view_item_list', list);
    }, {threshold: 0.5}) : null;
    function scan() {
      document.querySelectorAll(cardSelector).forEach(card => {
        if (registered.has(card) || !itemFor(card)) return;
        registered.add(card); observer?.observe(card);
      });
      for (const id of Object.keys(promotions)) {
        const dialog = document.getElementById(id);
        if (!dialog) continue;
        const opened = dialog.open || dialog.classList.contains('open');
        if (opened && !openPromos.has(dialog)) {
          openPromos.add(dialog); track('view_promotion', promoFor(dialog));
        } else if (!opened && openPromos.has(dialog)) {
          openPromos.delete(dialog); track('promotion_close', {promotion_id: dialog.dataset?.promotionId || id});
        }
      }
    }
    scan();
    let pending = false;
    new MutationObserver(records => {
      if (records.every(record => record.type === 'attributes' && record.attributeName === 'class' && record.target.id !== 'preview-modal')) return;
      if (pending) return;
      pending = true;
      requestAnimationFrame(() => {pending = false; scan();});
    }).observe(document.body, {childList: true, subtree: true, attributes: true, attributeFilter: ['open', 'hidden', 'href', 'class']});
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', observeContent, {once: true});
  else observeContent();
})();
