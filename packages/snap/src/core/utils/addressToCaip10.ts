import type { Caip10Address, Network } from '../constants/solana';

/**
 * Converts a Solana address to a CAIP-10 address.
 *
 * @param scope - The network scope.
 * @param address - The Solana address.
 * @returns The CAIP-10 address.
 */
export function addressToCaip10(
  scope: Network,
  address: string,
): Caip10Address {
  return `${scope}:${address}`;
}
