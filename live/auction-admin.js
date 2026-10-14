(()=>{
  const $=id=>document.getElementById(id);if(!$('auction-admin'))return;
  let current=null,offset=0,editing=false,working=false;
  const money=cents=>(cents/100).toLocaleString('pt-BR',{style:'currency',currency:'BRL'});
  async function api(path='',body,photo=false){
    const response=await fetch('/live/api/auction'+path,{method:body===undefined?'GET':'POST',cache:'no-store',credentials:'same-origin',headers:body===undefined?{}:{'Content-Type':photo?body.type:'application/json'},body:body===undefined?undefined:photo?body:JSON.stringify(body)});
    const data=await response.json();if(response.status===401)location.replace('/painel/');
    if(!response.ok)throw new Error(data.error||'Não foi possível consultar o leilão.');return data;
  }
  function render(data){
    current=data;
    $('auction-admin-round').textContent='Rodada '+data.round_id+' · '+(data.enabled?'Lances abertos':'Lances pausados');
    $('auction-admin-value').textContent=money(data.amount_cents);
    $('auction-admin-photo-preview').src=data.photo_url;
    if(!editing){$('auction-admin-title').value=data.title;$('auction-admin-description').value=data.description;$('auction-admin-enabled').checked=data.enabled;}
    const rows=$('auction-history');rows.replaceChildren();
    for(const bid of data.history||[]){
      const row=document.createElement('tr');if(bid.id===data.bids[0]?.id)row.className='auction-history-latest';
      const date=new Date(bid.created_at).toLocaleString('pt-BR',{timeZone:'America/Fortaleza'});
      for(const value of [bid.id,bid.round_id,bid.product_title,bid.name,bid.phone,bid.city,money(bid.amount_cents),date]){const cell=document.createElement('td');cell.textContent=value;row.append(cell);}rows.append(row);
    }
    const total=data.total||0;
    $('auction-history-count').textContent=total?`${offset+1}–${Math.min(offset+100,total)} de ${total} lances · todas as rodadas`:'Nenhum lance registrado.';
    $('auction-history-prev').disabled=offset===0;$('auction-history-next').disabled=offset+100>=total;
  }
  async function load(){try{render(await api('/admin?offset='+offset));}catch(error){$('auction-admin-feedback').textContent=error.message;}}
  $('auction-config-form').addEventListener('input',()=>editing=true);
  $('auction-config-form').addEventListener('submit',async e=>{
    e.preventDefault();if(working)return;working=true;$('auction-admin-save').disabled=true;
    try{await api('/admin',{title:$('auction-admin-title').value,description:$('auction-admin-description').value,enabled:$('auction-admin-enabled').checked});editing=false;await load();$('auction-admin-feedback').textContent='Produto e status do leilão publicados.';}
    catch(error){$('auction-admin-feedback').textContent=error.message;}
    finally{working=false;$('auction-admin-save').disabled=false;}
  });
  $('auction-admin-photo').addEventListener('change',async e=>{
    const file=e.target.files[0];if(!file)return;
    $('auction-admin-photo').disabled=true;
    try{
      if(!['image/jpeg','image/png','image/webp'].includes(file.type)||file.size>15000000)throw new Error('Selecione JPG, PNG ou WebP de até 15 MB.');
      const image=await createImageBitmap(file),canvas=document.createElement('canvas');
      const ratio=Math.min(1,1400/Math.max(image.width,image.height));canvas.width=Math.round(image.width*ratio);canvas.height=Math.round(image.height*ratio);
      const context=canvas.getContext('2d');context.fillStyle='#fff';context.fillRect(0,0,canvas.width,canvas.height);context.drawImage(image,0,0,canvas.width,canvas.height);image.close();
      let blob;for(const quality of [.88,.72,.55]){blob=await new Promise(resolve=>canvas.toBlob(resolve,'image/jpeg',quality));if(blob&&blob.size<=800000)break;}
      if(!blob||blob.size>800000)throw new Error('A foto é muito grande. Escolha uma imagem menor.');
      const data=await api('/photo',blob,true);$('auction-admin-photo-preview').src=data.photo_url;
      $('auction-admin-feedback').textContent='Foto do produto publicada.';
    }catch(error){$('auction-admin-feedback').textContent=error.message;}
    finally{$('auction-admin-photo').disabled=false;e.target.value='';}
  });
  $('auction-admin-reset').addEventListener('click',async()=>{
    if(!current||working||!confirm('Reiniciar o leilão em R$ 0,00 e pausar os lances? O histórico será preservado.'))return;
    working=true;$('auction-admin-reset').disabled=true;
    try{await api('/reset',{round_id:current.round_id});offset=0;editing=false;await load();$('auction-admin-feedback').textContent='Leilão reiniciado em R$ 0,00. Marque “Receber lances” e salve para abrir a nova rodada.';}
    catch(error){$('auction-admin-feedback').textContent=error.message;}
    finally{working=false;$('auction-admin-reset').disabled=false;}
  });
  $('auction-history-prev').addEventListener('click',()=>{offset=Math.max(0,offset-100);load();});
  $('auction-history-next').addEventListener('click',()=>{offset+=100;load();});
  $('auction-admin-refresh').addEventListener('click',load);
  load();setInterval(()=>{if(!document.hidden&&!working)load();},5000);
})();
