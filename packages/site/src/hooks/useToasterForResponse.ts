import { useCallback } from 'react';

import { toaster } from '../components/Toaster/Toaster';

type ToasterConfig = Omit<Parameters<typeof toaster.create>[0], 'type'>;

/**
 * Hook to show the result of a JSON-RPC response in a toaster.
 *
 * @returns A function to show a toaster for a JSON-RPC response.
 */
export const useShowToasterForResponse = () => {
  const showSuccessToaster = useCallback((config: ToasterConfig) => {
    toaster.create({
      ...config,
      type: 'success',
    });
  }, []);

  const showErrorToaster = useCallback((config: ToasterConfig) => {
    toaster.create({
      ...config,
      type: 'error',
    });
  }, []);

  const showToasterForResponse = useCallback(
    (
      response: unknown,
      successConfig?: ToasterConfig,
      errorConfig?: ToasterConfig,
    ) => {
      if (successConfig && (response as any)?.result) {
        showSuccessToaster(successConfig);
      } else if (errorConfig && (response as any)?.error) {
        showErrorToaster(errorConfig);
      }
    },
    [showSuccessToaster, showErrorToaster],
  );

  return {
    showToasterForResponse,
  };
};
