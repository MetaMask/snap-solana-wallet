import { CaipAssetTypeStruct } from '@metamask/keyring-api';
import type { Infer } from '@metamask/superstruct';
import {
  enums,
  min,
  nullable,
  number,
  record,
  string,
  type,
} from '@metamask/superstruct';

import { PercentNumberStruct } from '../../validation/structs';

/**
 * We use `type()` here instead of `object()` to allow for extra properties that are not defined in the schema.
 * This is because the Price API `GET /v3/spot-prices` endpoint returns undocumented extra properties occasionally.
 */
export const SpotPriceStruct = type({
  id: string(),
  price: min(number(), 0),
  marketCap: min(number(), 0),
  allTimeHigh: nullable(min(number(), 0)),
  allTimeLow: nullable(min(number(), 0)),
  totalVolume: min(number(), 0),
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
