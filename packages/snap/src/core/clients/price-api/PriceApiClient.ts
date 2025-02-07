/* eslint-disable no-restricted-globals */
import type { CaipAssetType } from '@metamask/keyring-api';
import { array, assert } from 'superstruct';

import type { ConfigProvider } from '../../services/config';
import { buildUrl } from '../../utils/buildUrl';
import type { ILogger } from '../../utils/logger';
import logger from '../../utils/logger';
import { Caip19Struct, UrlStruct } from '../../validation/structs';
import {
  SpotPricesFromPriceApiWithoutMarketDataStruct,
  VsCurrencyParamStruct,
} from './structs';
import type { SpotPrices, VsCurrencyParam } from './types';

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

  async getMultipleSpotPrices(
    tokenCaip19Ids: CaipAssetType[],
    vsCurrency: VsCurrencyParam = 'usd',
  ): Promise<SpotPrices> {
    try {
      assert(tokenCaip19Ids, array(Caip19Struct));
      assert(vsCurrency, VsCurrencyParamStruct);

      // Split tokenCaip19Ids into chunks
      const chunks: CaipAssetType[][] = [];
      for (let i = 0; i < tokenCaip19Ids.length; i += this.#chunkSize) {
        chunks.push(tokenCaip19Ids.slice(i, i + this.#chunkSize));
      }

      // Make parallel requests for each chunk
      const responses = await Promise.all(
        chunks.map(async (chunk) => {
          const url = buildUrl(this.#baseUrl, '/v3/spot-prices', {
            vsCurrency,
            assetIds: chunk.join(','),
            includeMarketData: 'false',
          });

          const response = await this.#fetch(url);

          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }

          const spotPricesResponse = await response.json();
          assert(
            spotPricesResponse,
            SpotPricesFromPriceApiWithoutMarketDataStruct,
          );

          const result = Object.keys(spotPricesResponse).reduce(
            (acc: SpotPrices, caip19Id) => {
              const price =
                spotPricesResponse?.[caip19Id as CaipAssetType]?.[vsCurrency];
              if (!price) {
                return acc;
              }
              acc[caip19Id as CaipAssetType] = {
                price,
              };
              return acc;
            },
            {},
          );

          return result;
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
