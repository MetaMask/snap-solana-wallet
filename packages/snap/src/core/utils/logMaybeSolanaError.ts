import { getSystemErrorMessage, isSystemError } from '@solana-program/system';
import type { Address } from '@solana/kit';
import { isSolanaError } from '@solana/kit';

import logger from './logger';

type TransactionMessageIsh = {
  instructions: Record<
    number,
    {
      programAddress: Address;
    }
  >;
};

/**
 * Generic logging function for Solana errors.
 *
 * @param error - The Solana error to log.
 * @param transactionMessage - The transaction message to include in the error detail message.
 */
export const logMaybeSolanaError = (
  error: any,
  transactionMessage: TransactionMessageIsh = { instructions: {} },
) => {
  if (isSolanaError(error)) {
    const preflightErrorContext = error.context;
    const preflightErrorMessage = error.message;
    const errorDetailMessage = isSystemError(error.cause, transactionMessage)
      ? getSystemErrorMessage(error.cause.context.code)
      : error.cause;
    logger.error(
      preflightErrorContext,
      '%s: %s',
      preflightErrorMessage,
      errorDetailMessage,
    );
  }
};
