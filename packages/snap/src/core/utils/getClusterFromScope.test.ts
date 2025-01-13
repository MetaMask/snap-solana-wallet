import { Network } from '../constants/solana';
import { getClusterFromScope } from './getClusterFromScope';

describe('getClusterFromScope', () => {
  it('returns "Mainnet" for mainnet network', () => {
    const result = getClusterFromScope(Network.Mainnet);
    expect(result).toBe('Mainnet');
  });

  it('returns "Devnet" for devnet network', () => {
    const result = getClusterFromScope(Network.Devnet);
    expect(result).toBe('Devnet');
  });

  it('returns "Testnet" for testnet network', () => {
    const result = getClusterFromScope(Network.Testnet);
    expect(result).toBe('Testnet');
  });

  it('returns undefined for unknown network value', () => {
    const result = getClusterFromScope('invalid:network' as unknown as Network);
    expect(result).toBeUndefined();
  });
});
