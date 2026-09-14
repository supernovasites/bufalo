(() => {
 const container=document.getElementById('gallery-slots');if(!container)return;
 const slots=[];
 for(let slot=1;slot<=5;slot++){
  const form=document.createElement('form');form.className='gallery-slot';
  form.innerHTML=`<h3>Foto ${slot}</h3><img alt="Prévia da foto ${slot}" hidden><div class="gallery-empty">Sem foto</div><label class="sr" for="gallery-file-${slot}">Escolher foto ${slot}</label><input id="gallery-file-${slot}" type="file" accept="image/jpeg,image/png,image/webp"><button type="submit" class="btn" disabled>Publicar foto ${slot}</button><p class="slot-feedback" role="status" aria-live="polite"></p>`;
  const input=form.querySelector('input'),img=form.querySelector('img'),empty=form.querySelector('.gallery-empty'),button=form.querySelector('button'),feedback=form.querySelector('p');let blob=null,url=null,revision=0,busy=false;
  slots.push({slot,render(version){if(!blob&&!busy&&version){img.src='/live/api/gallery/'+slot+'?v='+encodeURIComponent(version);img.hidden=false;empty.hidden=true;}}});
  input.addEventListener('change',async()=>{const id=++revision;blob=null;button.disabled=true;const file=input.files[0];feedback.textContent='';if(!file)return;if(!['image/jpeg','image/png','image/webp'].includes(file.type)||file.size>10*1024*1024){feedback.textContent='Use JPG, PNG ou WebP de até 10 MB.';return;}feedback.textContent='Preparando…';
   try{const bitmap=await createImageBitmap(file);const canvas=document.createElement('canvas');const size=Math.min(1200,bitmap.width,bitmap.height);canvas.width=size;canvas.height=size;const ctx=canvas.getContext('2d');ctx.fillStyle='#fff';ctx.fillRect(0,0,size,size);const side=Math.min(bitmap.width,bitmap.height);ctx.drawImage(bitmap,(bitmap.width-side)/2,(bitmap.height-side)/2,side,side,0,0,size,size);bitmap.close();let prepared;
    for(const quality of [.86,.72,.56,.4]){prepared=await new Promise(resolve=>canvas.toBlob(resolve,'image/jpeg',quality));if(prepared&&prepared.size<=800000)break;}
    if(id!==revision)return;if(!prepared||prepared.size>800000)throw new Error('Escolha uma imagem menor.');blob=prepared;if(url)URL.revokeObjectURL(url);url=URL.createObjectURL(blob);img.src=url;img.hidden=false;empty.hidden=true;button.disabled=false;feedback.textContent='Confira o recorte quadrado e publique.';
   }catch(error){if(id===revision)feedback.textContent='Não foi possível preparar a foto. '+error.message;}
  });
  form.addEventListener('submit',async event=>{event.preventDefault();if(!blob||busy)return;busy=true;button.disabled=true;input.disabled=true;feedback.textContent='Publicando…';try{const response=await fetch('/live/api/gallery/'+slot,{method:'POST',headers:{'Content-Type':blob.type},body:blob});const data=await response.json();if(!response.ok)throw new Error(data.error||'Erro ao publicar.');blob=null;input.value='';busy=false;window.dispatchEvent(new CustomEvent('live-gallery-state',{detail:data.gallery}));feedback.textContent='Foto '+slot+' publicada.';}catch(error){feedback.textContent=error.message;}finally{busy=false;input.disabled=false;button.disabled=!blob;}});
  container.append(form);
 }
 window.addEventListener('live-gallery-state',event=>{for(const slot of slots)slot.render(event.detail?.find(p=>p.slot===slot.slot)?.photo_version);});
 if(window.liveGalleryState)window.dispatchEvent(new CustomEvent('live-gallery-state',{detail:window.liveGalleryState}));
})();
