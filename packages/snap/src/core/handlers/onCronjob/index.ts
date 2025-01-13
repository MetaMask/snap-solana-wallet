import { type OnCronjobHandler } from '@metamask/snaps-sdk';

import { refreshTokenPrices } from './refreshTokenPrices';
import { refreshTransactions } from './refreshTransactions';

export enum CronjobMethod {
  RefreshTokenPrices = 'refreshTokenPrices',
  RefreshTransactions = 'refreshTransactions',
}

export const handlers: Record<CronjobMethod, OnCronjobHandler> = {
  [CronjobMethod.RefreshTokenPrices]: refreshTokenPrices,
  [CronjobMethod.RefreshTransactions]: refreshTransactions,
};
