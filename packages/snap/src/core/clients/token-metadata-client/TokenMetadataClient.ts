import type { CaipAssetType } from '@metamask/keyring-api';
import { array, assert } from '@metamask/superstruct';
import { CaipAssetTypeStruct } from '@metamask/utils';

import type { ConfigProvider } from '../../services/config';
import { buildUrl } from '../../utils/buildUrl';
import type { ILogger } from '../../utils/logger';
import logger from '../../utils/logger';
import { UrlStruct } from '../../validation/structs';
import { TokenMetadataResponseStruct } from './structs';
import type { SolanaTokenMetadata, TokenMetadata } from './types';

export class TokenMetadataClient {
  readonly #fetch: typeof globalThis.fetch;

  readonly #logger: ILogger;

  readonly #baseUrl: string;

  readonly #chunkSize: number;

  readonly #tokenIconBaseUrl: string;

  constructor(
    configProvider: ConfigProvider,
    _fetch: typeof globalThis.fetch = globalThis.fetch,
    _logger: ILogger = logger,
  ) {
    this.#fetch = _fetch;
    this.#logger = _logger;

    const { tokenApi, staticApi } = configProvider.get();
    const { baseUrl, chunkSize } = tokenApi;

    assert(baseUrl, UrlStruct);

    this.#baseUrl = baseUrl;
    this.#chunkSize = chunkSize;
    this.#tokenIconBaseUrl = staticApi.baseUrl;
  }

  async #fetchTokenMetadataBatch(
    caip19Ids: CaipAssetType[],
  ): Promise<TokenMetadata[]> {
    assert(caip19Ids, array(CaipAssetTypeStruct));

    const url = buildUrl({
      baseUrl: this.#baseUrl,
      path: '/v3/assets',
      queryParams: {
        assetIds: caip19Ids.join(','),
      },
    });

    const response = await this.#fetch(url);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    assert(data, TokenMetadataResponseStruct);

    return data;
  }

  async getTokenMetadataFromAddresses(
    caip19Ids: CaipAssetType[],
  ): Promise<Record<CaipAssetType, SolanaTokenMetadata>> {
    try {
      assert(caip19Ids, array(CaipAssetTypeStruct));

      // Split addresses into chunks
      const chunks: CaipAssetType[][] = [];
      for (let i = 0; i < caip19Ids.length; i += this.#chunkSize) {
        chunks.push(caip19Ids.slice(i, i + this.#chunkSize));
      }

      // Fetch metadata for each chunk
      const tokenMetadataResponses = await Promise.all(
        chunks.map(async (chunk) => this.#fetchTokenMetadataBatch(chunk)),
      );

      // Flatten and process all metadata
      const tokenMetadataMap = new Map<string, SolanaTokenMetadata>();

      tokenMetadataResponses.flat().forEach((metadata) => {
        tokenMetadataMap.set(metadata.assetId, {
          name: metadata.name,
          symbol: metadata.symbol,
          fungible: true,
          iconUrl:
            metadata?.iconUrl ??
            buildUrl({
              baseUrl: this.#tokenIconBaseUrl,
              path: '/api/v2/tokenIcons/assets/{assetId}.png',
              pathParams: {
                assetId: metadata.assetId.replace(/:/gu, '/'),
              },
            }),
          units: [
            {
              name: metadata.name,
              symbol: metadata.symbol,
              decimals: metadata.decimals,
            },
          ],
        });
      });

      return Object.fromEntries(tokenMetadataMap);
    } catch (error) {
      this.#logger.error(error, 'Error fetching token metadata');
      throw error;
    }
  }
}
