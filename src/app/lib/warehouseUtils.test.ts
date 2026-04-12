import { describe, it, expect } from 'vitest';
import type { Product } from '../data/mockData';
import { deriveProductStatus, dateInRange, formatDateDotDMY, formatAuditAtDisplay, compareDebtsNewestFirst, compareClientSalesNewestFirst, daysLeftUntilExpiration, getProductsExpiringWithinDays } from './warehouseUtils';

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

  it('compareClientSalesNewestFirst orders by createdAt within same calendar date', () => {
    const a = {
      id: 'a',
      fullName: 'First',
      phone: '+998901111111',
      productId: 'p',
      productName: 'X',
      quantity: 1,
      amountUzs: 100,
      date: '2026-04-12',
      createdAt: '2026-04-12T08:00:00.000Z',
    };
    const b = {
      id: 'b',
      fullName: 'Second',
      phone: '+998902222222',
      productId: 'p',
      productName: 'X',
      quantity: 1,
      amountUzs: 100,
      date: '2026-04-12',
      createdAt: '2026-04-12T18:00:00.000Z',
    };
    expect(compareClientSalesNewestFirst(a, b)).toBeGreaterThan(0);
    expect(compareClientSalesNewestFirst(b, a)).toBeLessThan(0);
  });

  it('daysLeftUntilExpiration counts calendar days to expiration', () => {
    const now = new Date(2026, 3, 12, 10, 0, 0);
    expect(daysLeftUntilExpiration('2026-05-12', now)).toBe(30);
    expect(daysLeftUntilExpiration('2026-04-13', now)).toBe(1);
    expect(daysLeftUntilExpiration('2026-04-12', now)).toBe(0);
  });

  it('getProductsExpiringWithinDays lists in-stock products in window', () => {
    const now = new Date(2026, 3, 12, 12, 0, 0);
    const products: Product[] = [
      {
        id: 'a',
        name: 'A',
        category: 'c',
        quantity: 5,
        unit: 'шт',
        price: 1,
        supplier: 's',
        expirationDate: '2026-05-10',
        status: 'in-stock',
        history: [],
      },
      {
        id: 'b',
        name: 'B',
        category: 'c',
        quantity: 0,
        unit: 'шт',
        price: 1,
        supplier: 's',
        expirationDate: '2026-05-10',
        status: 'out-of-stock',
        history: [],
      },
    ];
    const rows = getProductsExpiringWithinDays(products, 30, now);
    expect(rows).toHaveLength(1);
    expect(rows[0].product.id).toBe('a');
  });

});
