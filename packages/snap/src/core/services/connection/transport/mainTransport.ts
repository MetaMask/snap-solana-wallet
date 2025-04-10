import { createDefaultRpcTransport } from '@solana/kit';

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
  const config = {
    headers: {
      'x-bigtable': 'disabled',
    },
  };
  const baseTransports = urls.map((url) =>
    createDefaultRpcTransport({ url, ...config }),
  );
  const failoverTransport = createFailoverTransport(baseTransports);
  return createRetryingTransport(failoverTransport);
};
