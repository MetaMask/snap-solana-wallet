import type { OnCronjobHandler } from '@metamask/snaps-sdk';
import { assert, literal, object, string } from '@metamask/superstruct';

import {
  accountsService,
  assetsService,
  transactionsService,
} from '../../../../snapContext';
import { UuidStruct } from '../../../validation/structs';
import { ScheduleBackgroundEventMethod } from './ScheduleBackgroundEventMethod';

const OnSyncAccountRequestStruct = object({
  id: string(),
  jsonrpc: literal('2.0'),
  method: literal(ScheduleBackgroundEventMethod.OnSyncAccount),
  params: object({
    accountId: UuidStruct,
  }),
});

export const onSyncAccount: OnCronjobHandler = async ({ request }) => {
  assert(request, OnSyncAccountRequestStruct);

  const { accountId } = request.params;

  const account = await accountsService.findById(accountId);
  if (!account) {
    throw new Error('Account not found');
  }

  // Sync account's assets
  const assetEntities = await assetsService.fetch(account);
  await assetsService.saveMany(assetEntities);

  // Sync account's transactions
  const transactions = await transactionsService.fetchAssetsTransactions(
    assetEntities,
    {
      limit: 20,
    },
  );
  await transactionsService.saveMany(transactions);
};
