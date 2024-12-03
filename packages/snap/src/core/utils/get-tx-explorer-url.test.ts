import { SolanaCaip2Networks } from '../constants/solana';
import { getTransactionSolanaExplorerUrl } from './get-tx-explorer-url';

describe('getTransactionSolanaExplorerUrl', () => {
  const mockSignature =
    '4RPWXt8TKZqGXzxK5E5cdQ9calB5HoQDKtHNxnZn9susDkh8xyxnd3UqbsWHwvsHsqTbvp8BFhDXQQqyABbvSnhF';

  it('should return mainnet explorer URL without cluster param', () => {
    const url = getTransactionSolanaExplorerUrl(
      SolanaCaip2Networks.Mainnet,
      mockSignature,
    );
    expect(url).toBe(`https://explorer.solana.com/tx/${mockSignature}`);
  });

  it('should return devnet explorer URL with cluster param', () => {
    const url = getTransactionSolanaExplorerUrl(
      SolanaCaip2Networks.Devnet,
      mockSignature,
    );
    expect(url).toBe(
      `https://explorer.solana.com/tx/${mockSignature}?cluster=devnet`,
    );
  });
});
