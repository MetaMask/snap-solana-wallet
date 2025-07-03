import type { Network, TokenCaip19Id } from '../constants/solana';

/**
 * Converts a token address to a CAIP-19 identifier.
 *
 * @param scope - The network scope.
 * @param address - The token address.
 * @returns The CAIP-19 identifier.
 */
export function tokenAddressToCaip19(
  scope: Network,
  address: string,
): TokenCaip19Id {
  return `${scope}/token:${address}`;
}
