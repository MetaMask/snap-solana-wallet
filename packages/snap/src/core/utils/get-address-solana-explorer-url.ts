import { SolanaCaip2Networks } from '../constants/solana';

const scopeToCluster: Record<
  SolanaCaip2Networks,
  'mainnet' | 'devnet' | 'testnet' | 'localnet'
> = {
  [SolanaCaip2Networks.Mainnet]: 'mainnet',
  [SolanaCaip2Networks.Devnet]: 'devnet',
  [SolanaCaip2Networks.Testnet]: 'testnet',
  [SolanaCaip2Networks.Localnet]: 'localnet',
};

/**
 * Returns the URL to the Solana explorer for a given address.
 *
 * @param scope - The scope of the address.
 * @param address - The address to get the URL for.
 * @returns The URL to the Solana explorer for the given address.
 */
export function getAddressSolanaExplorerUrl(
  scope: SolanaCaip2Networks,
  address: string,
) {
  const cluster = scopeToCluster[scope];
  return `https://explorer.solana.com/address/${address}?cluster=${cluster}`;
}
