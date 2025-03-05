import type { Transaction } from '@metamask/keyring-api';
import BigNumber from 'bignumber.js';

import {
  LAMPORTS_PER_SOL,
  Networks,
  type Network,
} from '../../../constants/solana';
import type { SolanaTransaction } from '../../../types/solana';
import { parseTransactionFees } from './parseTransactionFees';

/**
 * Parses native SOL token transfers from a transaction.
 * @param options0 - The options object.
 * @param options0.scope - The network scope (e.g., Mainnet, Devnet).
 * @param options0.transactionData - The raw transaction data containing balance changes.
 * @returns Transaction details.
 */
export function parseTransactionNativeTransfers({
  scope,
  transactionData,
}: {
  scope: Network;
  transactionData: SolanaTransaction;
}): {
  fees: Transaction['fees'];
  from: Transaction['from'];
  to: Transaction['to'];
} {
  const fees = parseTransactionFees({
    scope,
    transactionData,
  });

  const from: Transaction['from'] = [];
  const to: Transaction['to'] = [];

  const preBalances = new Map(
    transactionData.meta?.preBalances?.map((balance, index) => [
      index,
      new BigNumber(balance.toString()),
    ]) ?? [],
  );

  const postBalances = new Map(
    transactionData.meta?.postBalances?.map((balance, index) => [
      index,
      new BigNumber(balance.toString()),
    ]) ?? [],
  );

  /**
   * The indexes of accounts can be higher than account keys. Don't forget `loadedAddresses`!
   * https://solana.stackexchange.com/questions/11981/the-account-index-does-not-exist-in-accountkeys
   */
  const allAccountAddresses = [
    ...transactionData.transaction.message.accountKeys,
    ...(transactionData.meta?.loadedAddresses?.writable ?? []),
    ...(transactionData.meta?.loadedAddresses?.readonly ?? []),
  ];

  /**
   * Track all accounts that had SOL balance changes
   */
  const allAccountIndexes = new Set([
    ...Array.from(preBalances.keys()),
    ...Array.from(postBalances.keys()),
  ]);

  for (const accountIndex of allAccountIndexes) {
    const address = allAccountAddresses[accountIndex]?.toString();

    if (!address) {
      continue;
    }

    const preBalance = preBalances.get(accountIndex) ?? new BigNumber(0);
    const postBalance = postBalances.get(accountIndex) ?? new BigNumber(0);

    /**
     * Calculate the delta between the balances and convert from lamports to SOL.
     */
    let balanceDiff = postBalance
      .minus(preBalance)
      .absoluteValue()
      .dividedBy(new BigNumber(LAMPORTS_PER_SOL));

    /**
     * For the fee payer, subtract the fees from the balance difference
     * since we are counting them separately.
     */
    if (accountIndex === 0) {
      const totalFees = fees
        .reduce((acc, currentFee) => {
          if (currentFee.asset.fungible) {
            return acc.plus(currentFee.asset.amount);
          }

          return acc;
        }, new BigNumber(0))
        .decimalPlaces(8, BigNumber.ROUND_DOWN);

      balanceDiff = balanceDiff.minus(totalFees);
    }

    if (balanceDiff.isZero()) {
      continue;
    }

    const amount = balanceDiff.toString();

    /**
     * If the pre-balance is greater than the post-balance, it means that the account
     * has lost SOL, so it's a sender.
     */
    if (preBalance.isGreaterThan(postBalance)) {
      from.push({
        address,
        asset: {
          fungible: true,
          type: Networks[scope].nativeToken.caip19Id,
          unit: Networks[scope].nativeToken.symbol,
          amount,
        },
      });
    }

    /**
     * If the pre-balance is less than the post-balance, it means that the account
     * has gained SOL, so it's a receiver.
     */
    if (preBalance.isLessThan(postBalance)) {
      to.push({
        address,
        asset: {
          fungible: true,
          type: Networks[scope].nativeToken.caip19Id,
          unit: Networks[scope].nativeToken.symbol,
          amount,
        },
      });
    }
  }

  return { fees, from, to };
}
