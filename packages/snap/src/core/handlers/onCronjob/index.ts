import { type OnCronjobHandler } from '@metamask/snaps-sdk';

import { refreshAssets } from './refreshAssets';
import { refreshConfirmationEstimation } from './refreshConfirmationEstimation';
import { refreshSendTokenPrices } from './refreshSendTokenPrices';
import { refreshTransactions } from './refreshTransactions';

export enum CronjobMethod {
  RefreshSendTokenPrices = 'refreshSendTokenPrices',
  RefreshConfirmationEstimation = 'refreshConfirmationEstimation',
  RefreshTransactions = 'refreshTransactions',
  RefreshAssets = 'refreshAssets',
}

export const handlers: Record<CronjobMethod, OnCronjobHandler> = {
  [CronjobMethod.RefreshSendTokenPrices]: refreshSendTokenPrices,
  [CronjobMethod.RefreshConfirmationEstimation]: refreshConfirmationEstimation,
  [CronjobMethod.RefreshTransactions]: refreshTransactions,
  [CronjobMethod.RefreshAssets]: refreshAssets,
};
