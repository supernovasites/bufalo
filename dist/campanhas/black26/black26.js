(()=>{
  const grid=document.getElementById('product-grid');
  const count=document.getElementById('product-count');
  let products=[];
  const money=value=>Number(value).toLocaleString('pt-BR',{style:'currency',currency:'BRL'});
  const escape=value=>String(value).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'",'&#39;');
  const discount=color=>color.oldPrice>color.price?Math.round((1-color.price/color.oldPrice)*100):0;
  const priceHTML=color=>money(color.price).replace('R$','<small>R$</small>');
  function href(product){const url=new URL(product.url,'https://loja.bufalogrowler.com.br/');url.searchParams.set('utm_source','black_bufalo');url.searchParams.set('utm_medium','referral');url.searchParams.set('utm_campaign','black26');return escape(url.href);}
  const labelFor=color=>{const halves=color.label.split(' / ');return halves.length===2&&halves[0]===halves[1]?halves[0]:color.label;};
  const capacity=product=>{const value=parseFloat(product.size.replace(',','.'));return /ml/i.test(product.size)?value/1000:value;};
  function card(product){
    const color=product.color,oldPrice=color.oldPrice||product.oldPrice,label=labelFor(color);
    const image=color.img.replace('/600x600/','/1200x1200/');
    return `<article class="card product-card" data-product="${escape(product.url)}" data-variant="${escape(product.url+'--'+color.id)}" style="--capacity-scale:${(.88*Math.cbrt(capacity(product)/1.9)).toFixed(3)}"><a class="photo product-photo" href="${href(product)}" target="_blank" rel="noopener" aria-label="Ver ${escape(product.name+' '+product.size+' — '+label)} por ${escape(money(color.price))} na loja"><span class="badge discount-badge">${discount(color)}% OFF</span><svg class="product-image" viewBox="${color.crop.viewBox.join(' ')}" role="img" aria-label="${escape(product.name+' '+product.size+' — '+label)}"><image href="${escape(image)}" width="${color.crop.width}" height="${color.crop.height}"/></svg><div class="photo-pricing"><div><s>${money(oldPrice)}</s><strong>${priceHTML(color)}</strong></div><span aria-hidden="true">↗</span></div></a></article>`;
  }
  function render(){
    const groups=new Map();for(const product of products){if(!groups.has(product.url))groups.set(product.url,[]);groups.get(product.url).push(product);}
    grid.innerHTML=[...groups].map(([slug,items])=>{const product=items[0],id='model-'+slug;
      return '<section class="model-section" aria-labelledby="'+id+'-title"><div class="model-heading"><div><h2 id="'+id+'-title">'+escape(product.name)+' <span>· '+escape(product.size)+'</span></h2><p>'+items.length+' cores em oferta</p></div><div class="model-controls"><button type="button" data-direction="-1" aria-controls="'+id+'" aria-label="Cores anteriores de '+escape(product.name)+'">‹</button><button type="button" data-direction="1" aria-controls="'+id+'" aria-label="Próximas cores de '+escape(product.name)+'">›</button></div></div><div class="model-track" id="'+id+'" tabindex="0" role="group" aria-label="Cores de '+escape(product.name)+' '+escape(product.size)+'">'+items.map(card).join('')+'</div></section>';
    }).join('');count.textContent=groups.size+' modelos · '+products.length+' cores';
    for(const section of grid.querySelectorAll('.model-section')){
      const track=section.querySelector('.model-track'),buttons=section.querySelectorAll('[data-direction]');
      const update=()=>{buttons[0].disabled=track.scrollLeft<=2;buttons[1].disabled=track.scrollLeft+track.clientWidth>=track.scrollWidth-2;};
      buttons.forEach(button=>button.addEventListener('click',()=>track.scrollBy({left:Number(button.dataset.direction)*(track.firstElementChild.getBoundingClientRect().width+parseFloat(getComputedStyle(track).columnGap)),behavior:reducedMotion?'instant':'smooth'})));
      track.addEventListener('scroll',update,{passive:true});window.addEventListener('resize',update);if('ResizeObserver' in window)new ResizeObserver(update).observe(track);update();
    }
  }

  const video=document.getElementById('trilha-video');
  const scriptURL=document.currentScript.src;
  const reducedMotion=matchMedia('(prefers-reduced-motion: reduce)').matches;
  const saveData=!!navigator.connection?.saveData;
  let manuallyPaused=reducedMotion||saveData;
  video.src=new URL(matchMedia('(max-width: 760px)').matches?'media/trilha-mobile.mp4':'media/trilha-desktop.mp4?v=fullhd-20261020',scriptURL).href;
  const playbackUnavailable=()=>{};
  video.addEventListener('error',()=>{manuallyPaused=true;});
  if(!manuallyPaused)video.play().catch(playbackUnavailable);
  if('IntersectionObserver' in window)new IntersectionObserver(entries=>{for(const entry of entries){if(!entry.isIntersecting)video.pause();else if(!manuallyPaused)video.play().catch(playbackUnavailable);}},{threshold:.1}).observe(video);

  fetch(new URL('products.json',document.currentScript.src),{cache:'no-cache'}).then(response=>{if(!response.ok)throw Error('Catalog unavailable');return response.json();}).then(data=>{
    products=data.products.flatMap(p=>p.colors.filter(c=>c.available!==false&&c.price>0&&c.oldPrice>c.price).map(color=>({...p,color})));
    render();
  }).catch(()=>{count.textContent='Seleção indisponível';document.getElementById('catalog-error').hidden=false;});
})();
