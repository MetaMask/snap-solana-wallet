import { type OnCronjobHandler } from '@metamask/snaps-sdk';

import { CronjobMethod } from './CronjobMethod';
import { onTransactionAdded } from './onTransactionAdded';
import { onTransactionApproved } from './onTransactionApproved';
import { onTransactionFinalized } from './onTransactionFinalized';
import { onTransactionSubmitted } from './onTransactionSubmitted';
import { refreshAssets } from './refreshAssets';
import { refreshConfirmationEstimation } from './refreshConfirmationEstimation';
import { refreshSend } from './refreshSend';
import { refreshTransactions } from './refreshTransactions';

export const handlers: Record<CronjobMethod, OnCronjobHandler> = {
  [CronjobMethod.RefreshSend]: refreshSend,
  [CronjobMethod.RefreshConfirmationEstimation]: refreshConfirmationEstimation,
  [CronjobMethod.RefreshTransactions]: refreshTransactions,
  [CronjobMethod.RefreshAssets]: refreshAssets,
  [CronjobMethod.OnTransactionAdded]: onTransactionAdded,
  [CronjobMethod.OnTransactionApproved]: onTransactionApproved,
  [CronjobMethod.OnTransactionSubmitted]: onTransactionSubmitted,
  [CronjobMethod.OnTransactionFinalized]: onTransactionFinalized,
};
