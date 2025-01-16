import { type OnCronjobHandler } from '@metamask/snaps-sdk';

import { refreshAssets } from './refreshAssets';
import { refreshTransactions } from './refreshTransactions';
import { refreshUiTokenPrices } from './refreshUiTokenPrices';

export enum CronjobMethod {
  RefreshTokenPrices = 'refreshTokenPrices',
  RefreshTransactions = 'refreshTransactions',
  RefreshAssetss = 'refreshAssets',
}

export const handlers: Record<CronjobMethod, OnCronjobHandler> = {
  [CronjobMethod.RefreshTokenPrices]: refreshUiTokenPrices,
  [CronjobMethod.RefreshTransactions]: refreshTransactions,
  [CronjobMethod.RefreshAssetss]: refreshAssets,
  // Register new handlers here
};
