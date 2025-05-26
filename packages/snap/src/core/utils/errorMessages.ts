import type { Preferences } from '../types/snap';
import { i18n } from './i18n';

/**
 * Maps error codes to user-friendly messages
 */
export const ERROR_MESSAGES: Record<string, string> = {
  AccountAlreadyInUse: 'errors.accountAlreadyInUse',
  ResultWithNegativeLamports: 'errors.insufficientSol',
  SlippageToleranceExceeded: 'errors.slippageToleranceExceeded', // Jupiter
  ExceededDesiredSlippageLimit: 'errors.slippageToleranceExceeded', // Raydium
};

/**
 * Gets a user-friendly message for an error code.
 * @param errorCode - The error code to get a message for.
 * @param preferences - The user preferences containing locale information.
 * @returns A user-friendly error message, or the original error code if no mapping exists.
 */
export function getErrorMessage(
  errorCode: string,
  preferences: Preferences,
): string {
  const translate = i18n(preferences.locale);
  const translationKey = ERROR_MESSAGES[errorCode];

  if (!translationKey) {
    return errorCode;
  }

  return translate(translationKey as keyof typeof translate);
}
