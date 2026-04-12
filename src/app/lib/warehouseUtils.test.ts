import { describe, it, expect } from 'vitest';
import { deriveProductStatus, dateInRange, formatDateDotDMY } from './warehouseUtils';

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

});
