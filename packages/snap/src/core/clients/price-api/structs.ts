import { nullable, record, string } from 'superstruct';

import { Caip19Struct, PositiveNumber } from '../../validation/structs';

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
  nullable(record(string(), PositiveNumber)),
);
