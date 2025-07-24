import type { OnCronjobHandler } from '@metamask/snaps-sdk';
import { assert, literal, object, string } from '@metamask/superstruct';

import { accountsService } from '../../../../snapContext';
import { UuidStruct } from '../../../validation/structs';
import { ScheduleBackgroundEventMethod } from './ScheduleBackgroundEventMethod';

const OnSynchronizeAccountRequestStruct = object({
  id: string(),
  jsonrpc: literal('2.0'),
  method: literal(ScheduleBackgroundEventMethod.OnSynchronizeAccount),
  params: object({
    accountId: UuidStruct,
  }),
});

export const onSynchronizeAccount: OnCronjobHandler = async ({ request }) => {
  assert(request, OnSynchronizeAccountRequestStruct);

  const { accountId } = request.params;

  const account = await accountsService.findById(accountId);
  if (!account) {
    throw new Error('Account not found');
  }

  await accountsService.synchronize([account]);
};
