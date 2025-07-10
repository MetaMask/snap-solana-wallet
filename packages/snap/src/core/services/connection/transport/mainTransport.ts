import { pipe } from '@solana/kit';

import { createToggleInfuraBigtableLookupsTransport } from './createToggleInfuraBigtableLookupsTransports';
import { createErrorTrackingTransport } from './errorTrackingTransport';
import { createFailoverTransport } from './failoverTransport';
import { createRetryingTransport } from './retryingTransport';

/**
 * A functional programming utility to iterate over an array and apply a function to each item.
 * @param callback - The function to apply to each item.
 * @returns An array of the results of applying the function to each item.
 */
const forEach =
  <TItem, TResult>(callback: (item: TItem) => TResult) =>
  (items: TItem[]): TResult[] =>
    items.map(callback);

/**
 * Creates the main transport for RPC calls, stacking up multiple behaviors:
 *
 * - Error Tracking: Tracks all RPC errors (4xx, 5xx, and 2xx with errors) using snap_trackError.
 * - BigTable Lookups: Toggles BigTable lookups on Infura via the `x-bigtable` header.
 * - Failover: Switches to the next transport on failure.
 * - Retrying: Retries the request up to MAX_ATTEMPTS times before failing.
 *
 * @param urls - The URL to use for the transport.
 * @returns The transport.
 */
export const createMainTransport = (urls: string[]) => {
  return pipe(
    urls,
    forEach(createToggleInfuraBigtableLookupsTransport), // For each URL, create a transport that toggles BigTable lookups on Infura
    (transports) => createFailoverTransport(transports, urls), // Wrap the list of above transports into a single transport that fails over each wrapped transport on failure, passing URLs for error tracking
    createRetryingTransport, // Wrap the previous transport into a transport that retries failed requests
    (transport) => createErrorTrackingTransport(transport), // Add error tracking as the most outer layer
  );
};
