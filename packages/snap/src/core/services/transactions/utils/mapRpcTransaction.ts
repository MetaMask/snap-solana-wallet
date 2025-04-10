import {
  TransactionStatus,
  TransactionType,
  type Transaction,
} from '@metamask/keyring-api';
import type { Address } from '@solana/kit';

import type { Network } from '../../../constants/solana';
import type { SolanaTransaction } from '../../../types/solana';
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
}): Transaction | null {
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

  let type = evaluateTransactionType({
    address,
    from,
    to,
  });

  if (type === TransactionType.Swap) {
    // if type is swap, use only show the items where the user is the sender and receiver
    from = from.filter((fromItem) => fromItem.address === address);
    to = to.filter((toItem) => toItem.address === address);
  }

  if (type === TransactionType.Receive) {
    // if user receives, we don't need to show the fees as they were not paid by the user
    fees = [];
  }

  if (from.length === 0 || to.length === 0) {
    // if we are unable to determine the type of transaction, we should set it to unknown
    type = TransactionType.Unknown;
  }

  const status =
    transactionData.meta?.err ||
    (transactionData.meta?.status && 'Err' in transactionData.meta.status)
      ? TransactionStatus.Failed
      : TransactionStatus.Confirmed;

  return {
    id,
    account: address,
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
  from: Transaction['from'];
  to: Transaction['to'];
}): TransactionType {
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
    return TransactionType.Send;
  }

  if (isAddressSender && isAddressReceiver) {
    return TransactionType.Swap;
  }

  if (isAddressSender) {
    return TransactionType.Send;
  }

  return TransactionType.Receive;
}
