import { type OnCronjobHandler } from '@metamask/snaps-sdk';

import { refreshTokenPrices } from './refreshTokenPrices';
import { refreshTransactions } from './refreshTransactions';

export enum OnCronjobMethods {
  RefreshTokenPrices = 'refreshTokenPrices',
  RefreshTransactions = 'refreshTransactions',
}

export const handlers: Record<OnCronjobMethods, OnCronjobHandler> = {
  [OnCronjobMethods.RefreshTokenPrices]: refreshTokenPrices,
  [OnCronjobMethods.RefreshTransactions]: refreshTransactions,
};
