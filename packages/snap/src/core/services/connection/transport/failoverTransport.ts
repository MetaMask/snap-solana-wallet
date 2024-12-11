import { type RpcTransport } from '@solana/web3.js';

import logger from '../../../utils/logger';

/**
 * Creates a failover transport that switches to the next transport on failure.
 * It wraps the provided base transports and adds the failover logic.
 *
 * @param baseTransports - The base transports to use for the failover transport.
 * @returns The failover transport.
 */
export const createFailoverTransport =
  (baseTransports: RpcTransport[]) =>
  async <TResponse>(...args: Parameters<RpcTransport>): Promise<TResponse> => {
    let lastError;
    const transportCount = baseTransports.length;
    for (const [index, transport] of baseTransports.entries()) {
      try {
        logger.info(
          `[🚌 FailoverTransport] Attempting to use transport ${
            index + 1
          } of ${transportCount}`,
        );
        return await transport(...args);
      } catch (error) {
        lastError = error;
        const isLastTransport = index === transportCount - 1;
        logger.error(
          `[🚌 FailoverTransport] Transport failed: ${error}. ${
            isLastTransport
              ? 'No more transports to try.'
              : 'Trying next transport...'
          }`,
        );
      }
    }
    // If all transports fail, throw the last error.
    throw lastError;
  };
