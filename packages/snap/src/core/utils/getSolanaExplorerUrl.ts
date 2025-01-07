import type { Network } from '../constants/solana';
import { NETWORK_BLOCK_EXPLORER_URL, Networks } from '../constants/solana';

/**
 * Get the Solana Explorer URL for a given scope, type, and value.
 *
 * @param scope - The scope of the Solana network.
 * @param type - The type of the value to explore.
 * @param value - The value to explore.
 * @returns The Solana Explorer URL.
 */
export function getSolanaExplorerUrl(
  scope: Network,
  type: 'address' | 'tx',
  value: string,
) {
  const { cluster } = Networks[scope];
  return `${NETWORK_BLOCK_EXPLORER_URL}/${type}/${value}${
    cluster ? `?cluster=${cluster}` : ''
  }`;
}
