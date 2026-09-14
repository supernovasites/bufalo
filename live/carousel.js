(() => {
  const art=document.querySelector('.hero-art'); if(!art)return;
  const categories=[['#copos-garrafas',0,'Garrafas'],['#copos-garrafas',1,'Copos'],['#bolsas-coolers',0,'Bolsas e coolers'],['#camping-churrasco',0,'Camping e churrasco'],['#acessorios',0,'Acessórios']];
  const slides=categories.map(([id,index,label])=>{const category=document.querySelector(id)?.closest('.product-category');const product=category?.querySelectorAll('.product')[index];const image=product?.querySelector('img');const link=product?.querySelector('a');return image&&link?{src:image.src,alt:image.alt,url:link.href,label}:null;}).filter(Boolean);
  if(slides.length<2)return;
  const img=art.querySelector('img'), caption=art.querySelector('.hero-caption');let current=0,paused=matchMedia('(prefers-reduced-motion: reduce)').matches,hover=false,focused=false;
  const link=document.createElement('a');link.className='hero-slide-link';link.target='_blank';link.rel='noopener noreferrer';img.replaceWith(link);link.append(img);
  const controls=document.createElement('div');controls.className='carousel-controls';controls.setAttribute('aria-label','Seleção de produtos da live');
  const dots=slides.map((slide,index)=>{const b=document.createElement('button');b.type='button';b.className='carousel-dot';b.setAttribute('aria-label','Ver '+slide.alt);b.addEventListener('click',()=>{show(index);restart();});controls.append(b);return b;});
  const pause=document.createElement('button');pause.className='carousel-pause';pause.type='button';const label=()=>{pause.textContent=paused?'Reproduzir':'Pausar';pause.setAttribute('aria-label',paused?'Reproduzir carrossel':'Pausar carrossel');};label();pause.addEventListener('click',()=>{paused=!paused;label();});controls.append(pause);art.append(controls);
  slides.forEach(slide=>{const preload=new Image();preload.src=slide.src;});
  function show(index){current=index;const s=slides[index];img.src=s.src;img.alt=s.alt;link.href=s.url;link.setAttribute('aria-label','Ver '+s.alt);caption.textContent=s.label+' · '+s.alt;dots.forEach((b,i)=>b.setAttribute('aria-pressed',String(i===index)));}
  let timer;function restart(){clearInterval(timer);timer=setInterval(()=>{if(!paused&&!hover&&!focused&&!document.hidden)show((current+1)%slides.length);},2000);}
  art.addEventListener('mouseenter',()=>hover=true);art.addEventListener('mouseleave',()=>hover=false);art.addEventListener('focusin',()=>focused=true);art.addEventListener('focusout',event=>{focused=art.contains(event.relatedTarget);});
  show(0);restart();
})();
