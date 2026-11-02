/* Búfalo: acessos, cliques e rolagem das páginas públicas. */
(() => {
  'use strict';
  const allowedHosts = ['bufalogrowler.com.br','www.bufalogrowler.com.br','bufalo.pages.dev'];
  if (!allowedHosts.includes(location.hostname) || /\/(admin|painel|mkt|midia|assets|api|mesadj|sorteio)(?:[/.]|$)/.test(location.pathname) || window.bgHomeClicks) return;
  window.bgHomeClicks = true;
  const page = location.pathname.replace(/index\.html$/, '').replace(/\/$/,'') || '/';
  const normalizedPath = page === '/' || /\.html$/.test(page) ? page : page + '/';
  const pagePath = ({'/black26/':'/campanhas/black26/','/chopeira/':'/produtos/chopeira/'})[normalizedPath] || normalizedPath;
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
    let key = '';
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
    // Muitos acessórios, posts do blog e categorias dividem a mesma URL: diferenciar cada card.
    const cardSpecific = ['shop-category-card','accessory-circle','blog-card','social-tile','launch-visual','launch-button'].includes(type);
    key = (isLink ? (type + ':' + (cardSpecific ? slug(title) + ':' : '') + target) : type + ':' + slug(element.id || dataId || element.getAttribute('aria-label') || title || 'acao')).slice(0,180);
    return {key,label:label(title) || type,target:target.slice(0,180)};
  }
  function send(payload) {
    const data = JSON.stringify({device,page:pagePath,...payload});
    try {
      if (navigator.sendBeacon && navigator.sendBeacon(endpoint,new Blob([data],{type:'text/plain;charset=UTF-8'}))) return;
    } catch {}
    try { fetch(endpoint,{method:'POST',body:data,headers:{'Content-Type':'text/plain;charset=UTF-8'},keepalive:true,credentials:'same-origin'}).catch(() => {}); } catch {}
  }
  let visitor = '';
  try {
    visitor = localStorage.getItem('bg-scroll-user-v2') || crypto.randomUUID();
    localStorage.setItem('bg-scroll-user-v2',visitor);
  } catch {}
  let highest = 0;
  

  let layoutSignature = '';
  function reportScrollSections(distance) {
    if (!['/','/produtos/chopeira/','/campanhas/black26/'].includes(pagePath) || typeof document.querySelectorAll !== 'function') return;
    const landmarks = [...document.querySelectorAll('main section,body > section,footer,[data-bg-footer]')].filter(el=>el.getBoundingClientRect().height>0);
    const mapping = [25,50,75,100].map(percent=>{
      const y = Math.min(distance + innerHeight - 1, distance * percent / 100 + innerHeight - 1);
      const containing = landmarks.filter(el=>{const r=el.getBoundingClientRect();return y >= r.top + window.scrollY && y < r.bottom + window.scrollY;});
      const el = containing.at(-1) || landmarks.filter(el=>el.getBoundingClientRect().top + window.scrollY <= y).at(-1);
      const name = el?.matches('footer,[data-bg-footer]') ? 'Rodapé' : el?.querySelector('h2')?.textContent || el?.getAttribute('aria-label') || el?.id || 'Página';
      return {percent,name:label(name)};
    });
    const signature = JSON.stringify(mapping);
    if (signature === layoutSignature) return;
    layoutSignature = signature;
    mapping.forEach(item=>send({kind:'scroll-section',section:'homepage',key:'scroll-' + item.percent,label:item.name,target:pagePath}));
  }
  let scrollPending = false;
  function measureScroll() {
    scrollPending = false;
    const page = document.documentElement;
    const distance = Math.max(page.scrollHeight, document.body?.scrollHeight || 0) - innerHeight;
    if (distance <= 0) return;
    reportScrollSections(distance);
    const progress = Math.min(1, Math.max(0, window.scrollY / distance));
    const mark = [100,75,50,25].find(mark => progress >= mark / 100 || (mark === 100 && distance - window.scrollY <= 2)) || 0;
    if (visitor && mark > highest) {
      highest = mark;
      send({kind:'scroll',visitor,section:'homepage',key:'scroll-' + mark,label:'Rolagem ' + mark + '%',target:pagePath});
    }
  }
  function scheduleScroll() {
    if (!scrollPending) { scrollPending = true; requestAnimationFrame(measureScroll); }
  }
  window.addEventListener('scroll',scheduleScroll,{passive:true});
  window.addEventListener('resize',scheduleScroll,{passive:true});
  window.addEventListener('load',scheduleScroll,{once:true});
  function pageView() { scheduleScroll(); send({kind:'view',section:'homepage',key:'page-load',label:'Visita à página',target:pagePath}); }
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
    const product = action.closest('.card,.product-card,.thermal-card,.accessory-item,.launch-card,.one-card,article.product');
    if (product && (product.querySelector('h3,h2,.product-title,.product-name') || product.matches('.product-card')) && action.matches('a[href]') && info.target.startsWith('loja.bufalogrowler.com.br/')) {
      send({kind:'product',section,...info});
    }
  }, true);
})();
