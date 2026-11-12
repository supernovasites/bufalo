(() => {
  'use strict';
  const id=crypto.randomUUID();
  const dialog=document.createElement('dialog');
  dialog.className='negotiation-dialog';
  dialog.setAttribute('aria-labelledby','negotiation-title');
  dialog.innerHTML=`<button type="button" class="negotiation-close" aria-label="Fechar pesquisa">×</button><p class="negotiation-eyebrow">UMA PROPOSTA PARA VOCÊ</p><h2 id="negotiation-title">Vamos negociar?</h2><p>Responda a uma pesquisa rápida e deixe seu contato para receber uma nova proposta.</p><form><fieldset><legend>O que impediu você de concluir a compra?</legend><p>Você pode marcar mais de uma opção.</p><label class="negotiation-option"><input type="checkbox" name="reason" value="produto-caro"> Preço do produto alto</label><label class="negotiation-option"><input type="checkbox" name="reason" value="frete-caro"> Frete caro</label><label class="negotiation-option"><input type="checkbox" name="reason" value="prazo-longo"> Prazo de entrega longo</label><label class="negotiation-option"><input type="checkbox" name="reason" value="outro"> Outro motivo</label><label class="negotiation-other" hidden>Conte para a gente<textarea name="other" maxlength="500" rows="2"></textarea></label></fieldset><label>Seu nome<input name="name" autocomplete="name" required minlength="2" maxlength="100"></label><label>WhatsApp com DDD<input name="phone" type="tel" inputmode="tel" autocomplete="tel" placeholder="(91) 99999-9999" required maxlength="22"></label><label class="negotiation-trap" aria-hidden="true">Site<input name="website" tabindex="-1" autocomplete="off"></label><label class="negotiation-option negotiation-consent"><input type="checkbox" name="consent" required> Quero receber uma nova proposta da Búfalo pelo WhatsApp. Meu nome, telefone e respostas serão usados para esse contato.</label><button type="submit" class="negotiation-submit">Quero uma nova proposta</button><p class="negotiation-status" role="status" aria-live="polite"></p></form>`;
  const messages=['O Frete está caro?','O Prazo está longo?','O Preço está alto?'];
  let messageIndex=0;
  const trigger=document.createElement('button');trigger.type='button';trigger.className='negotiation-trigger';trigger.textContent=messages[messageIndex];trigger.hidden=true;
  document.body.append(dialog,trigger);
  let previousFocus;
  function open(){if(dialog.open)return;previousFocus=document.activeElement;dialog.showModal();}
  trigger.addEventListener('click',open);
  dialog.querySelector('.negotiation-close').addEventListener('click',()=>dialog.close());
  dialog.addEventListener('close',()=>previousFocus?.focus());
  dialog.addEventListener('click',event=>{if(event.target===dialog){const r=dialog.getBoundingClientRect();if(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom)dialog.close();}});
  setTimeout(()=>{
    trigger.hidden=false;
    setInterval(()=>{
      if(document.hidden||dialog.open||trigger.hidden)return;
      messageIndex=(messageIndex+1)%messages.length;
      trigger.textContent=messages[messageIndex];
    },4000);
  },60000);
  const form=dialog.querySelector('form'),status=dialog.querySelector('.negotiation-status');
  const other=form.elements.other;
  form.addEventListener('change',()=>{const enabled=form.querySelector('[value="outro"]').checked;other.parentElement.hidden=!enabled;other.required=enabled;});
  form.addEventListener('submit',async event=>{
    event.preventDefault();const data=new FormData(form),reasons=data.getAll('reason');
    if(!reasons.length){status.textContent='Selecione pelo menos um motivo.';return;}
    const phone=String(data.get('phone')).replace(/[\s()+.-]/g,'');
    if(!/^(?:55)?[1-9]{2}9[0-9]{8}$/.test(phone)){status.textContent='Informe um WhatsApp válido com DDD.';form.elements.phone.focus();return;}
    const button=form.querySelector('[type="submit"]');button.disabled=true;status.textContent='Enviando sua resposta…';
    try{
      const response=await fetch('/api/chopeira-survey',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({id,name:data.get('name'),phone,reasons,other:data.get('other'),website:data.get('website'),consent:data.get('consent')==='on',device:innerWidth<768?'mobile':innerWidth<1024?'tablet':'desktop'})});
      const result=await response.json();if(!response.ok)throw new Error(result.error||'Não foi possível salvar. Tente novamente.');
      form.replaceChildren();const success=document.createElement('p');success.setAttribute('role','status');success.textContent='Resposta recebida! Nossa equipe poderá entrar em contato pelo WhatsApp com uma nova proposta.';form.append(success);trigger.hidden=true;
    }catch(error){status.textContent=error.message;button.disabled=false;}
  });
})();
