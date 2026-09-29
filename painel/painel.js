const $ = id => document.getElementById(id);
function message(text,error=false){$('feedback').textContent=text;$('feedback').classList.toggle('error',error);}
function showLogin(){ $('login').hidden=false; $('dashboard').hidden=true; $('logout').hidden=true; }
function showDashboard(){ $('login').hidden=true; $('dashboard').hidden=false; $('logout').hidden=false; }
async function api(path,body){const response=await fetch('/painel/api/'+path,{method:body===undefined?'GET':'POST',headers:body===undefined?{}:{'Content-Type':'application/json'},body:body===undefined?undefined:JSON.stringify(body),cache:'no-store'});const data=await response.json();if(!response.ok)throw new Error(data.error||'Não foi possível concluir. Tente novamente.');return data;}
$('login-form').addEventListener('submit',async event=>{event.preventDefault();const button=event.submitter;button.disabled=true;message('Validando acesso…');try{await api('login',{password:$('password').value});$('password').value='';showDashboard();message('Login ativo nos painéis administrativos.')}catch(error){message(error.message,true)}finally{button.disabled=false}});
$('logout').addEventListener('click',async()=>{try{await api('logout',{});showLogin();message('Você saiu do painel.')}catch(error){message(error.message,true)}});
showLogin();
api('session').then(data=>{if(data.authenticated){showDashboard();message('Login ativo nos painéis administrativos.')}}).catch(()=>showLogin());
