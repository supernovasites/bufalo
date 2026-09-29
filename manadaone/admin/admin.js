const ownLogin=document.getElementById("login-form");if(ownLogin)ownLogin.remove();const ownLoginPanel=document.getElementById("login");if(ownLoginPanel)ownLoginPanel.hidden=true;
const $ = id => document.getElementById(id);
let enabled = true;
function message(text, error = false) { $('feedback').textContent = text; $('feedback').classList.toggle('error', error); }
async function api(path, body) {
  const response = await fetch('/manadaone/api/' + path, { method: body === undefined ? 'GET' : 'POST', headers: body === undefined ? {} : {'Content-Type':'application/json'}, body: body === undefined ? undefined : JSON.stringify(body), cache:'no-store' });
  const data = await response.json();
  if (!response.ok) { if (response.status === 401) showLogin(); throw new Error(data.error || 'Não foi possível concluir. Tente novamente.'); }
  return data;
}
function syncPanelReturn() {
  const login = $('login');
  let link = document.querySelector('.panel-return-direct');
  document.querySelector('.back-link')?.remove();
  if (!link) { link = document.createElement('a'); link.className = 'panel-return-direct'; link.href = '/painel/'; link.textContent = 'Voltar ao Painel'; document.body.append(link); }
  link.hidden = !login || !login.hidden;
  if (!document.getElementById('panel-return-style')) { const style = document.createElement('style'); style.id = 'panel-return-style'; style.textContent = '.panel-return-direct{position:fixed;left:20px;bottom:20px;z-index:9999;display:inline-flex;align-items:center;padding:12px 16px;border:1px solid #142e32;border-radius:999px;background:#fff;color:#142e32;box-shadow:0 8px 20px #142e3230;text-decoration:none;font-weight:700;opacity:.3;transition:opacity .2s ease}.panel-return-direct:hover,.panel-return-direct:focus-visible{opacity:.95}.panel-return-direct:focus-visible{outline:3px solid #e77939;outline-offset:3px}'; document.head.append(style); }
}
function showLogin() { $('login').hidden = true; $('dashboard').hidden = true; $('logout').hidden = true; syncPanelReturn(); }
function render(data) {
  enabled = data.enabled; $('login').hidden = true; $('dashboard').hidden = false; $('logout').hidden = false;
  $('status').textContent = enabled ? 'Página ativa' : 'Página desativada'; $('status').classList.toggle('off', !enabled);
  $('status-title').textContent = enabled ? 'A Manada One pode receber seus clientes.' : 'Mensagem de reconhecimento ativa.';
  $('status-description').textContent = enabled ? 'Os clientes selecionados estão vendo a página de benefícios e ofertas.' : 'Todos os visitantes estão vendo o agradecimento por pertencer à Manada One.';
  $('toggle').textContent = enabled ? 'Desativar página' : 'Ativar página'; syncPanelReturn();
}
$('login-form')?.addEventListener('submit', async event => { event.preventDefault(); const button = event.submitter; button.disabled = true; message(''); try { await api('login', {password:$('password').value}); $('password').value = ''; render(await api('state')); } catch(error) { message(error.message, true); } finally { button.disabled = false; } });
$('toggle').addEventListener('click', async () => { $('toggle').disabled = true; message('Salvando alteração…'); try { render(await api('state', {enabled:!enabled})); message(enabled ? 'Página ativada. Os benefícios já estão disponíveis.' : 'Página desativada. A mensagem de agradecimento já está no ar.'); } catch(error) { message(error.message, true); } finally { $('toggle').disabled = false; } });
$('logout').addEventListener('click', async () => { try { await api('logout', {}); showLogin(); message('Você saiu do painel.'); } catch(error) { message(error.message, true); } });
showLogin();
api('state').then(render).catch(error => { if (!error.message.includes('Entre')) message(error.message, true); });
