(() => {
  const ids = ['tote', 'nag', 'outdoor', 'mestre'];
  const form = document.getElementById('puzzle-form');
  if (!form) return;
  const feedback = document.getElementById('puzzle-feedback');
  const save = document.getElementById('save-puzzle');
  const input = id => document.getElementById('puzzle-coupon-' + id);
  const discountInput = id => document.getElementById('puzzle-discount-' + id);
  const preview = id => {
    document.getElementById('puzzle-coupon-preview-' + id).textContent = input(id).value || '—';
    document.getElementById('puzzle-discount-preview-' + id).textContent = (discountInput(id).value || '—') + '% OFF';
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
      discountInput(id).value = data.challenge_discounts?.[id] ?? 20;
      discountInput(id).disabled = false;
      preview(id);
    });
    save.disabled = false;
  }
  ids.forEach(id => {
    input(id).addEventListener('input', () => preview(id));
    discountInput(id).addEventListener('input', () => preview(id));
  });
  form.addEventListener('submit', async event => {
    event.preventDefault();
    const coupons = Object.fromEntries(ids.map(id => [id, input(id).value.trim().toUpperCase()]));
    const discounts = Object.fromEntries(ids.map(id => [id, Number(discountInput(id).value)]));
    if (Object.values(coupons).some(coupon => !/^[A-Z0-9_-]{3,24}$/.test(coupon))) {
      feedback.textContent = 'Informe os quatro cupons com 3 a 24 letras, números, hífen ou sublinhado.';
      return;
    }
    if (Object.values(discounts).some(discount => !Number.isInteger(discount) || discount < 1 || discount > 100)) {
      feedback.textContent = 'Informe um desconto inteiro de 1% a 100% para cada desafio.';
      return;
    }
    save.disabled = true;
    ids.forEach(id => { input(id).disabled = true; discountInput(id).disabled = true; });
    feedback.textContent = 'Salvando cupons…';
    try {
      render(await api('challenges', {...coupons, discounts}));
      feedback.textContent = 'Cupons e descontos publicados. Recarregue a página da live para conferir as recompensas.';
    } catch (error) {
      feedback.textContent = error.message;
    } finally {
      save.disabled = false;
      ids.forEach(id => { input(id).disabled = false; discountInput(id).disabled = false; });
    }
  });
  api('state').then(render).catch(error => { feedback.textContent = error.message; });
})();
