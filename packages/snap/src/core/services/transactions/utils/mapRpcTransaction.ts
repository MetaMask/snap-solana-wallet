import type { Address } from '@solana/web3.js';

import type { Network } from '../../../constants/solana';
import type { SolanaTransaction } from '../../../types/solana';
import type { MappedTransaction } from '../types';
import { parseTransactionNativeTransfers } from './parseTransactionNativeTransfers';
import { parseTransactionSplTransfers } from './parseTransactionSplTransfers';

/**
 * Maps RPC transaction data to a standardized format.
 * @param options0 - The options object.
 * @param options0.scope - The network scope (e.g., Mainnet, Devnet).
 * @param options0.address - The account address associated with the transaction.
 * @param options0.transactionData - The raw transaction data from the RPC response.
 * @returns The mapped transaction data.
 */
export function mapRpcTransaction({
  scope,
  address,
  transactionData,
}: {
  scope: Network;
  address: Address;
  transactionData: SolanaTransaction | null;
}): MappedTransaction | null {
  if (!transactionData) {
    return null;
  }

  const firstSignature = transactionData.transaction.signatures[0];

  if (!firstSignature) {
    return null;
  }

  const id = firstSignature as string;
  const timestamp = Number(transactionData.blockTime);

  const {
    fees,
    from: nativeFrom,
    to: nativeTo,
  } = parseTransactionNativeTransfers({
    scope,
    transactionData,
  });

  const { from: splFrom, to: splTo } = parseTransactionSplTransfers({
    scope,
    transactionData,
  });

  const from = [...nativeFrom, ...splFrom];
  const to = [...nativeTo, ...splTo];

  /**
   * If any of the transfers sources (native or SPL) include our account's address,
   * we'll consider this a send, since it means we initiated the transfer.
   * Otherwise, it's a receive.
   */
  const type = from.some(({ address: fromAddress }) => fromAddress === address)
    ? 'send'
    : 'receive';

  return {
    id,
    timestamp,
    chain: scope as `${string}:${string}`,
    status: 'confirmed',
    type,
    from,
    to,
    fees,
    events: [
      {
        status: 'confirmed',
        timestamp,
      },
    ],
  };
}
