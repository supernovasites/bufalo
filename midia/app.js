const $=id=>document.getElementById(id),e=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const size=n=>n>=1000000?(n/1000000).toLocaleString('pt-BR',{maximumFractionDigits:1})+' MB':Math.ceil(n/1000)+' KB';
let files=[],page=1,pages=0,generation=0,pendingDelete=null,uploading=false,loading=false;
function feedback(text,error=false){$('feedback').textContent=text;$('feedback').classList.toggle('error',error);}
async function api(path,options={}){
  const response=await fetch('/midia/api/'+path,{cache:'no-store',...options});
  if(response.status===401){location.assign('/painel/');throw new Error('Entre novamente pelo painel.');}
  let data;try{data=await response.json();}catch{throw new Error('Não foi possível acessar a biblioteca. Tente novamente.');}
  if(!response.ok)throw new Error(data.error||'Não foi possível concluir.');return data;
}
function mutate(id,action){return api(`files/${id}/${action}`,{method:'POST',headers:{'Content-Type':'application/json'},body:'{}'});}
function buttons(){$('previous-page').disabled=loading||page<=1;$('next-page').disabled=loading||page>=pages;$('refresh-files').disabled=loading;$('upload-button').disabled=uploading;$('media-files').disabled=uploading;}
async function refresh(){
  const version=++generation;loading=true;buttons();$('media-grid').setAttribute('aria-busy','true');
  try{const data=await api('files?'+new URLSearchParams({page:String(page),search:$('search').value.trim(),kind:$('kind').value,trash:$('folder').value==='trash'?'1':'0'}));
    if(version!==generation)return;
    if(page>1&&page>data.pages){page=Math.max(1,data.pages);return refresh();}
    files=data.files;pages=data.pages;
    const trash=$('folder').value==='trash';$('trash-note').hidden=!trash;$('library-title').textContent=trash?'Arquivos na lixeira.':'Arquivos disponíveis.';
    $('media-stats').textContent=`${data.stats.active} ${data.stats.active===1?'arquivo disponível':'arquivos disponíveis'} · ${size(data.stats.bytes)} de ${size(data.capacity)} utilizados, incluindo a lixeira.`;
    $('page-info').textContent=`${data.matched} ${data.matched===1?'arquivo encontrado':'arquivos encontrados'} · Página ${page} de ${Math.max(1,pages)}`;
    $('media-grid').innerHTML=files.length?files.map(f=>`<article class="media-card"><div class="media-preview">${f.content_type.startsWith('image/')&&!trash?`<img src="${e(f.url)}" alt="${e(f.name)}" loading="lazy">`:`<span class="file-kind">${trash?'NA LIXEIRA':e(f.extension.toUpperCase())}</span>`}</div><div class="media-card-body"><h3>${e(f.name)}</h3><p class="note">${e(f.extension.toUpperCase())} · ${size(f.size)} · ${new Date(f.created_at).toLocaleDateString('pt-BR',{timeZone:'America/Belem'})}</p><label class="link-label" for="link-${f.id}">Link público${trash?' (indisponível)':''}</label><input class="file-link" id="link-${f.id}" value="${e(f.url)}" readonly><div class="controls">${trash?`<button type="button" class="btn light" data-action="restore" data-id="${f.id}">Restaurar</button>`:`<button type="button" class="btn" data-action="copy" data-id="${f.id}">Copiar link</button><a class="btn light" href="${e(f.url)}" target="_blank" rel="noopener noreferrer">${f.extension==='pdf'?'Baixar PDF':'Abrir'}</a><button type="button" class="text-button delete-button" data-action="delete" data-id="${f.id}">Excluir</button>`}</div></div></article>`).join(''):`<div class="empty-state"><h3>${trash?'A lixeira está vazia.':'Nenhum arquivo encontrado.'}</h3><p>${trash?'Arquivos excluídos aparecerão aqui para restauração.':'Envie seus arquivos acima ou ajuste os filtros da busca.'}</p></div>`;
  }catch(error){if(version===generation)feedback(error.message,true);}finally{if(version===generation){loading=false;$('media-grid').setAttribute('aria-busy','false');buttons();}}
}
async function optimized(file){
  if(file.size>15000000)throw new Error('Escolha um arquivo de até 15 MB antes da otimização.');
  let type=file.type;
  if(!type){const ext=file.name.split('.').pop().toLowerCase();type={jpg:'image/jpeg',jpeg:'image/jpeg',png:'image/png',webp:'image/webp',gif:'image/gif',pdf:'application/pdf'}[ext];}
  if(!['image/jpeg','image/png','image/webp','image/gif','application/pdf'].includes(type))throw new Error('Formato não permitido. Use JPG, PNG, WebP, GIF ou PDF.');
  if(['image/jpeg','image/png','image/webp'].includes(type)){
    let bitmap;try{bitmap=await createImageBitmap(file);}catch{throw new Error('Não foi possível ler esta imagem.');}
    try{
      if(bitmap.width*bitmap.height>40000000)throw new Error('Imagem muito grande. Use uma imagem com até 40 megapixels.');
      const scale=Math.min(1,1600/Math.max(bitmap.width,bitmap.height)),canvas=document.createElement('canvas');canvas.width=Math.max(1,Math.round(bitmap.width*scale));canvas.height=Math.max(1,Math.round(bitmap.height*scale));canvas.getContext('2d').drawImage(bitmap,0,0,canvas.width,canvas.height);
      const outputType=type==='image/jpeg'?'image/jpeg':'image/webp';
      for(const quality of [.9,.8,.68,.54,.4]){const blob=await new Promise(resolve=>canvas.toBlob(resolve,outputType,quality));if(blob&&blob.size<=1500000)return blob;}
      throw new Error('A imagem continua acima de 1,5 MB. Reduza as dimensões e tente novamente.');
    }finally{bitmap.close();}
  }
  if(file.size>1500000)throw new Error('GIFs e PDFs devem ter até 1,5 MB.');return new Blob([file],{type});
}
$('upload-form').addEventListener('submit',async event=>{
  event.preventDefault();if(uploading)return;const selected=[...$('media-files').files];if(!selected.length)return;if(selected.length>10){feedback('Selecione até 10 arquivos por envio.',true);return;}
  uploading=true;buttons();$('upload-results').replaceChildren();let done=0;
  for(const [index,file] of selected.entries()){const item=document.createElement('li');$('upload-results').append(item);$('upload-progress').textContent=`Processando ${index+1} de ${selected.length}: ${file.name}`;
    try{const blob=await optimized(file),data=await api('upload',{method:'POST',headers:{'Content-Type':blob.type,'X-File-Name':encodeURIComponent(file.name)},body:blob});item.textContent=`${data.file.name} · enviado · ${size(data.file.size)}`;item.className='upload-success';done++;}
    catch(error){item.textContent=`${file.name}: ${error.message}`;item.className='error';}
  }
  $('upload-progress').textContent=`${done} de ${selected.length} arquivos enviados.`;uploading=false;buttons();if(done){$('folder').value='active';$('search').value='';$('kind').value='';page=1;await refresh();}$('media-files').value='';if(done<selected.length)$('upload-progress').textContent+=' Selecione novamente apenas os arquivos com erro.';
});
$('filter-form').addEventListener('submit',event=>{event.preventDefault();page=1;refresh();});
for(const id of ['kind','folder'])$(id).addEventListener('change',()=>{page=1;refresh();});
$('refresh-files').addEventListener('click',refresh);
$('previous-page').addEventListener('click',()=>{if(page>1){page--;refresh();}});$('next-page').addEventListener('click',()=>{if(page<pages){page++;refresh();}});
$('media-grid').addEventListener('click',async event=>{
  const button=event.target.closest('[data-action]');if(!button)return;const file=files.find(f=>f.id===button.dataset.id);if(!file)return;
  if(button.dataset.action==='delete'){pendingDelete=file;$('delete-name').textContent=file.name;$('delete-dialog').showModal();return;}
  button.disabled=true;
  try{if(button.dataset.action==='copy'){try{await navigator.clipboard.writeText(file.url);feedback('Link copiado. Cole no site ou no campo de imagem do email marketing.');}catch{const input=$('link-'+file.id);input.focus();input.select();feedback('Selecionei o link. Use Ctrl+C ou a opção Copiar do seu dispositivo.');}}
    else if(button.dataset.action==='restore'){await mutate(file.id,'restore');await refresh();feedback('Arquivo restaurado. O mesmo link público voltou a funcionar.');}
  }catch(error){feedback(error.message,true);}finally{button.disabled=false;}
});
$('cancel-delete').addEventListener('click',()=>$('delete-dialog').close());
$('delete-form').addEventListener('submit',async event=>{event.preventDefault();if(!pendingDelete)return;$('confirm-delete').disabled=true;try{await mutate(pendingDelete.id,'delete');$('delete-dialog').close();pendingDelete=null;await refresh();feedback('Arquivo movido para a lixeira. O link público está indisponível.');}catch(error){feedback(error.message,true);}finally{$('confirm-delete').disabled=false;}});
refresh();
