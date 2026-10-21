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
    return `<article class="product-card" data-product="${escape(product.url)}"><div class="product-visual"><a class="product-photo" href="${href(product)}" target="_blank" rel="noopener" aria-label="Ver ${escape(product.name+' '+product.size+' — '+color.label)} na loja"><img src="${escape(color.img)}" alt="${escape(product.name+' '+product.size+' — '+color.label)}" loading="lazy" width="600" height="600"><span class="discount-badge">−${discount(color)}<small>%</small></span><span class="photo-arrow" aria-hidden="true">↗</span></a><div class="color-options" role="group" aria-label="Cores de ${escape(product.name)}">${product.colors.map(c=>`<button class="swatch" type="button" data-color="${escape(c.id)}" aria-label="${escape(c.label)}" title="${escape(c.label)}" aria-pressed="${c.id===color.id}" style="--color-one:${c.hex[0]};--color-two:${c.hex[1]}"><span aria-hidden="true"></span></button>`).join('')}</div></div><div class="product-body"><div class="product-title"><h3><a href="${href(product)}" target="_blank" rel="noopener">${escape(product.name)}</a></h3><span>${escape(product.size)}</span></div><p class="color-name">Cor: <span>${escape(color.label)}</span></p><div class="pricing"><p class="old-price"><s>${money(oldPrice)}</s></p><p class="price">${priceHTML(color)}</p><span class="saving">ECONOMIZE <b>${money(oldPrice-color.price)}</b></span></div><p class="installments">6x de R$ ${escape(color.pay||product.pay)} sem juros</p></div></article>`;
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
    article.querySelector('.discount-badge').innerHTML='−'+discount(color)+'<small>%</small>';
    article.querySelector('.old-price s').textContent=money(color.oldPrice||product.oldPrice);
    article.querySelector('.price').innerHTML=priceHTML(color);
    article.querySelector('.saving b').textContent=money((color.oldPrice||product.oldPrice)-color.price);
    article.querySelector('.installments').textContent='6x de R$ '+(color.pay||product.pay)+' sem juros';
  });
  fetch(new URL('products.json',document.currentScript.src),{cache:'no-cache'}).then(response=>{if(!response.ok)throw Error('Catalog unavailable');return response.json();}).then(data=>{
    products=data.products.map(p=>({...p,colors:p.colors.filter(c=>c.available!==false&&c.price>0&&c.oldPrice>c.price)})).filter(p=>p.colors.length);
    const heroes=[['hero-bottle','garrafa-harpuri-750ml-','1069625'],['hero-cup','copo-pand-750ml','425881'],['hero-growler','growler-palitano-14l','426573']];
    for(const [id,slug,colorId] of heroes){const product=products.find(p=>p.url===slug),color=product?.colors.find(c=>c.id===colorId)||product?.colors[0];if(color)document.getElementById(id).src=color.img;}
    const max=Math.max(...products.flatMap(p=>p.colors.map(discount)));document.getElementById('max-discount').innerHTML=max+'<small>%</small>';
    render();
  }).catch(()=>{count.textContent='Seleção indisponível';document.getElementById('catalog-error').hidden=false;});
})();
