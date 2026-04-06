import { describe, it, expect } from 'vitest';
import { deriveProductStatus, dateInRange, kpiInDateRange } from './warehouseUtils';

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

  it('kpiInDateRange detects overlap', () => {
    expect(kpiInDateRange('2026-01-01', '2026-01-31', '2026-01-15', '2026-02-01')).toBe(true);
    expect(kpiInDateRange('2026-03-01', '2026-03-31', '2026-01-01', '2026-01-31')).toBe(false);
  });
});
