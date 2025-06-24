import { SnapError } from '@metamask/snaps-sdk';

import logger from './logger';

export const handle = async <ResponseT>(
  scope: string,
  fn: () => Promise<ResponseT>,
): Promise<ResponseT> => {
  try {
    return await fn();
  } catch (errorInstance: any) {
    const error = new SnapError(errorInstance as Error);

    logger.error(
      { error },
      `[${scope}] Error occurred: ${JSON.stringify(error.toJSON(), null, 2)}`,
    );

    throw error;
  }
};
