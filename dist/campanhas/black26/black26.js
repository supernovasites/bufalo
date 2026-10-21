(()=>{
  const grid=document.getElementById('product-grid');
  const count=document.getElementById('product-count');
  let products=[],category='all';
  const selectedColors=new Map();
  const money=value=>Number(value).toLocaleString('pt-BR',{style:'currency',currency:'BRL'});
  const escape=value=>String(value).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'",'&#39;');
  const slugCategory={copos:'COPOS & CANECAS',garrafas:'GARRAFAS',growlers:'GROWLERS'};
  const discount=color=>color.oldPrice>color.price?Math.round((1-color.price/color.oldPrice)*100):0;
  const priceHTML=color=>money(color.price).replace('R$','<small>R$</small>');
  function colorFor(product){return product.colors.find(c=>c.id===selectedColors.get(product.url))||product.colors.find(c=>c.id===product.defaultColor)||product.colors[0];}
  function href(product){const url=new URL(product.url,'https://loja.bufalogrowler.com.br/');url.searchParams.set('utm_source','black_bufalo');url.searchParams.set('utm_medium','referral');url.searchParams.set('utm_campaign','black26');return escape(url.href);}
  function card(product){
    const color=colorFor(product),oldPrice=color.oldPrice||product.oldPrice;
    return `<article class="card product-card" data-product="${escape(product.url)}"><a class="photo product-photo" href="${href(product)}" target="_blank" rel="noopener" aria-label="Ver ${escape(product.name+' '+product.size+' — '+color.label)} na loja"><span class="badge discount-badge">${discount(color)}% OFF</span><img src="${escape(color.img)}" alt="${escape(product.name+' '+product.size+' — '+color.label)}" loading="lazy" width="600" height="600"></a><div class="card-body product-body"><p class="volume">${escape(product.size)}</p><h3><a href="${href(product)}" target="_blank" rel="noopener">${escape(product.name)}</a></h3><div class="color-options" role="group" aria-label="Cores de ${escape(product.name)}">${product.colors.map(c=>`<button class="color-swatch swatch" type="button" data-color="${escape(c.id)}" aria-label="${escape(c.label)}" title="${escape(c.label)}" aria-pressed="${c.id===color.id}" style="--color-one:${c.hex[0]};--color-two:${c.hex[1]}"><span aria-hidden="true"></span></button>`).join('')}</div><p class="selected-color color-name">Cor: <span>${escape(color.label)}</span></p><div class="pricing"><p class="old-price">De <s>${money(oldPrice)}</s></p><p class="price">${priceHTML(color)}</p><p class="saving">Economize <b>${money(oldPrice-color.price)}</b></p></div><p class="installments">até 6x de R$ ${escape(color.pay||product.pay)} sem juros</p><a class="button product-buy" href="${href(product)}" target="_blank" rel="noopener">Ver na loja <span aria-hidden="true">↗</span></a></div></article>`;
  }
  function render(){
    const visible=products.filter(p=>category==='all'||p.category===category);
    grid.innerHTML=visible.map(card).join('');
    count.textContent=visible.length+' modelos na seleção';
    document.querySelectorAll('[data-filter]').forEach(button=>{const active=button.dataset.filter===category;button.classList.toggle('active',active);button.setAttribute('aria-pressed',String(active));});
  }
  function setCategory(value){category=value;render();}
  document.querySelectorAll('[data-filter]').forEach(button=>button.addEventListener('click',()=>setCategory(button.dataset.filter)));
  document.querySelectorAll('[data-category-link]').forEach(link=>link.addEventListener('click',()=>setCategory(link.dataset.categoryLink)));
  grid.addEventListener('click',event=>{
    const button=event.target.closest('.swatch');if(!button||button.getAttribute('aria-pressed')==='true')return;
    const article=button.closest('.product-card'),product=products.find(p=>p.url===article.dataset.product),color=product?.colors.find(c=>c.id===button.dataset.color);if(!color)return;
    selectedColors.set(product.url,color.id);
    article.querySelectorAll('.swatch').forEach(swatch=>swatch.setAttribute('aria-pressed',String(swatch===button)));
    article.querySelector('.product-photo').setAttribute('aria-label','Ver '+product.name+' '+product.size+' — '+color.label+' na loja');
    const image=article.querySelector('.product-photo img');image.src=color.img;image.alt=product.name+' '+product.size+' — '+color.label;
    article.querySelector('.color-name span').textContent=color.label;
    article.querySelector('.discount-badge').textContent=discount(color)+'% OFF';
    article.querySelector('.old-price s').textContent=money(color.oldPrice||product.oldPrice);
    article.querySelector('.price').innerHTML=priceHTML(color);
    article.querySelector('.saving b').textContent=money((color.oldPrice||product.oldPrice)-color.price);
    article.querySelector('.installments').textContent='até 6x de R$ '+(color.pay||product.pay)+' sem juros';
  });

  const video=document.getElementById('trilha-video'),playButton=document.getElementById('video-play'),soundButton=document.getElementById('video-sound');
  const scriptURL=document.currentScript.src;
  const reducedMotion=matchMedia('(prefers-reduced-motion: reduce)').matches;
  const saveData=!!navigator.connection?.saveData;
  let manuallyPaused=reducedMotion||saveData;
  video.src=new URL(matchMedia('(max-width: 760px)').matches?'media/trilha-mobile.mp4':'media/trilha-desktop.mp4',scriptURL).href;
  const syncVideo=()=>{playButton.textContent=video.paused?'Reproduzir vídeo':'Pausar vídeo';soundButton.textContent=video.muted?'Ativar som':'Desativar som';soundButton.setAttribute('aria-pressed',String(!video.muted));};
  playButton.addEventListener('click',()=>{if(video.paused){manuallyPaused=false;video.play().catch(syncVideo);}else{manuallyPaused=true;video.pause();}});
  soundButton.addEventListener('click',()=>{video.muted=!video.muted;syncVideo();});
  video.addEventListener('play',syncVideo);video.addEventListener('pause',syncVideo);video.addEventListener('error',()=>{manuallyPaused=true;syncVideo();});
  if(!manuallyPaused)video.play().catch(syncVideo);else syncVideo();
  if('IntersectionObserver' in window)new IntersectionObserver(entries=>{for(const entry of entries){if(!entry.isIntersecting)video.pause();else if(!manuallyPaused)video.play().catch(syncVideo);}},{threshold:.1}).observe(video);

  fetch(new URL('products.json',document.currentScript.src),{cache:'no-cache'}).then(response=>{if(!response.ok)throw Error('Catalog unavailable');return response.json();}).then(data=>{
    products=data.products.map(p=>({...p,colors:p.colors.filter(c=>c.available!==false&&c.price>0&&c.oldPrice>c.price)})).filter(p=>p.colors.length);
    render();
  }).catch(()=>{count.textContent='Seleção indisponível';document.getElementById('catalog-error').hidden=false;});
})();
