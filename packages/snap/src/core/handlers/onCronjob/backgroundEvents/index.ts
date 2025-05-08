import type { OnCronjobHandler } from '@metamask/snaps-sdk';

import { onSignTransaction } from './onSignTransaction';
import { onTransactionAdded } from './onTransactionAdded';
import { onTransactionApproved } from './onTransactionApproved';
import { onTransactionFinalized } from './onTransactionFinalized';
import { onTransactionRejected } from './onTransactionRejected';
import { onTransactionSubmitted } from './onTransactionSubmitted';
import { ScheduleBackgroundEventMethod } from './ScheduleBackgroundEventMethod';

export const handlers: Record<ScheduleBackgroundEventMethod, OnCronjobHandler> =
  {
    [ScheduleBackgroundEventMethod.OnTransactionAdded]: onTransactionAdded,
    [ScheduleBackgroundEventMethod.OnTransactionApproved]:
      onTransactionApproved,
    [ScheduleBackgroundEventMethod.OnTransactionSubmitted]:
      onTransactionSubmitted,
    [ScheduleBackgroundEventMethod.OnTransactionFinalized]:
      onTransactionFinalized,
    [ScheduleBackgroundEventMethod.OnTransactionRejected]:
      onTransactionRejected,
    [ScheduleBackgroundEventMethod.OnSignTransaction]: onSignTransaction,
  };
