import type { Network } from '../constants/solana';

/**
 * Gets the balances after a transaction.
 * @param options0 - The options object.
 * @param options0.scope - The network scope (e.g., Mainnet, Devnet).
 * @param options0.transaction - The transaction to get the balances after.
 */
export function getBalancesAfterTransaction({
  scope,
  transaction,
}: {
  scope: Network;
  transaction: Transaction;
}) {
  const balances = getBalancesBeforeTransaction({
    scope,
    transaction,
  });
}
