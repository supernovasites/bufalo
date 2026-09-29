const $ = id => document.getElementById(id);
let enabled = true;

function feedback(text, error = false) {
  $('feedback').textContent = text;
  $('feedback').classList.toggle('error', error);
}

async function api(path, payload) {
  const response = await fetch('/manadaone/api/' + path, {
    method: payload === undefined ? 'GET' : 'POST',
    headers: payload === undefined ? {} : {'Content-Type':'application/json'},
    body: payload === undefined ? undefined : JSON.stringify(payload),
    cache: 'no-store'
  });
  const data = await response.json();
  if (!response.ok) {
    if (response.status === 401) showLogin();
    throw new Error(data.error || 'Não foi possível concluir a operação.');
  }
  return data;
}

function showLogin() {
  $('login').hidden = false;
  $('panel').hidden = true;
}

function render(data) {
  enabled = data.enabled;
  $('login').hidden = true;
  $('panel').hidden = false;
  $('status').textContent = enabled ? 'Página ativa' : 'Página desativada';
  $('status').classList.toggle('off', !enabled);
  $('title').textContent = enabled ? 'A Manada One pode receber seus clientes.' : 'A página está em modo de agradecimento.';
  $('description').textContent = enabled
    ? 'Os clientes selecionados estão vendo a página de ofertas e benefícios.'
    : 'Todos os visitantes recebem a mensagem de reconhecimento da Manada One.';
  $('toggle').textContent = enabled ? 'Desativar página' : 'Ativar página';
}

async function load() {
  try { render(await api('state')); }
  catch (error) { showLogin(); feedback(error.message, true); }
}

$('login-form').addEventListener('submit', async event => {
  event.preventDefault();
  feedback('Validando acesso…');
  try {
    await api('login', {password: $('password').value});
    $('password').value = '';
    feedback('');
    render(await api('state'));
  } catch (error) { feedback(error.message, true); }
});

$('toggle').addEventListener('click', async () => {
  $('toggle').disabled = true;
  feedback('Salvando status…');
  try { render(await api('state', {enabled: !enabled})); feedback('Status atualizado para todos os visitantes.'); }
  catch (error) { feedback(error.message, true); }
  finally { $('toggle').disabled = false; }
});

$('logout').addEventListener('click', async () => {
  try { await api('logout', {}); } finally { showLogin(); }
});

load();