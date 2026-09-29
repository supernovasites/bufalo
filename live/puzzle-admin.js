(() => {
  const form = document.getElementById('puzzle-form');
  const photoInput = document.getElementById('puzzle-photo');
  const couponInput = document.getElementById('puzzle-coupon');
  const photoPreview = document.getElementById('puzzle-photo-preview');
  const couponPreview = document.getElementById('puzzle-coupon-preview');
  const feedback = document.getElementById('puzzle-feedback');
  let selectedPhoto = null;
  let previewUrl = null;

  photoInput?.addEventListener('change', event => {
    selectedPhoto = null;
    if (feedback) feedback.textContent = '';
    const file = event.currentTarget.files?.[0];
    if (!file) return;
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type) || file.size > 10 * 1024 * 1024) {
      event.currentTarget.value = '';
      if (feedback) feedback.textContent = 'Escolha uma imagem JPG, PNG ou WebP de até 10 MB.';
      return;
    }
    selectedPhoto = file;
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    previewUrl = URL.createObjectURL(file);
    if (photoPreview) photoPreview.src = previewUrl;
    if (feedback) feedback.textContent = 'Imagem pronta para ser aplicada ao puzzle.';
  });

  couponInput?.addEventListener('input', event => {
    event.currentTarget.value = event.currentTarget.value.toUpperCase().replace(/[^A-Z0-9_-]/g, '');
    if (couponPreview) couponPreview.textContent = event.currentTarget.value || 'TOTE50';
  });

  form?.addEventListener('submit', event => {
    event.preventDefault();
    const button = event.submitter;
    if (button) button.disabled = true;
    try {
      const coupon = couponInput?.value.trim().toUpperCase();
      if (!coupon || coupon.length < 3) {
        if (feedback) feedback.textContent = 'Informe um cupom com pelo menos 3 caracteres.';
        return;
      }
      localStorage.setItem('bufalo-live-puzzle', JSON.stringify({coupon, photo_name: selectedPhoto?.name || null}));
      if (feedback) feedback.textContent = selectedPhoto
        ? 'Foto e cupom salvos nesta prévia local.'
        : 'Cupom salvo nesta prévia local. A foto atual foi mantida.';
      selectedPhoto = null;
      if (photoInput) photoInput.value = '';
    } finally {
      if (button) button.disabled = false;
    }
  });
})();
