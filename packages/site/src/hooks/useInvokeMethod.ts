import { defaultSnapOrigin } from '../config';
import { useRequest } from './useRequest';

export type InvokeMethodParams = {
  method: string;
  params?: Record<string, unknown>;
};

/**
 * Utility hook to wrap the `wallet_useInvokeMethod` method.
 *
 * @param snapId - The Snap ID to invoke. Defaults to the snap ID specified in the
 * config.
 * @returns The invokeKeyring wrapper method.
 */
export const useInvokeMethod = (snapId = defaultSnapOrigin) => {
  const request = useRequest();

  /**
   * Invoke the requested Keyring method.
   *
   * @param params - The invoke params.
   * @param params.method - The method name.
   * @param params.params - The method params.
   * @returns The Keyring response.
   */
  const invokeMethod = async ({ method, params }: InvokeMethodParams) =>
    request({
      method: 'wallet_invokeMethod',
      params: {
        snapId,
        request: {
          method,
          params,
        },
      },
    });

  return invokeMethod;
};
