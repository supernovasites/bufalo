(()=>{
 const ENDPOINT='/api/chopeira-activity',KEY='bg-chopeira-activity-visitor';
 let visitor;try{visitor=localStorage.getItem(KEY);}catch{}
 if(!/^[a-f0-9-]{36}$/i.test(visitor||'')){visitor=crypto.randomUUID();try{localStorage.setItem(KEY,visitor);}catch{}}
 const toast=document.createElement('aside');toast.className='chopeira-activity';toast.setAttribute('aria-hidden','true');
 toast.innerHTML='<svg class="chopeira-activity-eye" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z"/><circle cx="12" cy="12" r="3"/></svg><span class="chopeira-activity-message"></span>';
 toast.title='Usuários visualizando esta página: navegadores ativos nos últimos 90 segundos.';
 document.body.append(toast);
 const message=toast.querySelector('.chopeira-activity-message');
 let stats=null,updated=0,hideTimer,showTimer,heartbeatTimer,controller,disposed=false;
 function hide(){toast.classList.remove('is-visible');toast.setAttribute('aria-hidden','true');}
 function position(){
  const anchor=[document.querySelector('.faq-shortcut'),document.querySelector('.negotiation-trigger')].find(el=>el&&!el.hidden&&el.getBoundingClientRect().width>0);
  if(!anchor)return false;
  const rect=anchor.getBoundingClientRect(),width=toast.getBoundingClientRect().width,gap=8;
  const left=rect.right+gap;
  if(left+width>innerWidth-8)return false;
  toast.style.left=left+'px';toast.style.bottom=Math.max(8,innerHeight-rect.bottom)+'px';toast.style.height=rect.height+'px';return true;
 }
 function blocked(){return document.hidden||!!document.querySelector('dialog[open]')||document.activeElement?.matches('input,textarea,select');}
 async function heartbeat(){
  if(disposed||document.hidden)return;
  controller=new AbortController();const timeout=setTimeout(()=>controller.abort(),8000);
  try{const r=await fetch(ENDPOINT,{method:'POST',credentials:'same-origin',cache:'no-store',headers:{'Content-Type':'application/json'},body:JSON.stringify({visitor}),signal:controller.signal});const data=r.ok?await r.json():null;if(data?.available){stats=data;updated=Date.now();}else stats=null;}catch{stats=null;}finally{clearTimeout(timeout);}
 }
 function schedule(){clearTimeout(showTimer);if(!disposed)showTimer=setTimeout(show,15000);}
 function show(){
  if(disposed)return;schedule();
  if(blocked()||!stats||Date.now()-updated>=90000||!Number.isSafeInteger(stats.viewers)||stats.viewers<1){hide();return;}
  const count=stats.viewers;message.textContent=count.toLocaleString('pt-BR')+' Vendo chopeiras';toast.setAttribute('aria-label',count+(count===1?' usuário visualizando esta página':' usuários visualizando esta página'));
  if(!position()){hide();return;}
  toast.setAttribute('aria-hidden','false');toast.classList.add('is-visible');
  clearTimeout(hideTimer);hideTimer=setTimeout(hide,3000);
 }
 function reposition(){if(!position())hide();}
 addEventListener('resize',reposition);
 if(typeof ResizeObserver!=='undefined'){
  const observer=new ResizeObserver(reposition);
  for(const selector of ['.faq-shortcut','.negotiation-trigger']){const anchor=document.querySelector(selector);if(anchor)observer.observe(anchor);}
 }
 document.addEventListener('visibilitychange',()=>{hide();clearTimeout(hideTimer);if(document.hidden)clearTimeout(showTimer);else{heartbeat();schedule();}});
 document.addEventListener('click',()=>{queueMicrotask(()=>{if(document.querySelector('dialog[open]')){hide();clearTimeout(hideTimer);}});},true);
 addEventListener('pagehide',event=>{hide();clearInterval(heartbeatTimer);clearTimeout(showTimer);clearTimeout(hideTimer);controller?.abort();disposed=!event.persisted;});
 addEventListener('pageshow',event=>{if(event.persisted){disposed=false;heartbeat();clearInterval(heartbeatTimer);heartbeatTimer=setInterval(heartbeat,30000);schedule();}});
 hide();heartbeat();heartbeatTimer=setInterval(heartbeat,30000);schedule();
})();
