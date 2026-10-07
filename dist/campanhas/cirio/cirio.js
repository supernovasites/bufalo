const menu=document.getElementById('mobile-menu');
document.getElementById('open-menu')?.addEventListener('click',()=>menu?.showModal());
document.getElementById('close-menu')?.addEventListener('click',()=>menu?.close());
menu?.addEventListener('click',event=>{if(event.target===menu)menu.close();});
menu?.querySelectorAll('a').forEach(link=>link.addEventListener('click',()=>menu.close()));
document.getElementById('mobile-search')?.addEventListener('click',()=>{menu?.showModal();menu?.querySelector('input[type="search"]')?.focus();});
document.querySelectorAll('.nav-button').forEach(button=>button.addEventListener('click',()=>{
  const panel=document.getElementById(button.dataset.menu);
  const opened=!panel.hidden;
  document.querySelectorAll('.mega').forEach(item=>item.hidden=true);
  document.querySelectorAll('.nav-button').forEach(item=>item.setAttribute('aria-expanded','false'));
  panel.hidden=opened;
  button.setAttribute('aria-expanded',String(!opened));
}));
document.addEventListener('click',event=>{if(!event.target.closest('.nav-button,.mega')){
  document.querySelectorAll('.mega').forEach(item=>item.hidden=true);
  document.querySelectorAll('.nav-button').forEach(item=>item.setAttribute('aria-expanded','false'));
}});
document.addEventListener('keydown',event=>{if(event.key==='Escape'){document.querySelectorAll('.mega').forEach(item=>item.hidden=true);document.querySelectorAll('.nav-button').forEach(item=>item.setAttribute('aria-expanded','false'));}});


const video=document.getElementById('cirio-video'),play=document.getElementById('video-play');
const motion=matchMedia('(prefers-reduced-motion: reduce)');
function syncVideo(){const paused=video.paused;play.setAttribute('aria-pressed',String(paused));play.setAttribute('aria-label',paused?'Reproduzir vídeo':'Pausar vídeo');play.title=paused?'Reproduzir vídeo':'Pausar vídeo';}
play.addEventListener('click',()=>{if(video.paused)video.play().catch(syncVideo);else video.pause();});
video.addEventListener('pause',syncVideo);video.addEventListener('play',syncVideo);
if(motion.matches){video.autoplay=false;video.pause();}else video.play().catch(syncVideo);
motion.addEventListener('change',()=>{if(motion.matches)video.pause();});
syncVideo();

// Native touch scrolling, mouse dragging, buttons and keyboard for each color row.
document.querySelectorAll('.bottle-model,.product-model').forEach(model=>{
 const rail=model.querySelector('.bottle-rail');
 const prev=model.querySelector('[data-bottle-prev]'),next=model.querySelector('[data-bottle-next]');
 const update=()=>{prev.disabled=rail.scrollLeft<=2;next.disabled=rail.scrollLeft+rail.clientWidth>=rail.scrollWidth-2;};
 const move=direction=>rail.scrollBy({left:direction*(model.classList.contains('product-model')?rail.clientWidth*.85:rail.querySelector('.catalog-card').offsetWidth+parseFloat(getComputedStyle(rail).columnGap)),behavior:motion.matches?'instant':'smooth'});
 prev.addEventListener('click',()=>move(-1));next.addEventListener('click',()=>move(1));
 rail.addEventListener('scroll',update,{passive:true});
 new ResizeObserver(update).observe(rail);update();
 rail.addEventListener('keydown',event=>{if(event.target!==rail)return;if(event.key==='ArrowRight'||event.key==='ArrowLeft'){event.preventDefault();move(event.key==='ArrowRight'?1:-1);}});
 let startX=0,startScroll=0,activePointer=null,dragged=false;
 rail.addEventListener('pointerdown',event=>{if(event.pointerType!=='mouse'||event.button!==0)return;activePointer=event.pointerId;startX=event.clientX;startScroll=rail.scrollLeft;dragged=false;});
 rail.addEventListener('pointermove',event=>{if(event.pointerId!==activePointer)return;const distance=event.clientX-startX;if(!dragged&&Math.abs(distance)<6)return;if(!dragged){dragged=true;rail.classList.add('is-dragging');rail.setPointerCapture(event.pointerId);}event.preventDefault();rail.scrollLeft=startScroll-distance;});
 const stop=event=>{if(event.pointerId!==activePointer)return;activePointer=null;rail.classList.remove('is-dragging');if(rail.hasPointerCapture(event.pointerId))rail.releasePointerCapture(event.pointerId);};
 rail.addEventListener('pointerup',stop);rail.addEventListener('pointercancel',stop);
 rail.addEventListener('pointerleave',event=>{if(!dragged)stop(event);});
 rail.addEventListener('click',event=>{if(dragged){event.preventDefault();event.stopPropagation();dragged=false;}},true);
});

const bottleModelTabs=[...document.querySelectorAll('.bottle-subcategories [role="tab"]')];
function selectBottleModel(tab,focus=false){
 bottleModelTabs.forEach(item=>{const selected=item===tab;item.setAttribute('aria-selected',String(selected));item.tabIndex=selected?0:-1;document.getElementById(item.getAttribute('aria-controls')).hidden=!selected;});
 if(focus)tab.focus();
}
bottleModelTabs.forEach((tab,index)=>{
 tab.addEventListener('click',()=>selectBottleModel(tab));
 tab.addEventListener('keydown',event=>{
  let next;
  if(event.key==='ArrowRight')next=(index+1)%bottleModelTabs.length;
  if(event.key==='ArrowLeft')next=(index-1+bottleModelTabs.length)%bottleModelTabs.length;
  if(event.key==='Home')next=0;
  if(event.key==='End')next=bottleModelTabs.length-1;
  if(next!==undefined){event.preventDefault();selectBottleModel(bottleModelTabs[next],true);}
 });
});
