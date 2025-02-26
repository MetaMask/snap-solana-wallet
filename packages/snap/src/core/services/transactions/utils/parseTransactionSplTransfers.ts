import type { Transaction } from '@metamask/keyring-api';
import BigNumber from 'bignumber.js';

import type { Network } from '../../../constants/solana';
import type { SolanaTransaction } from '../../../types/solana';
import { tokenAddressToCaip19 } from '../../../utils/tokenAddressToCaip19';

/**
 * Parses SPL token transfers from a transaction data object.
 * @param options0 - The options object.
 * @param options0.scope - The network scope (e.g., Mainnet, Devnet).
 * @param options0.transactionData - The raw transaction data containing token balance changes.
 * @returns Transaction transfer details.
 */
export function parseTransactionSplTransfers({
  scope,
  transactionData,
}: {
  scope: Network;
  transactionData: SolanaTransaction;
}): {
  from: Transaction['from'];
  to: Transaction['to'];
} {
  const from: Transaction['from'] = [];
  const to: Transaction['to'] = [];

  const preBalances = new Map(
    transactionData.meta?.preTokenBalances?.map((balance) => [
      balance.accountIndex,
      new BigNumber(balance.uiTokenAmount.amount),
    ]) ?? [],
  );

  const postBalances = new Map(
    transactionData.meta?.postTokenBalances?.map((balance) => [
      balance.accountIndex,
      new BigNumber(balance.uiTokenAmount.amount),
    ]) ?? [],
  );

  // Track all accounts that had token balance changes
  const allAccountIndexes = new Set([
    ...(transactionData.meta?.preTokenBalances?.map((b) => b.accountIndex) ??
      []),
    ...(transactionData.meta?.postTokenBalances?.map((b) => b.accountIndex) ??
      []),
  ]);

  for (const accountIndex of allAccountIndexes) {
    const preBalance = preBalances.get(accountIndex) ?? new BigNumber(0);
    const postBalance = postBalances.get(accountIndex) ?? new BigNumber(0);
    const balanceDiff = postBalance.minus(preBalance);

    if (balanceDiff.isEqualTo(0)) {
      continue;
    }

    const tokenDetails =
      transactionData.meta?.preTokenBalances?.find(
        (b) => b.accountIndex === accountIndex,
      ) ??
      transactionData.meta?.postTokenBalances?.find(
        (b) => b.accountIndex === accountIndex,
      );

    if (!tokenDetails) {
      continue;
    }

    const {
      mint,
      uiTokenAmount: { decimals },
      owner,
    } = tokenDetails;

    const caip19Id = tokenAddressToCaip19(scope, mint);

    if (!owner) {
      continue;
    }

    const amount = balanceDiff
      .absoluteValue()
      .dividedBy(new BigNumber(10).pow(decimals))
      .toString();

    if (balanceDiff.isNegative()) {
      from.push({
        address: owner,
        asset: {
          fungible: true,
          type: caip19Id,
          unit: '', // This will get overwritten by the token metadata when we fetch it
          amount,
        },
      });
    }

    if (balanceDiff.isPositive()) {
      to.push({
        address: owner,
        asset: {
          fungible: true,
          type: caip19Id,
          unit: '', // This will get overwritten by the token metadata when we fetch it
          amount,
        },
      });
    }
  }

  return { from, to };
}
