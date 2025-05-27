import { useCallback } from 'react';

import { toaster } from '../components/Toaster/Toaster';

type JsonRpcResponse =
  | {
      result: object | null;
      error: Error | null;
    }
  | unknown;

type SuccessToasterConfig = Omit<Parameters<typeof toaster.create>[0], 'type'>;

type ErrorToasterConfig = Omit<Parameters<typeof toaster.create>[0], 'type'>;

/**
 * Hook to show the result of a JSON-RPC response in a toaster.
 *
 * @returns A function to show a toaster for a JSON-RPC response.
 */
export const useShowToasterForResponse = () => {
  const showSuccessToaster = useCallback((config: SuccessToasterConfig) => {
    toaster.create({
      title: config.title,
      description: config.description,
      type: 'success',
      action: config.action as any,
    });
  }, []);

  const showErrorToaster = useCallback((config: ErrorToasterConfig) => {
    toaster.create({
      title: config.title,
      description: config.description,
      type: 'error',
    });
  }, []);

  const showToasterForResponse = useCallback(
    (
      response: JsonRpcResponse,
      successConfig?: SuccessToasterConfig,
      errorConfig?: ErrorToasterConfig,
    ) => {
      const responseResult = response as { result: object | null };
      if (responseResult?.result) {
        successConfig && showSuccessToaster(successConfig);
      } else {
        errorConfig && showErrorToaster(errorConfig);
      }
    },
    [showSuccessToaster, showErrorToaster],
  );

  return {
    showToasterForResponse,
  };
};
