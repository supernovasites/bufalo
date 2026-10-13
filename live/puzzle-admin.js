(() => {
  const ids = ['tote', 'nag', 'outdoor', 'mestre'];
  const form = document.getElementById('puzzle-form');
  if (!form) return;
  const feedback = document.getElementById('puzzle-feedback');
  const save = document.getElementById('save-puzzle');
  const input = id => document.getElementById('puzzle-coupon-' + id);
  const preview = id => {
    document.getElementById('puzzle-coupon-preview-' + id).textContent = input(id).value || '—';
  };
  async function api(path, body) {
    const response = await fetch('/live/api/' + path, {
      method: body ? 'POST' : 'GET',
      headers: body ? {'Content-Type': 'application/json'} : {},
      body: body ? JSON.stringify(body) : undefined,
      cache: 'no-store', credentials: 'same-origin'
    });
    let data = {};
    try { data = await response.json(); } catch {}
    if (response.status === 401) window.location.replace('/painel/');
    if (!response.ok) throw new Error(data.error || 'Não foi possível carregar ou salvar os cupons. Recarregue a página e tente novamente.');
    return data;
  }
  function render(data) {
    ids.forEach(id => {
      input(id).value = data.challenge_coupons?.[id] || data.coupon || '';
      input(id).disabled = false;
      preview(id);
    });
    save.disabled = false;
  }
  ids.forEach(id => input(id).addEventListener('input', () => preview(id)));
  form.addEventListener('submit', async event => {
    event.preventDefault();
    const coupons = Object.fromEntries(ids.map(id => [id, input(id).value.trim().toUpperCase()]));
    if (Object.values(coupons).some(coupon => !/^[A-Z0-9_-]{3,24}$/.test(coupon))) {
      feedback.textContent = 'Informe os quatro cupons com 3 a 24 letras, números, hífen ou sublinhado.';
      return;
    }
    save.disabled = true;
    ids.forEach(id => { input(id).disabled = true; });
    feedback.textContent = 'Salvando cupons…';
    try {
      render(await api('challenges', coupons));
      feedback.textContent = 'Cupons publicados. Eles serão revelados ao concluir cada desafio na live. Recarregue a página da live para conferir.';
    } catch (error) {
      feedback.textContent = error.message;
    } finally {
      save.disabled = false;
      ids.forEach(id => { input(id).disabled = false; });
    }
  });
  api('state').then(render).catch(error => { feedback.textContent = error.message; });
})();
