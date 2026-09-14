(async () => {
 const art=document.querySelector('.photo-gallery');if(!art)return;
 let photos;try{const response=await fetch('/live/api/gallery',{cache:'no-store'});if(!response.ok)return;photos=(await response.json()).photos;}catch{return;}
 if(!photos?.length)return;
 const img=art.querySelector('#gallery-image'),placeholder=art.querySelector('.gallery-placeholder');
 const sources=photos.map(p=>({src:'/live/api/gallery/'+p.slot+'?v='+encodeURIComponent(p.photo_version),alt:'Seleção da live · foto '+p.slot}));
 let current=0,paused=matchMedia('(prefers-reduced-motion: reduce)').matches,hover=false,focused=false;
 const controls=document.createElement('div');controls.className='carousel-controls';controls.setAttribute('aria-label','Fotos da seleção da live');
 const dots=sources.map((s,i)=>{const b=document.createElement('button');b.type='button';b.className='carousel-dot';b.setAttribute('aria-label','Ver foto '+photos[i].slot);b.addEventListener('click',()=>{show(i);restart();});controls.append(b);return b;});
 const pause=document.createElement('button');pause.type='button';pause.className='carousel-pause';function label(){pause.textContent=paused?'Reproduzir':'Pausar';pause.setAttribute('aria-label',paused?'Reproduzir carrossel':'Pausar carrossel');}label();pause.addEventListener('click',()=>{paused=!paused;label();});if(sources.length>1){controls.append(pause);art.append(controls);}
 img.addEventListener('load',()=>{placeholder.hidden=true;img.hidden=false;});img.addEventListener('error',()=>{img.hidden=true;placeholder.hidden=false;});
 function show(i){current=i;img.src=sources[i].src;img.alt=sources[i].alt;dots.forEach((b,n)=>b.setAttribute('aria-pressed',String(n===i)));}
 sources.forEach(s=>{const image=new Image();image.src=s.src;});
 let timer;function restart(){clearInterval(timer);if(sources.length>1)timer=setInterval(()=>{if(!paused&&!hover&&!focused&&!document.hidden)show((current+1)%sources.length);},2000);}
 art.addEventListener('mouseenter',()=>hover=true);art.addEventListener('mouseleave',()=>hover=false);art.addEventListener('focusin',()=>focused=true);art.addEventListener('focusout',e=>focused=art.contains(e.relatedTarget));show(0);restart();
})();
