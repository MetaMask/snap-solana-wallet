import { type RpcTransport } from '@solana/kit';
import { isJsonRpcError, isJsonRpcFailure } from '@metamask/utils';
import { getJsonError } from '@metamask/snaps-sdk';

import logger from '../../../utils/logger';

/**
 * Error information that will be tracked.
 */
interface ErrorTrackingInfo {
  method: string;
  url?: string | undefined;
  statusCode?: number | undefined;
  errorMessage: string;
  errorStack?: string | undefined;
  responseData?: any | undefined;
  requestParams?: any | undefined;
}

/**
 * Tracks an error using the snap's error tracking mechanism.
 * This function safely handles the error tracking without throwing errors.
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
 */
function isErrorResponse(response: any): boolean {
  if (isJsonRpcError(response) || isJsonRpcFailure(response)) {
    return true;
  }
  
  // Also check for Solana RPC error format (result.err)
  if (response?.result?.err) {
    return true;
  }
  
  return false;
}

/**
 * Extracts error information from various error response formats.
 */
function extractErrorInfo(error: any, method: string, url?: string): ErrorTrackingInfo {
  const errorInfo: ErrorTrackingInfo = {
    method,
    url,
    errorMessage: 'Unknown error',
  };

  // Handle different error formats
  if (error instanceof Error) {
    errorInfo.errorMessage = error.message;
    errorInfo.errorStack = error.stack;
  } else if (typeof error === 'string') {
    errorInfo.errorMessage = error;
  } else if (error?.message) {
    errorInfo.errorMessage = error.message;
  } else if (error?.error) {
    errorInfo.errorMessage = typeof error.error === 'string' 
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
 *
 * @param baseTransport - The base transport to wrap.
 * @param url - The URL of the RPC endpoint (optional, for tracking purposes).
 * @returns The error tracking transport.
 */
export const createErrorTrackingTransport = (
  baseTransport: RpcTransport,
  url?: string,
): RpcTransport => {
  return async <TResponse>(
    ...args: Parameters<RpcTransport>
  ): Promise<TResponse> => {
    const { payload } = args[0];
    const { method } = payload as any;

    try {
      logger.info(
        `[🚌 ErrorTrackingTransport] Making RPC request: ${method}`,
      );

      const response = await baseTransport(...args);

      // Check if the response indicates an error (even with 2xx status)
      if (isErrorResponse(response)) {
        const errorInfo: ErrorTrackingInfo = {
          method,
          url,
          errorMessage: `RPC error in response: ${JSON.stringify(response)}`,
          responseData: response,
          requestParams: payload,
        };

        await trackError(errorInfo);
        
        // Also re-throw the error to maintain the original behavior
        throw new Error(`RPC error: ${JSON.stringify(response)}`);
      }

      return response as TResponse;
    } catch (error) {
      const errorInfo = extractErrorInfo(error, method, url);
      // Track the error
      await trackError(errorInfo);

      // And re-throw the original error to maintain the transport chain flow
      throw error;
    }
  };
};
