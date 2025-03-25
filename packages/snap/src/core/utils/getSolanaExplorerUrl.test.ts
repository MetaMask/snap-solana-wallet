import { Network } from '../constants/solana';
import { getSolanaExplorerUrl } from './getSolanaExplorerUrl';

describe('getSolanaExplorerUrl', () => {
  const mockAddress = '5AcFMJZkXo14r3Hj99iYd1HScPiM4hAcLZf961Qs7y7';
  const mockTx =
    '4RPWUVqAqW6jHbVuZH5qJuvoJM6EeX9m9Q6PC1RkcYBW3J4zY9LuZPZqNiYNXGm5qL6GJgCB7JqhXqV8vkKxnAHd';

  it('should generate mainnet URL for address without cluster param', () => {
    const url = getSolanaExplorerUrl(Network.Mainnet, 'address', mockAddress);
    expect(url).toBe(
      `https://solscan.io/address/${mockAddress}?cluster=mainnet`,
    );
  });

  it('should generate devnet URL for address with cluster param', () => {
    const url = getSolanaExplorerUrl(Network.Devnet, 'address', mockAddress);
    expect(url).toBe(
      `https://solscan.io/address/${mockAddress}?cluster=devnet`,
    );
  });

  it('should generate testnet URL for address with cluster param', () => {
    const url = getSolanaExplorerUrl(Network.Testnet, 'address', mockAddress);
    expect(url).toBe(
      `https://solscan.io/address/${mockAddress}?cluster=testnet`,
    );
  });

  it('should generate mainnet URL for transaction without cluster param', () => {
    const url = getSolanaExplorerUrl(Network.Mainnet, 'tx', mockTx);
    expect(url).toBe(`https://solscan.io/tx/${mockTx}?cluster=mainnet`);
  });

  it('should generate devnet URL for transaction with cluster param', () => {
    const url = getSolanaExplorerUrl(Network.Devnet, 'tx', mockTx);
    expect(url).toBe(`https://solscan.io/tx/${mockTx}?cluster=devnet`);
  });

  it('should generate testnet URL for transaction with cluster param', () => {
    const url = getSolanaExplorerUrl(Network.Testnet, 'tx', mockTx);
    expect(url).toBe(`https://solscan.io/tx/${mockTx}?cluster=testnet`);
  });
});
