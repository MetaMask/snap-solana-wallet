import { Network } from '../constants/solana';

/**
 * Returns the cluster name from the given CAIP-2 scope.
 *
 * @param lookedUpScope - The CAIP-2 scope to look up.
 * @returns The cluster name or undefined if the scope is not found.
 */
export function getClusterFromScope(lookedUpScope: Network) {
  for (const [scope, value] of Object.entries(Network)) {
    if (value === lookedUpScope) {
      return scope as keyof typeof Network;
    }
  }

  return undefined;
}
