import type { OnAssetHistoricalPriceResponse } from '@metamask/snaps-sdk';

export type HistoricalPrice =
  NonNullable<OnAssetHistoricalPriceResponse>['historicalPrice'];
