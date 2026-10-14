(()=>{
  const root=document.getElementById('live-auction');if(!root)return;
  const $=id=>document.getElementById(id),money=cents=>(cents/100).toLocaleString('pt-BR',{style:'currency',currency:'BRL'});
  const dialog=$('auction-dialog'),form=$('auction-bid-form');
  let state=null,pending=null,busy=false,loading=false,previous=null,previousOverflow='';
  root.addEventListener('animationend',event=>{if(event.animationName==='auction-price-pop')root.classList.remove('auction-new-bid');});
  function render(next){
    if(state&&(next.round_id<state.round_id||(next.round_id===state.round_id&&next.amount_cents<state.amount_cents)))return;
    state=next;
    $('auction-product-title').textContent=next.title;
    $('auction-description').textContent=next.description;
    const photo=$('auction-photo');if(photo.getAttribute('src')!==next.photo_url)photo.src=next.photo_url;
    photo.alt=next.title;
    $('auction-current').textContent=money(next.amount_cents);
    $('auction-next').textContent=money(next.next_amount_cents);
    $('auction-status').textContent=next.enabled?'Lances abertos':'Lances pausados';
    $('auction-open').disabled=!next.enabled;
    if(dialog.open&&!busy)$('auction-submit').disabled=!next.enabled;
    root.classList.toggle('is-open',next.enabled);
    const list=$('auction-recent');list.replaceChildren();
    next.bids.forEach((bid,index)=>{
      const item=document.createElement('li');item.className=index===0?'auction-leader':'auction-previous';
      const label=document.createElement('span');label.textContent=index===0?'Último lance':'Lance anterior';
      const name=document.createElement('strong');name.textContent=bid.name;
      const city=document.createElement('small');city.className='auction-bid-city';city.textContent=bid.city;
      const value=document.createElement('b');value.textContent=money(bid.amount_cents);
      item.append(label,name,value,city);list.append(item);
    });
    $('auction-empty').hidden=next.bids.length>0;
    const revision=next.round_id+':'+(next.bids[0]?.id||0);
    if(previous!==null&&revision!==previous){
      root.classList.remove('auction-new-bid');void root.offsetWidth;root.classList.add('auction-new-bid');
      $('auction-announcement').textContent=next.bids.length?`Novo lance: ${next.bids[0].name}, ${money(next.amount_cents)}.`:'Leilão reiniciado em R$ 0,00.';
    }
    previous=revision;
  }
  async function refresh(){
    if(loading||document.hidden)return;loading=true;
    try{const response=await fetch('/live/api/auction',{cache:'no-store'});if(!response.ok)throw new Error();render(await response.json());$('auction-connection').textContent='Atualização automática';}
    catch{$('auction-connection').textContent='Não foi possível atualizar. Tentando novamente…';$('auction-open').disabled=true;}
    finally{loading=false;}
  }
  function proposal(){pending={round_id:state.round_id,product_version:state.updated_at,expected_cents:state.amount_cents,request_id:crypto.randomUUID()};$('auction-confirm-value').textContent=money(state.next_amount_cents);}
  $('auction-open').addEventListener('click',()=>{
    if(!state?.enabled)return;proposal();$('auction-submit').disabled=false;$('auction-bid-feedback').textContent='';previousOverflow=document.body.style.overflow;dialog.showModal();document.body.style.overflow='hidden';
  });
  dialog.addEventListener('close',()=>{document.body.style.overflow=previousOverflow;});
  $('auction-dialog-close').addEventListener('click',()=>{if(!busy)dialog.close();});
  dialog.addEventListener('cancel',e=>{if(busy)e.preventDefault();});
  form.addEventListener('submit',async e=>{
    e.preventDefault();if(busy||!pending)return;busy=true;
    const submit=$('auction-submit');submit.disabled=true;$('auction-dialog-close').disabled=true;
    $('auction-bid-feedback').textContent='Registrando seu lance…';
    try{
      const response=await fetch('/live/api/auction/bid',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({...pending,name:$('auction-name').value,phone:$('auction-phone').value,city:$('auction-city').value})});
      const data=await response.json();
      if(!response.ok){if(data.auction){render(data.auction);proposal();}throw new Error(data.error||'Não foi possível registrar o lance.');}
      render(data);form.reset();dialog.close();pending=null;
      $('auction-announcement').textContent='Seu lance foi registrado: '+money(data.bids.find(b=>b.id===data.accepted_id)?.amount_cents||data.amount_cents)+'.';
      $('auction-connection').textContent='Lance registrado com sucesso!';
    }catch(error){$('auction-bid-feedback').textContent=error.message==='Failed to fetch'?'Conexão interrompida. Tente novamente para confirmar o mesmo lance.':error.message;}
    finally{busy=false;submit.disabled=!state?.enabled;$('auction-dialog-close').disabled=false;}
  });
  document.addEventListener('visibilitychange',()=>{if(!document.hidden)refresh();});
  refresh();setInterval(refresh,3000);
})();
