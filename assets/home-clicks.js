/* Búfalo: contador agregado de interações da homepage. Sem dados pessoais. */
(() => {
  'use strict';
  const allowedHosts = ['bufalogrowler.com.br','www.bufalogrowler.com.br','bufalo.pages.dev'];
  if (!allowedHosts.includes(location.hostname) || !['/','/index.html','/bufalo'].includes(location.pathname) || window.bgHomeClicks) return;
  window.bgHomeClicks = true;
  const endpoint = '/api/home-analytics';
  const device = innerWidth < 768 ? 'mobile' : innerWidth < 1100 ? 'tablet' : 'desktop';
  const slug = value => String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9_-]+/g,'-').replace(/^-+|-+$/g,'').slice(0,60) || 'item';
  const label = value => String(value || '').replace(/\s+/g,' ').replace(/\b\d{8,}\b/g,'').replace(/[<>@]/g,'').trim().slice(0,95);
  const targetFor = element => {
    if (!element.matches('a[href]')) return '';
    let url;
    try { url = new URL(element.getAttribute('href'),location.href); } catch { return ''; }
    // Nunca salvar queries, telefones de links WhatsApp ou URLs livres de clientes.
    if (['wa.me','api.whatsapp.com','web.whatsapp.com'].includes(url.hostname)) return 'whatsapp';
    if (['bufalogrowler.com.br','www.bufalogrowler.com.br','bufalo.pages.dev','loja.bufalogrowler.com.br'].includes(url.hostname)) return url.hostname + url.pathname.slice(0,130);
    return url.hostname.replace(/[^a-z0-9.-]/gi,'').slice(0,80);
  };
  function sectionFor(element) {
    const modal = element.closest('dialog,[role="dialog"]');
    if (modal) return 'popup-' + slug(modal.id || modal.getAttribute('aria-label') || 'oferta');
    const section = element.closest('section');
    if (section) return slug(section.id || section.getAttribute('aria-label') || section.querySelector('h2')?.textContent || 'secao');
    if (element.closest('header,[data-bg-header],.header')) return 'cabecalho';
    if (element.closest('footer,[data-bg-footer],.footer')) return 'rodape';
    if (element.closest('.hero,[class*="hero-"]')) return 'banner-principal';
    if (element.closest('nav')) return 'navegacao';
    return 'homepage';
  }
  function typeFor(element) {
    const cls = ['launch-visual','launch-button','bw-cta','bw-art-wrap','shop-category-card','accessory-circle','blog-card','social-tile','catalog-shortcut','underlink','button','photo'];
    return cls.find(name => element.classList.contains(name)) || (element.matches('a[href]') ? 'link' : element.getAttribute('role') === 'tab' ? 'aba' : 'botao');
  }
  function infoFor(element, section) {
    const target = targetFor(element);
    const type = typeFor(element);
    const isLink = element.matches('a[href]');
    const dataId = element.dataset.analyticsId || element.dataset.thermal || element.dataset.camping || element.dataset.accessory || element.dataset.direction || '';
    const key = (isLink ? type + ':' + target : type + ':' + slug(element.id || dataId || element.getAttribute('aria-label') || element.textContent || 'acao')).slice(0,180);
    let title = '';
    if (section === 'cabecalho' || section === 'rodape') {
      title = isLink ? ('Navegação: ' + (target || 'link')) : (element.getAttribute('aria-label') || element.id || 'Menu');
    } else {
      const product = element.closest('.card,.product-card,.thermal-card,.shop-category-card,.accessory-item,.blog-card,.launch-card,article');
      title = product?.querySelector('h3,.product-title,.product-name')?.textContent;
      title ||= element.getAttribute('aria-label') || element.getAttribute('title') || element.querySelector('img[alt]')?.getAttribute('alt');
      title ||= element.textContent;
      if (!title || !title.trim()) title = element.id || target || type;
    }
    return {key,label:label(title) || type,target:target.slice(0,180)};
  }
  function send(payload) {
    const data = JSON.stringify({device,...payload});
    try {
      if (navigator.sendBeacon && navigator.sendBeacon(endpoint,new Blob([data],{type:'text/plain;charset=UTF-8'}))) return;
    } catch {}
    try { fetch(endpoint,{method:'POST',body:data,headers:{'Content-Type':'text/plain;charset=UTF-8'},keepalive:true,credentials:'same-origin'}).catch(() => {}); } catch {}
  }
  function pageView() { send({kind:'view',section:'homepage',key:'page-load',label:'Visita à homepage',target:'/'}); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded',pageView,{once:true});
  else pageView();
  const last = new Map();
  document.addEventListener('click', event => {
    if (!event.isTrusted) return;
    const node = event.target instanceof Element ? event.target : event.target?.parentElement;
    const action = node?.closest('a[href],button,[role="button"],[role="tab"],summary,[data-open-mc]');
    if (!action || action.matches(':disabled') || action.closest('[inert]')) return;
    const section = sectionFor(action);
    const info = infoFor(action,section);
    if (!info.key || info.key === 'link:') return;
    const dedupe = section + '|' + info.key;
    const now = Date.now();
    if (now - (last.get(dedupe) || 0) < 300) return;
    last.set(dedupe,now);
    if (last.size > 200) last.clear();
    send({kind:'click',section,...info});
  }, true);
})();
