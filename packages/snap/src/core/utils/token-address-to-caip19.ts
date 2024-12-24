import type { SolanaCaip2Networks } from '../constants/solana';

/**
 * Converts a token address to a CAIP-19 identifier.
 *
 * @param scope - The network scope.
 * @param address - The token address.
 * @returns The CAIP-19 identifier.
 */
export function tokenAddressToCaip19(
  scope: SolanaCaip2Networks,
  address: string,
): string {
  return `${scope}/token:${address}`;
}
