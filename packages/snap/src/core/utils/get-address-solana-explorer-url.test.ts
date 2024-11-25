import { SolanaCaip2Networks } from '../constants/solana';
import { getAddressSolanaExplorerUrl } from './get-address-solana-explorer-url';

describe('getAddressSolanaExplorerUrl', () => {
  it('generates correct mainnet explorer URL', () => {
    const addresses = [
      'BLw3RweJmfbTapJRgnPRvd962YDjFYAnVGd1p5hmZ5tP',
      '5FHwkrdxkjPmWfYkXyJ2NakXVw7iYXmiWgZEx9yxRr7q',
      'GWzkuQHcHyAtkLVXVqfbJAcbZFqgXC6yRXHCcqrJGq9F',
    ];

    addresses.forEach((address) => {
      const result = getAddressSolanaExplorerUrl(
        SolanaCaip2Networks.Mainnet,
        address,
      );
      expect(result).toBe(
        `https://explorer.solana.com/address/${address}?cluster=mainnet`,
      );
    });
  });

  it('generates correct devnet explorer URL', () => {
    const addresses = [
      'BLw3RweJmfbTapJRgnPRvd962YDjFYAnVGd1p5hmZ5tP',
      '5FHwkrdxkjPmWfYkXyJ2NakXVw7iYXmiWgZEx9yxRr7q',
      'GWzkuQHcHyAtkLVXVqfbJAcbZFqgXC6yRXHCcqrJGq9F',
    ];

    addresses.forEach((address) => {
      const result = getAddressSolanaExplorerUrl(
        SolanaCaip2Networks.Devnet,
        address,
      );
      expect(result).toBe(
        `https://explorer.solana.com/address/${address}?cluster=devnet`,
      );
    });
  });

  it('generates correct testnet explorer URL', () => {
    const addresses = [
      'BLw3RweJmfbTapJRgnPRvd962YDjFYAnVGd1p5hmZ5tP',
      '5FHwkrdxkjPmWfYkXyJ2NakXVw7iYXmiWgZEx9yxRr7q',
      'GWzkuQHcHyAtkLVXVqfbJAcbZFqgXC6yRXHCcqrJGq9F',
    ];

    addresses.forEach((address) => {
      const result = getAddressSolanaExplorerUrl(
        SolanaCaip2Networks.Testnet,
        address,
      );
      expect(result).toBe(
        `https://explorer.solana.com/address/${address}?cluster=testnet`,
      );
    });
  });
});
