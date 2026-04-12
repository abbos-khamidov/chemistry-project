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

/** Отображение даты: YYYY-MM-DD или YYYY.MM.DD → DD.MM.YYYY */
export function formatDateDotDMY(raw: string): string {
  if (!raw || typeof raw !== 'string') return '';
  const s = raw.trim().slice(0, 10);
  const iso = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s);
  if (iso) return `${iso[3]}.${iso[2]}.${iso[1]}`;
  const dotted = /^(\d{4})\.(\d{2})\.(\d{2})$/.exec(s);
  if (dotted) return `${dotted[3]}.${dotted[2]}.${dotted[1]}`;
  return raw;
}

/** Журнал аудита: «YYYY-MM-DD HH:MM» → «DD.MM.YYYY HH:MM» (время сохраняется). */
export function formatAuditAtDisplay(raw: string): string {
  if (!raw || typeof raw !== 'string') return '';
  const m = /^(\d{4})-(\d{2})-(\d{2})(?:[ T](.+))?$/.exec(raw.trim());
  if (!m) return formatDateDotDMY(raw);
  const dmy = `${m[3]}.${m[2]}.${m[1]}`;
  const rest = m[4]?.trim();
  return rest ? `${dmy} ${rest}` : dmy;
}
