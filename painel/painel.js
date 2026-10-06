const $ = id => document.getElementById(id);
function message(text,error=false){$('feedback').textContent=text;$('feedback').classList.toggle('error',error);}
function showLogin(){ $('login').hidden=false; $('dashboard').hidden=true; $('logout').hidden=true; }
function showDashboard(){ $('login').hidden=true; $('dashboard').hidden=false; $('logout').hidden=false; loadCampaigns(); }
async function api(path,body){const response=await fetch('/painel/api/'+path,{method:body===undefined?'GET':'POST',headers:body===undefined?{}:{'Content-Type':'application/json'},body:body===undefined?undefined:JSON.stringify(body),cache:'no-store'});const data=await response.json();if(!response.ok)throw new Error(data.error||'Não foi possível concluir. Tente novamente.');return data;}
$('login-form').addEventListener('submit',async event=>{event.preventDefault();const button=event.submitter;button.disabled=true;message('Validando acesso…');try{await api('login',{password:$('password').value});$('password').value='';showDashboard();message('Login ativo nos painéis administrativos.')}catch(error){message(error.message,true)}finally{button.disabled=false}});
$('logout').addEventListener('click',async()=>{try{await api('logout',{});showLogin();message('Você saiu do painel.')}catch(error){message(error.message,true)}});
let cirioEnabled;
function renderCampaigns(data){const campaign=data.campaigns.find(item=>item.slug==='cirio');cirioEnabled=campaign.enabled;$('cirio-status').textContent=cirioEnabled?'Página ativa.':'Página desativada. Os visitantes são direcionados à homepage.';$('cirio-toggle').textContent=cirioEnabled?'Desativar página do Círio':'Reativar página do Círio';$('cirio-toggle').disabled=false;}
async function loadCampaigns(){cirioEnabled=undefined;$('cirio-toggle').disabled=true;$('cirio-status').textContent='Carregando status…';try{renderCampaigns(await api('campaigns'))}catch(error){$('cirio-status').textContent=error.message;message(error.message,true)}}
$('cirio-toggle').addEventListener('click',async()=>{if(typeof cirioEnabled!=='boolean')return;const button=$('cirio-toggle');button.disabled=true;try{renderCampaigns(await api('campaigns',{slug:'cirio',enabled:!cirioEnabled}));message(cirioEnabled?'Página do Círio reativada.':'Página do Círio desativada. Os visitantes serão direcionados à homepage.')}catch(error){message(error.message,true)}finally{button.disabled=typeof cirioEnabled!=='boolean'}});
showLogin();
api('session').then(data=>{if(data.authenticated){showDashboard();message('Login ativo nos painéis administrativos.')}}).catch(()=>showLogin());
