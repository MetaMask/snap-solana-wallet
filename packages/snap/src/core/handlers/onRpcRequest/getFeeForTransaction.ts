import { InternalError, type OnRpcRequestHandler } from '@metamask/snaps-sdk';
import { assert } from '@metamask/superstruct';

import { FeeCalculator } from '../../fees/FeeCalculator';
import logger from '../../utils/logger';
import {
  GetFeeForTransactionParamsStruct,
  GetFeeForTransactionResponseStruct,
} from '../../validation/structs';

/**
 * Handles the computation of a fee for a transaction.
 * @param args - The arguments for the request.
 * @param args.request - The request object.
 * @returns The response to the JSON-RPC request.
 * @deprecated Use `ClientRequestMethod.ComputeFee` instead.
 */
export const getFeeForTransaction: OnRpcRequestHandler = async ({
  request,
}) => {
  assert(request.params, GetFeeForTransactionParamsStruct);

  const { transaction } = request.params;

  try {
    const { totalFee } = FeeCalculator.calculateFee(transaction);

    const result = {
      value: totalFee.toString(),
    };

    assert(result, GetFeeForTransactionResponseStruct);

    return result;
  } catch (error) {
    logger.error(error);
    throw new InternalError(error as string) as Error;
  }
};
