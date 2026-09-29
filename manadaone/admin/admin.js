const $ = id => document.getElementById(id);
let enabled = true;
function message(text, error = false) { $('feedback').textContent = text; $('feedback').classList.toggle('error', error); }
async function api(path, body) {
  const response = await fetch('/manadaone/api/' + path, { method: body === undefined ? 'GET' : 'POST', headers: body === undefined ? {} : {'Content-Type':'application/json'}, body: body === undefined ? undefined : JSON.stringify(body), cache:'no-store' });
  const data = await response.json();
  if (!response.ok) { if (response.status === 401) showLogin(); throw new Error(data.error || 'Não foi possível concluir. Tente novamente.'); }
  return data;
}
function showLogin() { $('login').hidden = false; $('dashboard').hidden = true; $('logout').hidden = true; }
function render(data) {
  enabled = data.enabled; $('login').hidden = true; $('dashboard').hidden = false; $('logout').hidden = false;
  $('status').textContent = enabled ? 'Página ativa' : 'Página desativada'; $('status').classList.toggle('off', !enabled);
  $('status-title').textContent = enabled ? 'A Manada One pode receber seus clientes.' : 'Mensagem de reconhecimento ativa.';
  $('status-description').textContent = enabled ? 'Os clientes selecionados estão vendo a página de benefícios e ofertas.' : 'Todos os visitantes estão vendo o agradecimento por pertencer à Manada One.';
  $('toggle').textContent = enabled ? 'Desativar página' : 'Ativar página';
}
$('login-form').addEventListener('submit', async event => { event.preventDefault(); const button = event.submitter; button.disabled = true; message(''); try { await api('login', {password:$('password').value}); $('password').value = ''; render(await api('state')); } catch(error) { message(error.message, true); } finally { button.disabled = false; } });
$('toggle').addEventListener('click', async () => { $('toggle').disabled = true; message('Salvando alteração…'); try { render(await api('state', {enabled:!enabled})); message(enabled ? 'Página ativada. Os benefícios já estão disponíveis.' : 'Página desativada. A mensagem de agradecimento já está no ar.'); } catch(error) { message(error.message, true); } finally { $('toggle').disabled = false; } });
$('logout').addEventListener('click', async () => { try { await api('logout', {}); showLogin(); message('Você saiu do painel.'); } catch(error) { message(error.message, true); } });
api('state').then(render).catch(error => { if (!error.message.includes('Entre')) message(error.message, true); });