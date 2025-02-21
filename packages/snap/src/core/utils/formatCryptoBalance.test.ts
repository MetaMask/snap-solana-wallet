import BigNumber from 'bignumber.js';

import { formatCryptoBalance } from './formatCryptoBalance';

describe('formatCryptoBalance', () => {
  const locale = 'en';

  describe('covers zero values', () => {
    it('returns "0" for zero amount', () => {
      expect(formatCryptoBalance(new BigNumber(0), locale)).toBe('0');
      expect(formatCryptoBalance('0', locale)).toBe('0');
      expect(formatCryptoBalance(0, locale)).toBe('0');
    });
  });

  describe('covers small values', () => {
    it('formats very small numbers with < prefix', () => {
      expect(formatCryptoBalance(0.0000001, locale)).toBe('<0.000001');
      expect(formatCryptoBalance('0.0000001', locale)).toBe('<0.000001');
      expect(formatCryptoBalance(new BigNumber('0.0000001'), locale)).toBe(
        '<0.000001',
      );
    });

    it('formats numbers less than 1 with maximum significant digits', () => {
      expect(formatCryptoBalance(0.123456, locale)).toBe('0.123');
      expect(formatCryptoBalance('0.123456', locale)).toBe('0.123');
      expect(formatCryptoBalance(new BigNumber('0.123456'), locale)).toBe(
        '0.123',
      );
    });
  });

  describe('covers regular values', () => {
    it('formats numbers with appropriate decimal places based on integer length', () => {
      // 1 digit integer (shows up to 3 decimal places)
      expect(formatCryptoBalance(1.23456789, locale)).toBe('1.235');

      // 2 digits integer (shows up to 2 decimal places)
      expect(formatCryptoBalance(12.3456789, locale)).toBe('12.35');

      // 3 digits integer (shows up to 1 decimal place)
      expect(formatCryptoBalance(123.456789, locale)).toBe('123.5');

      // 4+ digits integer (shows no decimal places)
      expect(formatCryptoBalance(1234.56789, locale)).toBe('1,235');
    });

    it('formats numbers with commas for thousands', () => {
      expect(formatCryptoBalance(1234567.89, locale)).toBe('1,234,568');
    });
  });

  describe('covers negative values', () => {
    it('handles negative numbers correctly', () => {
      expect(formatCryptoBalance(-0.0000001, locale)).toBe('<0.000001');
    });
  });

  describe('covers error handling', () => {
    it('handles invalid inputs gracefully', () => {
      expect(formatCryptoBalance('invalid', locale)).toBe('0');
      expect(formatCryptoBalance(NaN, locale)).toBe('0');
    });
  });
});
