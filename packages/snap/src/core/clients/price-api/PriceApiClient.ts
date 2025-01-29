/* eslint-disable no-restricted-globals */
import type { CaipAssetType } from '@metamask/keyring-api';

import type { ConfigProvider } from '../../services/config';
import type { ILogger } from '../../utils/logger';
import logger from '../../utils/logger';
import type { SpotPriceResponse, SpotPrices } from './types';

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

    this.#fetch = _fetch;
    this.#logger = _logger;
    this.#baseUrl = baseUrl;
    this.#chunkSize = chunkSize;
  }

  async getMultipleSpotPrices(
    tokenCaip19Ids: CaipAssetType[],
    vsCurrency = 'usd',
  ): Promise<SpotPriceResponse> {
    try {
      // Split tokenCaip19Ids into chunks
      const chunks: CaipAssetType[][] = [];
      for (let i = 0; i < tokenCaip19Ids.length; i += this.#chunkSize) {
        chunks.push(tokenCaip19Ids.slice(i, i + this.#chunkSize));
      }

      // Make parallel requests for each chunk
      const responses = await Promise.all(
        chunks.map(async (chunk) => {
          const params = [
            `vsCurrency=${encodeURIComponent(vsCurrency)}`,
            `assetIds=${encodeURIComponent(chunk.join(','))}`,
            `includeMarketData=false`,
          ];

          const response = await this.#fetch(
            `${this.#baseUrl}/v3/spot-prices?${params.join('&')}`,
          );

          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }

          const prices = (await response.json()) as SpotPrices;

          return Object.keys(prices).reduce(
            (acc: SpotPriceResponse, caip19Id) => {
              acc[caip19Id as CaipAssetType] = {
                price: prices?.[caip19Id as CaipAssetType]?.[
                  vsCurrency
                ] as number,
              };
              return acc;
            },
            {},
          );
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
