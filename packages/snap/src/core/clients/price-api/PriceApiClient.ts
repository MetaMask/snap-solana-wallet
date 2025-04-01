/* eslint-disable no-restricted-globals */
import type { CaipAssetType } from '@metamask/keyring-api';
import { array, assert } from '@metamask/superstruct';
import { CaipAssetTypeStruct } from '@metamask/utils';

import type { ConfigProvider } from '../../services/config';
import { buildUrl } from '../../utils/buildUrl';
import type { ILogger } from '../../utils/logger';
import logger from '../../utils/logger';
import { UrlStruct } from '../../validation/structs';
import type { SpotPrices, VsCurrencyParam } from './structs';
import { SpotPricesStruct, VsCurrencyParamStruct } from './structs';
import type { ExchangeRate, FiatTicker } from './types';

export class PriceApiClient {
  readonly #fetch: typeof globalThis.fetch;

  readonly #logger: ILogger;

  readonly #baseUrl: string;

  readonly #chunkSize: number;

  constructor(
    configProvider: ConfigProvider,
    _fetch: typeof globalThis.fetch = globalThis.fetch,
    _logger: ILogger = logger,
  ) {
    const { baseUrl, chunkSize } = configProvider.get().priceApi;

    assert(baseUrl, UrlStruct);

    this.#fetch = _fetch;
    this.#logger = _logger;
    this.#baseUrl = baseUrl;
    this.#chunkSize = chunkSize;
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

      // Split tokenCaip19Ids into chunks
      const chunks: CaipAssetType[][] = [];
      for (let i = 0; i < tokenCaip19Ids.length; i += this.#chunkSize) {
        chunks.push(tokenCaip19Ids.slice(i, i + this.#chunkSize));
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

          const spotPricesResponse = await response.json();
          assert(spotPricesResponse, SpotPricesStruct);

          return spotPricesResponse;
        }),
      );

      // Combine all responses
      return responses.reduce((prices, price) => ({ ...prices, ...price }), {});
    } catch (error) {
      this.#logger.error(error, 'Error fetching spot prices');
      throw error;
    }
  }
}
