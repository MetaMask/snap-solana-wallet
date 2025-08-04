import { type OnCronjobHandler } from '@metamask/snaps-sdk';

import { CronjobMethod } from './CronjobMethod';
import { refreshConfirmationEstimation } from './refreshConfirmationEstimation';

export const handlers: Record<CronjobMethod, OnCronjobHandler> = {
  [CronjobMethod.RefreshConfirmationEstimation]: refreshConfirmationEstimation,
};
