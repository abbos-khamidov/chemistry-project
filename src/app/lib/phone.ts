import { AsYouType, parsePhoneNumberFromString } from 'libphonenumber-js';
import type { CountryCode } from 'libphonenumber-js';

/** Максимум цифр после «+» в международном номере (по требованию продукта). */
export const PHONE_MAX_DIGITS = 12;

/**
 * Оставляет только «+» в начале и цифры; не более PHONE_MAX_DIGITS цифр.
 * Буквы и прочие символы отбрасываются. Если ввели цифры без «+», добавляется «+».
 */
export function sanitizeInternationalPhoneInput(raw: string): string {
  const only = raw.replace(/[^\d+]/g, '');
  let digits = '';
  let hasLeadingPlus = false;
  for (let i = 0; i < only.length; i++) {
    const ch = only[i];
    if (ch === '+') {
      if (!hasLeadingPlus && digits.length === 0) hasLeadingPlus = true;
      continue;
    }
    if (ch >= '0' && ch <= '9') {
      digits += ch;
      if (digits.length >= PHONE_MAX_DIGITS) break;
    }
  }
  if (!digits) return hasLeadingPlus ? '+' : '';
  return '+' + digits;
}

/** Компактное хранение: + и цифры без пробелов. */
export function normalizePhoneForStore(raw: string): string {
  return sanitizeInternationalPhoneInput(raw);
}

/** Полный номер: «+» и ровно 12 цифр. */
export function isCompleteInternationalPhone12(raw: string): boolean {
  const s = normalizePhoneForStore(raw);
  return /^\+\d{12}$/.test(s);
}

/** Отображение с пробелами по мере ввода (AsYouType). */
export function formatInternationalPhoneDisplay(compact: string): string {
  const s = normalizePhoneForStore(compact);
  if (!s || s === '+') return s || '+';
  const typer = new AsYouType();
  return typer.input(s);
}

/** Телефон в списках и карточках: международное форматирование с пробелами (libphonenumber). */
export function formatPhoneDisplay(raw: string | undefined | null): string {
  if (raw == null) return '';
  const s = String(raw).trim();
  if (s === '' || s === '—' || s === '-') return s;
  return formatInternationalPhoneDisplay(s);
}

export function getDetectedCountry(e164compact: string): CountryCode | undefined {
  const p = parsePhoneNumberFromString(e164compact);
  return p?.country;
}

export function countryLabelRu(code: CountryCode | undefined): string | null {
  if (!code) return null;
  try {
    return new Intl.DisplayNames(['ru'], { type: 'region' }).of(code) ?? code;
  } catch {
    return code;
  }
}
