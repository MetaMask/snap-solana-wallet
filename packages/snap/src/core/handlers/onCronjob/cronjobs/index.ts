import { type OnCronjobHandler } from '@metamask/snaps-sdk';

import { CronjobMethod } from './CronjobMethod';
import { refreshAccounts } from './refreshAccounts';
import { refreshConfirmationEstimation } from './refreshConfirmationEstimation';
import { refreshSend } from './refreshSend';

export const handlers: Record<CronjobMethod, OnCronjobHandler> = {
  [CronjobMethod.RefreshSend]: refreshSend,
  [CronjobMethod.RefreshConfirmationEstimation]: refreshConfirmationEstimation,
  [CronjobMethod.RefreshAccounts]: refreshAccounts,
};
