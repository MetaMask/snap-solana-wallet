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
import { createPrefixedLogger } from '../../utils/logger';
import type { ILogger } from '../../utils/logger';
import type { AccountsService } from '../accounts/AccountsService';
import type { ConfigProvider } from '../config';
import type { TokenPricesService } from '../token-prices/TokenPrices';
import type { CoreAssetsAdapter } from './adapters/CoreAssetsAdapter';
import { SnapAssetsAdapter } from './adapters/SnapAssetsAdapter';
import { isSnapOwnedAsset } from './snapOwnedAssets';
import type { AssetMetadata, NonFungibleAssetMetadata } from './types';

export class AssetsService {
  readonly #logger: ILogger;

  readonly #configProvider: ConfigProvider;

  readonly #snapAdapter: SnapAssetsAdapter;

  readonly #coreAssetsAdapter: CoreAssetsAdapter;

  readonly #accountsService: AccountsService;

  readonly #tokenPricesService: TokenPricesService;

  readonly #tokenApiClient: TokenApiClient;

  readonly #nftApiClient: NftApiClient;

  constructor({
    logger,
    configProvider,
    snapAssetsAdapter,
    coreAssetsAdapter,
    accountsService,
    tokenApiClient,
    tokenPricesService,
    nftApiClient,
  }: {
    logger: ILogger;
    configProvider: ConfigProvider;
    snapAssetsAdapter: SnapAssetsAdapter;
    coreAssetsAdapter: CoreAssetsAdapter;
    accountsService: AccountsService;
    tokenApiClient: TokenApiClient;
    tokenPricesService: TokenPricesService;
    nftApiClient: NftApiClient;
  }) {
    this.#logger = createPrefixedLogger(logger, '[🪙 AssetsService]');
    this.#configProvider = configProvider;
    this.#snapAdapter = snapAssetsAdapter;
    this.#coreAssetsAdapter = coreAssetsAdapter;
    this.#accountsService = accountsService;
    this.#tokenApiClient = tokenApiClient;
    this.#tokenPricesService = tokenPricesService;
    this.#nftApiClient = nftApiClient;
  }

  async #solanaChainIds(): Promise<string[]> {
    return this.#configProvider.getActiveNetworks();
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
        isPossibleSpam: false,
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
          creator: '' as Caip10Address,
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

    const { nativeAssetTypes, tokenAssetTypes } =
      this.#splitAssetsByType(assetTypes);

    const [nativeTokensMetadata, tokensMetadata] = await Promise.all([
      this.#getNativeTokensMetadata(nativeAssetTypes),
      this.#tokenApiClient.getTokensMetadata(tokenAssetTypes),
    ]);

    return {
      ...nativeTokensMetadata,
      ...tokensMetadata,
    };
  }

  async fetch(_account: SolanaKeyringAccount): Promise<AssetEntity[]> {
    return [];
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

  async save(_asset: AssetEntity): Promise<void> {
    // Fungible assets are tracked by Core; Snap persistence is disabled.
  }

  async saveMany(_assets: AssetEntity[]): Promise<void> {
    // Fungible assets are tracked by Core; Snap persistence is disabled.
  }

  static hasChanged(asset: AssetEntity, assetsLookup: AssetEntity[]): boolean {
    return SnapAssetsAdapter.hasChanged(asset, assetsLookup);
  }

  async getAll(): Promise<AssetEntity[]> {
    return this.#snapAdapter.getAll();
  }

  async getAccountAssetByID(
    accountId: string,
    assetId: CaipAssetType,
  ): Promise<AssetEntity | null> {
    if (isSnapOwnedAsset(assetId)) {
      return this.#snapAdapter.getAccountAssetByID(accountId, assetId);
    }

    const account = await this.#accountsService.findById(accountId);
    if (!account) {
      return null;
    }

    return this.#coreAssetsAdapter.getAccountAssetByID(
      accountId,
      assetId,
      account.address,
    );
  }

  async getAccountAssetsByIDs(
    accountId: string,
    assetIds: string[],
  ): Promise<Record<string, AssetEntity | null>> {
    if (assetIds.length === 0) {
      return {};
    }

    const account = await this.#accountsService.findById(accountId);
    if (!account) {
      return Object.fromEntries(assetIds.map((assetId) => [assetId, null]));
    }

    const snapOwnedIds = assetIds.filter(isSnapOwnedAsset);
    const fungibleIds = assetIds.filter(
      (assetId) => !isSnapOwnedAsset(assetId),
    );

    const [fungibleResults, snapResults] = await Promise.all([
      fungibleIds.length > 0
        ? this.#coreAssetsAdapter.getAccountAssetsByIDs(
            accountId,
            fungibleIds,
            account.address,
          )
        : Promise.resolve({}),
      snapOwnedIds.length > 0
        ? this.#snapAdapter.getAccountAssetsByIDs(accountId, snapOwnedIds)
        : Promise.resolve({}),
    ]);

    return { ...snapResults, ...fungibleResults };
  }

  async getAccountAssetsByScope(
    scope: CaipChainId,
    accountId: string,
  ): Promise<AssetEntity[]> {
    const account = await this.#accountsService.findById(accountId);
    if (!account) {
      return [];
    }

    const [fungibleAssets, snapAssets] = await Promise.all([
      this.#coreAssetsAdapter.getAccountAssetsByScope(
        scope,
        accountId,
        account.address,
      ),
      this.#snapAdapter.getAccountAssetsByScope(scope, accountId),
    ]);

    const nftAssets = snapAssets.filter((asset) =>
      isSnapOwnedAsset(asset.assetType),
    );

    return [...fungibleAssets, ...nftAssets];
  }

  async getAccountAssetsForAllActiveScopes(
    accountId: string,
  ): Promise<AssetEntity[]> {
    const account = await this.#accountsService.findById(accountId);
    if (!account) {
      return [];
    }

    const chainIds = (await this.#solanaChainIds()) as CaipChainId[];
    const relevantChainIds = chainIds.filter((chainId) =>
      account.scopes.includes(chainId),
    );

    const fungibleByScope = await Promise.all(
      relevantChainIds.map((scope) =>
        this.#coreAssetsAdapter.getAccountAssetsByScope(
          scope,
          accountId,
          account.address,
        ),
      ),
    );
    const snapAssets =
      await this.#snapAdapter.getAccountAssetsForAllActiveScopes(accountId);
    const nftAssets = snapAssets.filter((asset) =>
      isSnapOwnedAsset(asset.assetType),
    );

    return [...fungibleByScope.flat(), ...nftAssets];
  }

  async findByAccount(account: SolanaKeyringAccount): Promise<AssetEntity[]> {
    return this.#snapAdapter.findByAccount(account);
  }
}
