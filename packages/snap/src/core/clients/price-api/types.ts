import type { CaipAssetType } from '@metamask/keyring-api';

export type PriceApiClientConfig = {
  baseUrl: string;
};

/**
 * When includeMarketData=false, the price api returns this format,
 * where price value is indexed by CAIP-19 and currency:
 *
 * @example
 * {
 *   "solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp/slip44:501": {
 *     "usd": 202.53
 *   },
 *  ...
 * }
 */
export type SpotPricesFromPriceApiWithIncludeMarketDataFalse = Record<
  CaipAssetType,
  Record<string, number>
>;

export type SpotPrices = Record<CaipAssetType, { price: number }>;
