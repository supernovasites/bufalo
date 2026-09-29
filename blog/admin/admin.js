const $ = id => document.getElementById(id);
const form = $('post-form');
const list = $('admin-posts');
const saveStatus = $('save-status');
const coverFile = $('cover-file');
const coverPreview = $('cover-preview');
let posts = [];

const slugify = value => value.normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '')
  .toLowerCase()
  .replace(/[^a-z0-9]+/g, '-')
  .replace(/^-|-$/g, '')
  .slice(0, 90);

function redirectToLogin() {
  window.location.replace('/painel/');
}

async function request(path, method = 'GET', data) {
  const response = await fetch('/blog/api/' + path, {
    method,
    credentials: 'same-origin',
    cache: 'no-store',
    headers: data ? {'Content-Type': 'application/json'} : {},
    body: data ? JSON.stringify(data) : undefined
  });
  let result = {};
  try { result = await response.json(); } catch {}
  if (!response.ok) {
    if (response.status === 401) redirectToLogin();
    throw new Error(result.error || 'Não foi possível concluir.');
  }
  return result;
}

function showCover(src) {
  if (!coverPreview) return;
  coverPreview.src = src || '';
  coverPreview.classList.toggle('hidden', !src);
}

async function prepareCover(file) {
  if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
    throw new Error('Escolha uma imagem JPG, PNG ou WebP.');
  }
  const bitmap = await createImageBitmap(file);
  try {
    let scale = Math.min(1, 1600 / Math.max(bitmap.width, bitmap.height));
    for (let attempt = 0; attempt < 5; attempt++) {
      const canvas = document.createElement('canvas');
      canvas.width = Math.max(1, Math.round(bitmap.width * scale));
      canvas.height = Math.max(1, Math.round(bitmap.height * scale));
      canvas.getContext('2d').drawImage(bitmap, 0, 0, canvas.width, canvas.height);
      const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/webp', .82 - attempt * .08));
      if (blob && blob.size <= 1400000) return blob;
      scale *= .8;
    }
    throw new Error('A imagem ficou grande demais. Escolha outra imagem.');
  } finally {
    bitmap.close();
  }
}

async function uploadImage(blob) {
  const response = await fetch('/blog/api/admin/images', {
    method: 'POST',
    credentials: 'same-origin',
    headers: {'Content-Type': blob.type},
    body: blob
  });
  let data = {};
  try { data = await response.json(); } catch {}
  if (!response.ok) {
    if (response.status === 401) redirectToLogin();
    throw new Error(data.error || 'Não foi possível enviar a imagem.');
  }
  return data.url;
}

function render() {
  list.replaceChildren();
  posts.sort((a, b) => b.date.localeCompare(a.date));

  for (const post of posts) {
    const item = document.createElement('li');
    const image = document.createElement('img');
    image.className = 'post-thumb';
    image.src = post.image || '';
    image.alt = post.imageAlt || '';
    image.loading = 'lazy';
    if (!post.image) image.classList.add('empty');

    const title = document.createElement('strong');
    title.textContent = post.title;
    const meta = document.createElement('small');
    meta.textContent = (post.status === 'published' ? 'Publicado' : 'Rascunho') + ' · ' + post.date;

    const actions = document.createElement('span');
    actions.className = 'post-actions';
    const edit = document.createElement('button');
    edit.type = 'button';
    edit.textContent = 'Editar';
    edit.addEventListener('click', () => editPost(post));
    const remove = document.createElement('button');
    remove.type = 'button';
    remove.textContent = 'Excluir';
    remove.addEventListener('click', () => deletePost(post));

    actions.append(edit, remove);
    item.append(image, title, meta, actions);
    list.append(item);
  }

  if (!posts.length) list.textContent = 'Nenhum post cadastrado.';
}

function editPost(post) {
  for (const key of ['title', 'category', 'date', 'excerpt', 'image', 'imageAlt', 'body', 'sourceUrl', 'status']) {
    const field = form.elements.namedItem(key);
    if (field) field.value = post[key] ?? '';
  }
  form.elements.id.value = post.slug;
  showCover(post.image);
  $('editor-title').textContent = 'Editar post';
  saveStatus.textContent = '';
  form.scrollIntoView({behavior: 'smooth'});
}

function resetForm() {
  form.reset();
  showCover('');
  form.elements.id.value = '';
  form.elements.date.value = new Date().toISOString().slice(0, 10);
  $('editor-title').textContent = 'Novo post';
  saveStatus.textContent = '';
}

async function load() {
  const data = await request('admin/posts');
  posts = data.posts || [];
  render();
}

async function deletePost(post) {
  if (!confirm('Excluir “' + post.title + '”?')) return;
  saveStatus.textContent = 'Excluindo post…';
  try {
    await request('admin/posts/' + encodeURIComponent(post.slug), 'DELETE');
    await load();
    resetForm();
    saveStatus.textContent = 'Post excluído.';
  } catch (error) {
    saveStatus.textContent = error.message;
  }
}

coverFile?.addEventListener('change', async () => {
  const file = coverFile.files?.[0];
  if (!file) return;
  saveStatus.textContent = 'Preparando imagem…';
  coverFile.disabled = true;
  try {
    const blob = await prepareCover(file);
    saveStatus.textContent = 'Enviando imagem…';
    const url = await uploadImage(blob);
    form.elements.image.value = url;
    showCover(url);
    saveStatus.textContent = 'Imagem pronta para o post.';
  } catch (error) {
    saveStatus.textContent = error.message;
  } finally {
    coverFile.disabled = false;
    coverFile.value = '';
  }
});

form?.addEventListener('submit', async event => {
  event.preventDefault();
  const button = event.submitter;
  if (button) button.disabled = true;
  saveStatus.textContent = 'Salvando…';

  const data = Object.fromEntries(new FormData(form));
  data.slug = data.id || slugify(data.title);
  delete data.id;

  if (!data.slug) {
    saveStatus.textContent = 'Informe um título válido.';
    if (button) button.disabled = false;
    return;
  }
  if (!data.image) {
    saveStatus.textContent = 'Carregue uma imagem de capa antes de salvar.';
    if (button) button.disabled = false;
    return;
  }

  try {
    await request('admin/posts', 'POST', data);
    await load();
    form.elements.id.value = data.slug;
    saveStatus.textContent = data.status === 'published' ? 'Post publicado.' : 'Rascunho salvo.';
  } catch (error) {
    saveStatus.textContent = error.message;
  } finally {
    if (button) button.disabled = false;
  }
});

$('new-post')?.addEventListener('click', resetForm);

$('logout')?.addEventListener('click', async event => {
  event.currentTarget.disabled = true;
  try {
    await fetch('/painel/api/logout', {method: 'POST', credentials: 'same-origin', cache: 'no-store'});
  } finally {
    redirectToLogin();
  }
});

request('admin/posts')
  .then(data => {
    posts = data.posts || [];
    render();
    resetForm();
  })
  .catch(error => {
    if (!error.message.includes('Entre')) saveStatus.textContent = error.message;
  });
