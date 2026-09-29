const $ = id => document.getElementById(id);
let enabled = true;
let selectedPhoto = null;
let objectUrl = null;

function text(id, value) {
  const element = $(id);
  if (element) element.textContent = value;
}

function message(value, error = false) {
  const feedback = $('feedback');
  if (!feedback) return;
  feedback.textContent = value;
  feedback.classList.toggle('error', error);
}

function showLogin() {
  window.location.replace('/painel/');
}

async function api(path, body) {
  const response = await fetch('/live/api/' + path, {
    method: body === undefined ? 'GET' : 'POST',
    headers: body === undefined ? {} : {'Content-Type': 'application/json'},
    body: body === undefined ? undefined : JSON.stringify(body),
    cache: 'no-store',
    credentials: 'same-origin'
  });
  let data = {};
  try { data = await response.json(); } catch {}
  if (!response.ok) {
    if (response.status === 401) showLogin();
    throw new Error(data.error || 'Não foi possível concluir. Tente novamente.');
  }
  return data;
}

function render(data) {
  enabled = Boolean(data.enabled);
  const dashboard = $('dashboard');
  const editor = $('content-editor');
  const logout = $('logout');
  if (dashboard) dashboard.hidden = false;
  if (editor) editor.hidden = false;
  if (logout) logout.hidden = false;

  const coupon = $('daily-coupon');
  const liveDate = $('live-date');
  if (coupon && document.activeElement !== coupon) coupon.value = data.coupon || 'LIVEBG1609';
  if (liveDate && document.activeElement !== liveDate) liveDate.value = data.live_date || '16/09';

  if (data.photo_version && !selectedPhoto) {
    const preview = $('photo-preview');
    const empty = $('photo-empty');
    if (preview) {
      preview.src = '/live/api/photo?v=' + encodeURIComponent(data.photo_version);
      preview.hidden = false;
    }
    if (empty) empty.hidden = true;
  }

  const status = $('status');
  if (status) {
    status.textContent = enabled ? 'Live ativa' : 'Live desativada';
    status.classList.toggle('off', !enabled);
  }
  text('status-title', enabled ? 'A manada pode aproveitar.' : 'Obrigado por participar da nossa live.');
  text('status-description', enabled
    ? 'Os visitantes estão vendo os produtos, o cupom e as ofertas da live.'
    : 'A página pública agradece a presença da manada e convida para o próximo encontro, quarta-feira, às 15h — sem exibir cupom.');
  text('toggle', enabled ? 'Desativar live' : 'Ativar live');
}

$('toggle')?.addEventListener('click', async event => {
  const button = event.currentTarget;
  button.disabled = true;
  message('Salvando alteração…');
  try {
    render(await api('state', {enabled: !enabled}));
    message(enabled
      ? 'Live ativada. As ofertas já estão disponíveis.'
      : 'Live desativada. A mensagem de agradecimento já está no ar.');
  } catch (error) {
    message(error.message, true);
  } finally {
    button.disabled = false;
  }
});

$('logout')?.addEventListener('click', async event => {
  const button = event.currentTarget;
  button.disabled = true;
  try {
    await fetch('/painel/api/logout', {method: 'POST', credentials: 'same-origin', cache: 'no-store'});
  } finally {
    showLogin();
  }
});

$('live-date')?.addEventListener('input', event => {
  const digits = event.currentTarget.value.replace(/\D/g, '').slice(0, 4);
  event.currentTarget.value = digits.length > 2 ? digits.slice(0, 2) + '/' + digits.slice(2) : digits;
});

$('content-form')?.addEventListener('submit', async event => {
  event.preventDefault();
  const button = event.submitter;
  if (button) button.disabled = true;
  text('content-feedback', 'Salvando…');
  try {
    const data = await api('content', {
      coupon: $('daily-coupon')?.value || '',
      live_date: $('live-date')?.value || ''
    });
    render(data);
    text('content-feedback', 'Cupom e data publicados na live.');
  } catch (error) {
    text('content-feedback', error.message);
  } finally {
    if (button) button.disabled = false;
  }
});

$('live-photo')?.addEventListener('change', async event => {
  selectedPhoto = null;
  const upload = $('upload-photo');
  if (upload) upload.disabled = true;
  text('photo-feedback', '');
  const file = event.currentTarget.files?.[0];
  if (!file) return;
  if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type) || file.size > 10 * 1024 * 1024) {
    text('photo-feedback', 'Escolha uma imagem JPG, PNG ou WebP de até 10 MB.');
    return;
  }
  text('photo-feedback', 'Preparando a foto…');
  try {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, 1600 / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.round(bitmap.width * scale));
    canvas.height = Math.max(1, Math.round(bitmap.height * scale));
    const context = canvas.getContext('2d');
    context.fillStyle = '#ffffff';
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    bitmap.close();

    for (const quality of [.86, .72, .56, .4]) {
      selectedPhoto = await new Promise(resolve => canvas.toBlob(resolve, 'image/jpeg', quality));
      if (selectedPhoto && selectedPhoto.size <= 800000) break;
    }
    if (!selectedPhoto || selectedPhoto.size > 800000) throw new Error('Escolha uma foto menor.');

    if (objectUrl) URL.revokeObjectURL(objectUrl);
    objectUrl = URL.createObjectURL(selectedPhoto);
    const preview = $('photo-preview');
    const empty = $('photo-empty');
    if (preview) {
      preview.src = objectUrl;
      preview.hidden = false;
    }
    if (empty) empty.hidden = true;
    if (upload) upload.disabled = false;
    text('photo-feedback', 'Foto pronta. Clique em Publicar foto para atualizar a live.');
  } catch (error) {
    selectedPhoto = null;
    text('photo-feedback', 'Não foi possível preparar esta foto. ' + error.message);
  }
});

$('photo-form')?.addEventListener('submit', async event => {
  event.preventDefault();
  if (!selectedPhoto) return;
  const upload = $('upload-photo');
  if (upload) upload.disabled = true;
  text('photo-feedback', 'Publicando foto…');
  try {
    const response = await fetch('/live/api/photo', {
      method: 'POST',
      headers: {'Content-Type': selectedPhoto.type},
      body: selectedPhoto,
      credentials: 'same-origin'
    });
    let data = {};
    try { data = await response.json(); } catch {}
    if (!response.ok) {
      if (response.status === 401) showLogin();
      throw new Error(data.error || 'Não foi possível publicar a foto.');
    }
    selectedPhoto = null;
    const input = $('live-photo');
    if (input) input.value = '';
    render(data);
    text('photo-feedback', 'Foto publicada no Momento BG.');
  } catch (error) {
    text('photo-feedback', error.message);
  } finally {
    if (upload) upload.disabled = !selectedPhoto;
  }
});

api('state').then(render).catch(error => {
  if (!error.message.includes('Entre')) message(error.message, true);
});
