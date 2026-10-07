(() => {
  const form = document.querySelector('#lead-capture-form');
  if (!form) return;

  const digitsOnly = value => value.replace(/\D/g, '');
  const formatDate = value => {
    const digits = digitsOnly(value).slice(0, 8);
    if (digits.length <= 2) return digits;
    if (digits.length <= 4) return `${digits.slice(0, 2)}/${digits.slice(2)}`;
    return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`;
  };
  const formatCpf = value => {
    const digits = digitsOnly(value).slice(0, 11);
    if (digits.length <= 3) return digits;
    if (digits.length <= 6) return `${digits.slice(0, 3)}.${digits.slice(3)}`;
    if (digits.length <= 9) return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6)}`;
    return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9)}`;
  };
  const formatPhone = value => {
    let digits = digitsOnly(value);
    if (digits.length > 11 && digits.startsWith('55')) digits = digits.slice(2);
    digits = digits.slice(0, 11);
    if (!digits) return '';
    if (digits.length <= 2) return `(${digits}`;
    const area = digits.slice(0, 2);
    const local = digits.slice(2);
    const prefixLength = digits.length > 10 ? 5 : 4;
    if (local.length <= prefixLength) return `(${area}) ${local}`;
    return `(${area}) ${local.slice(0, prefixLength)}-${local.slice(prefixLength)}`;
  };
  const validDate = value => {
    const match = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(value);
    if (!match) return false;
    const [, day, month, year] = match.map(Number);
    if (year < 1900 || year > new Date().getFullYear()) return false;
    const date = new Date(year, month - 1, day);
    return date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day;
  };

  for (const [name, formatter] of [
    ['data_nascimento', formatDate],
    ['cpf', formatCpf],
    ['whatsapp', formatPhone],
  ]) {
    const input = form.elements.namedItem(name);
    if (!(input instanceof HTMLInputElement)) continue;
    input.addEventListener('input', () => {
      const before = input.value.slice(0, input.selectionStart ?? input.value.length);
      const position = digitsOnly(before).length;
      const formatted = formatter(input.value);
      input.value = formatted;
      if (input === document.activeElement && input.selectionStart !== null) {
        let offset = 0;
        let seen = 0;
        while (offset < formatted.length && seen < position) {
          if (/\d/.test(formatted[offset])) seen++;
          offset++;
        }
        input.setSelectionRange(offset, offset);
      }
      if (name === 'data_nascimento') {
        input.setCustomValidity(formatted.length === 10 && !validDate(formatted) ? 'Informe uma data de nascimento válida.' : '');
      }
    });
  }
})();
