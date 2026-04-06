import type { Product } from '../data/mockData';

export function deriveProductStatus(quantity: number): Product['status'] {
  if (quantity <= 0) return 'out-of-stock';
  if (quantity < 20) return 'low-stock';
  return 'in-stock';
}

/** Сравнение дат в формате YYYY-MM-DD */
export function dateInRange(dateStr: string, start: string, end: string): boolean {
  const d = dateStr.slice(0, 10);
  return d >= start && d <= end;
}

export function kpiInDateRange(
  periodStart: string,
  periodEnd: string,
  rangeStart: string,
  rangeEnd: string
): boolean {
  const ps = periodStart.slice(0, 10);
  const pe = periodEnd.slice(0, 10);
  return ps <= rangeEnd && pe >= rangeStart;
}
