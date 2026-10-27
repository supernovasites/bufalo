const $ = id => document.getElementById(id);
function message(text,error=false){$('feedback').textContent=text;$('feedback').classList.toggle('error',error);}
function showLogin(){ $('login').hidden=false; $('dashboard').hidden=true; $('logout').hidden=true; }
function showDashboard(){ $('login').hidden=true; $('dashboard').hidden=false; $('logout').hidden=false; loadCampaigns(); }
async function api(path,body){const response=await fetch('/painel/api/'+path,{method:body===undefined?'GET':'POST',headers:body===undefined?{}:{'Content-Type':'application/json'},body:body===undefined?undefined:JSON.stringify(body),cache:'no-store'});const data=await response.json();if(!response.ok)throw new Error(data.error||'Não foi possível concluir. Tente novamente.');return data;}
$('login-form').addEventListener('submit',async event=>{event.preventDefault();const button=event.submitter;button.disabled=true;message('Validando acesso…');try{await api('login',{username:$('username').value,password:$('password').value});$('password').value='';showDashboard();message('Login ativo nos painéis administrativos.')}catch(error){message(error.message,true)}finally{button.disabled=false}});
$('logout').addEventListener('click',async()=>{try{await api('logout',{});showLogin();message('Você saiu do painel.')}catch(error){message(error.message,true)}});
const campaignControls=[{slug:'cirio',name:'página do Círio'},{slug:'acaibowl',name:'reserva do Açaí Bowl'}];
const campaignStates=new Map(),pendingCampaigns=new Set();
function renderCampaigns(data){
  for(const control of campaignControls){
    const campaign=data.campaigns.find(item=>item.slug===control.slug);
    const enabled=campaign?.enabled;
    campaignStates.set(control.slug,enabled);
    $(control.slug+'-status').textContent=typeof enabled!=='boolean'?'Não foi possível carregar o status.':enabled?'Página ativa.':'Página desativada. Os visitantes são direcionados à homepage.';
    $(control.slug+'-toggle').textContent=(enabled?'Desativar ':'Reativar ')+control.name;
    $(control.slug+'-toggle').disabled=typeof enabled!=='boolean'||pendingCampaigns.has(control.slug);
  }
}
async function loadCampaigns(){
  for(const control of campaignControls){campaignStates.delete(control.slug);$(control.slug+'-toggle').disabled=true;$(control.slug+'-status').textContent='Carregando status…';}
  try{renderCampaigns(await api('campaigns'))}catch(error){for(const control of campaignControls)$(control.slug+'-status').textContent=error.message;message(error.message,true)}
}
for(const control of campaignControls)$(control.slug+'-toggle').addEventListener('click',async()=>{
  const enabled=campaignStates.get(control.slug);if(typeof enabled!=='boolean'||pendingCampaigns.has(control.slug))return;
  const button=$(control.slug+'-toggle');pendingCampaigns.add(control.slug);button.disabled=true;
  try{renderCampaigns(await api('campaigns',{slug:control.slug,enabled:!enabled}));message(campaignStates.get(control.slug)?'Página reativada.':'Página desativada. Os visitantes serão direcionados à homepage.')}
  catch(error){message(error.message,true)}
  finally{pendingCampaigns.delete(control.slug);button.disabled=typeof campaignStates.get(control.slug)!=='boolean'}
});
showLogin();
api('session').then(data=>{if(data.authenticated){showDashboard();message('Login ativo nos painéis administrativos.')}}).catch(()=>showLogin());
