import type { FungibleAssetMetadata } from '@metamask/snaps-sdk';
import { array, assert, type Infer } from '@metamask/superstruct';
import { CaipAssetTypeStruct, parseCaipAssetType } from '@metamask/utils';

import type { TokenCaipAssetType } from '../../constants/solana';
import { Network, TokenCaipAssetTypeStruct } from '../../constants/solana';
import type { ConfigProvider } from '../../services/config';
import { buildUrl } from '../../utils/buildUrl';
import type { ILogger } from '../../utils/logger';
import logger from '../../utils/logger';
import { UrlStruct } from '../../validation/structs';
import { TokenMetadataResponseStruct } from './structs';

const DEFAULT_DECIMALS = 9;

const DEFAULT_TOKEN_METADATA: FungibleAssetMetadata = {
  name: 'UNKNOWN',
  symbol: 'UNKNOWN',
  fungible: true,
  iconUrl: '',
  units: [{ name: 'UNKNOWN', symbol: 'UNKNOWN', decimals: DEFAULT_DECIMALS }],
} as const;

export class TokenApiClient {
  readonly #fetch: typeof globalThis.fetch;

  readonly #logger: ILogger;

  readonly #baseUrl: string;

  readonly #chunkSize: number;

  readonly #tokenIconBaseUrl: string;

  public static readonly supportedNetworks = [Network.Mainnet, Network.Devnet];

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
    assetTypes: TokenCaipAssetType[],
  ): Promise<Infer<typeof TokenMetadataResponseStruct>> {
    assert(assetTypes, array(TokenCaipAssetTypeStruct));

    const url = buildUrl({
      baseUrl: this.#baseUrl,
      path: '/v3/assets',
      queryParams: {
        assetIds: assetTypes.join(','),
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

  async getTokensMetadata(
    assetTypes: TokenCaipAssetType[],
  ): Promise<Record<TokenCaipAssetType, FungibleAssetMetadata>> {
    try {
      assert(assetTypes, array(CaipAssetTypeStruct));

      // The Token API only supports the networks in TokenApiClient.supportedNetworks
      const supportedAssetTypes = assetTypes.filter((assetType) => {
        const { chainId } = parseCaipAssetType(assetType);
        return TokenApiClient.supportedNetworks.includes(chainId as Network);
      });

      if (supportedAssetTypes.length !== assetTypes.length) {
        this.#logger.warn(
          `[TokenApiClient] Received some asset types on networks that the Token API doesn't support. They will be ignored. Supported networks: ${TokenApiClient.supportedNetworks.join(
            ', ',
          )}`,
        );
      }

      // Split addresses into chunks
      const chunks: TokenCaipAssetType[][] = [];
      for (let i = 0; i < supportedAssetTypes.length; i += this.#chunkSize) {
        chunks.push(supportedAssetTypes.slice(i, i + this.#chunkSize));
      }

      // Fetch metadata for each chunk
      const tokenMetadataResponses = (
        await Promise.all(
          chunks.map(async (chunk) => this.#fetchTokenMetadataBatch(chunk)),
        )
      ).flat();

      // Flatten and process all metadata
      const tokenMetadataMap = new Map<
        TokenCaipAssetType,
        FungibleAssetMetadata
      >();

      /**
       * Iterate over each asset type, and return a default value when metadata is not found,
       * to ensure the returned object has exactly the same keys as the input array.
       */
      assetTypes.forEach((assetType) => {
        const tokenMetadata = tokenMetadataResponses.find(
          (item) => item.assetId === assetType,
        );

        const defaultIconUrl = buildUrl({
          baseUrl: this.#tokenIconBaseUrl,
          path: '/api/v2/tokenIcons/assets/{assetType}.png',
          pathParams: {
            assetType: assetType.replace(/:/gu, '/'),
          },
          encodePathParams: false,
        });

        if (!tokenMetadata) {
          this.#logger.warn(
            `No metadata for ${assetType}. Returning default values.`,
          );
          tokenMetadataMap.set(assetType, {
            ...DEFAULT_TOKEN_METADATA,
            iconUrl: defaultIconUrl,
          });
          return;
        }

        const name = tokenMetadata.name ?? DEFAULT_TOKEN_METADATA.name;
        const symbol = tokenMetadata.symbol ?? DEFAULT_TOKEN_METADATA.symbol;
        const decimals = tokenMetadata.decimals ?? DEFAULT_DECIMALS;

        const metadata: FungibleAssetMetadata = {
          name,
          symbol,
          fungible: true,
          iconUrl: tokenMetadata.iconUrl ?? defaultIconUrl,
          units: [
            {
              name,
              symbol,
              decimals,
            },
          ],
        };

        tokenMetadataMap.set(assetType, metadata);
      });

      return Object.fromEntries(tokenMetadataMap);
    } catch (error) {
      this.#logger.error(error, 'Error fetching token metadata');
      throw error;
    }
  }
}
