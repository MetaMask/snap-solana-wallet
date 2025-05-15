import { InternalError, type OnRpcRequestHandler } from '@metamask/snaps-sdk';
import { assert } from '@metamask/superstruct';

import {  transactionHelper } from '../../../snapContext';
import logger from '../../utils/logger';
import { GetMinimumBalanceForRentExemptionParamsStruct, GetMinimumBalanceForRentExemptionResponseStruct } from '../../validation/structs';

export const getMinimumBalanceForRentExemption: OnRpcRequestHandler = async ({ request }) => {  const { params } = request;
  assert(params, GetMinimumBalanceForRentExemptionParamsStruct);

  const { scope, accountSize } = params;

  try {
     const value = await transactionHelper.getMinimumBalanceForRentExemption(
      scope,
      accountSize?BigInt(accountSize): undefined,
    );

  const result = {value: value.toString()}
    assert(result, GetMinimumBalanceForRentExemptionResponseStruct);

    return result;
  } catch (error) {
    logger.error(error);
    throw new InternalError(error as string) as Error;
  }
};
