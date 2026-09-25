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
document.addEventListener('keydown',event=>{if(event.key==='Escape')document.querySelectorAll('.mega').forEach(item=>item.hidden=true);});

document.querySelectorAll('.catalog-section').forEach(section=>{
  const rail=section.querySelector('.catalog-rail');
  const prev=section.querySelector('[data-prev]');
  const next=section.querySelector('[data-next]');
  const update=()=>{prev.disabled=rail.scrollLeft<=2;next.disabled=rail.scrollLeft+rail.clientWidth>=rail.scrollWidth-2;};
  prev.addEventListener('click',()=>rail.scrollBy({left:-rail.clientWidth*.9,behavior:'smooth'}));
  next.addEventListener('click',()=>rail.scrollBy({left:rail.clientWidth*.9,behavior:'smooth'}));
  rail.addEventListener('scroll',update,{passive:true});
  addEventListener('resize',update);
  update();
});
document.addEventListener('click',event=>{
  const button=event.target.closest('.catalog-card .color-swatch');
  if(!button||button.getAttribute('aria-pressed')==='true')return;
  const card=button.closest('.catalog-card');
  const apply=()=>{
    card.querySelectorAll('.color-swatch').forEach(swatch=>swatch.setAttribute('aria-pressed',String(swatch===button)));
    card.querySelector('.selected-color strong').textContent=button.dataset.colorLabel;
  };
  const imageUrl=button.dataset.colorImg;
  if(!imageUrl){card.dataset.colorRequest='';card.querySelector('.photo').removeAttribute('aria-busy');apply();return;}
  const next=new Image();
  const photo=card.querySelector('.photo');
  const requestId=String(Date.now()+Math.random());
  card.dataset.colorRequest=requestId;
  photo.setAttribute('aria-busy','true');
  next.onload=()=>{
    if(card.dataset.colorRequest!==requestId)return;
    const image=photo.querySelector('img');
    image.src=imageUrl;
    image.alt=`${card.querySelector('h3').textContent} — ${button.dataset.colorLabel}`;
    photo.removeAttribute('aria-busy');
    apply();
  };
  next.onerror=()=>{if(card.dataset.colorRequest===requestId)photo.removeAttribute('aria-busy');};
  next.src=imageUrl;
});
const indexLinks=[...document.querySelectorAll('.category-index-links a')];
const setCurrentCategory=link=>{
  indexLinks.forEach(item=>item.removeAttribute('aria-current'));
  link?.setAttribute('aria-current','true');
};
indexLinks.forEach(link=>link.addEventListener('click',()=>setCurrentCategory(link)));
setCurrentCategory(indexLinks.find(link=>link.hash===location.hash)||indexLinks[0]);
const observer=new IntersectionObserver(entries=>{
  for(const entry of entries){if(!entry.isIntersecting)continue;
    setCurrentCategory(document.querySelector(`.category-index-links a[href="#${entry.target.id}"]`));
  }
},{rootMargin:'-27% 0px -65% 0px'});
document.querySelectorAll('.catalog-section').forEach(section=>observer.observe(section));
