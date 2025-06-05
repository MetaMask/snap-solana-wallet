import type { TransactionScanError } from '../../../../core/services/transaction-scan/types';
import type { Preferences } from '../../../../core/types/snap';
import { i18n } from '../../../../core/utils/i18n';

/**
 * Maps error codes to user-friendly messages
 */
const ERROR_MESSAGES: Record<string, string> = {
  AccountAlreadyInUse: 'transactionScan.errors.accountAlreadyInUse',
  ResultWithNegativeLamports: 'transactionScan.errors.insufficientSol',
  SlippageToleranceExceeded: 'transactionScan.errors.slippageToleranceExceeded', // Jupiter
  ExceededDesiredSlippageLimit:
    'transactionScan.errors.slippageToleranceExceeded', // Raydium
};

/**
 * Gets a user-friendly message from a transaction scan error.
 * @param error - The error of the transaction scan.
 * @param preferences - The user preferences containing locale information.
 * @returns A user-friendly error message, or the original error code if no mapping exists.
 */
export function getErrorMessage(
  error: TransactionScanError,
  preferences: Preferences,
): string {
  const translate = i18n(preferences.locale);
  const { code } = error;

  const translationKey =
    (code && ERROR_MESSAGES[code]) ?? 'transactionScan.errors.unknownError';

  return translate(translationKey as keyof typeof translate);
}
