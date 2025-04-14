/* eslint-disable @typescript-eslint/naming-convention */
/* eslint-disable no-restricted-globals */
import type { CaipAssetType } from '@metamask/keyring-api';
import { array, assert } from '@metamask/superstruct';
import { CaipAssetTypeStruct } from '@metamask/utils';

import type { ICache } from '../../caching/ICache';
import { useCache } from '../../caching/useCache';
import type { Serializable } from '../../serialization/types';
import type { ConfigProvider } from '../../services/config';
import { buildUrl } from '../../utils/buildUrl';
import type { ILogger } from '../../utils/logger';
import logger from '../../utils/logger';
import { UrlStruct } from '../../validation/structs';
import type {
  ExchangeRate,
  FiatTicker,
  GetHistoricalPricesParams,
  GetHistoricalPricesResponse,
  SpotPrices,
  VsCurrencyParam,
} from './types';
import {
  GetHistoricalPricesParamsStruct,
  GetHistoricalPricesResponseStruct,
  SpotPricesStruct,
  VsCurrencyParamStruct,
} from './types';

export class PriceApiClient {
  readonly #fetch: typeof globalThis.fetch;

  readonly #logger: ILogger;

  readonly #baseUrl: string;

  readonly #chunkSize: number;

  readonly #cache: ICache<Serializable>;

  readonly #cacheTtlsMilliseconds = {
    fiatExchangeRates: 1000 * 60 * 60, // 1 hour
    spotPrices: 1000 * 60 * 60, // 1 hour
    historicalPrices: 1000 * 60 * 60, // 1 hour
  };

  constructor(
    configProvider: ConfigProvider,
    _cache: ICache<Serializable>,
    _fetch: typeof globalThis.fetch = globalThis.fetch,
    _logger: ILogger = logger,
  ) {
    const { baseUrl, chunkSize } = configProvider.get().priceApi;

    assert(baseUrl, UrlStruct);

    this.#fetch = _fetch;
    this.#logger = _logger;
    this.#baseUrl = baseUrl;
    this.#chunkSize = chunkSize;

    this.#cache = _cache;
  }

  async getFiatExchangeRates(): Promise<Record<FiatTicker, ExchangeRate>> {
    try {
      const response = await this.#fetch(
        `${this.#baseUrl}/v1/exchange-rates/fiat`,
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      this.#logger.error(error, 'Error fetching fiat exchange rates');
      throw error;
    }
  }

  async getMultipleSpotPrices(
    tokenCaip19Ids: CaipAssetType[],
    vsCurrency: VsCurrencyParam | string = 'usd',
  ): Promise<SpotPrices> {
    try {
      assert(tokenCaip19Ids, array(CaipAssetTypeStruct));
      assert(vsCurrency, VsCurrencyParamStruct);

      if (tokenCaip19Ids.length === 0) {
        return {};
      }

      const uniqueTokenCaip19Ids = [...new Set(tokenCaip19Ids)];

      const toCacheKey = (tokenCaip19Id: CaipAssetType) =>
        `PriceApiClient:getMultipleSpotPrices:${tokenCaip19Id}:${vsCurrency}`;

      const cachedSpotPricesRecord = await this.#cache.mget(
        uniqueTokenCaip19Ids.map(toCacheKey),
      );

      const nonCachedTokenCaip19Ids = uniqueTokenCaip19Ids.filter(
        (tokenCaip19Id) =>
          cachedSpotPricesRecord[toCacheKey(tokenCaip19Id)] === undefined,
      );

      // Split tokenCaip19Ids into chunks
      const chunks: CaipAssetType[][] = [];
      for (
        let i = 0;
        i < nonCachedTokenCaip19Ids.length;
        i += this.#chunkSize
      ) {
        chunks.push(nonCachedTokenCaip19Ids.slice(i, i + this.#chunkSize));
      }

      // Make parallel requests for each chunk
      const responses = await Promise.all(
        chunks.map(async (chunk) => {
          const url = buildUrl({
            baseUrl: this.#baseUrl,
            path: '/v3/spot-prices',
            queryParams: {
              vsCurrency,
              assetIds: chunk.join(','),
              includeMarketData: 'true',
            },
          });

          const response = await this.#fetch(url);

          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }

          const spotPrices = await response.json();
          assert(spotPrices, SpotPricesStruct);

          return spotPrices;
        }),
      );

      // Combine all responses
      const spotPrices = responses.reduce(
        (prices, price) => ({ ...prices, ...price }),
        {},
      );

      // Cache the spot prices for 5 minutes
      await this.#cache.mset(
        tokenCaip19Ids.map((tokenCaip19Id) => ({
          key: `PriceApiClient:getMultipleSpotPrices:${tokenCaip19Id}:${vsCurrency}`,
          value: spotPrices[tokenCaip19Id],
          ttlMilliseconds: 1000 * 60 * 5, // 5 minutes
        })),
      );

      return spotPrices;
    } catch (error) {
      this.#logger.error(error, 'Error fetching spot prices');
      throw error;
    }
  }

  async #getHistoricalPrices_INTERNAL(
    params: GetHistoricalPricesParams,
  ): Promise<GetHistoricalPricesResponse> {
    assert(params, GetHistoricalPricesParamsStruct);

    const url = buildUrl({
      baseUrl: this.#baseUrl,
      path: '/v3/historical-prices/{assetType}',
      pathParams: {
        assetType: params.assetType,
      },
      queryParams: {
        ...(params.timePeriod && { timePeriod: params.timePeriod }),
        ...(params.from && { from: params.from.toString() }),
        ...(params.to && { to: params.to.toString() }),
        ...(params.vsCurrency && { vsCurrency: params.vsCurrency }),
      },
    });

    const response = await this.#fetch(url);
    const historicalPrices = await response.json();
    assert(historicalPrices, GetHistoricalPricesResponseStruct);

    return historicalPrices;
  }

  /**
   * Get historical prices for a token by calling the Price API.
   * It caches the results for 1 hour.
   *
   * @see https://price.uat-api.cx.metamask.io/docs#/Historical%20Prices/PriceController_getHistoricalPricesByCaipAssetId
   * @param params - The parameters for the request.
   * @param params.assetType - The asset type of the token.
   * @param params.timePeriod - The time period for the historical prices.
   * @param params.from - The start date for the historical prices.
   * @param params.to - The end date for the historical prices.
   * @param params.vsCurrency - The currency to convert the prices to.
   * @returns The historical prices for the token.
   */
  async getHistoricalPrices(
    params: GetHistoricalPricesParams,
  ): Promise<GetHistoricalPricesResponse> {
    return useCache(
      this.#getHistoricalPrices_INTERNAL.bind(this),
      this.#cache,
      {
        functionName: 'PriceApiClient:getHistoricalPrices',
        ttlMilliseconds: this.#cacheTtlsMilliseconds.historicalPrices,
      },
    )(params);
  }
}
