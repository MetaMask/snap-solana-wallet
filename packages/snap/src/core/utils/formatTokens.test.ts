import BigNumber from 'bignumber.js';

import { formatTokens } from './formatTokens';

describe('formatTokens', () => {
  const locale = 'en';

  describe('covers zero values', () => {
    it('returns "0" for zero amount', () => {
      expect(formatTokens(new BigNumber(0), 'SOL', locale)).toBe('0 SOL');
      expect(formatTokens('0', 'SOL', locale)).toBe('0 SOL');
      expect(formatTokens(0, 'SOL', locale)).toBe('0 SOL');
    });
  });

  describe('covers small values', () => {
    it('formats very small numbers with < prefix', () => {
      expect(formatTokens(0.0000001, 'SOL', locale)).toBe('<0.000001 SOL');
      expect(formatTokens('0.0000001', 'SOL', locale)).toBe('<0.000001 SOL');
      expect(formatTokens(new BigNumber('0.0000001'), 'SOL', locale)).toBe(
        '<0.000001 SOL',
      );
    });

    it('formats numbers less than 1 with maximum significant digits', () => {
      expect(formatTokens(0.123456, 'SOL', locale)).toBe('0.123 SOL');
      expect(formatTokens('0.123456', 'SOL', locale)).toBe('0.123 SOL');
      expect(formatTokens(new BigNumber('0.123456'), 'SOL', locale)).toBe(
        '0.123 SOL',
      );
    });
  });

  describe('covers regular values', () => {
    it('formats numbers with appropriate decimal places based on integer length', () => {
      // 1 digit integer (shows up to 3 decimal places)
      expect(formatTokens(1.23456789, 'SOL', locale)).toBe('1.235 SOL');

      // 2 digits integer (shows up to 2 decimal places)
      expect(formatTokens(12.3456789, 'SOL', locale)).toBe('12.35 SOL');

      // 3 digits integer (shows up to 1 decimal place)
      expect(formatTokens(123.456789, 'SOL', locale)).toBe('123.5 SOL');

      // 4+ digits integer (shows no decimal places)
      expect(formatTokens(1234.56789, 'SOL', locale)).toBe('1,235 SOL');
    });

    it('formats numbers with commas for thousands', () => {
      expect(formatTokens(1234567.89, 'SOL', locale)).toBe('1,234,568 SOL');
    });
  });

  describe('covers negative values', () => {
    it('handles negative numbers correctly', () => {
      expect(formatTokens(-0.0000001, 'SOL', locale)).toBe('<0.000001 SOL');
    });
  });

  describe('covers error handling', () => {
    it('handles invalid inputs gracefully', () => {
      expect(formatTokens('invalid', 'SOL', locale)).toBe('0 SOL');
      expect(formatTokens(NaN, 'SOL', locale)).toBe('0 SOL');
    });
  });
});
