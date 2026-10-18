/* Interface da homepage sobre o Grand Store. Os scripts da loja permanecem instalados. */
(()=>{
  'use strict';
  function mount(){
    const original=document.getElementById('cabecalho');
    if(!original||document.getElementById('bg-site-header'))return;
    const home='https://www.bufalogrowler.com.br',store='https://loja.bufalogrowler.com.br';
    const paths={
      menu:'<path d="M3 6h18M3 12h18M3 18h18"/>',
      ai:'<path d="m14 3 2.5 6.5L23 12l-6.5 2.5L14 21l-2.5-6.5L5 12l6.5-2.5L14 3Z M4 2l1 3 3 1-3 1-1 3-1-3-3-1 3-1 1-3Z"/>',
      bag:'<path d="M5 7h14l1 14H4L5 7Z M8 8V6a4 4 0 0 1 8 0v2"/>',
      whatsapp:'<path d="M20.5 11.8a8.5 8.5 0 0 1-12.6 7.5L3 21l1.6-4.8A8.5 8.5 0 1 1 20.5 11.8Z"/><path d="M8.1 7.2c-.6.2-1 1-.8 2 .6 3 3 5.5 6 6.1 1.1.2 2-.3 2.3-1l.3-1-2.5-1.2-.9 1c-1.4-.5-2.5-1.6-3-3l.9-.9-1.2-2.2Z"/>',
      instagram:'<rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r=".8" fill="currentColor" stroke="none"/>',
      cash:'<rect x="3" y="7" width="18" height="14" rx="2"/><path d="M2 7h20M12 7v14M3 12h18M12 7C6 7 5 5 6.5 3.5 8 2 11 4 12 7Zm0 0c6 0 7-2 5.5-3.5C16 2 13 4 12 7Z"/>',
      offers:'<path d="M3 3h8l10 10-8 8L3 11Z"/><circle cx="7.5" cy="7.5" r="1.2"/>',
      catalog:'<rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/>'
    };
    const icon=key=>`<svg viewBox="0 0 24 24" aria-hidden="true">${paths[key]}</svg>`;
    const shell=document.createElement('div');shell.id='bg-li-shell';
    shell.innerHTML=`<div id="bg-site-announcement">SUA PRÓXIMA AVENTURA COMEÇA AQUI</div><header id="bg-site-header"><div class="header-row"><button class="icon-button mobile-only" id="open-menu" type="button" aria-label="Abrir menu" aria-haspopup="dialog" aria-controls="mobile-menu">${icon('menu')}</button><a class="logo" href="${home}/" aria-label="Búfalo Growler início"><img src="https://cdn.awsli.com.br/400x300/1237/1237589/logo/21547a1296.png" alt="Búfalo Growler" width="64" height="64"></a><div class="mobile-actions"><a class="icon-button mobile-only" id="mobile-search" href="${home}/?open=ia" target="_blank" rel="noopener" aria-label="Compre com IA" title="Compre com IA">${icon('ai')}<span class="bg-ai-label">Compre<br>com IA</span></a><a class="icon-button" id="bg-li-cart" href="${store}/carrinho/index" aria-label="Abrir carrinho na loja oficial">${icon('bag')}</a></div></div></header>`;
    const menu=document.createElement('dialog');menu.id='mobile-menu';menu.setAttribute('aria-label','Explore a Búfalo');
    menu.innerHTML=`<header><strong>Explore a Búfalo</strong><button class="icon-button" id="close-menu" type="button" aria-label="Fechar menu">✕</button></header><form id="bg-li-search" role="search" action="${store}/buscar" method="get"><label for="bg-li-query">Buscar na loja</label><div><input id="bg-li-query" type="search" name="q" required maxlength="255" placeholder="O que você procura?"><button type="submit">Buscar</button></div></form><nav aria-label="Categorias e atendimento"></nav>`;
    const links=menu.querySelector('nav'),seen=new Set();
    function link(text,href){if(seen.has(href))return;seen.add(href);const a=document.createElement('a');a.textContent=text;a.href=href;links.append(a);}
    document.querySelectorAll('.menu-desktop .menu>.nivel-um>li:not(.todas-categorias)>a').forEach(a=>{
      const href=a.href;if(!href.startsWith(store+'/'))return;
      const text=(a.querySelector('.titulo')?.textContent||a.textContent).trim();if(text)link(text,href);
    });
    if(!links.childElementCount){for(const [name,path] of [['Garrafas e growlers','/garrafas'],['Copos e bowls','/copos-e-bowls'],['Acessórios','/acessorios'],['Vestuário','/vestuario'],['Cutelaria','/cutelaria'],['Camping','/camping-'],['Jogos','/jogos'],['Ofertas','/ofertas']])link(name,store+path);}
    link('Ache aqui',home+'/catalogo/');link('Minha conta',store+'/conta/index');link('Meus pedidos',store+'/conta/pedido/listar');link('Meus desejos',store+'/conta/favorito/listar');link('Blog Búfalo',home+'/blog/');link('YouTube','https://www.youtube.com/@bufalogrowler');link('TikTok','https://www.tiktok.com/@bufalogrowler');
    const dock=document.createElement('nav');dock.id='bg-li-dock';dock.setAttribute('aria-label','Atalhos rápidos');
    const shortcuts=[['whatsapp','WhatsApp','https://wa.me/5591984973370'],['instagram','Instagram','https://www.instagram.com/bufalogrowler/'],['cash','ManadaCash',home+'/?open=mc'],['offers','Ofertas',store+'/ofertas'],['catalog','Ache aqui',home+'/catalogo/']];
    for(const [key,label,href] of shortcuts){const a=document.createElement('a');a.href=href;a.className='bg-li-'+key;a.innerHTML=icon(key)+`<span>${label}</span>`;if(['whatsapp','instagram'].includes(key)){a.target='_blank';a.rel='noopener';}dock.append(a);}
    original.before(shell);document.body.append(menu,dock);
    const header=shell.querySelector('header');
    // Fora do bloco do aviso, para manter position:sticky durante a rolagem.
    shell.after(header);
    document.documentElement.classList.add('bg-li-ready');
    let previousFocus;
    header.querySelector('#open-menu').addEventListener('click',()=>{previousFocus=document.activeElement;menu.showModal();});
    menu.querySelector('#close-menu').addEventListener('click',()=>menu.close());
    menu.addEventListener('close',()=>previousFocus?.focus({preventScroll:true}));
    menu.addEventListener('click',e=>{if(e.target!==menu)return;const r=menu.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)menu.close();});
    dock.querySelector('.bg-li-cash').addEventListener('click',e=>{const launcher=document.querySelector('#fmais-loyalty__bottom__open__btn,.fmais-loyalty__bottom__open__btn');if(launcher){e.preventDefault();e.stopPropagation();launcher.click();}});
    // O carrinho original continua sendo a fonte da quantidade e dos eventos.
    const nativeCart=document.querySelector('#cabecalho .painel .carrinho');
    if(nativeCart){const update=()=>{const n=nativeCart.querySelector('strong')?.textContent.trim();header.querySelector('#bg-li-cart').setAttribute('aria-label',n?'Abrir carrinho na loja oficial · '+n+' itens':'Abrir carrinho na loja oficial');};update();new MutationObserver(update).observe(nativeCart,{childList:true,subtree:true,characterData:true});}
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',mount,{once:true});else mount();
})();
