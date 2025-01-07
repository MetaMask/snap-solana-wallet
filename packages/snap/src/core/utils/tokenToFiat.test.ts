import { tokenToFiat } from './tokenToFiat';

describe('tokenToFiat', () => {
  it('converts token amount to fiat correctly', () => {
    const tokenAmount = '100';
    const exchangeRate = 2;
    const fiatAmount = tokenToFiat(tokenAmount, exchangeRate);
    expect(fiatAmount).toBe('200');
  });

  it('handles zero token amount', () => {
    const tokenAmount = '0';
    const exchangeRate = 2;
    const fiatAmount = tokenToFiat(tokenAmount, exchangeRate);
    expect(fiatAmount).toBe('0');
  });

  it('handles zero exchange rate', () => {
    const tokenAmount = '100';
    const exchangeRate = 0;
    const fiatAmount = tokenToFiat(tokenAmount, exchangeRate);
    expect(fiatAmount).toBe('0');
  });

  it('handles negative token amount', () => {
    const tokenAmount = '-100';
    const exchangeRate = 2;
    const fiatAmount = tokenToFiat(tokenAmount, exchangeRate);
    expect(fiatAmount).toBe('-200');
  });

  it('handles negative exchange rate', () => {
    const tokenAmount = '100';
    const exchangeRate = -2;
    const fiatAmount = tokenToFiat(tokenAmount, exchangeRate);
    expect(fiatAmount).toBe('-200');
  });
});
