/* Ponte restrita: quantidade do carrinho e primeiro nome da sessão autenticada. */
(()=>{
 'use strict';
 if(window.__bgCartCountStarted)return;window.__bgCartCountStarted=true;
 const store='https://loja.bufalogrowler.com.br';
 const sites=new Set(['https://www.bufalogrowler.com.br','https://bufalogrowler.com.br']);
 const valid=n=>Number.isSafeInteger(n)&&n>=0&&n<=99999;
 function render(n){
  if(!valid(n))return;
  document.querySelectorAll('#bg-site-header a[href*="/carrinho/index"]').forEach(a=>{
   let badge=a.querySelector('.bg-cart-count');
   if(!badge){badge=document.createElement('span');badge.className='bg-cart-count';badge.setAttribute('aria-hidden','true');a.append(badge);}
   if(badge.textContent!==String(n))badge.textContent=String(n);
   a.setAttribute('aria-label',`Abrir carrinho na loja oficial · ${n} ${n===1?'item':'itens'}`);
  });
 }
 function start(){
  if(location.origin===store){
   let count=null,peer=null,firstName='',customerRequest;
   const refreshCustomer=()=>{
    if(customerRequest)return customerRequest;
    customerRequest=fetch('/conta/status',{credentials:'same-origin',cache:'no-store'})
     .then(response=>{if(!response.ok)throw new Error('Status indisponível');return response.json();})
     .then(status=>{firstName=status.logged===true&&typeof status.name==='string'?status.name.trim().split(/\s+/)[0].slice(0,30):'';})
     .catch(()=>{firstName='';})
     .finally(()=>{customerRequest=null;window.__bgCustomerFirstName=firstName;document.dispatchEvent(new CustomEvent('bg:customer',{detail:{firstName}}));publishCustomer();});
    return customerRequest;
   };
   const publish=()=>{if(peer&&valid(count))parent.postMessage({type:'bg:cart-count',nonce:peer.nonce,count},peer.origin);};
   const publishCustomer=()=>{if(peer)parent.postMessage({type:'bg:customer',nonce:peer.nonce,firstName},peer.origin);};
   const update=()=>{
    publishCustomer();
    const native=document.querySelector('#cabecalho .qtd-carrinho');
    if(!native)return;
    const text=native.textContent.trim();if(!/^\d+$/.test(text))return;
    const next=Number(text);if(!valid(next))return;
    const changed=next!==count;count=next;render(count);if(changed)publish();
   };
   if(parent!==window&&new URLSearchParams(location.search).has('bg_cart_count')){
    addEventListener('message',e=>{
     if(e.source!==parent||!sites.has(e.origin)||e.data?.type!=='bg:cart-request'||typeof e.data.nonce!=='string'||e.data.nonce.length>100)return;
     peer={origin:e.origin,nonce:e.data.nonce};update();publish();refreshCustomer();
    });
    try{const origin=new URL(document.referrer).origin;if(sites.has(origin))parent.postMessage({type:'bg:cart-ready'},origin);}catch{}
   }
   refreshCustomer();addEventListener('focus',refreshCustomer);document.addEventListener('visibilitychange',()=>{if(!document.hidden)refreshCustomer();});
   if(window.jQuery)window.jQuery('body').on('user_state_changed.bgAnnouncement',refreshCustomer);
   update();new MutationObserver(update).observe(document.body,{childList:true,subtree:true,characterData:true});
   return;
  }
  if(!sites.has(location.origin))return;
  let frame,lastRefresh=0,nonce='';
  const request=()=>frame?.contentWindow?.postMessage({type:'bg:cart-request',nonce},store);
  addEventListener('message',e=>{
   if(e.origin!==store||!frame||e.source!==frame.contentWindow)return;
   if(e.data?.type==='bg:cart-ready'){request();return;}
   if(e.data?.type==='bg:customer'&&e.data.nonce===nonce&&typeof e.data.firstName==='string'&&e.data.firstName.length<=30){window.__bgCustomerFirstName=e.data.firstName;document.dispatchEvent(new CustomEvent('bg:customer',{detail:{firstName:e.data.firstName}}));}
   if(e.data?.type==='bg:cart-count'&&e.data.nonce===nonce&&valid(e.data.count))render(e.data.count);
  });
  function refresh(){
   if(document.visibilityState==='hidden'||Date.now()-lastRefresh<15000)return;
   lastRefresh=Date.now();nonce=crypto.randomUUID();
   if(!frame){frame=document.createElement('iframe');frame.hidden=true;frame.title='Quantidade do carrinho da loja';frame.setAttribute('aria-hidden','true');frame.tabIndex=-1;frame.addEventListener('load',request);document.body.append(frame);}
   frame.src=store+'/?bg_cart_count='+encodeURIComponent(nonce);
  }
  refresh();addEventListener('focus',refresh);addEventListener('pageshow',refresh);document.addEventListener('visibilitychange',refresh);
 }
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
})();
