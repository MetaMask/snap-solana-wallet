import { type OnCronjobHandler } from '@metamask/snaps-sdk';

import { refreshAssets } from './refreshAssets';
import { refreshConfirmationEstimation } from './refreshConfirmationEstimation';
import { refreshSend } from './refreshSend';
import { refreshTransactions } from './refreshTransactions';

export enum CronjobMethod {
  RefreshSend = 'refreshSend',
  RefreshConfirmationEstimation = 'refreshConfirmationEstimation',
  RefreshTransactions = 'refreshTransactions',
  RefreshAssets = 'refreshAssets',
}

export const handlers: Record<CronjobMethod, OnCronjobHandler> = {
  [CronjobMethod.RefreshSend]: refreshSend,
  [CronjobMethod.RefreshConfirmationEstimation]: refreshConfirmationEstimation,
  [CronjobMethod.RefreshTransactions]: refreshTransactions,
  [CronjobMethod.RefreshAssets]: refreshAssets,
};
