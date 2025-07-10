import { getJsonError } from '@metamask/snaps-sdk';
import { isJsonRpcError, isJsonRpcFailure } from '@metamask/utils';
import { isSolanaError, type RpcTransport } from '@solana/kit';

import logger from '../../../utils/logger';

/**
 * Error information that will be tracked.
 */
type ErrorTrackingInfo = {
  method: string;
  url?: string | undefined;
  statusCode?: number | undefined;
  errorMessage: string;
  errorStack?: string | undefined;
  responseData?: any | undefined;
  requestParams?: any | undefined;
};

/**
 * Tracks an error using the snap's error tracking mechanism.
 * This function safely handles the error tracking without throwing errors.
 *
 * @param errorInfo - The error information to track.
 */
async function trackError(errorInfo: ErrorTrackingInfo): Promise<void> {
  try {
    await snap.request({
      method: 'snap_trackError',
      params: {
        error: getJsonError(new Error(JSON.stringify(errorInfo))),
      },
    });

    logger.info(
      `[🚌 ErrorTrackingTransport] Error tracked: ${errorInfo.method} - ${errorInfo.errorMessage}`,
    );
  } catch (trackingError) {
    logger.warn(
      `[🚌 ErrorTrackingTransport] Failed to track error: ${trackingError}`,
    );
  }
}

/**
 * Checks if a response is indeed an error, even if it's a 2xx status code.
 * Uses metamask/utils to detect JSON-RPC errors.
 *
 * @param response - The response to check for errors.
 * @returns True if the response contains an error, false otherwise.
 */
function isErrorResponse(response: any): boolean {
  if (isJsonRpcError(response) || isJsonRpcFailure(response)) {
    return true;
  }

  // Also check for Solana RPC error
  if (isSolanaError(response)) {
    return true;
  }

  return false;
}

/**
 * Extracts error information from various error response formats.
 *
 * @param error - The error to extract information from.
 * @param method - The RPC method that was called.
 * @returns The extracted error information.
 */
function extractErrorInfo(error: any, method: string): ErrorTrackingInfo {
  const errorInfo: ErrorTrackingInfo = {
    method,
    errorMessage: 'Unknown error',
  };

  // Check if the error has a currentUrl property (from failover transport)
  if (error?.currentUrl) {
    errorInfo.url = error.currentUrl;
  }

  // Handle different error formats
  if (error instanceof Error) {
    errorInfo.errorMessage = error.message;
    errorInfo.errorStack = error.stack;
  } else if (typeof error === 'string') {
    errorInfo.errorMessage = error;
  } else if (error?.message) {
    errorInfo.errorMessage = error.message;
  } else if (error?.error) {
    errorInfo.errorMessage =
      typeof error.error === 'string'
        ? error.error
        : JSON.stringify(error.error);
  }

  // Get status code if available
  if (error?.status) {
    errorInfo.statusCode = error.status;
  } else if (error?.statusCode) {
    errorInfo.statusCode = error.statusCode;
  }

  // Get response data if available
  if (error?.response) {
    errorInfo.responseData = error.response;
  } else if (error?.data) {
    errorInfo.responseData = error.data;
  }

  return errorInfo;
}

/**
 * Creates an error tracking transport that wraps the provided base transport.
 * It tracks both 4xx/5xx HTTP errors and 2xx responses with error information.
 * The URL will be extracted from the error object when available (e.g., from failover transport).
 *
 * @param baseTransport - The base transport to wrap.
 * @returns The error tracking transport.
 */
export const createErrorTrackingTransport = (
  baseTransport: RpcTransport,
): RpcTransport => {
  return async <TResponse>(
    ...args: Parameters<RpcTransport>
  ): Promise<TResponse> => {
    const { payload } = args[0];
    const { method } = payload as any;

    try {
      logger.info(`[🚌 ErrorTrackingTransport] Making RPC request: ${method}`);

      const response = await baseTransport(...args);

      // Check if the response indicates an error (even with 2xx status)
      if (isErrorResponse(response)) {
        const errorInfo: ErrorTrackingInfo = {
          method,
          errorMessage: `RPC error in response: ${JSON.stringify(response)}`,
          responseData: response,
          requestParams: payload,
        };

        await trackError(errorInfo);

        // Returns the response to the caller for direct handling instead of throwing,
        // this maintains the original error flow
        return response as TResponse;
      }

      return response as TResponse;
    } catch (error) {
      const errorInfo = extractErrorInfo(error, method);
      // Track the error
      await trackError(errorInfo);

      // And re-throw the original error to maintain the transport chain flow
      // If error is not an Error instance, convert it
      if (error instanceof Error) {
        throw error;
      } else {
        throw new Error(errorInfo.errorMessage);
      }
    }
  };
};
