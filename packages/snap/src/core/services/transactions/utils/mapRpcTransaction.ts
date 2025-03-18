import type { Address } from '@solana/web3.js';

import type { Network } from '../../../constants/solana';
import type { SolanaTransaction } from '../../../types/solana';
import type { MappedTransaction } from '../types';
import { parseTransactionNativeTransfers } from './parseTransactionNativeTransfers';
import { parseTransactionSplTransfers } from './parseTransactionSplTransfers';

/**
 * Maps RPC transaction data to a standardized format.
 * @param params - The options object.
 * @param params.scope - The network scope (e.g., Mainnet, Devnet).
 * @param params.address - The account address associated with the transaction.
 * @param params.transactionData - The raw transaction data from the RPC response.
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

  const nativeTransfers = parseTransactionNativeTransfers({
    scope,
    transactionData,
  });

  let { fees } = nativeTransfers;
  const { from: nativeFrom, to: nativeTo } = nativeTransfers;

  const { from: splFrom, to: splTo } = parseTransactionSplTransfers({
    scope,
    transactionData,
  });

  let from = [...nativeFrom, ...splFrom];
  let to = [...nativeTo, ...splTo];

  const type = evaluateTransactionType({
    address,
    from,
    to,
  });

  if (type === 'swap') {
    from = from.filter((fromItem) => fromItem.address === address);
    to = to.filter((toItem) => toItem.address === address);
  }

  if (type === 'receive') {
    fees = [];
  }

  const status =
    transactionData.meta?.err ||
    (transactionData.meta?.status && 'Err' in transactionData.meta.status)
      ? 'failed'
      : 'confirmed';

  return {
    id,
    timestamp,
    chain: scope as `${string}:${string}`,
    status,
    type,
    from,
    to,
    fees,
    events: [
      {
        status,
        timestamp,
      },
    ],
  };
}

/**
 * Evaluates the type of transaction based on the address and the from and to items.
 * @param params - The options object.
 * @param params.address - The address of the user.
 * @param params.from - The from items.
 * @param params.to - The to items.
 * @returns The type of transaction.
 */
function evaluateTransactionType({
  address,
  from,
  to,
}: {
  address: Address;
  from: MappedTransaction['from'];
  to: MappedTransaction['to'];
}): MappedTransaction['type'] {
  const userSentItems = from.filter((fromItem) => fromItem.address === address);
  const userReceivedItems = to.filter((toItem) => toItem.address === address);

  const isAddressSender = userSentItems.length > 0;
  const isAddressReceiver = userReceivedItems.length > 0;

  const allSentItemsAreToSelf = from.every((fromItem) => {
    return to.some(
      (toItem) =>
        toItem.address === address &&
        fromItem.asset?.fungible === true &&
        toItem.asset?.fungible === true &&
        fromItem.asset.type === toItem.asset.type,
    );
  });

  const allReceivedItemsAreFromSelf = to.every((toItem) => {
    return from.some(
      (fromItem) =>
        fromItem.address === address &&
        fromItem.asset?.fungible === true &&
        toItem.asset?.fungible === true &&
        fromItem.asset.type === toItem.asset.type,
    );
  });

  const isSelfTransfer = allSentItemsAreToSelf && allReceivedItemsAreFromSelf;

  if (isSelfTransfer) {
    return 'send';
  }

  if (isAddressSender && isAddressReceiver) {
    return 'swap';
  }

  if (isAddressSender) {
    return 'send';
  }

  return 'receive';
}
