import {
  TransactionStatus,
  TransactionType,
  type Transaction,
} from '@metamask/keyring-api';
import { type Address } from '@solana/kit';
import { BigNumber } from 'bignumber.js';

import { KnownCaip19Id, type Network } from '../../../constants/solana';
import type { SolanaTransaction } from '../../../domain';
import { parseTransactionNativeTransfers } from './parseTransactionNativeTransfers';
import { parseTransactionNativeTransfersV2 } from './parseTransactionNativeTransfersV2';
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
    address,
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

  const isLegitimate = evaluateTransactionLegitimacy({
    address,
    from,
    to,
    type,
    status,
  });

  if (!isLegitimate) {
    return null;
  }

  /**
   * We cannot do this filtering earlier because we need to use the incomplete
   * mapped `from` and `to` arrays to determine the transaction's legitimacy.
   * For failed transactions, we need to first check if they are not spam before
   * finally clearing out what we had mapped to `from` and `to`.
   */
  if (status === TransactionStatus.Failed) {
    from = [];
    to = [];
  }

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

/**
 * Spam Filter #1 Check: Sufficient SOL Amount Received
 *
 * Checks if the received SOL amount meets a minimum threshold (0.001 SOL).
 * Transactions receiving less than this are considered potentially spam.
 * Returns true if the amount is sufficient or if no SOL was received.
 *
 * @param params - The options object.
 * @param params.address - The address of the user.
 * @param params.to - The transaction's destination items.
 * @returns Whether the transaction passes the minimum SOL amount check (true = passes/legitimate).
 */
function passesSOLAmountThresholdCheck({
  address,
  to,
}: {
  address: Address;
  to: Transaction['from'];
}): boolean {
  const { hasReceivedSOL, receivedSOLAmount } = to.reduce(
    (acc, toItem) => {
      if (
        toItem.address === address &&
        toItem.asset?.fungible &&
        (toItem.asset.type === KnownCaip19Id.SolMainnet ||
          toItem.asset.type === KnownCaip19Id.SolDevnet)
      ) {
        return {
          hasReceivedSOL: true,
          receivedSOLAmount: acc.receivedSOLAmount.plus(toItem.asset.amount),
        };
      }

      return acc;
    },
    { hasReceivedSOL: false, receivedSOLAmount: new BigNumber(0) },
  );

  if (!hasReceivedSOL || receivedSOLAmount.isGreaterThanOrEqualTo(0.001)) {
    return true;
  }

  return false;
}

/**
 * Evaluates the legitimacy of a transaction based on various checks.
 * @param params - The options object.
 * @param params.address - The address of the user.
 * @param params.from - The from items.
 * @param params.to - The to items.
 * @param params.type - The type of transaction.
 * @param params.status - The status of the transaction.
 * @returns Whether the transaction is considered legitimate (true = legitimate, false = spam).
 */
function evaluateTransactionLegitimacy({
  address,
  from,
  to,
  type,
  status,
}: {
  address: Address;
  from: Transaction['from'];
  to: Transaction['to'];
  type: TransactionType;
  status: TransactionStatus;
}): boolean {
  if (
    type === TransactionType.Receive &&
    !passesSOLAmountThresholdCheck({ address, to })
  ) {
    return false;
  }

  if (
    status === TransactionStatus.Failed &&
    !passesSOLAmountThresholdCheck({ address, to })
  ) {
    return false;
  }

  return true;
}
