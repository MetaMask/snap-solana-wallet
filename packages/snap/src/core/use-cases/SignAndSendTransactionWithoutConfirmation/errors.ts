import { InternalError, InvalidParamsError } from '@metamask/snaps-sdk';

/**
 * Error thrown when the backend signature verification fails.
 */
export class InvalidBackendSignatureError extends InvalidParamsError {
  constructor(
    reason:
      | 'signatureVerificationFailed'
      | 'timestampExpired'
      | 'invalidSignatureFormat'
      | 'missingPublicKey',
  ) {
    super('Invalid backend signature', {
      reason,
    });
  }
}

/**
 * Error thrown when the transaction does not match the intent.
 */
export class TransactionIntentMismatchError extends InvalidParamsError {
  constructor(
    reason:
      | 'amountMismatch'
      | 'assetMismatch'
      | 'addressMismatch'
      | 'unexpectedInstructions'
      | 'simulationFailed',
  ) {
    super('Transaction does not match intent', {
      reason,
    });
  }
}

/**
 * Error thrown when the account specified in the intent is not found.
 */
export class AccountNotFoundError extends InvalidParamsError {
  constructor(address: string) {
    super('Account not found', { address });
  }
}

/**
 * Error thrown when the transaction is malformed or invalid.
 */
export class InvalidTransactionError extends InvalidParamsError {
  constructor(
    reason:
      | 'invalidBase64Encoding'
      | 'malformedTransaction'
      | 'invalidTransactionStructure'
      | 'missingRequiredFields',
  ) {
    super('Invalid transaction', {
      reason,
    });
  }
}

/**
 * Error thrown when the transaction fails on the Solana network.
 */
export class TransactionFailedError extends InternalError {
  constructor(
    reason:
      | 'insufficientBalance'
      | 'blockhashExpired'
      | 'accountNotFound'
      | 'programError'
      | 'instructionError'
      | 'simulationFailed',
  ) {
    super('Transaction failed', {
      reason,
    });
  }
}
