import { formatCurrency } from './formatCurrency';

describe('formatCurrency', () => {
  it('formats positive amounts correctly', () => {
    expect(formatCurrency('1234.56', 'usd')).toBe('$1,234.56');
  });

  it('formats negative amounts correctly', () => {
    expect(formatCurrency('-1234.56', 'usd')).toBe('-$1,234.56');
  });

  it('formats large amounts correctly', () => {
    expect(formatCurrency('1234567890.12', 'usd')).toBe('$1,234,567,890.12');
  });

  it('formats small amounts correctly', () => {
    expect(formatCurrency('0.99', 'usd')).toBe('$0.99');
  });

  it('formats zero correctly', () => {
    expect(formatCurrency('0', 'usd')).toBe('$0.00');
  });

  it('handles amounts with no decimal part', () => {
    expect(formatCurrency('1000', 'usd')).toBe('$1,000.00');
  });

  it('handles amounts with more than two decimal places', () => {
    expect(formatCurrency('1234.5678', 'usd')).toBe('$1,234.57');
  });

  it('handles negative amounts with more than two decimal places', () => {
    expect(formatCurrency('-1234.5678', 'usd')).toBe('-$1,234.57');
  });

  it('handles different currency', () => {
    expect(formatCurrency('1234.5678', 'eur')).toBe('€1,234.57');
  });
});
