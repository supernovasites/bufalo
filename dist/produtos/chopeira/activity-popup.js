(()=>{
 const ENDPOINT='/api/chopeira-activity',KEY='bg-chopeira-activity-visitor';
 let visitor;try{visitor=localStorage.getItem(KEY);}catch{}
 if(!/^[a-f0-9-]{36}$/i.test(visitor||'')){visitor=crypto.randomUUID();try{localStorage.setItem(KEY,visitor);}catch{}}
 const shortcut=document.querySelector('.faq-shortcut');
 if(!shortcut)return;
 const original=shortcut.innerHTML,originalLabel=shortcut.getAttribute('aria-label');
 const eye='<svg class="faq-shortcut-symbol" viewBox="0 0 24 24" aria-hidden="true"><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z"/><circle cx="12" cy="12" r="3"/></svg>';
 const surveyPrompts=[
  {text:'O frete está caro?',reason:'frete-caro'},
  {text:'O prazo está longo?',reason:'prazo-longo'},
  {text:'O preço está alto?',reason:'produto-caro'}
 ];
 const surveyTrigger=document.querySelector('.negotiation-trigger');
 const offerButton=document.querySelector('.kundi-offer');
 const offerQuestion=offerButton?.querySelector('.kundi-offer-question');
 function openSurvey(reason){
  surveyTrigger.dataset.reason=reason;
  surveyTrigger.click();
 }
 if(offerButton && offerQuestion && surveyTrigger){
  offerButton.addEventListener('click',()=>{
   offerButton.focus({preventScroll:true});
   openSurvey(offerButton.dataset.reason);
  });
 }
 const startedAt=Date.now();
 let stats=null,updated=0,heartbeatTimer,paintTimer,controller,disposed=false,mode='faq';
 function restore(){
  if(mode==='faq')return;
  mode='faq';shortcut.innerHTML=original;
  if(originalLabel===null)shortcut.removeAttribute('aria-label');else shortcut.setAttribute('aria-label',originalLabel);
 }
 function blocked(){return document.hidden||!!document.querySelector('dialog[open]')||document.activeElement?.matches('input,textarea,select');}
 async function heartbeat(){
  if(disposed||document.hidden)return;
  controller=new AbortController();const timeout=setTimeout(()=>controller.abort(),8000);
  try{const r=await fetch(ENDPOINT,{method:'POST',credentials:'same-origin',cache:'no-store',headers:{'Content-Type':'application/json'},body:JSON.stringify({visitor}),signal:controller.signal});const data=r.ok?await r.json():null;if(data?.available){stats=data;updated=Date.now();}else stats=null;}catch{stats=null;}finally{clearTimeout(timeout);}
 }
 function render(nextMode,content,label){
  if(mode!==nextMode||shortcut.innerHTML!==content){shortcut.innerHTML=content;mode=nextMode;}
  if(label)shortcut.setAttribute('aria-label',label);
  else if(originalLabel===null)shortcut.removeAttribute('aria-label');
  else shortcut.setAttribute('aria-label',originalLabel);
 }
 function paint(){
  if(disposed)return;
  if(blocked()){restore();return;}
  const elapsed=(Date.now()-startedAt)/1000;
  if(offerQuestion && surveyTrigger && document.activeElement!==offerButton){
   const prompt=surveyPrompts[Math.floor(elapsed/6)%surveyPrompts.length];
   if(offerButton.dataset.reason!==prompt.reason){
    offerQuestion.textContent=prompt.text;
    offerButton.dataset.reason=prompt.reason;
    offerButton.hidden=false;
   }
  }
  const viewerSlot=elapsed>=15&&(elapsed-15)%15<3;
  const surveySlot=elapsed>=63&&(elapsed-63)%10<3;
  const hasCount=stats&&Date.now()-updated<90000&&Number.isSafeInteger(stats.todayVisitors)&&stats.todayVisitors>=0;
  if(surveySlot&&surveyTrigger){
   const prompt=surveyPrompts[Math.floor((elapsed-63)/10)%surveyPrompts.length];
   shortcut.dataset.reason=prompt.reason;
   const count=hasCount?stats.todayVisitors:0;
   const countBadge=viewerSlot&&hasCount?'<span class="faq-view-count" aria-hidden="true">'+eye+'<span>'+count.toLocaleString('pt-BR')+' hoje</span></span>':'';
   render('survey',original.replace(/<span>[\s\S]*?<\/span>/,'<span>'+prompt.text+'</span>')+countBadge,prompt.text+' Responda à pesquisa sobre sua compra'+(countBadge?' · '+count+' '+(count===1?'pessoa viu':'pessoas viram')+' a chopeira hoje':''));
   return;
  }
  if(viewerSlot&&hasCount){
   const count=stats.todayVisitors;
   render('viewers',eye+'<span>'+count.toLocaleString('pt-BR')+' '+(count===1?'pessoa viu':'pessoas viram')+' a chopeira hoje</span>',count+' '+(count===1?'pessoa viu':'pessoas viram')+' a chopeira hoje');
   return;
  }
  restore();
 }
 shortcut.addEventListener('click',event=>{
  if(!mode.startsWith('survey')||!surveyTrigger)return;
  event.preventDefault();
  openSurvey(shortcut.dataset.reason);
 });
 document.addEventListener('visibilitychange',()=>{if(document.hidden)restore();else heartbeat();paint();});
 document.addEventListener('click',()=>{queueMicrotask(()=>{if(document.querySelector('dialog[open]'))restore();});},true);
 addEventListener('pagehide',event=>{restore();clearInterval(heartbeatTimer);clearInterval(paintTimer);controller?.abort();disposed=!event.persisted;});
 addEventListener('pageshow',event=>{if(event.persisted){disposed=false;heartbeat();clearInterval(heartbeatTimer);clearInterval(paintTimer);heartbeatTimer=setInterval(heartbeat,30000);paintTimer=setInterval(paint,250);paint();}});
 heartbeat();heartbeatTimer=setInterval(heartbeat,30000);paint();paintTimer=setInterval(paint,250);
})();
