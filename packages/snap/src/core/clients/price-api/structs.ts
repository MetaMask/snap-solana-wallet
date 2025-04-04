import type { Infer } from '@metamask/superstruct';
import {
  boolean,
  enums,
  min,
  nullable,
  number,
  object,
  record,
  string,
} from '@metamask/superstruct';
import { CaipAssetTypeStruct } from '@metamask/utils';

import { PercentNumberStruct } from '../../validation/structs';

/**
 * The structure of the spot price response from the Price API as described in
 * [this file](https://github.com/consensys-vertical-apps/va-mmcx-price-api/blob/main/src/types/price.ts#L46-L71),
 *
 * All undefined fields are replaced with null, to ensure that the returned object is assignable to `Json`.
 */
export const SpotPriceStruct = object({
  id: string(),
  price: min(number(), 0),
  marketCap: min(number(), 0),
  allTimeHigh: nullable(min(number(), 0)),
  allTimeLow: nullable(min(number(), 0)),
  totalVolume: nullable(min(number(), 0)),
  high1d: nullable(min(number(), 0)),
  low1d: nullable(min(number(), 0)),
  circulatingSupply: nullable(min(number(), 0)),
  dilutedMarketCap: nullable(min(number(), 0)),
  marketCapPercentChange1d: nullable(PercentNumberStruct),
  priceChange1d: nullable(number()),
  pricePercentChange1h: nullable(PercentNumberStruct),
  pricePercentChange1d: nullable(PercentNumberStruct),
  pricePercentChange7d: nullable(PercentNumberStruct),
  pricePercentChange14d: nullable(PercentNumberStruct),
  pricePercentChange30d: nullable(PercentNumberStruct),
  pricePercentChange200d: nullable(PercentNumberStruct),
  pricePercentChange1y: nullable(PercentNumberStruct),
  bondingCurveProgressPercent: nullable(number()),
  liquidity: nullable(number()),
  totalSupply: nullable(number()),
  holderCount: nullable(number()),
  isMutable: nullable(boolean()),
});

export type SpotPrice = Infer<typeof SpotPriceStruct>;

export const SPOT_PRICE_NULL_OBJECT: SpotPrice = {
  id: '',
  price: 0,
  marketCap: 0,
  allTimeHigh: null,
  allTimeLow: null,
  totalVolume: null,
  high1d: null,
  low1d: null,
  circulatingSupply: null,
  dilutedMarketCap: null,
  marketCapPercentChange1d: null,
  priceChange1d: null,
  pricePercentChange1h: null,
  pricePercentChange1d: null,
  pricePercentChange7d: null,
  pricePercentChange14d: null,
  pricePercentChange30d: null,
  pricePercentChange200d: null,
  pricePercentChange1y: null,
  bondingCurveProgressPercent: null,
  liquidity: null,
  totalSupply: null,
  holderCount: null,
  isMutable: null,
};

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

export const VsCurrencyParamStruct = enums([
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
  'usd',
  'aed',
  'ars',
  'aud',
  'bdt',
  'bhd',
  'bmd',
  'brl',
  'cad',
  'chf',
  'clp',
  'cny',
  'czk',
  'dkk',
  'eur',
  'gbp',
  'gel',
  'hkd',
  'huf',
  'idr',
  'ils',
  'inr',
  'jpy',
  'krw',
  'kwd',
  'lkr',
  'mmk',
  'mxn',
  'myr',
  'ngn',
  'nok',
  'nzd',
  'php',
  'pkr',
  'pln',
  'rub',
  'sar',
  'sek',
  'sgd',
  'thb',
  'try',
  'twd',
  'uah',
  'vef',
  'vnd',
  'zar',
  'xdr',
  'xag',
  'xau',
  'bits',
  'sats',
]);

export type VsCurrencyParam = Infer<typeof VsCurrencyParamStruct>;
