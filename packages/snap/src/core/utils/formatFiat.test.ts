import { formatFiat } from './formatFiat';

describe('formatFiat', () => {
  it('formats positive amounts correctly', () => {
    expect(formatFiat('1234.56', 'usd', 'en-US')).toBe('$1,234.56');
  });

  it('formats negative amounts correctly', () => {
    expect(formatFiat('-1234.56', 'usd', 'en-US')).toBe('-$1,234.56');
  });

  it('formats large amounts correctly', () => {
    expect(formatFiat('1234567890.12', 'usd', 'en-US')).toBe(
      '$1,234,567,890.12',
    );
  });

  it('formats small amounts correctly', () => {
    expect(formatFiat('0.99', 'usd', 'en-US')).toBe('$0.99');
  });

  it('formats zero correctly', () => {
    expect(formatFiat('0', 'usd', 'en-US')).toBe('$0.00');
  });

  it('handles amounts with no decimal part', () => {
    expect(formatFiat('1000', 'usd', 'en-US')).toBe('$1,000.00');
  });

  it('handles amounts with more than two decimal places', () => {
    expect(formatFiat('1234.5678', 'usd', 'en-US')).toBe('$1,234.57');
  });

  it('handles negative amounts with more than two decimal places', () => {
    expect(formatFiat('-1234.5678', 'usd', 'en-US')).toBe('-$1,234.57');
  });

  it('handles different currency', () => {
    expect(formatFiat('1234.5678', 'eur', 'en-US')).toBe('€1,234.57');
  });
});
