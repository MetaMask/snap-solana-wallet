import type { OnCronjobHandler } from '@metamask/snaps-sdk';
import { assert, literal, object, string } from '@metamask/superstruct';

import {
  accountsService,
  assetsService,
  transactionsService,
} from '../../../../snapContext';
import { UuidStruct } from '../../../validation/structs';
import { ScheduleBackgroundEventMethod } from './ScheduleBackgroundEventMethod';

const OnSyncAccountTransactionsRequestStruct = object({
  id: string(),
  jsonrpc: literal('2.0'),
  method: literal(ScheduleBackgroundEventMethod.OnSyncAccountTransactions),
  params: object({
    accountId: UuidStruct,
  }),
});

export const onSyncAccountTransactions: OnCronjobHandler = async ({
  request,
}) => {
  assert(request, OnSyncAccountTransactionsRequestStruct);

  const { accountId } = request.params;

  const account = await accountsService.findById(accountId);
  if (!account) {
    throw new Error('Account not found');
  }

  const assetEntities = await assetsService.fetch(account);

  const transactions = await transactionsService.fetchAssetsTransactions(
    assetEntities,
    {
      limit: 20,
    },
  );

  await transactionsService.saveMany(transactions);
};
