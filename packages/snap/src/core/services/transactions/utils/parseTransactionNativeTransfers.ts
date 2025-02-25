import type { Transaction } from '@metamask/keyring-api';

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

  // Get the fee payer (first account in accountKeys)
  const feePayer = transactionData.transaction.message.accountKeys[0];
  const feeAmount = BigInt(transactionData.meta?.fee ?? 0);

  const preBalances = new Map(
    transactionData.meta?.preBalances.map((balance, index) => [
      index,
      BigInt(balance),
    ]) ?? [],
  );

  const postBalances = new Map(
    transactionData.meta?.postBalances.map((balance, index) => [
      index,
      BigInt(balance),
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
    const preBalance = preBalances.get(accountIndex) ?? BigInt(0);
    const postBalance = postBalances.get(accountIndex) ?? BigInt(0);
    let balanceDiff = postBalance - preBalance;

    const accountAddress = allAccountAddresses[accountIndex];

    // TODO: Investigate, how can this be undefined? Link to documentation
    if (!accountAddress) {
      continue;
    }

    // Adjust balance difference for fee payer to exclude the transaction fee
    if (accountAddress === feePayer) {
      balanceDiff += feeAmount;
    }

    if (balanceDiff === BigInt(0)) {
      continue;
    }

    const amount = Number(Math.abs(Number(balanceDiff))) / LAMPORTS_PER_SOL;

    if (balanceDiff < BigInt(0)) {
      from.push({
        address: accountAddress.toString(),
        asset: {
          fungible: true,
          type: Networks[scope].nativeToken.caip19Id,
          unit: Networks[scope].nativeToken.symbol,
          amount: amount.toString(),
        },
      });
    }

    if (balanceDiff > BigInt(0)) {
      to.push({
        address: accountAddress.toString(),
        asset: {
          fungible: true,
          type: Networks[scope].nativeToken.caip19Id,
          unit: Networks[scope].nativeToken.symbol,
          amount: amount.toString(),
        },
      });
    }
  }

  return { fees, from, to };
}
