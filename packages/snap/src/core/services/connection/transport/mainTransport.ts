import { createDefaultRpcTransport } from '@solana/web3.js';

import { createFailoverTransport } from './failoverTransport';
import { createRetryingTransport } from './retryingTransport';

/**
 * Creates the main transport for RPC calls, stacking up mutiple behaviors:
 * - Failover: Switches to the next transport on failure.
 * - Retrying: Retries the request up to MAX_ATTEMPTS times before failing.
 *
 * @param urls - The URL to use for the transport.
 * @returns The transport.
 */
export const createMainTransport = (urls: string[]) => {
  const baseTransports = urls.map((url) => createDefaultRpcTransport({ url }));
  const failoverTransport = createFailoverTransport(baseTransports);
  return createRetryingTransport(failoverTransport);
};
