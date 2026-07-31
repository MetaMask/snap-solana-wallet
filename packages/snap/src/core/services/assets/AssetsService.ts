/* eslint-disable jsdoc/require-returns */
/* eslint-disable jsdoc/check-indentation */
import type {
  FungibleAssetMarketData,
  FungibleAssetMetadata,
} from '@metamask/snaps-sdk';
import type { CaipAssetType, CaipChainId } from '@metamask/utils';
import { parseCaipAssetType } from '@metamask/utils';

import type { AssetEntity, SolanaKeyringAccount } from '../../../entities';
import type { NftApiClient } from '../../clients/nft-api/NftApiClient';
import type { TokenApiClient } from '../../clients/token-api-client/TokenApiClient';
import type {
  NativeCaipAssetType,
  NftCaipAssetType,
  TokenCaipAssetType,
} from '../../constants/solana';
import { SolanaCaip19Tokens } from '../../constants/solana';
import type { Caip10Address } from '../../constants/solana';
import { createPrefixedLogger, type ILogger } from '../../utils/logger';
import type { ConfigProvider } from '../config';
import type { TokenPricesService } from '../token-prices/TokenPrices';
import { SnapAssetsAdapter } from './adapters/SnapAssetsAdapter';
import type { AssetMetadata, NonFungibleAssetMetadata } from './types';

export class AssetsService {
  readonly #logger: ILogger;

  readonly #configProvider: ConfigProvider;

  readonly #snapAdapter: SnapAssetsAdapter;

  readonly #tokenPricesService: TokenPricesService;

  readonly #tokenApiClient: TokenApiClient;

  readonly #nftApiClient: NftApiClient;

  constructor({
    logger,
    configProvider,
    snapAssetsAdapter,
    tokenApiClient,
    tokenPricesService,
    nftApiClient,
  }: {
    logger: ILogger;
    configProvider: ConfigProvider;
    snapAssetsAdapter: SnapAssetsAdapter;
    tokenApiClient: TokenApiClient;
    tokenPricesService: TokenPricesService;
    nftApiClient: NftApiClient;
  }) {
    this.#logger = createPrefixedLogger(logger, '[🪙 AssetsService]');
    this.#configProvider = configProvider;
    this.#snapAdapter = snapAssetsAdapter;
    this.#tokenApiClient = tokenApiClient;
    this.#tokenPricesService = tokenPricesService;
    this.#nftApiClient = nftApiClient;
  }

  #splitAssetsByType(assetTypes: CaipAssetType[]) {
    const nativeAssetTypes = assetTypes.filter((assetType) =>
      assetType.endsWith(SolanaCaip19Tokens.SOL),
    ) as NativeCaipAssetType[];
    const tokenAssetTypes = assetTypes.filter((assetType) =>
      assetType.includes('/token:'),
    ) as TokenCaipAssetType[];
    const nftAssetTypes = assetTypes.filter((assetType) =>
      assetType.includes('/nft:'),
    ) as NftCaipAssetType[];

    return { nativeAssetTypes, tokenAssetTypes, nftAssetTypes };
  }

  #getNativeTokensMetadata(
    assetTypes: NativeCaipAssetType[],
  ): Record<CaipAssetType, FungibleAssetMetadata | null> {
    const nativeTokensMetadata: Record<
      CaipAssetType,
      FungibleAssetMetadata | null
    > = {};

    for (const assetType of assetTypes) {
      const {
        chain: { namespace, reference },
        assetNamespace,
        assetReference,
      } = parseCaipAssetType(assetType);

      nativeTokensMetadata[assetType] = {
        name: 'Solana',
        symbol: 'SOL',
        fungible: true,
        iconUrl: `${this.#configProvider.get().staticApi.baseUrl}/api/v2/tokenIcons/assets/${namespace}/${reference}/${assetNamespace}/${assetReference}.png`,
        units: [
          {
            name: 'Solana',
            symbol: 'SOL',
            decimals: 9,
          },
        ],
      };
    }

    return nativeTokensMetadata;
  }

  async #getNftsMetadata(
    assetTypes: NftCaipAssetType[],
  ): Promise<Record<NftCaipAssetType, NonFungibleAssetMetadata | null>> {
    const nftsMetadata = await this.#nftApiClient.getNftsMetadata(
      assetTypes.map((assetType) => {
        const { assetReference } = parseCaipAssetType(assetType);
        return assetReference;
      }),
    );

    const nftsMetadataMap: Record<NftCaipAssetType, NonFungibleAssetMetadata> =
      {};

    assetTypes.forEach((assetType, index) => {
      const nftMetadata = nftsMetadata[index];

      if (!nftMetadata) {
        return;
      }

      const metadata = {
        name: nftMetadata.name,
        symbol: nftMetadata.name,
        imageUrl: nftMetadata.imageUrl,
        description: nftMetadata.description,
        fungible: false as const,
        isPossibleSpam: false, // FIXME: The isSpam should be part of the NFT item response, not balance, otherwise we can't get it here
        attributes: Object.fromEntries(
          nftMetadata.attributes.map(
            (attr: { key: string; value: string | number }) => [
              attr.key,
              attr.value,
            ],
          ),
        ),
        collection: {
          name: nftMetadata.collectionName,
          address: nftMetadata.onchainCollectionAddress as Caip10Address,
          symbol: nftMetadata.collectionSymbol,
          tokenCount: nftMetadata.collectionCount,
          creator: '' as Caip10Address, // FIXME: There can be more than one creator
          imageUrl: nftMetadata.collectionImageUrl ?? '',
        },
      };

      nftsMetadataMap[assetType] = metadata;
    });

    return nftsMetadataMap;
  }

  async getAssetsMetadata(
    assetTypes: CaipAssetType[],
  ): Promise<Record<CaipAssetType, AssetMetadata | null>> {
    this.#logger.log('Fetching metadata for assets', assetTypes);

    const { nativeAssetTypes, tokenAssetTypes, nftAssetTypes } =
      this.#splitAssetsByType(assetTypes);

    const [
      nativeTokensMetadata,
      tokensMetadata,
      // nftMetadata,
    ] = await Promise.all([
      this.#getNativeTokensMetadata(nativeAssetTypes),
      this.#tokenApiClient.getTokensMetadata(tokenAssetTypes),
      // this.#getNftsMetadata(nftAssetTypes),
    ]);

    return {
      ...nativeTokensMetadata,
      ...tokensMetadata,
      // ...nftMetadata,
    };
  }

  async fetch(account: SolanaKeyringAccount): Promise<AssetEntity[]> {
    return this.#snapAdapter.fetch(account);
  }

  async fetchAssetsMarketData(
    assets: {
      asset: CaipAssetType;
      unit: CaipAssetType;
    }[],
  ): Promise<
    Record<CaipAssetType, Record<CaipAssetType, FungibleAssetMarketData>>
  > {
    this.#logger.info('Fetching market data for assets', assets);

    const marketData =
      await this.#tokenPricesService.getMultipleTokensMarketData(assets);
    return marketData;
  }

  async save(asset: AssetEntity): Promise<void> {
    await this.saveMany([asset]);
  }

  async saveMany(assets: AssetEntity[]): Promise<void> {
    return this.#snapAdapter.saveMany(assets);
  }

  /**
   * Checks if the asset has changed compared to passed assets lookup.
   *
   * @param asset - The asset to check.
   * @param assetsLookup - The lookup table to check against.
   * @returns True if the asset has changed, false otherwise.
   */
  static hasChanged(asset: AssetEntity, assetsLookup: AssetEntity[]): boolean {
    return SnapAssetsAdapter.hasChanged(asset, assetsLookup);
  }

  async getAll(): Promise<AssetEntity[]> {
    return this.#snapAdapter.getAll();
  }

  /**
   * Returns a single account asset by CAIP-19 ID, or `null` if missing.
   *
   * @param accountId - Keyring account ID.
   * @param assetId - CAIP-19 asset ID.
   */
  async getAccountAssetByID(
    accountId: string,
    assetId: string,
  ): Promise<AssetEntity | null> {
    return this.#snapAdapter.getAccountAssetByID(accountId, assetId);
  }

  /**
   * Returns account assets for the given CAIP-19 IDs, keyed by asset ID.
   * Missing assets are `null`.
   *
   * @param accountId - Keyring account ID.
   * @param assetIds - CAIP-19 asset IDs to resolve.
   */
  async getAccountAssetsByIDs(
    accountId: string,
    assetIds: string[],
  ): Promise<Record<string, AssetEntity | null>> {
    return this.#snapAdapter.getAccountAssetsByIDs(accountId, assetIds);
  }

  /**
   * Returns controller-backed assets for an account on the given Solana scope.
   *
   * @param scope - CAIP-2 chain ID to filter results.
   * @param accountId - Keyring account ID.
   */
  async getAccountAssetsByScope(
    scope: CaipChainId,
    accountId: string,
  ): Promise<AssetEntity[]> {
    return this.#snapAdapter.getAccountAssetsByScope(scope, accountId);
  }

  /**
   * Returns assets for an account across all active Solana networks.
   *
   * @param accountId - Keyring account ID.
   */
  async getAccountAssetsForAllActiveScopes(
    accountId: string,
  ): Promise<AssetEntity[]> {
    return this.#snapAdapter.getAccountAssetsForAllActiveScopes(accountId);
  }

  async findByAccount(account: SolanaKeyringAccount): Promise<AssetEntity[]> {
    return this.#snapAdapter.findByAccount(account);
  }
}
