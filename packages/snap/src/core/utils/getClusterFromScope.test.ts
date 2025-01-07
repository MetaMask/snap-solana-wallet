import { SolanaCaip2Networks } from '../constants/solana';
import { getClusterFromScope } from './getClusterFromScope';

describe('getClusterFromScope', () => {
  it('returns "Mainnet" for mainnet network', () => {
    const result = getClusterFromScope(SolanaCaip2Networks.Mainnet);
    expect(result).toBe('Mainnet');
  });

  it('returns "Devnet" for devnet network', () => {
    const result = getClusterFromScope(SolanaCaip2Networks.Devnet);
    expect(result).toBe('Devnet');
  });

  it('returns "Testnet" for testnet network', () => {
    const result = getClusterFromScope(SolanaCaip2Networks.Testnet);
    expect(result).toBe('Testnet');
  });

  it('returns undefined for unknown network value', () => {
    const result = getClusterFromScope(
      'invalid:network' as unknown as SolanaCaip2Networks,
    );
    expect(result).toBeUndefined();
  });
});
