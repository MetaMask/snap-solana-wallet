import type { CaipAssetType } from '@metamask/keyring-api';
import { array, assert } from '@metamask/superstruct';
import { CaipAssetTypeStruct, parseCaipAssetType } from '@metamask/utils';

import { Network } from '../../constants/solana';
import type { ConfigProvider } from '../../services/config';
import { NftService } from '../../services/nft/NftService';
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
    assetTypes: CaipAssetType[],
  ): Promise<Record<CaipAssetType, SolanaTokenMetadata>> {
    try {
      assert(assetTypes, array(CaipAssetTypeStruct));

      // The Token API only supports the networks in TokenMetadataClient.supportedNetworks
      const supportedAssetTypes = assetTypes.filter((assetType) => {
        const { chainId } = parseCaipAssetType(assetType);
        return TokenMetadataClient.supportedNetworks.includes(
          chainId as Network,
        );
      });

      if (supportedAssetTypes.length !== assetTypes.length) {
        this.#logger.warn(
          `[TokenMetadataClient] Received some asset types on networks that the Token API doesn't support. They will be ignored. Supported networks: ${TokenMetadataClient.supportedNetworks.join(
            ', ',
          )}`,
        );
      }

      // Split addresses into chunks
      const chunks: CaipAssetType[][] = [];
      for (let i = 0; i < supportedAssetTypes.length; i += this.#chunkSize) {
        chunks.push(supportedAssetTypes.slice(i, i + this.#chunkSize));
      }

      // Fetch metadata for each chunk
      const tokenMetadataResponses = await Promise.all(
        chunks.map(async (chunk) => this.#fetchTokenMetadataBatch(chunk)),
      );

      // Flatten and process all metadata
      const tokenMetadataMap = new Map<string, SolanaTokenMetadata>();

      tokenMetadataResponses.flat().forEach((metadata) => {
        const tokenSymbol = metadata?.symbol;
        const tokenNameOrSymbol = metadata?.name ?? tokenSymbol;
        const tokenDecimals = metadata?.decimals;

        if (!tokenSymbol || !tokenNameOrSymbol) {
          this.#logger.warn(`No metadata for ${metadata.assetId}`);
          return;
        }

        tokenMetadataMap.set(metadata.assetId, {
          name: tokenNameOrSymbol,
          symbol: tokenSymbol,
          fungible: !NftService.isMaybeNonFungible({
            tokenAmount: { decimals: tokenDecimals },
          }) as unknown as true, // TODO: Remove this cast once the changes in https://github.com/MetaMask/SIPs/pull/174 are implemented on the snap SDK
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
              name: tokenNameOrSymbol,
              symbol: tokenSymbol,
              decimals: tokenDecimals,
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
