import { type OnCronjobHandler } from '@metamask/snaps-sdk';

import { refreshTokenPrices } from './refreshTokenPrices';

export enum OnCronjobMethods {
  RefreshTokenPrices = 'refreshTokenPrices',
}

export const handlers: Record<OnCronjobMethods, OnCronjobHandler> = {
  [OnCronjobMethods.RefreshTokenPrices]: refreshTokenPrices,
  // Register new handlers here
};
