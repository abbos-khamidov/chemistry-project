/** Оставляет только цифры (для целых сумм в UZS). */
export function amountDigitsOnly(raw: string): string {
  return raw.replace(/\D/g, '');
}

/**
 * Пробелы между группами по 3 цифры справа: 10000 → "10 000".
 * Пустая строка → "".
 */
export function formatAmountWithSpaces(digitString: string): string {
  const d = amountDigitsOnly(digitString);
  if (!d) return '';
  return d.replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
}
