import BigNumber from 'bignumber.js';

import { formatFiatBalance } from './formatFiatBalance';

describe('formatFiatBalance', () => {
  it('should format number inputs to 2 decimal places', () => {
    expect(formatFiatBalance(123.456)).toBe('123.46');
    expect(formatFiatBalance(123.45)).toBe('123.45');
    expect(formatFiatBalance(123)).toBe('123.00');
  });

  it('should format string inputs to 2 decimal places', () => {
    expect(formatFiatBalance('123.456')).toBe('123.46');
    expect(formatFiatBalance('123.45')).toBe('123.45');
    expect(formatFiatBalance('123')).toBe('123.00');
  });

  it('should format BigNumber inputs to 2 decimal places', () => {
    expect(formatFiatBalance(new BigNumber('123.456'))).toBe('123.46');
    expect(formatFiatBalance(new BigNumber('123.45'))).toBe('123.45');
    expect(formatFiatBalance(new BigNumber('123'))).toBe('123.00');
  });

  it('should handle zero values', () => {
    expect(formatFiatBalance(0)).toBe('0.00');
    expect(formatFiatBalance('0')).toBe('0.00');
    expect(formatFiatBalance(new BigNumber(0))).toBe('0.00');
  });

  it('should handle negative values', () => {
    expect(formatFiatBalance(-123.456)).toBe('-123.46');
    expect(formatFiatBalance('-123.456')).toBe('-123.46');
    expect(formatFiatBalance(new BigNumber(-123.456))).toBe('-123.46');
  });
});
