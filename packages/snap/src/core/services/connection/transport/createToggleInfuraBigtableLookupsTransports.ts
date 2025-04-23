import { createDefaultRpcTransport, type RpcTransport } from '@solana/kit';

import logger from '../../../utils/logger';

export const METHODS_THAT_NEED_BIGTABLE_LOOKUPS = [
  'getTransaction',
  'getSignaturesForAddress',
];

/**
 * Creates a transport that controls BigTable lookups on Infura via the `x-bigtable` header.
 *
 * For most methods:
 * - We DISABLE BigTable lookups using "x-bigtable: disabled" header.
 * - This improves performance for most RPC requests that don't need historical data.
 *
 * For some specific methods that need historical data:
 * - We ENABLE BigTable lookups using "x-bigtable: enabled" header.
 * - Without BigTable access, these methods would return `null`.
 * - The {@link METHODS_THAT_NEED_BIGTABLE_LOOKUPS} array above defines which methods need BigTable enabled.
 *
 * @param url - The URL to use for the transport.
 * @returns A transport that automatically manages BigTable access based on the RPC method.
 */
export const createToggleInfuraBigtableLookupsTransport = (
  url: string,
): RpcTransport => {
  const transportWithBigtableEnabled = createDefaultRpcTransport({ url });
  const transportWithBigtableDisabled = createDefaultRpcTransport({
    url,
    headers: {
      'x-bigtable': 'disabled',
    },
  });

  // Create a dynamic transport that uses the correct transport based on the method
  const dynamicTransport = async <TResponse>(
    ...args: Parameters<RpcTransport>
  ): Promise<TResponse> => {
    const { payload } = args[0];
    const { method } = payload as any;
    const shouldEnableBigtableLookups =
      METHODS_THAT_NEED_BIGTABLE_LOOKUPS.includes(method);

    logger.info(
      `[🚌 ToggleInfuraBigtableLookupsTransport] RPC method is ${method}. ${
        shouldEnableBigtableLookups ? 'Enabling' : 'Disabling'
      } BigTable lookups.`,
    );

    return shouldEnableBigtableLookups
      ? transportWithBigtableEnabled(...args)
      : transportWithBigtableDisabled(...args);
  };

  return dynamicTransport;
};
