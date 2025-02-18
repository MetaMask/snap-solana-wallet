import BigNumber from 'bignumber.js';

import { formatCrypto } from './formatCrypto';

describe('formatCrypto', () => {
  const locale = 'en';
  const symbol = 'SOL';

  describe('covers zero values', () => {
    it('returns "0" for zero amount', () => {
      expect(formatCrypto(new BigNumber(0), symbol, locale)).toBe('0 SOL');
      expect(formatCrypto('0', symbol, locale)).toBe('0 SOL');
      expect(formatCrypto(0, symbol, locale)).toBe('0 SOL');
    });
  });

  describe('covers small values', () => {
    it('formats very small numbers with < prefix', () => {
      expect(formatCrypto(0.0000001, symbol, locale)).toBe('<0.000001 SOL');
      expect(formatCrypto('0.0000001', symbol, locale)).toBe('<0.000001 SOL');
      expect(formatCrypto(new BigNumber('0.0000001'), symbol, locale)).toBe(
        '<0.000001 SOL',
      );
    });

    it('formats numbers less than 1 with maximum significant digits', () => {
      expect(formatCrypto(0.123456, symbol, locale)).toBe('0.123 SOL');
      expect(formatCrypto('0.123456', symbol, locale)).toBe('0.123 SOL');
      expect(formatCrypto(new BigNumber('0.123456'), symbol, locale)).toBe(
        '0.123 SOL',
      );
    });
  });

  describe('covers regular values', () => {
    it('formats numbers with appropriate decimal places based on integer length', () => {
      // 1 digit integer (shows up to 3 decimal places)
      expect(formatCrypto(1.23456789, symbol, locale)).toBe('1.235 SOL');

      // 2 digits integer (shows up to 2 decimal places)
      expect(formatCrypto(12.3456789, symbol, locale)).toBe('12.35 SOL');

      // 3 digits integer (shows up to 1 decimal place)
      expect(formatCrypto(123.456789, symbol, locale)).toBe('123.5 SOL');

      // 4+ digits integer (shows no decimal places)
      expect(formatCrypto(1234.56789, symbol, locale)).toBe('1,235 SOL');
    });

    it('formats numbers with commas for thousands', () => {
      expect(formatCrypto(1234567.89, symbol, locale)).toBe('1,234,568 SOL');
    });
  });

  describe('covers negative values', () => {
    it('handles negative numbers correctly', () => {
      expect(formatCrypto(-0.0000001, symbol, locale)).toBe('<0.000001 SOL');
    });
  });

  describe('covers error handling', () => {
    it('handles invalid inputs gracefully', () => {
      expect(formatCrypto('invalid', symbol, locale)).toBe('0 SOL');
      expect(formatCrypto(NaN, symbol, locale)).toBe('0 SOL');
    });
  });

  describe('handles different locales correctly', () => {
    it('formats numbers according to locale', () => {
      expect(formatCrypto(1234.5678, symbol, 'de-DE')).toBe('1.235 SOL');
      // Heads up! That is not a normal space, but a non-breaking space.
      expect(formatCrypto(1234.5678, symbol, 'fr-FR')).toBe('1 235 SOL');
    });
  });

  describe('handles different symbols', () => {
    it('formats with different symbols', () => {
      expect(formatCrypto(1234.5678, 'ETH', locale)).toBe('1,235 ETH');
      expect(formatCrypto(1234.5678, '', locale)).toBe('1,235 ');
    });
  });
});
