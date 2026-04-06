import type { AppLocale } from '../i18n/types';

/** Суммы в узбекских сумах (UZS / so'm), без символа доллара. */
export function formatUzsAmount(amount: number, locale: AppLocale): string {
  const n = Number.isFinite(amount) ? Math.round(amount) : 0;
  if (locale === 'uz') {
    return `${new Intl.NumberFormat('uz-UZ').format(n)} so'm`;
  }
  return `${new Intl.NumberFormat('ru-RU').format(n)} UZS`;
}
