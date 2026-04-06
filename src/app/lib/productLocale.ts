import type { AppLocale } from '../i18n/types';
import type { Product } from '../data/mockData';

export function productName(p: Product, locale: AppLocale): string {
  if (locale === 'uz' && p.nameUz?.trim()) return p.nameUz.trim();
  return p.name;
}

export function productCategory(p: Product, locale: AppLocale): string {
  if (locale === 'uz' && p.categoryUz?.trim()) return p.categoryUz.trim();
  return p.category;
}

/** Для строк в долге: по id товара подставить локализованное имя */
export function debtLineProductName(
  productId: string,
  storedName: string,
  products: Product[],
  locale: AppLocale
): string {
  const pr = products.find((x) => x.id === productId);
  if (pr) return productName(pr, locale);
  return storedName;
}
