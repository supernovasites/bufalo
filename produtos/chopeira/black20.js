(() => {
  'use strict';
  document.querySelectorAll('.black20-copy').forEach(button => {
    button.addEventListener('click', async () => {
      const status = button.parentElement.querySelector('.black20-status');
      try {
        try { await navigator.clipboard.writeText('Black20'); }
        catch {
          const field = document.createElement('textarea');
          field.value = 'Black20'; field.setAttribute('readonly', '');
          field.style.cssText = 'position:fixed;opacity:0';
          document.body.append(field);
          let copied = false;
          try { field.select(); copied = document.execCommand('copy'); }
          finally { field.remove(); button.focus({preventScroll:true}); }
          if (!copied) throw new Error('Copy failed');
        }
        status.textContent = 'Cupom copiado! Use Black20 no carrinho.';
        window.bufaloAnalytics?.track('coupon_copy', {coupon:'Black20'});
      } catch { status.textContent = 'Não foi possível copiar. Digite Black20 no carrinho.'; }
    });
  });
})();
