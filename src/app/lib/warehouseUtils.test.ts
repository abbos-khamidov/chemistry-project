import { describe, it, expect } from 'vitest';
import { deriveProductStatus, dateInRange, formatDateDotDMY, formatAuditAtDisplay, compareDebtsNewestFirst } from './warehouseUtils';

describe('warehouseUtils', () => {
  it('deriveProductStatus reflects quantity bands', () => {
    expect(deriveProductStatus(0)).toBe('out-of-stock');
    expect(deriveProductStatus(10)).toBe('low-stock');
    expect(deriveProductStatus(25)).toBe('in-stock');
  });

  it('dateInRange compares YYYY-MM-DD strings', () => {
    expect(dateInRange('2026-03-15', '2026-03-01', '2026-03-31')).toBe(true);
    expect(dateInRange('2026-02-01', '2026-03-01', '2026-03-31')).toBe(false);
  });

  it('formatDateDotDMY converts ISO and dotted dates to DD.MM.YYYY', () => {
    expect(formatDateDotDMY('2026-05-01')).toBe('01.05.2026');
    expect(formatDateDotDMY('2026.04.12')).toBe('12.04.2026');
  });

  it('formatAuditAtDisplay converts audit timestamps to DD.MM.YYYY HH:MM', () => {
    expect(formatAuditAtDisplay('2026-04-12 10:55')).toBe('12.04.2026 10:55');
    expect(formatAuditAtDisplay('2026-01-02')).toBe('02.01.2026');
  });

  it('compareDebtsNewestFirst orders by createdAt then issueDate', () => {
    const a = {
      id: 'a',
      fullName: 'Old',
      phone: '+998901111111',
      issueDate: '2026-01-01',
      dueDate: '2026-02-01',
      createdAt: '2026-01-01T10:00:00.000Z',
      status: 'active' as const,
      totalAmount: 1,
      paidAmount: 0,
      remainingAmount: 1,
      products: [],
      debtHistory: [],
      paymentHistory: [],
    };
    const b = {
      id: 'b',
      fullName: 'New',
      phone: '+998902222222',
      issueDate: '2026-01-02',
      dueDate: '2026-03-01',
      createdAt: '2026-04-01T10:00:00.000Z',
      status: 'active' as const,
      totalAmount: 1,
      paidAmount: 0,
      remainingAmount: 1,
      products: [],
      debtHistory: [],
      paymentHistory: [],
    };
    expect(compareDebtsNewestFirst(a, b)).toBeGreaterThan(0);
    expect(compareDebtsNewestFirst(b, a)).toBeLessThan(0);
  });

});
