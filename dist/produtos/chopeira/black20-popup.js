(() => {
 'use strict';
 const popup=document.getElementById('black20-popup');
 if(!popup || typeof popup.showModal!=='function')return;
 const key='bufalo_chopeira_black20_20261105';
 let previousFocus,previousOverflow;
 popup.querySelector('.black20-popup-close').addEventListener('click',()=>popup.close());
 popup.querySelector('.black20-popup-shop').addEventListener('click',()=>{
   popup.close();
   const target=document.getElementById('ontap-2l');
   target?.scrollIntoView({behavior:'instant',block:'start'});
 });
 popup.addEventListener('click',event=>{
   if(event.target!==popup)return;
   const r=popup.getBoundingClientRect();
   if(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom)popup.close();
 });
 popup.addEventListener('close',()=>{
   document.body.style.overflow=previousOverflow;
   previousFocus?.focus({preventScroll:true});
 });
 setTimeout(()=>{
   try{if(sessionStorage.getItem(key))return;}catch{}
   if(document.querySelector('dialog[open]')||document.hidden||[...document.querySelectorAll('video')].some(v=>!v.paused&&(v.controls||!v.muted)))return;
   previousFocus=document.activeElement;previousOverflow=document.body.style.overflow;
   popup.showModal();document.body.style.overflow='hidden';
   try{sessionStorage.setItem(key,'1');}catch{}
 },1000);
})();
