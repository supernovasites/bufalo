export function validCpf(value) {
  if (typeof value !== 'string' || !/^(?:\d{11}|\d{3}\.\d{3}\.\d{3}-\d{2})$/.test(value)) return false;
  const digits = value.replace(/\D/g, '');
  if (/^(\d)\1{10}$/.test(digits)) return false;
  for (const length of [9, 10]) {
    let sum = 0;
    for (let index = 0; index < length; index++) sum += Number(digits[index]) * (length + 1 - index);
    const remainder = sum % 11;
    if (Number(digits[length]) !== (remainder < 2 ? 0 : 11 - remainder)) return false;
  }
  return true;
}
