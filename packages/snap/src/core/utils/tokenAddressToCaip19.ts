import type { Network, TokenCaipAssetType } from '../constants/solana';

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
): TokenCaipAssetType {
  return `${scope}/token:${address}`;
}
