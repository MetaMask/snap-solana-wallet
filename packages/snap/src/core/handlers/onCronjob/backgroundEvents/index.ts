import type { OnCronjobHandler } from '@metamask/snaps-sdk';

import { onAccountsRefresh } from './onAccountsRefresh';
import { onSignTransaction } from './onSignTransaction';
import { onTransactionAdded } from './onTransactionAdded';
import { onTransactionApproved } from './onTransactionApproved';
import { onTransactionRejected } from './onTransactionRejected';
import { ScheduleBackgroundEventMethod } from './ScheduleBackgroundEventMethod';

export const handlers: Record<ScheduleBackgroundEventMethod, OnCronjobHandler> =
  {
    [ScheduleBackgroundEventMethod.OnTransactionAdded]: onTransactionAdded,
    [ScheduleBackgroundEventMethod.OnTransactionApproved]:
      onTransactionApproved,
    [ScheduleBackgroundEventMethod.OnTransactionRejected]:
      onTransactionRejected,
    [ScheduleBackgroundEventMethod.OnSignTransaction]: onSignTransaction,
    [ScheduleBackgroundEventMethod.OnAccountsRefresh]: onAccountsRefresh,
  };
