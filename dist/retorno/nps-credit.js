(() => {
'use strict';
const $=id=>document.getElementById(id);let offset=0,requestId=0;
const make=(tag,text)=>{const el=document.createElement(tag);if(text!==undefined)el.textContent=text;return el;};
const date=value=>new Date(value).toLocaleString('pt-BR',{timeZone:'America/Belem'});
async function api(path,body){
 const r=await fetch('/retorno/api/'+path,{method:body?'POST':'GET',headers:body?{'Content-Type':'application/json'}:{},body:body?JSON.stringify(body):undefined,cache:'no-store'}),data=await r.json();
 if(r.status===401){location.href='/painel/?next=/retorno/retornonps/';throw Error('Sua sessão expirou.');}
 if(!r.ok)throw Error(data.error||'Não foi possível concluir.');return data;
}
async function load(){
 const current=++requestId;$('nps-message').textContent='Carregando avaliações…';$('nps-clients').replaceChildren();$('nps-prev').disabled=$('nps-next').disabled=true;
 const params=new URLSearchParams({offset:String(offset),search:$('nps-search').value,status:$('nps-status').value});
 try{
  const data=await api('nps?'+params);if(current!==requestId)return;
  $('nps-counts').replaceChildren();
  for(const [label,n] of [['Avaliações',data.summary.total],['Crédito pendente',data.summary.pending],['Creditadas',data.summary.credited]]){const p=make('p',label);p.append(make('strong',String(n)));$('nps-counts').append(p);}
  for(const item of data.rows){
   const card=make('article');card.className='nps-client';
   const top=make('div');top.className='nps-client-top';const title=make('div');title.append(make('h2',item.name),make('span',date(item.created_at)+' · Chopeira · Nota '+item.score+'/10'));
   const badge=make('span',item.credited_at?'Pontos creditados':'Crédito pendente');badge.className='badge'+(item.credited_at?' responded':'');top.append(title,badge);card.append(top);
   const contact=make('div');contact.className='nps-contact';const email=make('a',item.email),phone=make('a','+'+item.phone);email.href='mailto:'+item.email;phone.href='https://wa.me/'+item.phone;phone.target='_blank';phone.rel='noopener noreferrer';contact.append(email,phone);card.append(contact);
   const details=make('details');details.append(make('summary','Ver avaliação e foto'));
   for(const [label,value] of [['Experiência',item.review],['Sugestão de melhoria',item.improvement]]){details.append(make('h3',label));const p=make('p',value||'Não informada');p.className='review-text';details.append(p);}
   if(item.has_photo){const link=make('a','Abrir foto'),img=make('img');link.href='/retorno/api/nps-photo?id='+encodeURIComponent(item.id);link.target='_blank';link.rel='noopener noreferrer';img.dataset.src=link.href;img.alt='Foto enviada por '+item.name;img.loading='lazy';details.addEventListener('toggle',()=>{if(details.open&&!img.getAttribute('src'))img.src=img.dataset.src;});details.append(img,make('br'),link);}
   card.append(details);
   const label=make('label');label.className='credit-field';const checkbox=make('input');checkbox.type='checkbox';checkbox.checked=!!item.credited_at;checkbox.disabled=!!item.credited_at;label.append(checkbox,make('span',(item.points||500)+' pontos creditados no ManadaCash'));
   const stamp=make('p');stamp.className='credit-stamp';const feedback=make('p');feedback.setAttribute('role','status');
   const showCredit=credit=>{stamp.textContent=credit.credited_at?'Registrado por '+credit.staff_name+' em '+date(credit.credited_at):'Confirme somente depois de realizar o crédito dos pontos.';};
   showCredit(item);
   checkbox.addEventListener('change',async()=>{
    if(!checkbox.checked)return;checkbox.disabled=true;feedback.textContent='Registrando confirmação…';
    try{const saved=await api('nps-credit',{id:item.id,credited:true});showCredit(saved);badge.textContent='Pontos creditados';badge.className='badge responded';checkbox.checked=true;feedback.textContent='Crédito registrado.';await load();}
    catch(error){checkbox.checked=false;checkbox.disabled=false;feedback.textContent=error.message;}
   });
   card.append(label,stamp,feedback);$('nps-clients').append(card);
  }
  $('nps-message').textContent=data.total?data.total+' avaliações · Exibindo '+(offset+1)+' a '+(offset+data.rows.length)+'.':'Nenhuma avaliação nesta seleção.';
  $('nps-prev').disabled=offset===0;$('nps-next').disabled=offset+data.limit>=data.total;
 }catch(error){if(current===requestId)$('nps-message').textContent=error.message;}
}
document.addEventListener('retorno:session',()=>load());
$('reload').addEventListener('click',load);
$('nps-filters').addEventListener('submit',event=>{event.preventDefault();offset=0;load();});
$('nps-status').addEventListener('change',()=>{offset=0;load();});
$('nps-prev').addEventListener('click',()=>{offset=Math.max(0,offset-50);load();});
$('nps-next').addEventListener('click',()=>{offset+=50;load();});
})();