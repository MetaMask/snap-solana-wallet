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
  getJsonError,
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

export const trackError = async (
  error: unknown,
): Promise<string | undefined> => {
  try {
    return await snap.request({
      method: 'snap_trackError',
      params: {
        error: getJsonError(error),
      },
    });
  } catch (trackingError) {
    logger.warn('Failed track error', { error: trackingError });
    return undefined;
  }
};

const shouldTrackError = (error: Error): boolean => {
  return !(error instanceof UserRejectedRequestError);
};

export const withCatchAndThrowSnapError = async <ResponseT>(
  fn: () => Promise<ResponseT>,
): Promise<ResponseT> => {
  try {
    return await fn();
  } catch (errorInstance: any) {
    if (shouldTrackError(errorInstance)) {
      await trackError(errorInstance);
    }

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
