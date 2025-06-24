import {
  MethodNotFoundError,
  ParseError,
  ResourceNotFoundError,
  ResourceUnavailableError,
  ChainDisconnectedError,
  TransactionRejected,
  DisconnectedError,
  InternalError,
  UnauthorizedError,
  UnsupportedMethodError,
  InvalidInputError,
  InvalidParamsError,
  InvalidRequestError,
  LimitExceededError,
  SnapError,
  MethodNotSupportedError,
  UserRejectedRequestError,
} from '@metamask/snaps-sdk';

import logger from './logger';

/**
 * Determines if the given error is a Snap RPC error.
 *
 * @param error - The error instance to be checked.
 * @returns A boolean indicating whether the error is a Snap RPC error.
 */
export function isSnapRpcError(error: Error): boolean {
  const errors = [
    SnapError,
    MethodNotFoundError,
    UserRejectedRequestError,
    MethodNotSupportedError,
    MethodNotFoundError,
    ParseError,
    ResourceNotFoundError,
    ResourceUnavailableError,
    TransactionRejected,
    ChainDisconnectedError,
    DisconnectedError,
    UnauthorizedError,
    UnsupportedMethodError,
    InternalError,
    InvalidInputError,
    InvalidParamsError,
    InvalidRequestError,
    LimitExceededError,
  ];
  return errors.some((errType) => error instanceof errType);
}

export const withCatchAndThrowSnapError = async <ResponseT>(
  fn: () => Promise<ResponseT>,
): Promise<ResponseT> => {
  try {
    return await fn();
  } catch (errorInstance: any) {
    const error = isSnapRpcError(errorInstance)
      ? errorInstance
      : new SnapError(errorInstance);

    logger.error(
      { error },
      `[SnapError] ${JSON.stringify(error.toJSON(), null, 2)}`,
    );

    throw error;
  }
};
