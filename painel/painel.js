const $ = id => document.getElementById(id);
function message(text,error=false){$('feedback').textContent=text;$('feedback').classList.toggle('error',error);}
function showLogin(){ $('login').hidden=false; $('dashboard').hidden=true; $('logout').hidden=true; }
function showDashboard(){ $('login').hidden=true; $('dashboard').hidden=false; $('logout').hidden=false; }
async function api(path,body){const response=await fetch('/painel/api/'+path,{method:body===undefined?'GET':'POST',headers:body===undefined?{}:{'Content-Type':'application/json'},body:body===undefined?undefined:JSON.stringify(body),cache:'no-store'});const data=await response.json();if(!response.ok)throw new Error(data.error||'Não foi possível concluir. Tente novamente.');return data;}
$('login-form').addEventListener('submit',async event=>{event.preventDefault();const button=event.submitter;button.disabled=true;message('Validando acesso…');try{await api('login',{password:$('password').value});$('password').value='';showDashboard();message('Login ativo nos dois painéis administrativos.')}catch(error){message(error.message,true)}finally{button.disabled=false}});
$('logout').addEventListener('click',async()=>{try{await api('logout',{});api('session').then(data=>data.authenticated?showDashboard():showLogin()).catch(()=>showLogin());message('Você saiu do painel.')}catch(error){message(error.message,true)}});
showLogin();

const addBlogPanelCard=()=>{const dashboard=$("dashboard");if(!dashboard||dashboard.querySelector('[data-panel-blog]'))return;const card=document.createElement('article');card.className='card';card.dataset.panelBlog='';card.innerHTML='<div class="eyebrow">CONTEÚDO E HISTÓRIAS</div><h2>Blog Búfalo.</h2><p>Crie, revise e publique as histórias da Búfalo para a manada.</p><a class="btn orange" href="/blog/admin/">Abrir painel do Blog ↗</a>';dashboard.append(card)};addBlogPanelCard();new MutationObserver(addBlogPanelCard).observe($("dashboard"),{attributes:true});
