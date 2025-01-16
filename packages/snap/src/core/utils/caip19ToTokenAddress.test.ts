import { caip19ToTokenAddress } from './caip19ToTokenAddress';

describe('caip19ToTokenAddress', () => {
  it('extracts token address from valid CAIP-19 ID', () => {
    const caip19Id =
      'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp/token:EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v';
    const tokenAddress = caip19ToTokenAddress(caip19Id);
    expect(tokenAddress).toBe('EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v');
  });

  it('throws error for invalid CAIP-19 ID without token part', () => {
    const invalidCaip19Id = 'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp';
    expect(() => caip19ToTokenAddress(invalidCaip19Id)).toThrow(
      'Invalid CAIP-19 ID',
    );
  });

  it('throws error for empty string', () => {
    expect(() => caip19ToTokenAddress('')).toThrow('Invalid CAIP-19 ID');
  });

  it('handles CAIP-19 ID with multiple colons correctly', () => {
    const caip19Id =
      'solana:test:network/token:So11111111111111111111111111111111111111112';
    const tokenAddress = caip19ToTokenAddress(caip19Id);
    expect(tokenAddress).toBe('So11111111111111111111111111111111111111112');
  });
});
