import { getNetworkFromToken } from './getNetworkFromToken';

describe('getNetworkFromToken', () => {
  it('correctly extracts network from a valid CAIP-19 token string', () => {
    const result = getNetworkFromToken(
      'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp/USDC',
    );
    expect(result).toBe('solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp');
  });
});
