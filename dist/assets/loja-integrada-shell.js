/* Interface da homepage sobre o Grand Store. Os scripts da loja permanecem instalados. */
(()=>{
  'use strict';
  function mount(){
    const counter=document.createElement('script');counter.src='https://www.bufalogrowler.com.br/assets/cart-count.js?v=20261029-no-flash';counter.defer=true;document.body.append(counter);
    if(new URLSearchParams(location.search).has('bg_cart_count')&&window.parent!==window)return;
    const announcementScript=document.createElement('script');announcementScript.src='https://www.bufalogrowler.com.br/assets/announcement.js?v=20261029-no-flash';announcementScript.defer=true;document.body.append(announcementScript);
    const original=document.getElementById('cabecalho');
    if(!original||document.getElementById('bg-site-header'))return;
    const home='https://www.bufalogrowler.com.br',store='https://loja.bufalogrowler.com.br';
    const paths={
      menu:'<path d="M3 6h18M3 12h18M3 18h18"/>',
      search:'<circle cx="10.5" cy="10.5" r="6.5"/><path d="m16 16 5 5"/>',
      bag:'<path d="M5 7h14l1 14H4L5 7Z M8 8V6a4 4 0 0 1 8 0v2"/>',
      whatsapp:'<path d="M20.5 11.8a8.5 8.5 0 0 1-12.6 7.5L3 21l1.6-4.8A8.5 8.5 0 1 1 20.5 11.8Z"/><path d="M8.1 7.2c-.6.2-1 1-.8 2 .6 3 3 5.5 6 6.1 1.1.2 2-.3 2.3-1l.3-1-2.5-1.2-.9 1c-1.4-.5-2.5-1.6-3-3l.9-.9-1.2-2.2Z"/>',
      instagram:'<rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r=".8" fill="currentColor" stroke="none"/>',
      cash:'<rect x="3" y="7" width="18" height="14" rx="2"/><path d="M2 7h20M12 7v14M3 12h18M12 7C6 7 5 5 6.5 3.5 8 2 11 4 12 7Zm0 0c6 0 7-2 5.5-3.5C16 2 13 4 12 7Z"/>',
      offers:'<path d="M3 3h8l10 10-8 8L3 11Z"/><circle cx="7.5" cy="7.5" r="1.2"/>',
      catalog:'<rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/>'
    };
    const icon=key=>`<svg viewBox="0 0 24 24" aria-hidden="true">${paths[key]}</svg>`;
    const shell=document.createElement('div');shell.id='bg-li-shell';
    shell.innerHTML=`<div id="bg-site-announcement" aria-busy="true"></div><header id="bg-site-header"><div class="header-row"><button class="icon-button mobile-only" id="open-menu" type="button" aria-label="Abrir menu" aria-haspopup="dialog" aria-controls="mobile-menu">${icon('menu')}</button><a class="logo" href="${home}/" aria-label="Búfalo Growler início"><img src="https://cdn.awsli.com.br/400x300/1237/1237589/logo/21547a1296.png" alt="Búfalo Growler" width="64" height="64"></a><div class="mobile-actions"><button class="icon-button" id="bg-search-toggle" type="button" aria-label="Buscar produtos" aria-haspopup="dialog" aria-controls="mobile-menu">${icon('search')}</button><a class="icon-button" id="bg-li-cart" href="${store}/carrinho/index" aria-label="Abrir carrinho na loja oficial">${icon('bag')}</a></div></div></header>`;
    const menu=document.createElement('dialog');menu.id='mobile-menu';menu.setAttribute('aria-label','Explore a Búfalo');
    menu.innerHTML=`<header><strong>Explore a Búfalo</strong><button class="icon-button" id="close-menu" type="button" aria-label="Fechar menu">✕</button></header><form id="bg-li-search" role="search" action="${store}/buscar" method="get"><label for="bg-li-query">Buscar na loja</label><div><input id="bg-li-query" type="search" name="q" required maxlength="255" placeholder="O que você procura?"><button type="submit">Buscar</button></div></form><nav aria-label="Categorias e atendimento"></nav>`;
    const links=menu.querySelector('nav'),seen=new Set();
    function link(text,href){if(seen.has(href))return;seen.add(href);const a=document.createElement('a');a.textContent=text;a.href=href;links.append(a);}
    for(const category of [{"name":"Chopeiras","slug":"chopeiras","product":{"image":"https://cdn.awsli.com.br/400x400/1237/1237589/produto/266520163/a82be5fecf024fd5b8e38a2bcdf7bcfd-ajydrwwate.png","name":"Búfalo Growler On TAP 2L - Chopeira Térmica Portatil","url":"https://loja.bufalogrowler.com.br/bufaloontap2l"}},{"name":"Garrafas","slug":"garrafas","product":{"image":"https://cdn.awsli.com.br/400x400/1237/1237589/produto/311751043/24166786bc9b4b49a5a1b2ecf37eaaab-j1kzlwcn6y.png","name":"Garrafa Jafarabadi 1L","url":"https://loja.bufalogrowler.com.br/garrafa-jafarabadi-1l-"}},{"name":"Copos","slug":"copos-bg","product":{"image":"https://cdn.awsli.com.br/400x400/1237/1237589/produto/186946123/ravi-2-as6u67ab6a.png","name":"Copo Ravi 483ml","url":"https://loja.bufalogrowler.com.br/copo-ravi-483ml"}},{"name":"Hard Coolers","slug":"nagpro","product":{"image":"https://cdn.awsli.com.br/400x400/1237/1237589/produto/348094223/nagpuri-42l-lx2yamfqmk.png","name":"Nag PRO 6 Cooler 42L com Rodinhas","url":"https://loja.bufalogrowler.com.br/nagpro6"}},{"name":"Soft Bags Coolers","slug":"pandhar","product":{"image":"https://cdn.awsli.com.br/400x400/1237/1237589/produto/341482470/-----editar---camping-p8635djpyl.png","name":"Pandhar 20L Soft Cooler Petróleo","url":"https://loja.bufalogrowler.com.br/bolsa-termica-nagpuri-20l-petroleo"}},{"name":"Carabinho Kids","slug":"carabinho-kids","product":{"image":"https://cdn.awsli.com.br/400x400/1237/1237589/produto/390291382/copo-carabinho-lima-iclpdgdp38.png","name":"Copo Carabinho 350ml","url":"https://loja.bufalogrowler.com.br/copo-carabinho-350ml"}},{"name":"Cutelaria","slug":"cutelaria","product":{"image":"https://cdn.awsli.com.br/400x400/1237/1237589/produto/265289143/machado-ax-kfv4gfmjrq.png","name":"Machado Ax Carbono 90Mm CB Madeira","url":"https://loja.bufalogrowler.com.br/machado-ax-carbono-90mm-cb-madeira"}},{"name":"Mochilas Impermeáveis","slug":"mochilas","product":{"image":"https://cdn.awsli.com.br/400x400/1237/1237589/produto/361534760/mochila-estanque-verde_laranja-l9uwbvqkeh-ba5yf37rl8.png","name":"Mochila Marajó Dry 25L - Verde","url":"https://loja.bufalogrowler.com.br/mochila-marajo-dry-verde"}},{"name":"Cadeiras Praia e Camping","slug":"cadeiras","product":{"image":"https://cdn.awsli.com.br/400x400/1237/1237589/produto/359881205/cadeira-dobr-vel-g-laranja-pq3nrgg9nm.png","name":"Cadeira Portátil Búfalo Pena G","url":"https://loja.bufalogrowler.com.br/xco61r2pc-cadeira-portatil-bufalo-pena-p-2025-06-27-12-50-37"}},{"name":"Vestuário","slug":"camisas-shorts","product":{"image":"https://cdn.awsli.com.br/400x400/1237/1237589/produto/166521784/-----editar---shorts--1--rfplhog1jc.png","name":"Bermuda Pirarucu","url":"https://loja.bufalogrowler.com.br/bermuda-pirarucu"}},{"name":"Souvenir e Jogos","slug":"souvenir-e-jogos","product":{"image":"https://cdn.awsli.com.br/400x400/1237/1237589/produto/117902270/growler-vidro-1-900-e59c7pkyvx.png","name":"Growler de Vidro 1.900ml","url":"https://loja.bufalogrowler.com.br/growler-de-vidro-1900ml"}},{"name":"Acessórios e Bags","slug":"alcas-e-bags","product":{"image":"https://cdn.awsli.com.br/400x400/1237/1237589/produto/390919334/5ae1e5c02a804fbe98b41064e4228597-l4l396nhhg.png","name":"Unibag - Bolsa universal Búfalo Growler","url":"https://loja.bufalogrowler.com.br/bolsa-esportiva-bufalo"}},{"name":"Reposição de partes","slug":"tampas-e-acessorios","product":{"image":"https://cdn.awsli.com.br/400x400/1237/1237589/produto/344413208/1-lej5a1hjk6.png","name":"Tampa Esporte com Bico","url":"https://loja.bufalogrowler.com.br/tampa-esporte-com-bico"}},{"name":"Adesivos","slug":"adesivos","product":{"image":"https://cdn.awsli.com.br/400x400/1237/1237589/produto/302674999/pack-camping---viagem--3--ukn5pudtv6.png","name":"Adesivos Camping","url":"https://loja.bufalogrowler.com.br/adesivos-camping"}}]){link(category.name,store+'/'+category.slug);const a=links.lastElementChild;const img=document.createElement('img');img.className='bg-category-photo';img.src=category.product.image;img.alt='';img.width=48;img.height=48;img.loading='lazy';const label=document.createElement('span');label.textContent=category.name;a.replaceChildren(img,label);a.dataset.productUrl=category.product.url;}
    const dock=document.createElement('nav');dock.id='bg-li-dock';dock.setAttribute('aria-label','Atalhos rápidos');
    const shortcuts=[['whatsapp','WhatsApp','https://wa.me/5591984973370'],['instagram','Instagram','https://www.instagram.com/bufalogrowler/'],['cash','ManadaCash',home+'/?open=mc'],['offers','Ofertas',store+'/ofertas'],['catalog','Tudo Aqui',home+'/catalogo/']];
    for(const [key,label,href] of shortcuts){const a=document.createElement('a');a.href=href;a.className='bg-li-'+key;a.innerHTML=icon(key)+`<span>${label}</span>`;if(['whatsapp','instagram'].includes(key)){a.target='_blank';a.rel='noopener';}dock.append(a);}
    original.before(shell);document.body.append(menu);if(document.body.classList.contains('pagina-produto'))document.body.append(dock);
    const header=shell.querySelector('header');
    // Fora do bloco do aviso, para manter position:sticky durante a rolagem.
    shell.after(header);
    document.documentElement.classList.add('bg-li-ready');
    const nativeFooter=document.getElementById('rodape');
    if(nativeFooter&&!document.getElementById('bg-site-footer')){
      const placeholder=document.createElement('div');placeholder.setAttribute('data-bg-footer','');nativeFooter.before(placeholder);
      const footerScript=document.createElement('script');footerScript.src=home+'/assets/site-shell.js?v=20261018-footer';footerScript.defer=true;
      footerScript.addEventListener('load',()=>{if(document.getElementById('bg-site-footer'))document.documentElement.classList.add('bg-li-footer-ready');});document.body.append(footerScript);
    }
    if(!document.querySelector('link[href*="/assets/menu-search.css"]')){const css=document.createElement('link');css.rel='stylesheet';css.href=home+'/assets/menu-search.css?v=20261018-ache-facil';document.head.append(css);}
    const searchScript=document.createElement('script');searchScript.src=home+'/assets/menu-search.js?v=20261018-ache-facil';searchScript.defer=true;document.body.append(searchScript);
    let previousFocus;
    header.querySelector('#open-menu').addEventListener('click',()=>{previousFocus=document.activeElement;menu.showModal();});
    menu.querySelector('#close-menu').addEventListener('click',()=>menu.close());
    menu.addEventListener('close',()=>previousFocus?.focus({preventScroll:true}));
    menu.addEventListener('click',e=>{if(e.target!==menu)return;const r=menu.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)menu.close();});
    dock.querySelector('.bg-li-cash').addEventListener('click',e=>{const launcher=document.querySelector('#fmais-loyalty__bottom__open__btn,.fmais-loyalty__bottom__open__btn');if(launcher){e.preventDefault();e.stopPropagation();launcher.click();}});
    // Mantém o acionador nativo para abrir o programa, sem exibir a aba lateral.
    const guardedLaunchers=new WeakSet();
    const hideNativeLaunchers=()=>document.querySelectorAll('#fmais-loyalty__bottom__open__btn,.fmais-loyalty__bottom__open__btn').forEach(button=>{
      const hide=()=>{if(button.style.getPropertyValue('display')!=='none'||button.style.getPropertyPriority('display')!=='important')button.style.setProperty('display','none','important');};
      hide();button.setAttribute('aria-hidden','true');
      if(!guardedLaunchers.has(button)){guardedLaunchers.add(button);new MutationObserver(hide).observe(button,{attributes:true,attributeFilter:['style','class']});}
    });
    hideNativeLaunchers();new MutationObserver(hideNativeLaunchers).observe(document.body,{childList:true,subtree:true});

  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',mount,{once:true});else mount();
})();
