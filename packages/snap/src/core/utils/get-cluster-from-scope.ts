import { SolanaCaip2Networks } from '../constants/solana';

/**
 * Returns the cluster name from the given CAIP-2 scope.
 *
 * @param lookedUpScope - The CAIP-2 scope to look up.
 * @returns The cluster name or undefined if the scope is not found.
 */
export function getClusterFromScope(lookedUpScope: SolanaCaip2Networks) {
  for (const [scope, value] of Object.entries(SolanaCaip2Networks)) {
    if (value === lookedUpScope) {
      return scope as keyof typeof SolanaCaip2Networks;
    }
  }

  return undefined;
}
