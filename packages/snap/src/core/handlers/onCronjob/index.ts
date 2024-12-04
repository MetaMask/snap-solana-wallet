import { type OnCronjobHandler } from '@metamask/snaps-sdk';

import { refreshTokenRates } from './refreshTokenRates';

export enum OnCronjobMethods {
  RefreshTokenRates = 'refreshTokenRates',
}

export const handlers: Record<OnCronjobMethods, OnCronjobHandler> = {
  [OnCronjobMethods.RefreshTokenRates]: refreshTokenRates,
  // Register new handlers here
};
