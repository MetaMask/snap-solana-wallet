import { Network } from '../constants/solana';
import { addressToCaip10 } from './addressToCaip10';

describe('addressToCaip10', () => {
  const testAddress = 'BLw3RweJmfbTapJRgnPRvd962YDjFYAnVGd1p5hmZ5tP';

  it('correctly formats mainnet addresses', () => {
    const result = addressToCaip10(Network.Mainnet, testAddress);
    expect(result).toBe(
      `solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp:${testAddress}`,
    );
  });

  it('correctly formats devnet addresses', () => {
    const result = addressToCaip10(Network.Devnet, testAddress);
    expect(result).toBe(
      `solana:EtWTRABZaYq6iMfeYKouRu166VU2xqa1:${testAddress}`,
    );
  });

  it('correctly formats testnet addresses', () => {
    const result = addressToCaip10(Network.Testnet, testAddress);
    expect(result).toBe(
      `solana:4uhcVJyU9pJkvQyS88uRDiswHXSCkY3z:${testAddress}`,
    );
  });
});
