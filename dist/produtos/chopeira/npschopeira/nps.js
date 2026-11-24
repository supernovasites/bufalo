(() => {
'use strict';
const form=document.getElementById('nps-form'),photo=document.getElementById('photo'),preview=document.getElementById('photo-preview'),remove=document.getElementById('photo-remove'),photoStatus=document.getElementById('photo-status'),status=document.getElementById('form-status'),submit=document.getElementById('submit');
let prepared=null,processing=false,generation=0,previewUrl=null,id=crypto.randomUUID();
function clearPhoto(){generation++;prepared=null;processing=false;photo.value='';preview.hidden=true;remove.hidden=true;photoStatus.textContent='';if(previewUrl)URL.revokeObjectURL(previewUrl);previewUrl=null;}
remove.addEventListener('click',clearPhoto);
photo.addEventListener('change',async()=>{
 const current=++generation,file=photo.files[0];prepared=null;preview.hidden=true;remove.hidden=!file;
 if(previewUrl)URL.revokeObjectURL(previewUrl);
 if(!file){processing=false;photoStatus.textContent='';return;}
 processing=true;photoStatus.textContent='Preparando foto…';
 try{
  if(!['image/jpeg','image/png','image/webp'].includes(file.type)||file.size>15*1024*1024)throw Error('Escolha uma foto JPG, PNG ou WebP de até 15 MB.');
  const url=URL.createObjectURL(file),img=new Image();
  try{img.src=url;await img.decode();}finally{URL.revokeObjectURL(url);}
  if(current!==generation)return;
  const canvas=document.createElement('canvas'),scale=Math.min(1,1280/Math.max(img.naturalWidth,img.naturalHeight));
  canvas.width=Math.max(1,Math.round(img.naturalWidth*scale));canvas.height=Math.max(1,Math.round(img.naturalHeight*scale));
  const ctx=canvas.getContext('2d');ctx.fillStyle='#fff';ctx.fillRect(0,0,canvas.width,canvas.height);ctx.drawImage(img,0,0,canvas.width,canvas.height);
  let blob;
  for(const quality of [.82,.65,.45,.28]){blob=await new Promise(resolve=>canvas.toBlob(resolve,'image/jpeg',quality));if(blob&&blob.size<=220000)break;}
  if(!blob||blob.size>220000)throw Error('Não foi possível otimizar esta foto. Escolha outra imagem.');
  if(current!==generation)return;
  prepared=blob;previewUrl=URL.createObjectURL(blob);preview.src=previewUrl;preview.hidden=false;photoStatus.textContent='Foto pronta para enviar.';
 }catch(error){if(current===generation){photo.value='';photoStatus.textContent=error.message;remove.hidden=true;}}
 finally{if(current===generation)processing=false;}
});
form.addEventListener('submit',async event=>{
 event.preventDefault();if(!form.reportValidity())return;
 if(processing){status.textContent='Aguarde a preparação da foto.';return;}
 submit.disabled=true;status.className='';status.textContent='Enviando sua avaliação…';
 try{
  const values=new FormData(form),data={id,name:values.get('name'),email:values.get('email'),phone:values.get('phone'),review:values.get('review'),score:Number(values.get('score')),consent:values.get('consent')==='on',website:values.get('website'),device:matchMedia('(max-width: 600px)').matches?'mobile':matchMedia('(max-width: 1024px)').matches?'tablet':'desktop'};
  const body=new FormData();body.set('data',JSON.stringify(data));if(prepared)body.set('photo',prepared,'chopeira.jpg');
  const response=await fetch('/api/chopeira-nps',{method:'POST',body}),result=await response.json();
  if(!response.ok)throw Error(result.error||'Não foi possível enviar. Tente novamente.');
  form.hidden=true;const success=document.getElementById('success');success.hidden=false;success.focus();clearPhoto();
 }catch(error){status.className='error';status.textContent=error.message||'Falha de conexão. Tente novamente.';}
 finally{submit.disabled=false;}
});
})();