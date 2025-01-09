import { formatTokens } from './formatTokens';

describe('formatTokens', () => {
  it('formats token amount with commas and symbol', () => {
    const result = formatTokens('1234567.8910', 'SOL');
    expect(result).toBe('1,234,567.8910 SOL');
  });

  it('formats token amount with rounding to four decimal places', () => {
    const result = formatTokens('1234567.891234', 'SOL');
    expect(result).toBe('1,234,567.8912 SOL');
  });

  it('throws an error for invalid token amount', () => {
    expect(() => formatTokens('invalid', 'SOL')).toThrow(
      'Invalid token amount',
    );
  });

  it('formats token amount with no decimal places', () => {
    const result = formatTokens('1000', 'SOL');
    expect(result).toBe('1,000.0000 SOL');
  });

  it('formats token amount with less than four decimal places', () => {
    const result = formatTokens('1000.5', 'SOL');
    expect(result).toBe('1,000.5000 SOL');
  });
});
