import type { CaipAssetType } from '@metamask/keyring-api';
import type { Infer } from 'superstruct';

import type { SpotPricesFromPriceApiWithoutMarketDataStruct } from './structs';

export type PriceApiClientConfig = {
  baseUrl: string;
};

export type SpotPricesFromPriceApiWithoutMarketData = Infer<
  typeof SpotPricesFromPriceApiWithoutMarketDataStruct
>;

export type SpotPrices = Record<CaipAssetType, { price: number }>;
