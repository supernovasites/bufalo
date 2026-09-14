const $ = id => document.getElementById(id);
let enabled = true;
function message(text, error = false) { $('feedback').textContent = text; $('feedback').classList.toggle('error', error); }
async function api(path, body) {
  const response = await fetch('/live/api/' + path, { method: body === undefined ? 'GET' : 'POST', headers: body === undefined ? {} : {'Content-Type':'application/json'}, body: body === undefined ? undefined : JSON.stringify(body), cache:'no-store' });
  const data = await response.json();
  if (!response.ok) { if (response.status === 401) showLogin(); throw new Error(data.error || 'Não foi possível concluir. Tente novamente.'); }
  return data;
}
function showLogin() { $('login').hidden = false; $('dashboard').hidden = true; $('content-editor').hidden=true; $('logout').hidden = true; }
function render(data) {
  enabled = data.enabled; $('login').hidden = true; $('dashboard').hidden = false; $('logout').hidden = false;
  $('content-editor').hidden=false;
  if(document.activeElement!==$('daily-coupon'))$('daily-coupon').value=data.coupon||'LIVEBG1609';
  if(document.activeElement!==$('live-date'))$('live-date').value=data.live_date||'16/09';
  if(data.photo_version&&!selectedPhoto){$('photo-preview').src='/live/api/photo?v='+encodeURIComponent(data.photo_version);$('photo-preview').hidden=false;$('photo-empty').hidden=true;}
  $('status').textContent = enabled ? 'Live ativa' : 'Live desativada'; $('status').classList.toggle('off', !enabled);
  $('status-title').textContent = enabled ? 'A manada pode aproveitar.' : 'Convite para o próximo encontro.';
  $('status-description').textContent = enabled ? 'Os visitantes estão vendo os produtos, o cupom e as ofertas da live.' : 'Os visitantes estão vendo o agradecimento e o convite para quarta-feira, às 15h.';
  $('toggle').textContent = enabled ? 'Desativar live' : 'Ativar live';
}
$('login-form').addEventListener('submit', async event => { event.preventDefault(); const button = event.submitter; button.disabled = true; message(''); try { await api('login', {password:$('password').value}); $('password').value = ''; render(await api('state')); } catch(error) { message(error.message, true); } finally { button.disabled = false; } });
$('toggle').addEventListener('click', async () => { $('toggle').disabled = true; message('Salvando alteração…'); try { render(await api('state', {enabled:!enabled})); message(enabled ? 'Live ativada. As ofertas já estão disponíveis.' : 'Live desativada. O convite já está no ar.'); } catch(error) { message(error.message, true); } finally { $('toggle').disabled = false; } });
$('logout').addEventListener('click', async () => { try { await api('logout', {}); showLogin(); message('Você saiu do painel.'); } catch(error) { message(error.message, true); } });
let selectedPhoto=null, objectUrl=null;
$('live-date').addEventListener('input',()=>{const digits=$('live-date').value.replace(/\D/g,'').slice(0,4);$('live-date').value=digits.length>2?digits.slice(0,2)+'/'+digits.slice(2):digits;});
$('content-form').addEventListener('submit',async event=>{event.preventDefault();event.submitter.disabled=true;$('content-feedback').textContent='Salvando…';try{const data=await api('content',{coupon:$('daily-coupon').value,live_date:$('live-date').value});render(data);$('content-feedback').textContent='Cupom e data publicados na live.';}catch(error){$('content-feedback').textContent=error.message;}finally{event.submitter.disabled=false;}});
$('live-photo').addEventListener('change',async()=>{
  selectedPhoto=null;$('upload-photo').disabled=true;$('photo-feedback').textContent='';const file=$('live-photo').files[0];if(!file)return;
  if(!['image/jpeg','image/png','image/webp'].includes(file.type)||file.size>10*1024*1024){$('photo-feedback').textContent='Escolha uma imagem JPG, PNG ou WebP de até 10 MB.';return;}
  $('photo-feedback').textContent='Preparando a foto…';
  try{const bitmap=await createImageBitmap(file);const scale=Math.min(1,1600/Math.max(bitmap.width,bitmap.height));const canvas=document.createElement('canvas');canvas.width=Math.max(1,Math.round(bitmap.width*scale));canvas.height=Math.max(1,Math.round(bitmap.height*scale));const ctx=canvas.getContext('2d');ctx.fillStyle='#ffffff';ctx.fillRect(0,0,canvas.width,canvas.height);ctx.drawImage(bitmap,0,0,canvas.width,canvas.height);bitmap.close();
    for(const quality of [.86,.72,.56,.4]){selectedPhoto=await new Promise(resolve=>canvas.toBlob(resolve,'image/jpeg',quality));if(selectedPhoto&&selectedPhoto.size<=800000)break;}
    if(!selectedPhoto||selectedPhoto.size>800000)throw new Error('Escolha uma foto menor.');
    if(objectUrl)URL.revokeObjectURL(objectUrl);objectUrl=URL.createObjectURL(selectedPhoto);$('photo-preview').src=objectUrl;$('photo-preview').hidden=false;$('photo-empty').hidden=true;$('upload-photo').disabled=false;$('photo-feedback').textContent='Foto pronta. Clique em Publicar foto para atualizar a live.';
  }catch(error){selectedPhoto=null;$('photo-feedback').textContent='Não foi possível preparar esta foto. '+error.message;}
});
$('photo-form').addEventListener('submit',async event=>{event.preventDefault();if(!selectedPhoto)return;$('upload-photo').disabled=true;$('photo-feedback').textContent='Publicando foto…';try{const response=await fetch('/live/api/photo',{method:'POST',headers:{'Content-Type':selectedPhoto.type},body:selectedPhoto});const data=await response.json();if(!response.ok){if(response.status===401)showLogin();throw new Error(data.error||'Não foi possível publicar a foto.');}selectedPhoto=null;$('live-photo').value='';render(data);$('photo-feedback').textContent='Foto publicada no Momento BG.';}catch(error){$('photo-feedback').textContent=error.message;}finally{$('upload-photo').disabled=!selectedPhoto;}});
api('state').then(render).catch(error => { if (!error.message.includes('Entre')) message(error.message, true); });
