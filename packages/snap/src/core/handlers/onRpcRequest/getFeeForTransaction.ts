import type { OnRpcRequestHandler } from '@metamask/snaps-sdk';
import { assert } from '@metamask/superstruct';

import { transactionHelper } from '../../../snapContext';
import logger from '../../utils/logger';
import {
  GetFeeForTransactionParamsStruct,
  GetFeeForTransactionResponseStruct,
} from '../../validation/structs';

export const getFeeForTransaction: OnRpcRequestHandler = async ({
  request,
}) => {
  assert(request.params, GetFeeForTransactionParamsStruct);

  const { transaction, scope } = request.params;

  try {
    const message =
      await transactionHelper.base64EncodeTransactionMessageFromBase64EncodedTransaction(
        transaction,
      );

    const value = await transactionHelper.getFeeForMessageInLamports(
      message,
      scope,
    );

    const result = { value: value?.toString() ?? null };

    assert(result, GetFeeForTransactionResponseStruct);

    return result;
  } catch (error) {
    logger.error(error);
    throw error;
  }
};
