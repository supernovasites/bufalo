/* Faixa compartilhada: só usa o primeiro nome informado pela sessão nativa da loja. */
(()=>{
 'use strict';
 if(window.__bgAnnouncementStarted)return;window.__bgAnnouncementStarted=true;
 const home='https://www.bufalogrowler.com.br',store='https://loja.bufalogrowler.com.br';
 const messages=[
 ['Olá, {cliente}! Frete grátis acima de R$ 200.','Aproveite! Frete grátis acima de R$ 200.',store+'/'],
 ['{cliente}, descubra as novidades da Búfalo!','Chegou novidade na manada. Vem conhecer!',home+'/#lancamentos'],
 ['{cliente}, sua Búfalo pode ter o seu nome!','Sua Búfalo, do seu jeito. Personalize!', 'https://wa.me/5591984973370?text=Quero%20personalizar%20minha%20B%C3%BAfalo'],
 ['{cliente}, precisa de ajuda? Chama no WhatsApp!','Podemos ajudar na escolha? Chama no WhatsApp!','https://wa.me/5591984973370'],
 ['Bom te ver por aqui, {cliente}!','Boas-vindas à manada! Encontre sua Búfalo.',store+'/'],
 ['{cliente}, aproveite a Black Búfalo: até 30% OFF!','A Black Búfalo começou! Até 30% OFF.',home+'/campanhas/black26/'],
 ['Olá, {cliente}! Confira nossos lançamentos.','Sua próxima aventura merece uma novidade.',home+'/#lancamentos'],
 ['Olá, {cliente}! Conte com a nossa equipe.','Ficou com alguma dúvida? Fale com a gente!','https://wa.me/5591984973370']
 ];
 let firstName='',index=Math.floor(Math.random()*messages.length),link,bar;
 try {
  const previous=sessionStorage.getItem('bg-announcement-index');
  if(previous!==null&&/^\d+$/.test(previous)&&Number(previous)<messages.length)index=(Number(previous)+1)%messages.length;
  sessionStorage.setItem('bg-announcement-index',String(index));
 } catch {}
 const normalize=value=>typeof value==='string'?value.trim().split(/\s+/)[0].slice(0,30):'';
 function render(){if(!link)return;const m=messages[index];link.textContent=firstName?m[0].replace('{cliente}',firstName):m[1];link.href=m[2];}
 function nativeName(){return location.origin===store?normalize(window.__bgCustomerFirstName??document.querySelector('#cabecalho .menu-user-name')?.textContent):'';}
 function setName(value){const next=normalize(value);if(next===firstName)return;firstName=next;render();}
 function mount(){
  const next=document.getElementById('bg-site-announcement');if(!next||next===bar)return;
  bar=next;bar.replaceChildren();link=document.createElement('a');link.className='bg-announcement-link';bar.append(link);bar.setAttribute('aria-label','Novidades e atendimento Búfalo');
  if(!document.getElementById('bg-announcement-style')){const style=document.createElement('style');style.id='bg-announcement-style';style.textContent='#bg-site-announcement{box-sizing:border-box;min-height:40px;display:flex;align-items:center;justify-content:center;padding:7px 14px;text-align:center;background:#142e32;color:#fff}#bg-site-announcement .bg-announcement-link{display:block;width:100%;max-width:950px;color:inherit;text-decoration:none;font:700 15px/1.35 Arial,Helvetica,sans-serif;letter-spacing:0;text-transform:none;overflow-wrap:anywhere}#bg-site-announcement .bg-announcement-link:focus-visible{outline:2px solid white;outline-offset:3px}@media(max-width:760px){#bg-site-announcement{min-height:44px}#bg-site-announcement .bg-announcement-link{font-size:13px}}';document.head.append(style);}
  setName(location.origin===store?nativeName():(window.__bgCustomerFirstName||''));render();bar.removeAttribute('aria-busy');
 }
 document.addEventListener('bg:customer',e=>setName(e.detail?.firstName));
 document.addEventListener('bg:site-shell-ready',mount);
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',mount,{once:true});else mount();
 if(location.origin===store)new MutationObserver(()=>setName(nativeName())).observe(document.body,{childList:true,subtree:true,characterData:true});
})();
