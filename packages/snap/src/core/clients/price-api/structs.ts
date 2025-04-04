import {
  enums,
  min,
  nullable,
  number,
  record,
  string,
} from '@metamask/superstruct';

import { Caip19Struct } from '../../validation/structs';

/**
 * When includeMarketData=false, the price api returns the following format,
 * which is DIFFERENT from the format when includeMarketData=true.
 *
 * @example
 * {
 *   "solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp/slip44:501": {
 *     "usd": 202.53
 *   },
 *   "solana:EtWTRABZaYq6iMfeYKouRu166VU2xqa1/slip44:501": null
 * }
 */
export const SpotPricesFromPriceApiWithoutMarketDataStruct = record(
  Caip19Struct,
  nullable(record(string(), min(number(), 0))),
);

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
