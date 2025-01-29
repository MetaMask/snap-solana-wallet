import type { CaipAssetType } from '@metamask/keyring-api';

import type { ConfigProvider } from '../../services/config';
import type { ILogger } from '../../utils/logger';
import logger from '../../utils/logger';
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

    const { baseUrl, chunkSize } = configProvider.get().tokenApi;

    this.#baseUrl = baseUrl;
    this.#chunkSize = chunkSize;
    this.#tokenIconBaseUrl = 'https://uat-static.cx.metamask.io';
  }

  async #fetchTokenMetadataBatch(
    caip19Ids: CaipAssetType[],
  ): Promise<TokenMetadata[]> {
    const params = [`assetIds=${encodeURIComponent(caip19Ids.join(','))}`];

    const response = await this.#fetch(
      `${this.#baseUrl}/v3/assets?${params.join('&')}`,
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = (await response.json()) as TokenMetadata[];

    return data;
  }

  async getTokenMetadataFromAddresses(
    caip19Ids: CaipAssetType[],
  ): Promise<Record<CaipAssetType, SolanaTokenMetadata>> {
    try {
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
            `${
              this.#tokenIconBaseUrl
            }/api/v2/tokenIcons/assets/${metadata.assetId.replace(
              /:/gu,
              '/',
            )}.png`,
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
