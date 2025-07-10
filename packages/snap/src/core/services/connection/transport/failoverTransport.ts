import { type RpcTransport } from '@solana/kit';

import logger from '../../../utils/logger';

/**
 * Creates a failover transport that switches to the next transport on failure.
 * It wraps the provided base transports and adds the failover logic.
 *
 * @param baseTransports - The base transports to use for the failover transport.
 * @param urls - The URLs corresponding to each transport (for error tracking).
 * @returns The failover transport.
 */
export const createFailoverTransport =
  (baseTransports: RpcTransport[], urls: string[]) =>
  async <TResponse>(...args: Parameters<RpcTransport>): Promise<TResponse> => {
    let lastError;
    const transportCount = baseTransports.length;
    for (const [index, transport] of baseTransports.entries()) {
      try {
        const currentUrl = urls[index];
        logger.info(
          `[🚌 FailoverTransport] Attempting to use transport ${
            index + 1
          } of ${transportCount} (URL: ${currentUrl})`,
        );
        return await transport(...args);
      } catch (error) {
        const currentUrl = urls[index];
        lastError = error;
        const isLastTransport = index === transportCount - 1;
        logger.error(
          `[🚌 FailoverTransport] Transport failed (URL: ${currentUrl}): ${error}. ${
            isLastTransport
              ? 'No more transports to try.'
              : 'Trying next transport...'
          }`,
        );

        // Adds URL information to the error for better tracking
        if (error instanceof Error) {
          (error as any).currentUrl = currentUrl;
        }
      }
    }
    // If all transports fail, throw the last error.
    throw lastError;
  };
