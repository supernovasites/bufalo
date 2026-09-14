const $ = id => document.getElementById(id);
let enabled = true;
function message(text, error = false) { $('feedback').textContent = text; $('feedback').classList.toggle('error', error); }
async function api(path, body) {
  const response = await fetch('/live/api/' + path, { method: body === undefined ? 'GET' : 'POST', headers: body === undefined ? {} : {'Content-Type':'application/json'}, body: body === undefined ? undefined : JSON.stringify(body), cache:'no-store' });
  const data = await response.json();
  if (!response.ok) { if (response.status === 401) showLogin(); throw new Error(data.error || 'Não foi possível concluir. Tente novamente.'); }
  return data;
}
function showLogin() { $('login').hidden = false; $('dashboard').hidden = true; $('logout').hidden = true; }
function render(data) {
  enabled = data.enabled; $('login').hidden = true; $('dashboard').hidden = false; $('logout').hidden = false;
  $('status').textContent = enabled ? 'Live ativa' : 'Live desativada'; $('status').classList.toggle('off', !enabled);
  $('status-title').textContent = enabled ? 'A manada pode aproveitar.' : 'Convite para o próximo encontro.';
  $('status-description').textContent = enabled ? 'Os visitantes estão vendo os produtos, o cupom e as ofertas da live.' : 'Os visitantes estão vendo o agradecimento e o convite para quarta-feira, às 15h.';
  $('toggle').textContent = enabled ? 'Desativar live' : 'Ativar live';
}
$('login-form').addEventListener('submit', async event => { event.preventDefault(); const button = event.submitter; button.disabled = true; message(''); try { await api('login', {password:$('password').value}); $('password').value = ''; render(await api('state')); } catch(error) { message(error.message, true); } finally { button.disabled = false; } });
$('toggle').addEventListener('click', async () => { $('toggle').disabled = true; message('Salvando alteração…'); try { render(await api('state', {enabled:!enabled})); message(enabled ? 'Live ativada. As ofertas já estão disponíveis.' : 'Live desativada. O convite já está no ar.'); } catch(error) { message(error.message, true); } finally { $('toggle').disabled = false; } });
$('logout').addEventListener('click', async () => { try { await api('logout', {}); showLogin(); message('Você saiu do painel.'); } catch(error) { message(error.message, true); } });
api('state').then(render).catch(error => { if (!error.message.includes('Entre')) message(error.message, true); });
