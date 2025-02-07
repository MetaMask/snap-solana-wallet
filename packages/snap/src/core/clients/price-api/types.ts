import type { CaipAssetType } from '@metamask/keyring-api';
import { type Infer } from 'superstruct';

import type {
  SpotPricesFromPriceApiWithoutMarketDataStruct,
  VsCurrencyParamStruct,
} from './structs';

export type PriceApiClientConfig = {
  baseUrl: string;
};

export type SpotPricesFromPriceApiWithoutMarketData = Infer<
  typeof SpotPricesFromPriceApiWithoutMarketDataStruct
>;

export type SpotPrices = Record<CaipAssetType, { price: number }>;

export type VsCurrencyParam = Infer<typeof VsCurrencyParamStruct>;
