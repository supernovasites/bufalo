const form=document.getElementById('reservation-form');
const error=document.getElementById('form-error');
const phone=document.getElementById('telefone');
phone.addEventListener('input',()=>phone.setCustomValidity(''));
form.addEventListener('submit',async event=>{
  event.preventDefault();error.hidden=true;
  const digits=phone.value.replace(/\D/g,'');
  if(!/^\d{10,15}$/.test(digits)){phone.setCustomValidity('Informe um telefone válido com DDD.');phone.reportValidity();return;}
  const button=form.querySelector('button[type=submit]');
  button.disabled=true;button.textContent='Enviando...';
  try{
    const response=await fetch(form.action,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({nome:form.nome.value.trim(),telefone:digits,email:form.email.value.trim(),cidade:form.cidade.value.trim(),website:form.website.value,consent:form.consent.checked}),signal:AbortSignal.timeout(25000)});
    const result=await response.json();
    if(!response.ok||result.ok!==true)throw new Error('Falha no cadastro');
    form.hidden=true;const success=document.getElementById('success');success.hidden=false;success.focus();
  }catch{error.textContent='Não foi possível confirmar sua reserva agora. Tente novamente em instantes. Seus dados continuam preenchidos.';error.hidden=false;}
  finally{button.disabled=false;button.textContent='Reserve agora';}
});

