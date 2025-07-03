import type { Infer } from '@metamask/superstruct';
import {
  array,
  boolean,
  enums,
  min,
  nullable,
  number,
  object,
  optional,
  pattern,
  record,
  string,
  tuple,
  union,
} from '@metamask/superstruct';
import { CaipAssetTypeStruct } from '@metamask/utils';

export type PriceApiClientConfig = {
  baseUrl: string;
};

export const CryptoTickerStruct = enums([
  'btc',
  'eth',
  'ltc',
  'bch',
  'bnb',
  'eos',
  'xrp',
  'xlm',
  'link',
  'dot',
  'yfi',
  'bits',
  'sats',
  'sol',
  'sei',
  'sonic',
]);

export const FiatTickerStruct = enums([
  'usd',
  'aed',
  'amd',
  'ars',
  'aud',
  'bam',
  'bdt',
  'bhd',
  'bmd',
  'brl',
  'cad',
  'chf',
  'clp',
  'cny',
  'cop',
  'crc',
  'czk',
  'dkk',
  'dop',
  'eur',
  'gbp',
  'gel',
  'gtq',
  'hkd',
  'hnl',
  'huf',
  'idr',
  'ils',
  'inr',
  'jpy',
  'kes',
  'krw',
  'kwd',
  'lbp',
  'lkr',
  'mmk',
  'mxn',
  'myr',
  'ngn',
  'nok',
  'nzd',
  'pen',
  'php',
  'pkr',
  'pln',
  'ron',
  'rub',
  'sar',
  'sek',
  'sgd',
  'svc',
  'thb',
  'try',
  'twd',
  'uah',
  'vef',
  'vnd',
  'xdr',
  'zar',
  'zmw',
]);

export const CommodityTickerStruct = enums(['xag', 'xau']);

export type CryptoTicker = Infer<typeof CryptoTickerStruct>;
export type FiatTicker = Infer<typeof FiatTickerStruct>;
export type CommodityTicker = Infer<typeof CommodityTickerStruct>;

export const TickerStruct = union([
  CryptoTickerStruct,
  FiatTickerStruct,
  CommodityTickerStruct,
]);

export type Ticker = Infer<typeof TickerStruct>;

export type ExchangeRate = {
  name: string;
  ticker: Ticker;
  value: number;
  currencyType: 'fiat' | 'crypto' | 'commodity';
};

/**
 * The structure of the spot price response from the Price API as described in
 * [this file](https://github.com/consensys-vertical-apps/va-mmcx-price-api/blob/main/src/types/price.ts#L46-L71).
 *
 * For safety, most fields are marked optional and nullable even though it goes against the type in the Price API source code.
 */

export const SpotPriceStruct = object({
  id: string(),
  price: min(number(), 0),
  marketCap: optional(nullable(min(number(), 0))),
  allTimeHigh: optional(nullable(min(number(), 0))),
  allTimeLow: optional(nullable(min(number(), 0))),
  totalVolume: optional(nullable(min(number(), 0))),
  high1d: optional(nullable(min(number(), 0))),
  low1d: optional(nullable(min(number(), 0))),
  circulatingSupply: optional(nullable(min(number(), 0))),
  dilutedMarketCap: optional(nullable(min(number(), 0))),
  marketCapPercentChange1d: optional(nullable(number())),
  priceChange1d: optional(nullable(number())),
  pricePercentChange1h: optional(nullable(number())),
  pricePercentChange1d: optional(nullable(number())),
  pricePercentChange7d: optional(nullable(number())),
  pricePercentChange14d: optional(nullable(number())),
  pricePercentChange30d: optional(nullable(number())),
  pricePercentChange200d: optional(nullable(number())),
  pricePercentChange1y: optional(nullable(number())),
  bondingCurveProgressPercent: optional(nullable(number())),
  liquidity: optional(nullable(number())),
  totalSupply: optional(nullable(number())),
  holderCount: optional(nullable(number())),
  isMutable: optional(nullable(boolean())),
});

export type SpotPrice = Infer<typeof SpotPriceStruct>;

/**
 * @example
 * {
 *   "bip122:000000000019d6689c085ae165831e93/slip44:0": {
 *     "id": "bitcoin",
 *     "price": 84302,
 *     "marketCap": 1670808919774,
 *     "allTimeHigh": 108786,
 *     "allTimeLow": 67.81,
 *     "totalVolume": 25784747348,
 *     "high1d": 84370,
 *     "low1d": 81426,
 *     "circulatingSupply": 19844840,
 *     "dilutedMarketCap": 1670808919774,
 *     "marketCapPercentChange1d": 3.2788,
 *     "priceChange1d": 2876.1,
 *     "pricePercentChange1h": 0.1991278666784771,
 *     "pricePercentChange1d": 3.5321815522315307,
 *     "pricePercentChange7d": -3.4056070943823666,
 *     "pricePercentChange14d": 1.663812725054475,
 *     "pricePercentChange30d": -1.8166338283570667,
 *     "pricePercentChange200d": 45.12491105880435,
 *     "pricePercentChange1y": 21.403818710804778
 *   },
 *   "eip155:1/slip44:60": { ... },
 *   "solana:EtWTRABZaYq6iMfeYKouRu166VU2xqa1/slip44:501": null
 */
export const SpotPricesStruct = record(
  CaipAssetTypeStruct,
  nullable(SpotPriceStruct),
);

export type SpotPrices = Infer<typeof SpotPricesStruct>;

// In the Price API source code, the parameters `vsCurrency` and `ticker` represent the same list of values.
// We create aliases here for clarity.
export const VsCurrencyParamStruct = TickerStruct;
export type VsCurrencyParam = Infer<typeof VsCurrencyParamStruct>;

export const GetHistoricalPricesParamsStruct = object({
  assetType: CaipAssetTypeStruct,
  timePeriod: optional(pattern(string(), /^[1-9][0-9]*[dmy]$/u)), // Supports days, months, years
  from: optional(min(number(), 0)),
  to: optional(min(number(), 0)),
  vsCurrency: optional(VsCurrencyParamStruct),
});

export type GetHistoricalPricesParams = Infer<
  typeof GetHistoricalPricesParamsStruct
>;

export const GetHistoricalPricesResponseStruct = object({
  prices: array(tuple([number(), number()])),
  marketCaps: array(tuple([number(), number()])),
  totalVolumes: array(tuple([number(), number()])),
});

export type GetHistoricalPricesResponse = Infer<
  typeof GetHistoricalPricesResponseStruct
>;

export const GET_HISTORICAL_PRICES_RESPONSE_NULL_OBJECT: GetHistoricalPricesResponse =
  {
    prices: [],
    marketCaps: [],
    totalVolumes: [],
  };
