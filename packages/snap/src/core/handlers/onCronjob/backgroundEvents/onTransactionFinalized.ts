import { TransactionStruct } from '@metamask/keyring-api';
import { InternalError, type OnCronjobHandler } from '@metamask/snaps-sdk';
import {
  assert,
  literal,
  nullable,
  object,
  string,
} from '@metamask/superstruct';

import {
  analyticsService,
  assetsService,
  keyring,
  transactionsService,
} from '../../../../snapContext';
import logger from '../../../utils/logger';
import { NetworkStruct, UuidStruct } from '../../../validation/structs';
import { ScheduleBackgroundEventMethod } from './ScheduleBackgroundEventMethod';

export const OnTransactionFinalizedRequestStruct = object({
  id: string(),
  jsonrpc: literal('2.0'),
  method: literal(ScheduleBackgroundEventMethod.OnTransactionFinalized),
  params: object({
    accountId: UuidStruct,
    transaction: TransactionStruct,
    metadata: object({
      scope: NetworkStruct,
      origin: string(),
    }),
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
export const onTransactionFinalized: OnCronjobHandler = async ({ request }) => {
  try {
    logger.info('[onTransactionFinalized] Cronjob triggered', request);

    assert(request, OnTransactionFinalizedRequestStruct);

    const { accountId, transaction, metadata } = request.params;

    const account = await keyring.getAccountOrThrow(accountId);

    const allAccounts = await keyring.listAccounts();

    // Identify accounts that are involved in the transaction. We will perform refreshes for these specifically
    const fromAddresses = transaction.from.map((from) => from.address);
    const toAddresses = transaction.to.map((to) => to.address);
    const toAndFromAddresses = [
      // The account that triggered the cronjob
      account.address,
      // The accounts that are involved in the transaction
      ...fromAddresses,
      ...toAddresses,
    ];
    const accountsChanged = allAccounts.filter((item) =>
      toAndFromAddresses.includes(item.address),
    );

    const refreshAssetsPromise = assetsService.refreshAssets(accountsChanged);

    const refreshTransactionsPromise =
      transactionsService.refreshTransactions(accountsChanged);

    const trackEventPromise = analyticsService.trackEventTransactionFinalized(
      account,
      transaction,
      metadata,
    );

    await Promise.all([
      refreshAssetsPromise,
      refreshTransactionsPromise,
      trackEventPromise,
    ]);
  } catch (error) {
    logger.error(error);
    throw new InternalError(error as string) as Error;
  }
};
