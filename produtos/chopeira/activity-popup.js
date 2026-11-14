(()=>{
 const ENDPOINT='/api/chopeira-activity',KEY='bg-chopeira-activity-visitor',CLOSED='bg-chopeira-activity-closed';
 let stopped=false;try{stopped=sessionStorage.getItem(CLOSED)==='1';}catch{}
 if(stopped)return;
 let visitor;try{visitor=localStorage.getItem(KEY);}catch{}
 if(!/^[a-f0-9-]{36}$/i.test(visitor||'')){visitor=crypto.randomUUID();try{localStorage.setItem(KEY,visitor);}catch{}}
 const toast=document.createElement('aside');toast.className='chopeira-activity';toast.setAttribute('aria-label','Destaques das chopeiras');toast.setAttribute('aria-hidden','true');
 toast.innerHTML='<span class="chopeira-activity-mark" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><circle cx="9" cy="7" r="3"/><path d="M3 20v-3a6 6 0 0 1 12 0v3M16 4a3 3 0 0 1 0 6M18 13a5 5 0 0 1 3 4v3"/></svg></span><div class="chopeira-activity-copy"><span class="chopeira-activity-message"></span><span class="chopeira-activity-detail"></span><a href="#modelos" data-track-key="chopeira-activity-models" data-track-label="Popup: escolher minha chopeira">Escolher minha chopeira</a></div><button class="chopeira-activity-close" type="button" aria-label="Fechar notificações">×</button>';
 document.body.append(toast);
 const message=toast.querySelector('.chopeira-activity-message'),detail=toast.querySelector('.chopeira-activity-detail');
 let stats=null,updated=0,last='',hideTimer,showTimer,heartbeatTimer,controller;
 function hide(){toast.classList.remove('is-visible');toast.setAttribute('aria-hidden','true');toast.inert=true;}
 function blocked(){return document.hidden||!!document.querySelector('dialog[open]')||document.activeElement?.matches('input,textarea,select');}
 function messages(){
  const items=[{id:'models',text:'Seu próximo brinde começa aqui.',detail:'Compare modelos e escolha sua chopeira.'},{id:'faq',text:'Conheça sua chopeira antes de comprar.',detail:'Assista aos vídeos e tire suas dúvidas.'}];
  if(stats&&Date.now()-updated<90000){
   if(Number.isInteger(stats.viewers)&&stats.viewers>1)items.push({id:'viewers',text:stats.viewers.toLocaleString('pt-BR')+' pessoas estão vendo agora',detail:'Navegadores ativos nos últimos 90 segundos.'});
   if(Number.isInteger(stats.visitorsToday)&&stats.visitorsToday>1)items.push({id:'visits',text:stats.visitorsToday.toLocaleString('pt-BR')+' pessoas visitaram hoje',detail:'Visitas únicas à página, no horário de Belém.'});
  }
  return items;
 }
 async function heartbeat(){
  if(stopped||document.hidden)return;
  controller=new AbortController();const timeout=setTimeout(()=>controller.abort(),8000);
  try{const r=await fetch(ENDPOINT,{method:'POST',credentials:'same-origin',cache:'no-store',headers:{'Content-Type':'application/json'},body:JSON.stringify({visitor}),signal:controller.signal});const data=r.ok?await r.json():null;if(data?.available){stats=data;updated=Date.now();}else stats=null;}catch{stats=null;}finally{clearTimeout(timeout);}
 }
 function schedule(){clearTimeout(showTimer);if(!stopped)showTimer=setTimeout(show,20000+Math.random()*12000);}
 function show(){
  if(stopped)return;if(blocked()){schedule();return;}
  const options=messages().filter(item=>item.id!==last),item=options[Math.floor(Math.random()*options.length)];last=item.id;message.textContent=item.text;detail.textContent=item.detail;
  toast.inert=false;toast.setAttribute('aria-hidden','false');toast.classList.add('is-visible');
  clearTimeout(hideTimer);hideTimer=setTimeout(()=>{if(toast.contains(document.activeElement)){hideTimer=setTimeout(()=>{hide();schedule();},8000);}else{hide();schedule();}},6500);
 }
 toast.querySelector('button').onclick=()=>{stopped=true;hide();clearTimeout(showTimer);clearTimeout(hideTimer);clearInterval(heartbeatTimer);controller?.abort();try{sessionStorage.setItem(CLOSED,'1');}catch{}};
 toast.querySelector('a').onclick=()=>{hide();clearTimeout(hideTimer);schedule();};
 document.addEventListener('visibilitychange',()=>{if(document.hidden){hide();clearTimeout(hideTimer);clearTimeout(showTimer);}else if(!stopped){heartbeat();schedule();}});
 document.addEventListener('click',()=>{if(document.querySelector('dialog[open]')){hide();clearTimeout(hideTimer);schedule();}},true);
 addEventListener('pagehide',()=>{clearInterval(heartbeatTimer);clearTimeout(showTimer);clearTimeout(hideTimer);controller?.abort();});
 hide();heartbeat();heartbeatTimer=setInterval(heartbeat,30000);showTimer=setTimeout(show,12000);
})();
