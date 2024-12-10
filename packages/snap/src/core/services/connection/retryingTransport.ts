import { type RpcTransport } from '@solana/web3.js';

import logger from '../../utils/logger';

// Set the maximum number of attempts to retry a request.
const MAX_ATTEMPTS = 4;
const BASE_RETRY_DELAY_MS = 100;
const MAX_RETRY_DELAY_MS = 1500;

/**
 * Sleep function to wait for a given number of milliseconds.
 * @param ms - The number of milliseconds to sleep.
 * @returns A promise that resolves when the sleep is complete.
 */
async function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Calculate the delay for a given attempt.
 * @param attempt - The attempt number.
 * @returns The delay in milliseconds.
 */
function calculateRetryDelay(attempt: number): number {
  // Exponential backoff with a maximum delay.
  return Math.min(
    BASE_RETRY_DELAY_MS * Math.pow(2, attempt),
    MAX_RETRY_DELAY_MS,
  );
}

/**
 * Creates a retrying transport that will retry up to MAX_ATTEMPTS times before failing.
 * It wraps the provided base transport and adds the retry logic.
 * @param baseTransport - The base transport to wrap.
 * @returns The retrying transport.
 */
export const createRetryingTransport = (baseTransport: RpcTransport) => {
  return async <TResponse>(
    ...args: Parameters<RpcTransport>
  ): Promise<TResponse> => {
    let requestError;
    for (let attempts = 0; attempts < MAX_ATTEMPTS; attempts++) {
      try {
        logger.info(
          `[🚌 RetryingTransport] Attempt ${attempts + 1} of ${MAX_ATTEMPTS}`,
        );
        return await baseTransport(...args);
      } catch (error) {
        logger.error(
          `[🚌 RetryingTransport] Error during attempt ${
            attempts + 1
          }: ${error}`,
        );
        requestError = error;
        // Only sleep if we have more attempts remaining.
        if (attempts < MAX_ATTEMPTS - 1) {
          logger.info(
            `[🚌 RetryingTransport] Sleeping for ${calculateRetryDelay(
              attempts,
            )}ms`,
          );
          const retryDelay = calculateRetryDelay(attempts);
          await sleep(retryDelay);
        }
      }
    }
    throw requestError;
  };
};
