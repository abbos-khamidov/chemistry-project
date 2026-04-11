import { describe, expect, it } from 'vitest';
import { amountDigitsOnly, formatAmountWithSpaces } from './amountInput';

describe('amountDigitsOnly', () => {
  it('strips non-digits', () => {
    expect(amountDigitsOnly('10 000')).toBe('10000');
    expect(amountDigitsOnly('abc12x34')).toBe('1234');
    expect(amountDigitsOnly('')).toBe('');
  });
});

describe('formatAmountWithSpaces', () => {
  it('returns empty for empty or non-digit input', () => {
    expect(formatAmountWithSpaces('')).toBe('');
    expect(formatAmountWithSpaces('abc')).toBe('');
  });

  it('groups thousands with spaces', () => {
    expect(formatAmountWithSpaces('10000')).toBe('10 000');
    expect(formatAmountWithSpaces('1000000')).toBe('1 000 000');
    expect(formatAmountWithSpaces('42')).toBe('42');
  });
});
