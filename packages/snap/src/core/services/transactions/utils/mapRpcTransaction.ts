import {
  TransactionStatus,
  TransactionType,
  type Transaction,
} from '@metamask/keyring-api';
import { address as asAddress, type Address } from '@solana/kit';

import type { SolanaKeyringAccount } from '../../../../entities/keyring-account';
import { type Network } from '../../../constants/solana';
import type { SolanaTransaction } from '../../../types/solana';
import logger from '../../../utils/logger';
import { parseTransactionNativeTransfers } from './parseTransactionNativeTransfers';
import { parseTransactionNativeTransfersV2 } from './parseTransactionNativeTransfersV2';
import { parseTransactionSplTransfers } from './parseTransactionSplTransfers';

/**
 * Maps RPC transaction data to a standardized format.
 * @param params - The options object.
 * @param params.transactionData - The raw transaction data from the RPC response.
 * @param params.account - The account associated with the transaction.
 * @param params.scope - The network scope (e.g., Mainnet, Devnet).
 * @returns The mapped transaction data.
 */
export function mapRpcTransaction({
  transactionData,
  account,
  scope,
}: {
  transactionData: SolanaTransaction;
  account: SolanaKeyringAccount;
  scope: Network;
}): Transaction | null {
  try {
    const { blockTime } = transactionData;
    const { id: accountId, address } = account;

    const id = transactionData.transaction.signatures[0];
    if (!id) {
      throw new Error('Transaction ID is required');
    }

    const timestamp = Number(blockTime);
    const status = evaluateTransactionStatus(transactionData);

    let fees: Transaction['fees'] = [];
    let nativeFrom: Transaction['from'] = [];
    let nativeTo: Transaction['to'] = [];

    /**
     * If a transaction fails we don't really have access to meaningful `preBalances`
     * and `postBalances` values, since nothing really happened. To extract information
     * from it we have created this second version of the native transfers parser which
     * reads instructions directly, instead of relying on balance differences.
     */
    const parser =
      status === TransactionStatus.Failed
        ? parseTransactionNativeTransfersV2
        : parseTransactionNativeTransfers;

    const nativeTransfers = parser({
      scope,
      transactionData,
    });

    fees = nativeTransfers.fees;
    nativeFrom = nativeTransfers.from;
    nativeTo = nativeTransfers.to;

    const { from: splFrom, to: splTo } = parseTransactionSplTransfers({
      scope,
      transactionData,
    });

    let from = [...splFrom, ...nativeFrom];
    let to = [...splTo, ...nativeTo];

    const type = evaluateTransactionType({
      address: asAddress(address),
      status,
      from,
      to,
    });

    if (type === TransactionType.Swap) {
      /**
       * If the type is swap:
       * - we don't want to include assets that were sent by other addresses
       * - we don't want to include assets that were received by other addresses
       * - if there are SPL tokens AND SOL in the from and to arrays, we want to remove the SOL
       */
      from = from.filter((fromItem) => fromItem.address === address);
      to = to.filter((toItem) => toItem.address === address);
    }

    if (type === TransactionType.Receive) {
      /**
       * If the type is receive:
       * - we don't want to include assets that were received by other addresses
       * - we don't want to include fees as they were not paid by the user
       */
      to = to.filter((toItem) => toItem.address === address);
      fees = [];
    }

    return {
      id,
      account: accountId,
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
  } catch (error) {
    logger.warn(error, 'Error mapping transaction');
    return null;
  }
}

/**
 * Evaluates the status of a transaction based on the transaction data.
 * @param transactionData - The transaction data.
 * @returns The status of the transaction.
 */
function evaluateTransactionStatus(
  transactionData: SolanaTransaction,
): TransactionStatus {
  const isError =
    transactionData.meta?.err ||
    (transactionData.meta?.status && 'Err' in transactionData.meta.status);

  const status = isError
    ? TransactionStatus.Failed
    : TransactionStatus.Confirmed;

  return status;
}

/**
 * Evaluates the type of transaction based on the address and the from and to items.
 * @param params - The options object.
 * @param params.address - The address of the user.
 * @param params.from - The from items.
 * @param params.to - The to items.
 * @param params.status - The status of the transaction.
 * @returns The type of transaction.
 */
function evaluateTransactionType({
  address,
  status,
  from,
  to,
}: {
  address: Address;
  status: TransactionStatus;
  from: Transaction['from'];
  to: Transaction['to'];
}): TransactionType {
  if (
    from.length === 0 ||
    to.length === 0 ||
    status === TransactionStatus.Failed
  ) {
    return TransactionType.Unknown;
  }

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
