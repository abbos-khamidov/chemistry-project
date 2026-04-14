import type { ClientSale, Debt, Product } from '../data/mockData';

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

/** Журнал аудита: отображение в часовом поясе Ташкента (Asia/Tashkent). */
export function formatAuditAtDisplay(raw: string): string {
  if (!raw || typeof raw !== 'string') return '';
  const s = raw.trim();

  // Если в строке есть timezone/ISO, конвертируем момент во время Ташкента.
  const hasZone = /(Z|[+-]\d{2}:?\d{2})$/.test(s);
  if (hasZone || s.includes('T')) {
    const normalized = s.includes(' ') ? s.replace(' ', 'T') : s;
    const dt = new Date(normalized);
    if (Number.isFinite(dt.getTime())) {
      const parts = new Intl.DateTimeFormat('ru-RU', {
        timeZone: 'Asia/Tashkent',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
      }).formatToParts(dt);
      const get = (type: string) => parts.find((p) => p.type === type)?.value ?? '';
      return `${get('day')}.${get('month')}.${get('year')} ${get('hour')}:${get('minute')}`.trim();
    }
  }

  // legacy-формат без timezone: просто приводим к DD.MM.YYYY HH:MM
  const m = /^(\d{4})-(\d{2})-(\d{2})(?:[ T](.+))?$/.exec(s);
  if (!m) return formatDateDotDMY(raw);
  const dmy = `${m[3]}.${m[2]}.${m[1]}`;
  const rest = m[4]?.trim();
  return rest ? `${dmy} ${rest}` : dmy;
}

/** Новые должники выше старых: по времени создания записи, иначе по дате выдачи и id. */
export function compareDebtsNewestFirst(a: Debt, b: Debt): number {
  const ka = a.createdAt ?? `${a.issueDate}T00:00:00.000Z`;
  const kb = b.createdAt ?? `${b.issueDate}T00:00:00.000Z`;
  const c = kb.localeCompare(ka);
  if (c !== 0) return c;
  return b.id.localeCompare(a.id);
}

/** Новые продажи/клиенты в списке выше старых (по времени записи, не только по календарной дате). */
export function compareClientSalesNewestFirst(a: ClientSale, b: ClientSale): number {
  const ka = a.createdAt ?? `${a.date}T00:00:00.000Z`;
  const kb = b.createdAt ?? `${b.date}T00:00:00.000Z`;
  const c = kb.localeCompare(ka);
  if (c !== 0) return c;
  return b.id.localeCompare(a.id);
}

/** Срок годности в формате YYYY-MM-DD (из поля товара). */
export function parseExpirationDateYmd(raw: string | undefined | null): string | null {
  if (!raw || typeof raw !== 'string') return null;
  const s = raw.trim().slice(0, 10);
  const iso = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s);
  if (iso) return `${iso[1]}-${iso[2]}-${iso[3]}`;
  const ymdDotted = /^(\d{4})\.(\d{2})\.(\d{2})$/.exec(s);
  if (ymdDotted) return `${ymdDotted[1]}-${ymdDotted[2]}-${ymdDotted[3]}`;
  const dmyDotted = /^(\d{2})\.(\d{2})\.(\d{4})$/.exec(s);
  if (dmyDotted) return `${dmyDotted[3]}-${dmyDotted[2]}-${dmyDotted[1]}`;
  return null;
}

/** Целое число дней от сегодня до даты окончания (положительное — ещё не истёк). */
export function daysLeftUntilExpiration(expirationRaw: string, now = new Date()): number | null {
  const ymd = parseExpirationDateYmd(expirationRaw);
  if (!ymd) return null;
  const [y, m, d] = ymd.split('-').map(Number);
  if (!y || !m || !d) return null;
  const end = new Date(y, m - 1, d, 12, 0, 0);
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 12, 0, 0);
  return Math.round((end.getTime() - start.getTime()) / 86400000);
}

/** Товары с остатком, у которых до конца срока годности не больше `withinDays` дней (и срок ещё не прошёл). */
export function getProductsExpiringWithinDays(
  products: Product[],
  withinDays: number,
  now = new Date()
): Array<{ product: Product; daysLeft: number }> {
  const out: Array<{ product: Product; daysLeft: number }> = [];
  for (const p of products) {
    if (!p.quantity || p.quantity <= 0) continue;
    const days = daysLeftUntilExpiration(p.expirationDate, now);
    if (days === null) continue;
    if (days > 0 && days <= withinDays) {
      out.push({ product: p, daysLeft: days });
    }
  }
  out.sort((a, b) => a.daysLeft - b.daysLeft);
  return out;
}

