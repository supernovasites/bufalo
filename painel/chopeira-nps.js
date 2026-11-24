(() => {
'use strict';
const $=id=>document.getElementById(id),panel=$('nps-panel');
if(!panel)return;
let offset=0,requestId=0;
const make=(tag,text)=>{const el=document.createElement(tag);if(text!==undefined)el.textContent=text;return el;};
async function load(){
 const current=++requestId;
 panel.hidden=$('click-page').value!=='/produtos/chopeira/';
 $('nps-rows').replaceChildren();$('nps-summary').replaceChildren();$('nps-distribution').replaceChildren();
 if(panel.hidden)return;
 $('nps-prev').disabled=$('nps-next').disabled=true;$('nps-status').textContent='Carregando avaliações…';
 const params=new URLSearchParams({days:$('click-days').value,device:$('click-device').value,offset:String(offset)});
 if($('click-days').value==='custom'){params.set('start',$('click-start').value);params.set('end',$('click-end').value);}
 try{
  const response=await fetch('/painel/api/chopeira-nps?'+params,{cache:'no-store',credentials:'same-origin'}),data=await response.json();
  if(current!==requestId)return;
  if(response.status===401){location.href='/painel/';return;}
  if(!response.ok)throw Error(data.error||'Não foi possível consultar as avaliações.');
  for(const [label,value] of [['NPS',data.nps===null?'—':data.nps],['Respostas',data.total],['Promotores · 9–10',data.promoters],['Neutros · 7–8',data.passives],['Detratores · 0–6',data.detractors]]){
   const card=make('div');card.className='metric';card.append(make('span',label),make('strong',String(value)));$('nps-summary').append(card);
  }
  for(let score=0;score<=10;score++){const row=make('div');row.className='metric-bar-row';row.append(make('span','Nota '+score),make('strong',String(data.distribution.find(r=>Number(r.score)===score)?.total||0)));$('nps-distribution').append(row);}
  for(const item of data.rows){
   const tr=make('tr'),contact=make('td'),email=make('a',item.email),phone=make('a','+'+item.phone);
   email.href='mailto:'+item.email;phone.href='https://wa.me/'+item.phone;phone.target='_blank';phone.rel='noopener noreferrer';contact.append(email,make('br'),phone);
   const review=make('td',item.review);review.style.whiteSpace='pre-wrap';review.style.minWidth='220px';review.style.overflowWrap='anywhere';
   review.append(make('br'),make('small',item.publication_authorized?'Divulgação da avaliação autorizada.':'Sem autorização de divulgação registrada.'));
   const photo=make('td');
   if(item.has_photo){const link=make('a'),img=make('img');link.href='/painel/api/chopeira-nps/photo?id='+encodeURIComponent(item.id);link.target='_blank';link.rel='noopener noreferrer';img.src=link.href;img.alt='Foto enviada por '+item.name;img.loading='lazy';img.width=110;img.style.height='90px';img.style.objectFit='cover';img.style.borderRadius='8px';link.append(img,make('span','Abrir foto'));photo.append(link);}else photo.textContent='Sem foto';
   const visibility=make('td'),label=make('label'),checkbox=make('input'),visibilityText=make('span',item.public_hidden?'Oculta':'Exibida');
   checkbox.type='checkbox';checkbox.checked=!Boolean(item.public_hidden);checkbox.setAttribute('aria-label',(checkbox.checked?'Ocultar':'Exibir')+' avaliação de '+item.name+' na página de vendas');
   label.style.display='inline-flex';label.style.alignItems='center';label.style.gap='8px';label.append(checkbox,visibilityText);visibility.append(label);
   checkbox.addEventListener('change',async()=>{
    const hidden=!checkbox.checked;checkbox.disabled=true;
    try{
     const response=await fetch('/painel/api/chopeira-nps',{method:'POST',credentials:'same-origin',headers:{'Content-Type':'application/json'},body:JSON.stringify({id:item.id,hidden})}),result=await response.json();
     if(response.status===401){location.href='/painel/';return;}
     if(!response.ok)throw Error(result.error||'Não foi possível salvar a exibição.');
     visibilityText.textContent=hidden?'Oculta':'Exibida';checkbox.setAttribute('aria-label',(hidden?'Exibir':'Ocultar')+' avaliação de '+item.name+' na página de vendas');
     $('nps-status').textContent='Avaliação de '+item.name+' '+(hidden?'ocultada da':'exibida na')+' página de vendas.';
    }catch(error){checkbox.checked=!hidden;$('nps-status').textContent=error.message;}
    finally{checkbox.disabled=false;}
   });
   tr.append(make('td',new Date(item.created_at).toLocaleString('pt-BR',{timeZone:'America/Belem'})),make('td',item.name),contact,make('td',String(item.score)),review,make('td',item.improvement||'—'),make('td',item.final_review||'—'),photo,visibility);$('nps-rows').append(tr);
  }
  if(!data.rows.length){const tr=make('tr'),td=make('td','Nenhuma avaliação neste período.');td.colSpan=9;tr.append(td);$('nps-rows').append(tr);}
  $('nps-status').textContent=data.total+' avaliações'+(data.total?' · Exibindo '+(offset+1)+' a '+(offset+data.rows.length):'')+'.';
  $('nps-prev').disabled=offset===0;$('nps-next').disabled=offset+data.limit>=data.total;
 }catch(error){if(current===requestId)$('nps-status').textContent=error.message;}
}
for(const id of ['click-page','click-days','click-start','click-end','click-device'])$(id).addEventListener('change',()=>{offset=0;load();});
$('click-reload').addEventListener('click',()=>{offset=0;load();});
$('nps-prev').addEventListener('click',()=>{offset=Math.max(0,offset-50);load();});
$('nps-next').addEventListener('click',()=>{offset+=50;load();});
load();
})();