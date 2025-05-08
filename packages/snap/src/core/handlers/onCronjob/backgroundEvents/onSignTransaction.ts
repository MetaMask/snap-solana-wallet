import { InternalError, type OnCronjobHandler } from '@metamask/snaps-sdk';
import { assert, literal, object, string } from '@metamask/superstruct';

import {
  assetsService,
  keyring,
  transactionsService,
} from '../../../../snapContext';
import logger from '../../../utils/logger';
import { UuidStruct } from '../../../validation/structs';
import { ScheduleBackgroundEventMethod } from './ScheduleBackgroundEventMethod';

export const OnSignTransactionRequestStruct = object({
  id: string(),
  jsonrpc: literal('2.0'),
  method: literal(ScheduleBackgroundEventMethod.OnSignTransaction),
  params: object({
    accountId: UuidStruct,
  }),
});

/**
 * Handles side effects that need to happen when a transaction is finalized (failed or confirmed).
 *
 * @param args - The arguments object.
 * @param args.request - The request object containing transaction details.
 * @returns A promise that resolves when the side effects are complete.
 * @see https://www.notion.so/consensys/Transaction-Finalized-270e5858ccd94209954d7260438291b1?pvs=4
 */
export const onSignTransaction: OnCronjobHandler = async ({ request }) => {
  try {
    logger.info('[onSignTransaction] Cronjob triggered', request);

    assert(request, OnSignTransactionRequestStruct);

    const { accountId } = request.params;

    const account = await keyring.getAccountOrThrow(accountId);

    const refreshAssetsPromise = assetsService.refreshAssets([account]);

    const refreshTransactionsPromise = transactionsService.refreshTransactions([
      account,
    ]);

    await Promise.all([refreshAssetsPromise, refreshTransactionsPromise]);
  } catch (error) {
    logger.error(error);
    throw new InternalError(error as string) as Error;
  }
};
