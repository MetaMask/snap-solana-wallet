import type { Network } from '../constants/solana';
import {
  DEFAULT_NETWORK_BLOCK_EXPLORER_URL,
  Networks,
} from '../constants/solana';
import { buildUrl } from './buildUrl';

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

  const url = buildUrl({
    baseUrl:
      // eslint-disable-next-line no-restricted-globals
      process.env.EXPLORER_BASE_URL ?? DEFAULT_NETWORK_BLOCK_EXPLORER_URL,
    path: `/${type}/${value}`,
    queryParams: cluster ? { cluster } : undefined,
  });

  return url;
}
