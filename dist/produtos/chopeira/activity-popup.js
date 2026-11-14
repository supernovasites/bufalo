(()=>{
 const ENDPOINT='/api/chopeira-activity',KEY='bg-chopeira-activity-visitor';
 let visitor;try{visitor=localStorage.getItem(KEY);}catch{}
 if(!/^[a-f0-9-]{36}$/i.test(visitor||'')){visitor=crypto.randomUUID();try{localStorage.setItem(KEY,visitor);}catch{}}
 const shortcut=document.querySelector('.faq-shortcut');
 if(!shortcut)return;
 const original=shortcut.innerHTML,originalLabel=shortcut.getAttribute('aria-label');
 const eye='<svg class="faq-shortcut-symbol" viewBox="0 0 24 24" aria-hidden="true"><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z"/><circle cx="12" cy="12" r="3"/></svg>';
 let stats=null,updated=0,hideTimer,showTimer,heartbeatTimer,controller,disposed=false,showing=false;
 function hide(){
  if(!showing)return;
  showing=false;shortcut.innerHTML=original;
  if(originalLabel===null)shortcut.removeAttribute('aria-label');else shortcut.setAttribute('aria-label',originalLabel);
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
  if(shortcut.hidden||!shortcut.getBoundingClientRect().width){hide();return;}
  const count=stats.viewers;
  shortcut.innerHTML=eye+'<span>'+count.toLocaleString('pt-BR')+' Vendo chopeiras</span>';
  shortcut.setAttribute('aria-label',count+(count===1?' pessoa visualizando chopeiras':' pessoas visualizando chopeiras'));
  showing=true;
  clearTimeout(hideTimer);hideTimer=setTimeout(hide,3000);
 }
 document.addEventListener('visibilitychange',()=>{hide();clearTimeout(hideTimer);if(document.hidden)clearTimeout(showTimer);else{heartbeat();schedule();}});
 document.addEventListener('click',()=>{queueMicrotask(()=>{if(document.querySelector('dialog[open]')){hide();clearTimeout(hideTimer);}});},true);
 addEventListener('pagehide',event=>{hide();clearInterval(heartbeatTimer);clearTimeout(showTimer);clearTimeout(hideTimer);controller?.abort();disposed=!event.persisted;});
 addEventListener('pageshow',event=>{if(event.persisted){disposed=false;heartbeat();clearInterval(heartbeatTimer);heartbeatTimer=setInterval(heartbeat,30000);schedule();}});
 hide();heartbeat();heartbeatTimer=setInterval(heartbeat,30000);schedule();
})();
