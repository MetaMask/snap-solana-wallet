import type { OnCronjobHandler } from '@metamask/snaps-sdk';

import { closeWebSocketConnections } from './closeWebSocketConnections';
import { onSyncAccount } from './onSyncAccount';
import { onTransactionAdded } from './onTransactionAdded';
import { onTransactionApproved } from './onTransactionApproved';
import { onTransactionRejected } from './onTransactionRejected';
import { refreshConfirmationEstimation } from './refreshConfirmationEstimation';
import { refreshSend } from './refreshSend';
import { ScheduleBackgroundEventMethod } from './ScheduleBackgroundEventMethod';

export const handlers: Record<ScheduleBackgroundEventMethod, OnCronjobHandler> =
  {
    [ScheduleBackgroundEventMethod.OnTransactionAdded]: onTransactionAdded,
    [ScheduleBackgroundEventMethod.OnTransactionApproved]:
      onTransactionApproved,
    [ScheduleBackgroundEventMethod.OnTransactionRejected]:
      onTransactionRejected,
    [ScheduleBackgroundEventMethod.OnSyncAccount]: onSyncAccount,
    [ScheduleBackgroundEventMethod.RefreshSend]: refreshSend,
    [ScheduleBackgroundEventMethod.RefreshConfirmationEstimation]:
      refreshConfirmationEstimation,
    [ScheduleBackgroundEventMethod.CloseWebSocketConnections]:
      closeWebSocketConnections,
  };
