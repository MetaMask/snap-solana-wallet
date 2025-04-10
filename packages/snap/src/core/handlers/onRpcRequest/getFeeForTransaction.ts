import { InternalError, type OnRpcRequestHandler } from '@metamask/snaps-sdk';
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
    const value = await transactionHelper.getFeeFromBase64StringInLamports(
      transaction,
      scope,
    );

    if (value === null) {
      throw new Error('Failed to get fee for transaction');
    }

    const result = { value: value.toString() };

    assert(result, GetFeeForTransactionResponseStruct);

    return result;
  } catch (error) {
    logger.error(error);
    throw new InternalError(error as string) as Error;
  }
};
