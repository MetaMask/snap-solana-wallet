import type { Transaction } from '@metamask/keyring-api';
import { TransactionStatus, TransactionType } from '@metamask/keyring-api';
import BigNumber from 'bignumber.js';

import type { SolanaKeyringAccount } from '../../../../entities';
import { KnownCaip19Id } from '../../../constants/solana';

// A function that returns true if it believes that the passed transaction is a spam, or false if it believes it's legitimate.
type SpamDetector = (
  transaction: Transaction,
  account: SolanaKeyringAccount,
) => boolean;

/**
 * Spam Detector #1: It categorizes transactions as spam if they receive less than 0.001 SOL.
 *
 * @param transaction - The transaction to evaluate.
 * @param account - The account associated with the transaction.
 * @returns Whether the transaction passes the minimum SOL amount check (true = passes/legitimate).
 */
const isSolAmountLowerThanThreshold: SpamDetector = (
  transaction,
  account,
): boolean => {
  const { to, type, status } = transaction;
  const { address } = account;

  // This checker only applies to receive transactions or failed transactions.
  const isApplicable =
    type === TransactionType.Receive || status === TransactionStatus.Failed;

  if (!isApplicable) {
    return false;
  }

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

  return hasReceivedSOL && receivedSOLAmount.isLessThan(0.001);
};

/**
 * Evaluates the legitimacy of a transaction based on various detectors.
 * @param transaction - The transaction to evaluate.
 * @param account - The account associated with the transaction.
 * @returns True if the transaction is spam, false if it's legitimate.
 */
export function isSpam(
  transaction: Transaction,
  account: SolanaKeyringAccount,
): boolean {
  const detectors: SpamDetector[] = [
    isSolAmountLowerThanThreshold,
    // Register more detectors here.
  ];

  return detectors.some((detect) => detect(transaction, account));
}
