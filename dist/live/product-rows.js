(() => {
  document.querySelectorAll('.product-row').forEach(row => {
    const track=row.querySelector('.product-track');
    const buttons=[...row.querySelectorAll('.row-arrow')];
    let drag=null, blockClick=false;
    const reduced=matchMedia('(prefers-reduced-motion: reduce)');
    const update=()=>{
      const max=Math.max(0,track.scrollWidth-track.clientWidth);
      buttons.forEach(b=>{b.disabled=Number(b.dataset.direction)<0?track.scrollLeft<=2:track.scrollLeft>=max-2;});
    };
    function step(direction){
      const card=track.querySelector('.product');
      const gap=parseFloat(getComputedStyle(track).gap)||0;
      track.scrollBy({left:direction*(card.getBoundingClientRect().width+gap),behavior:reduced.matches?'instant':'smooth'});
    }
    buttons.forEach(b=>b.addEventListener('click',()=>step(Number(b.dataset.direction))));
    track.addEventListener('keydown',e=>{
      if(e.target!==track)return;
      if(e.key==='ArrowRight'||e.key==='ArrowLeft'){e.preventDefault();step(e.key==='ArrowRight'?1:-1);}
      if(e.key==='Home'||e.key==='End'){e.preventDefault();track.scrollTo({left:e.key==='Home'?0:track.scrollWidth,behavior:'instant'});}
    });
    track.addEventListener('pointerdown',e=>{
      if(e.pointerType!=='mouse'||e.button!==0)return;
      if(e.target.closest('button,select,input'))return;
      blockClick=false;
      drag={id:e.pointerId,x:e.clientX,left:track.scrollLeft,moved:false};
    });
    track.addEventListener('pointermove',e=>{
      if(!drag||e.pointerId!==drag.id)return;
      const dx=e.clientX-drag.x;
      if(!drag.moved&&Math.abs(dx)>5){drag.moved=true;blockClick=true;track.classList.add('is-dragging');track.setPointerCapture(e.pointerId);}
      if(drag.moved){e.preventDefault();track.scrollLeft=drag.left-dx;}
    });
    function finish(e){
      if(!drag||e.pointerId!==drag.id)return;
      const moved=drag.moved;drag=null;
      if(track.hasPointerCapture(e.pointerId))track.releasePointerCapture(e.pointerId);
      track.classList.remove('is-dragging');
      if(moved)setTimeout(()=>{blockClick=false;},0);
      update();
    }
    track.addEventListener('pointerup',finish);
    track.addEventListener('pointercancel',finish);
    track.addEventListener('lostpointercapture',finish);
    track.addEventListener('pointerleave',e=>{if(drag&&!drag.moved)finish(e);});
    track.addEventListener('dragstart',e=>e.preventDefault());
    track.addEventListener('click',e=>{if(blockClick){e.preventDefault();e.stopPropagation();}},true);
    track.addEventListener('scroll',update,{passive:true});
    new ResizeObserver(update).observe(track);
    update();
  });
  document.querySelectorAll('.growler-card').forEach(card=>{
    const image=card.querySelector('img');
    const link=card.querySelector('.growler-photo-link');
    const label=card.querySelector('.growler-color-name');
    const swatches=[...card.querySelectorAll('.growler-swatch')];
    let request=0;
    swatches.forEach(button=>button.addEventListener('click',()=>{
      const current=++request;
      const next=new Image();
      card.setAttribute('aria-busy','true');
      next.onload=()=>{
        if(current!==request)return;
        image.src=button.dataset.image;
        image.alt=card.dataset.productName+' — '+button.dataset.colorName;
        link.href=button.dataset.productUrl;
        const cta=card.querySelector('.growler-cta');
        if(cta)cta.href=button.dataset.productUrl;
        if(button.dataset.price){
          const price=Number(button.dataset.price);
          const format=n=>n.toLocaleString('pt-BR',{style:'currency',currency:'BRL'});
          card.querySelector('.old s').textContent=format(price);
          card.querySelector('.price').textContent=format(price*.8);
        }
        label.textContent=button.dataset.colorName;
        swatches.forEach(s=>s.setAttribute('aria-pressed',String(s===button)));
        card.removeAttribute('aria-busy');
      };
      next.onerror=()=>{
        if(current!==request)return;
        label.textContent='Não foi possível carregar esta cor. Tente novamente.';
        card.removeAttribute('aria-busy');
      };
      next.src=button.dataset.image;
    }));
  });
})();