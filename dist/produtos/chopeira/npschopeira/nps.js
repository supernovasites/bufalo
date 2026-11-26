(() => {
'use strict';
const form=document.getElementById('nps-form'),photo=document.getElementById('photo'),preview=document.getElementById('photo-preview'),remove=document.getElementById('photo-remove'),photoStatus=document.getElementById('photo-status'),status=document.getElementById('form-status'),submit=document.getElementById('submit');
function formatPhone(value) {
 let digits=value.replace(/\D/g,'');
 if(digits.length>11&&digits.startsWith('55'))digits=digits.slice(2);
 digits=digits.slice(0,11);
 if(!digits)return '';
 if(digits.length<3)return '('+digits;
 const ddd='('+digits.slice(0,2)+') ',local=digits.slice(2);
 if(local.length<=4)return ddd+local;
 if(local.length<=8)return ddd+local.slice(0,4)+'-'+local.slice(4);
 return ddd+local[0]+'.'+local.slice(1,5)+'-'+local.slice(5);
}
const phone=form.elements.namedItem('phone');
phone.addEventListener('input',()=>{
 const before=phone.value,position=phone.selectionStart??before.length;
 let digitPosition=before.slice(0,position).replace(/\D/g,'').length;
 if(before.replace(/\D/g,'').length>11&&before.replace(/\D/g,'').startsWith('55'))digitPosition=Math.max(0,digitPosition-2);
 phone.value=formatPhone(before);
 let caret=phone.value.length,count=0;
 if(position<before.length){
  for(let i=0;i<phone.value.length;i++)if(/\d/.test(phone.value[i])&&++count>=digitPosition){caret=i+1;break;}
 }
 phone.setSelectionRange(caret,caret);
});
phone.addEventListener('blur',()=>{phone.value=formatPhone(phone.value);});
let prepared=null,processing=false,generation=0,previewUrl=null,id=crypto.randomUUID();
function clearPhoto(){generation++;prepared=null;processing=false;photo.value='';preview.hidden=true;remove.hidden=true;photoStatus.textContent='';if(previewUrl)URL.revokeObjectURL(previewUrl);previewUrl=null;}
remove.addEventListener('click',()=>{clearPhoto();completed.delete(photoStep);updateProgress();});
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

const contact=form.querySelector('section[aria-labelledby="contact-title"]');
const items=[
 [contact,'Seus dados'],
 [form.querySelector('fieldset'),'Indicação da chopeira'],
 [photo.closest('.field'),'Sua foto'],
 [form.elements.namedItem('improvement').closest('.field'),'Sugestão de melhoria'],
 [form.elements.namedItem('review').closest('.field'),'Sua experiência']
];
const photoStep=items.findIndex(([content])=>content.contains(photo));
const steps=items.map(([content,label],index)=>{
 const step=document.createElement('section');
 step.className='nps-step';step.tabIndex=-1;
 step.setAttribute('aria-label',label);step.dataset.step=String(index);
 const count=document.createElement('p');count.className='step-count';count.textContent='Etapa '+(index+1)+' de '+items.length;
 step.append(count,content);form.insertBefore(step,submit);
 return step;
});
steps[steps.length-1].append(form.querySelector('.consent-final'));
form.noValidate=true;
const nav=document.createElement('div');nav.className='step-navigation';
const back=document.createElement('button');back.type='button';back.className='secondary';back.textContent='Voltar';
const next=document.createElement('button');next.type='button';next.className='submit';next.textContent='Continuar';
nav.append(back,next);form.insertBefore(nav,submit);
const floating=document.createElement('aside');floating.className='nps-progress';floating.setAttribute('aria-label','Progresso do questionário');
const progressLabel=document.createElement('span');progressLabel.className='progress-label';
const progress=document.createElement('progress');progress.max=100;progress.value=70;progress.setAttribute('aria-label','Percentual concluído');
const reward=document.createElement('div');reward.className='progress-reward';reward.setAttribute('aria-label','Meta de 100%: 500 pontos');
reward.innerHTML='<span class="reward-coin" aria-hidden="true">★</span><span><strong>500 pontos</strong></span>';
floating.append(progressLabel,progress,reward);document.body.append(floating);
document.body.classList.add('nps-wizard');
let current=0,sending=false;
const completed=new Set();
function validStep(index,report=false){
 const step=steps[index];
 if(index===photoStep&&processing){if(report)status.textContent='Aguarde a preparação da foto.';return false;}
 for(const input of step.querySelectorAll('input,textarea')){
  input.setCustomValidity('');
  if(input.required&&input.type!=='radio'&&input.type!=='checkbox'&&!input.value.trim())input.setCustomValidity('Preencha este campo para continuar.');
  if(input.name==='phone'){
   const digits=input.value.replace(/\D/g,'');
   if(!/^[1-9]{2}[0-9]{8,9}$/.test(digits))input.setCustomValidity('Informe um telefone válido com DDD.');
  }
  if(!input.checkValidity()){if(report)input.reportValidity();return false;}
 }
 if(index===photoStep&&!prepared){if(report){photo.setCustomValidity('Compartilhe uma foto da sua chopeira para continuar.');photo.reportValidity();}return false;}
 return true;
}
function updateProgress(){
 if(current===steps.length-1){
  if(validStep(current))completed.add(current);else completed.delete(current);
 }
 const percent=70+Math.round(completed.size/steps.length*30);
 progress.value=percent;progressLabel.textContent=percent+'%';
 reward.classList.toggle('is-complete',percent===100);
}
function showStep(index,focus=true){
 current=index;steps.forEach((step,i)=>{step.hidden=i!==index;});
 back.hidden=index===0;next.hidden=index===steps.length-1;submit.hidden=index!==steps.length-1;
 next.textContent='Continuar';
 status.textContent='';status.className='';
 updateProgress();
 if(focus){steps[index].focus({preventScroll:true});steps[index].scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth',block:'start'});}
}
function advance(){
 if(sending||!validStep(current,true))return;
 completed.add(current);
 if(current<steps.length-1)showStep(current+1);
}
next.addEventListener('click',advance);
back.addEventListener('click',()=>{if(!sending&&current>0)showStep(current-1);});
form.addEventListener('input',()=>{
 for(let i=0;i<steps.length;i++)if(completed.has(i)&&!validStep(i))completed.delete(i);
 updateProgress();
});
form.addEventListener('change',event=>{
 if(event.target.name==='score'&&steps[current].contains(event.target))advance();
 if(event.target===photo)next.textContent='Continuar';
 updateProgress();
});
form.addEventListener('keydown',event=>{
 if(event.key==='Enter'&&event.target.tagName==='INPUT'&&!['file','checkbox','radio'].includes(event.target.type)){
  event.preventDefault();if(current<steps.length-1)advance();
 }
});
showStep(0,false);

const sharePanel=document.getElementById('share-panel'),shareCanvas=document.getElementById('share-image'),shareStatus=document.getElementById('share-status'),shareButton=document.getElementById('share-button'),downloadShareButton=document.getElementById('download-share-button');
function wrapCanvasText(ctx,text,maxWidth,maxLines){
 const words=text.split(/\s+/),lines=[];let line='';
 for(const word of words){const candidate=line?line+' '+word:word;if(ctx.measureText(candidate).width>maxWidth&&line){lines.push(line);line=word;}else line=candidate;}
 if(line)lines.push(line);
 if(lines.length>maxLines){lines.length=maxLines;let last=lines[maxLines-1];while(last&&ctx.measureText(last+'…').width>maxWidth)last=last.slice(0,-1);lines[maxLines-1]=last.trimEnd()+'…';}
 return lines;
}
function paintShareImage(name,review,score){
 const ctx=shareCanvas.getContext('2d'),w=1080,h=1350;
 ctx.clearRect(0,0,w,h);
 const gradient=ctx.createLinearGradient(0,0,w,h);gradient.addColorStop(0,'#0d292b');gradient.addColorStop(.55,'#173b39');gradient.addColorStop(1,'#265147');ctx.fillStyle=gradient;ctx.fillRect(0,0,w,h);
 const glow=ctx.createRadialGradient(940,100,20,940,100,540);glow.addColorStop(0,'rgba(211,167,79,.22)');glow.addColorStop(1,'rgba(211,167,79,0)');ctx.fillStyle=glow;ctx.fillRect(400,0,680,600);
 ctx.strokeStyle='rgba(231,196,119,.75)';ctx.lineWidth=3;ctx.strokeRect(38,38,w-76,h-76);
 ctx.fillStyle='#f0cd7c';ctx.font='700 30px Arial, sans-serif';ctx.textAlign='left';ctx.fillText('BÚFALO GROWLER',86,112);
 ctx.fillStyle='#f7f4e8';ctx.font='700 68px Arial, sans-serif';ctx.fillText('Minha experiência',86,235);
 ctx.font='400 38px Arial, sans-serif';ctx.fillStyle='#d5dfd6';ctx.fillText('com a chopeira Búfalo',86,296);
 ctx.fillStyle='rgba(255,255,255,.08)';ctx.beginPath();ctx.roundRect(72,370,936,300,28);ctx.fill();
 ctx.fillStyle='#f0cd7c';ctx.font='700 27px Arial, sans-serif';ctx.fillText('MINHA NOTA',116,430);
 ctx.fillStyle='#fff9e8';ctx.font='700 178px Arial, sans-serif';ctx.fillText(String(score)+'/10',116,610);
 ctx.fillStyle='#f0cd7c';ctx.font='700 32px Arial, sans-serif';ctx.fillText('RECOMENDAÇÃO',690,455);
 ctx.fillStyle='#f7f4e8';ctx.font='600 28px Arial, sans-serif';
 const verdict=score>=9?'Indicaria com certeza':score>=7?'Minha experiência foi boa':'Tenho pontos para sugerir';
 wrapCanvasText(ctx,verdict,270,3).forEach((line,i)=>ctx.fillText(line,690,510+i*42));
 ctx.fillStyle='#f7f4e8';ctx.font='700 30px Arial, sans-serif';ctx.fillText('O QUE EU ACHEI',86,755);
 ctx.fillStyle='rgba(255,255,255,.96)';ctx.beginPath();ctx.roundRect(72,790,936,355,26);ctx.fill();
 const quote=String(review||'').replace(/\s+/g,' ').trim().slice(0,340);
 ctx.fillStyle='#183536';ctx.font='italic 38px Arial, sans-serif';
 wrapCanvasText(ctx,'“'+quote+'”',820,4).forEach((line,i)=>ctx.fillText(line,116,870+i*54));
 const firstName=String(name||'').trim().split(/\s+/)[0]||'Cliente';
 ctx.fillStyle='#647570';ctx.font='700 28px Arial, sans-serif';ctx.fillText('— '+firstName,116,1090);
 ctx.strokeStyle='rgba(231,196,119,.55)';ctx.beginPath();ctx.moveTo(86,1200);ctx.lineTo(994,1200);ctx.stroke();
 ctx.fillStyle='#f0cd7c';ctx.font='700 31px Arial, sans-serif';ctx.fillText('Feito pra ser livre.',86,1260);
 ctx.textAlign='right';ctx.fillStyle='#d5dfd6';ctx.font='400 24px Arial, sans-serif';ctx.fillText('Búfalo On TAP',994,1260);ctx.textAlign='left';
}
function showSharePanel(name,review,score){paintShareImage(name,review,score);sharePanel.hidden=false;}
function shareImageBlob(){return new Promise((resolve,reject)=>shareCanvas.toBlob(blob=>blob?resolve(blob):reject(new Error('Não foi possível preparar a imagem.')),'image/png'));}
downloadShareButton.addEventListener('click',async()=>{
 try{const blob=await shareImageBlob(),url=URL.createObjectURL(blob),link=document.createElement('a');link.href=url;link.download='minha-experiencia-chopeira-bufalo.png';link.click();setTimeout(()=>URL.revokeObjectURL(url),1000);shareStatus.textContent='Imagem baixada. Você já pode publicar nas suas redes.';}
 catch(error){shareStatus.textContent=error.message;}
});
shareButton.addEventListener('click',async()=>{
 try{
  const blob=await shareImageBlob(),file=new File([blob],'minha-experiencia-chopeira-bufalo.png',{type:'image/png'});
  if(navigator.canShare?.({files:[file]})&&navigator.share){await navigator.share({files:[file],title:'Minha experiência com a chopeira Búfalo',text:'Minha experiência com a chopeira Búfalo On TAP.'});shareStatus.textContent='Imagem compartilhada.';}
  else{const url=URL.createObjectURL(blob),link=document.createElement('a');link.href=url;link.download=file.name;link.click();setTimeout(()=>URL.revokeObjectURL(url),1000);shareStatus.textContent='Seu aparelho não oferece compartilhamento de imagens por aqui. A imagem foi baixada para você publicar.';}
 }catch(error){if(error.name!=='AbortError')shareStatus.textContent=error.message||'Não foi possível compartilhar a imagem.';}
});


form.addEventListener('submit',async event=>{
 event.preventDefault();if(sending)return;
 if(current<steps.length-1){advance();return;}
 for(let i=0;i<steps.length;i++)if(!validStep(i)){showStep(i);validStep(i,true);return;}
 if(processing){status.textContent='Aguarde a preparação da foto.';return;}
 sending=true;back.disabled=true;submit.disabled=true;status.className='';status.textContent='Enviando sua avaliação…';
 try{
  const values=new FormData(form),data={id,name:values.get('name'),email:values.get('email'),phone:values.get('phone'),review:values.get('review'),improvement:values.get('improvement'),score:Number(values.get('score')),consent:values.get('consent')==='on',consentVersion:'review-publication-20261124',website:values.get('website'),device:matchMedia('(max-width: 600px)').matches?'mobile':matchMedia('(max-width: 1024px)').matches?'tablet':'desktop'};
  const body=new FormData();body.set('data',JSON.stringify(data));if(prepared)body.set('photo',prepared,'chopeira.jpg');
  const response=await fetch('/api/chopeira-nps',{method:'POST',body}),result=await response.json();
  if(!response.ok)throw Error(result.error||'Não foi possível enviar. Tente novamente.');
  floating.hidden=true;document.body.classList.remove('nps-wizard');form.hidden=true;const success=document.getElementById('success');success.hidden=false;showSharePanel(data.name,data.review,data.score);success.focus();clearPhoto();
 }catch(error){status.className='error';status.textContent=error.message||'Falha de conexão. Tente novamente.';}
 finally{sending=false;back.disabled=false;submit.disabled=false;}
});
})();