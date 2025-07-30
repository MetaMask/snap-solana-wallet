import type {
  AccountAssetListUpdatedEvent,
  AccountBalancesUpdatedEvent,
  Balance,
} from '@metamask/keyring-api';
import { KeyringEvent } from '@metamask/keyring-api';
import { emitSnapKeyringEvent } from '@metamask/keyring-snap-sdk';
import type {
  FungibleAssetMarketData,
  FungibleAssetMetadata,
} from '@metamask/snaps-sdk';
import type { CaipAssetType } from '@metamask/utils';
import { Duration, parseCaipAssetType } from '@metamask/utils';
import { TOKEN_PROGRAM_ADDRESS } from '@solana-program/token';
import { TOKEN_2022_PROGRAM_ADDRESS } from '@solana-program/token-2022';
import type {
  AccountInfoBase,
  AccountInfoWithPubkey,
  Address,
} from '@solana/kit';
import { address as asAddress } from '@solana/kit';

import type {
  AssetEntity,
  NativeAsset,
  SolanaKeyringAccount,
  TokenAsset,
} from '../../../entities';
import type { ICache } from '../../caching/ICache';
import { useCache } from '../../caching/useCache';
import type { NftApiClient } from '../../clients/nft-api/NftApiClient';
import type {
  Caip10Address,
  NativeCaipAssetType,
  NftCaipAssetType,
  TokenCaipAssetType,
} from '../../constants/solana';
import { Network, SolanaCaip19Tokens } from '../../constants/solana';
import type { TokenAccountInfoWithJsonData } from '../../sdk-extensions/rpc-api';
import type { Serializable } from '../../serialization/types';
import { fromTokenUnits } from '../../utils/fromTokenUnit';
import { getNetworkFromToken } from '../../utils/getNetworkFromToken';
import { createPrefixedLogger, type ILogger } from '../../utils/logger';
import { tokenAddressToCaip19 } from '../../utils/tokenAddressToCaip19';
import type { ConfigProvider } from '../config';
import type { SolanaConnection } from '../connection';
import type { TokenMetadataService } from '../token-metadata/TokenMetadata';
import type { TokenPricesService } from '../token-prices/TokenPrices';
import type { AssetsRepository } from './AssetsRepository';
import type { AssetMetadata, NonFungibleAssetMetadata } from './types';

/**
 * Extends a token account as returned by the `getTokenAccountsByOwner` RPC method with the scope and the caip-19 asset type for convenience.
 */
type TokenAccountWithMetadata = {
  token: AccountInfoWithPubkey<AccountInfoBase & TokenAccountInfoWithJsonData>;
  scope: Network;
  assetType: TokenCaipAssetType;
  keyringAccount: SolanaKeyringAccount;
} & Serializable;

export class AssetsService {
  readonly #logger: ILogger;

  readonly #loggerPrefix = '[🪙 AssetsService]';

  readonly #connection: SolanaConnection;

  readonly #configProvider: ConfigProvider;

  readonly #assetsRepository: AssetsRepository;

  readonly #tokenMetadataService: TokenMetadataService;

  readonly #tokenPricesService: TokenPricesService;

  readonly #cache: ICache<Serializable>;

  readonly #nftApiClient: NftApiClient;

  readonly #activeNetworks: Network[];

  public static readonly cacheTtlsMilliseconds = {
    tokenAccountsByOwner: 5 * Duration.Second,
  };

  constructor({
    connection,
    logger,
    configProvider,
    assetsRepository,
    tokenMetadataService,
    tokenPricesService,
    cache,
    nftApiClient,
  }: {
    connection: SolanaConnection;
    logger: ILogger;
    configProvider: ConfigProvider;
    assetsRepository: AssetsRepository;
    tokenMetadataService: TokenMetadataService;
    tokenPricesService: TokenPricesService;
    cache: ICache<Serializable>;
    nftApiClient: NftApiClient;
  }) {
    this.#logger = createPrefixedLogger(logger, '[🪙 AssetsService]');
    this.#connection = connection;
    this.#configProvider = configProvider;
    this.#assetsRepository = assetsRepository;
    this.#tokenMetadataService = tokenMetadataService;
    this.#tokenPricesService = tokenPricesService;
    this.#cache = cache;
    this.#nftApiClient = nftApiClient;
    this.#activeNetworks = configProvider.get().activeNetworks;
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

  async #getTokensMetadata(
    assetTypes: TokenCaipAssetType[],
  ): Promise<Record<TokenCaipAssetType, FungibleAssetMetadata | null>> {
    const tokensMetadata =
      await this.#tokenMetadataService.getTokensMetadata(assetTypes);

    return tokensMetadata;
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
    this.#logger.log(
      this.#loggerPrefix,
      'Fetching metadata for assets',
      assetTypes,
    );

    const { nativeAssetTypes, tokenAssetTypes, nftAssetTypes } =
      this.#splitAssetsByType(assetTypes);

    const [
      nativeTokensMetadata,
      tokensMetadata,
      // nftMetadata,
    ] = await Promise.all([
      this.#getNativeTokensMetadata(nativeAssetTypes),
      this.#getTokensMetadata(tokenAssetTypes),
      // this.#getNftsMetadata(nftAssetTypes),
    ]);

    return {
      ...nativeTokensMetadata,
      ...tokensMetadata,
      // ...nftMetadata,
    };
  }

  /**
   * Matrix-fetches all token accounts owned by the given address on the specified networks and program ids,
   * and merges the results into a single array. Each individual token is augmented with the scope and the caip-19 asset type for convenience.
   *
   * It caches the results for each pair of scope and program id.
   *
   * @param accounts - The owners of the token accounts.
   * @param programIds - The program ids to fetch the token accounts for.
   * @param scopes - The networks to fetch the token accounts for.
   * @returns The token accounts augmented with the scope and the caip-19 asset type for convenience.
   */
  async #fetchTokenAccountsMultiple(
    accounts: SolanaKeyringAccount[],
    programIds: Address[] = [TOKEN_PROGRAM_ADDRESS, TOKEN_2022_PROGRAM_ADDRESS],
    scopes: Network[] = [Network.Mainnet],
  ): Promise<TokenAccountWithMetadata[]> {
    if (programIds.length === 0 || scopes.length === 0) {
      return [];
    }

    // Create all combinations of account, programId, and scope
    const combinations = accounts.flatMap((account) =>
      programIds.flatMap((programId) =>
        scopes.map((scope) => ({ account, programId, scope })),
      ),
    );

    const fetchTokenAccountsCached = useCache<
      [SolanaKeyringAccount, Address, Network],
      TokenAccountWithMetadata[]
    >(this.#fetchTokenAccounts.bind(this), this.#cache, {
      functionName: 'AssetsService:fetchTokenAccounts',
      ttlMilliseconds: AssetsService.cacheTtlsMilliseconds.tokenAccountsByOwner,
      generateCacheKey: (functionName, args) => {
        const [account, programId, scope] = args;
        return `${functionName}:${account.id}:${programId}:${scope}`;
      },
    });

    const responses = await Promise.allSettled(
      combinations.map(async ({ account, programId, scope }) => {
        const response = await fetchTokenAccountsCached(
          account,
          programId,
          scope,
        );
        return response;
      }),
    );

    return responses.flatMap((item) =>
      item.status === 'fulfilled' ? item.value : [],
    );
  }

  /**
   * Fetches the token accounts for the given owner and program id on the specified scope.
   *
   * @param account - The owner of the token accounts.
   * @param programId - The program id to fetch the token accounts for.
   * @param scope - The scope to fetch the token accounts for.
   * @returns The token accounts augmented with the scope and the caip-19 asset type for convenience.
   */
  async #fetchTokenAccounts(
    account: SolanaKeyringAccount,
    programId: Address = TOKEN_PROGRAM_ADDRESS,
    scope: Network = Network.Mainnet,
  ): Promise<TokenAccountWithMetadata[]> {
    const response = await this.#connection
      .getRpc(scope)
      .getTokenAccountsByOwner(
        asAddress(account.address),
        { programId },
        { encoding: 'jsonParsed' },
      )
      .send();

    const tokens = response.value;

    // Attach the scope and the caip-19 asset type to each token account for easier future reference
    return tokens.map(
      (token) =>
        ({
          token,
          scope,
          assetType: tokenAddressToCaip19(
            scope,
            token.account.data.parsed.info.mint,
          ),
          keyringAccount: account,
        }) as TokenAccountWithMetadata,
    );
  }

  /**
   * Fetches all assets for the given account.
   *
   * @param account - The account to get the balances for.
   * @returns The balances and metadata of the account for the given assets.
   */
  async fetch(account: SolanaKeyringAccount): Promise<AssetEntity[]> {
    this.#logger.info('Fetching assets for account', account);

    const [nativeAssets, tokenAccounts] = await Promise.all([
      this.#fetchNativeAssets(account),
      this.#fetchTokenAccountsMultiple(
        [account],
        [TOKEN_PROGRAM_ADDRESS, TOKEN_2022_PROGRAM_ADDRESS],
        this.#activeNetworks,
      ),
    ]);

    const tokensMetadata = await this.#tokenMetadataService.getTokensMetadata(
      tokenAccounts.map((tokenAccount) => tokenAccount.assetType),
    );

    const tokenAssets: TokenAsset[] = tokenAccounts
      .filter((tokenAccount) => tokenAccount.assetType.includes('/token:'))
      .map((tokenAccount) => {
        const { assetType } = tokenAccount;
        const { decimals, amount, uiAmountString } =
          tokenAccount.token.account.data.parsed.info.tokenAmount;

        return {
          assetType,
          keyringAccountId: tokenAccount.keyringAccount.id,
          network: tokenAccount.scope,
          mint: tokenAccount.token.account.data.parsed.info.mint,
          pubkey: tokenAccount.token.pubkey,
          symbol: tokensMetadata[assetType]?.symbol ?? 'UNKNOWN',
          decimals,
          rawAmount: amount,
          uiAmount: uiAmountString ?? fromTokenUnits(amount, decimals),
        };
      });

    // const nftAssets = await this.#fetchNftAssets(account, tokenAccounts.filter(
    //   (token) => token.assetType.includes('/nft:'),
    // ));

    return [
      ...nativeAssets,
      ...tokenAssets,
      // ...nftAssets,
    ];
  }

  getNativeAssetTypes(): NativeCaipAssetType[] {
    return this.#activeNetworks.map(
      (network) => `${network}/${SolanaCaip19Tokens.SOL}` as const,
    );
  }

  async #fetchNativeAssets(
    account: SolanaKeyringAccount,
  ): Promise<NativeAsset[]> {
    const nativeAssetsTypes = this.getNativeAssetTypes();

    const accountAddress = asAddress(account.address);

    const balancePromises = nativeAssetsTypes.map(async (assetType) => {
      const balance = await this.#connection
        .getRpc(getNetworkFromToken(assetType))
        .getBalance(accountAddress)
        .send();

      return {
        assetType,
        keyringAccountId: account.id,
        network: getNetworkFromToken(assetType),
        address: accountAddress,
        symbol: 'SOL',
        decimals: 9,
        rawAmount: balance.value.toString(),
        uiAmount: fromTokenUnits(balance.value, 9),
      };
    });

    const results = (await Promise.allSettled(balancePromises)).flatMap(
      (item) => (item.status === 'fulfilled' ? item.value : []),
    );

    return results;
  }

  async #fetchNftAssets(
    account: SolanaKeyringAccount,
    assetIds: NftCaipAssetType[],
  ): Promise<Record<CaipAssetType, Balance>> {
    const accountAddress = asAddress(account.address);

    const nftAssets =
      await this.#nftApiClient.listAddressSolanaNfts(accountAddress);
    const balances: Record<CaipAssetType, Balance> = {};

    for (const assetId of assetIds) {
      const { assetReference } = parseCaipAssetType(assetId);

      const nftAsset = nftAssets.find(
        (nft) => nft.tokenAddress === assetReference,
      );

      if (!nftAsset) {
        continue;
      }

      balances[assetId] = {
        unit: nftAsset.nftToken.name,
        amount: nftAsset.balance.toString(),
      };
    }

    return balances;
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
    this.#logger.info('Saving assets', assets);

    const hasZeroRawAmount = (asset: AssetEntity) => asset.rawAmount === '0';
    const hasNonZeroRawAmount = (asset: AssetEntity) =>
      !hasZeroRawAmount(asset);

    const savedAssets = await this.getAll();

    // Save assets using repository
    await this.#assetsRepository.saveMany(assets);

    // Notify the extension about the new assets in a single event
    const isNew = (asset: AssetEntity) =>
      !savedAssets.find(
        (item) =>
          item.keyringAccountId === asset.keyringAccountId &&
          item.assetType === asset.assetType,
      );

    const wasSavedWithZeroRawAmount = (asset: AssetEntity) => {
      const savedAsset = savedAssets.find(
        (item) =>
          item.keyringAccountId === asset.keyringAccountId &&
          item.assetType === asset.assetType,
      );

      return savedAsset && hasZeroRawAmount(savedAsset);
    };

    const assetListUpdatedPayload = assets.reduce<
      AccountAssetListUpdatedEvent['params']['assets']
    >(
      (acc, asset) => ({
        ...acc,
        [asset.keyringAccountId]: {
          added: [
            ...(acc[asset.keyringAccountId]?.added ?? []),
            ...((isNew(asset) || wasSavedWithZeroRawAmount(asset)) &&
            hasNonZeroRawAmount(asset)
              ? [asset.assetType]
              : []),
          ],
          removed: [
            ...(acc[asset.keyringAccountId]?.removed ?? []),
            ...(hasZeroRawAmount(asset) ? [asset.assetType] : []),
          ],
        },
      }),
      {},
    );

    const isEmptyAccountAssetListUpdatedPayload = Object.values(
      assetListUpdatedPayload,
    )
      .map((item) => item.added.length + item.removed.length)
      .every((item) => item === 0);

    if (!isEmptyAccountAssetListUpdatedPayload) {
      await emitSnapKeyringEvent(snap, KeyringEvent.AccountAssetListUpdated, {
        assets: assetListUpdatedPayload,
      });
    }

    // Notify the extension about the changed balances in a single event

    const hasChanged = (asset: AssetEntity) =>
      AssetsService.hasChanged(asset, savedAssets);

    const balancesUpdatedPayload = assets
      .filter(hasNonZeroRawAmount)
      .filter(hasChanged)
      .reduce<AccountBalancesUpdatedEvent['params']['balances']>(
        (acc, asset) => ({
          ...acc,
          [asset.keyringAccountId]: {
            ...(acc[asset.keyringAccountId] ?? {}),
            [asset.assetType]: {
              unit: asset.symbol,
              amount: asset.uiAmount,
            },
          },
        }),
        {},
      );

    const isEmptyAccountBalancesUpdatedPayload = Object.values(
      balancesUpdatedPayload,
    )
      .map((item) => Object.keys(item).length)
      .every((item) => item === 0); // If all balances are zero, don't emit the event.

    if (!isEmptyAccountBalancesUpdatedPayload) {
      await emitSnapKeyringEvent(snap, KeyringEvent.AccountBalancesUpdated, {
        balances: balancesUpdatedPayload,
      });
    }
  }

  /**
   * Checks if the asset has changed compared to passed assets lookup.
   *
   * @param asset - The asset to check.
   * @param assetsLookup - The lookup table to check against.
   * @returns True if the asset has changed, false otherwise.
   */
  static hasChanged(asset: AssetEntity, assetsLookup: AssetEntity[]): boolean {
    const savedAsset = assetsLookup.find(
      (item) =>
        item.keyringAccountId === asset.keyringAccountId &&
        item.assetType === asset.assetType,
    );

    if (!savedAsset) {
      return true;
    }

    return savedAsset.rawAmount !== asset.rawAmount;
  }

  async getAll(): Promise<AssetEntity[]> {
    return this.#assetsRepository.getAll();
  }

  async findByAccount(account: SolanaKeyringAccount): Promise<AssetEntity[]> {
    const { id: keyringAccountId, address } = account;

    const savedAssets =
      await this.#assetsRepository.findByKeyringAccountId(keyringAccountId);

    // Every account must have at least the native assets. Ensure that they are always present, even if not yet fetched/saved.
    const nativeAssetTypes = this.getNativeAssetTypes();
    const missingNativeAssets: NativeAsset[] = [];

    for (const nativeAssetType of nativeAssetTypes) {
      const hasNativeAsset = savedAssets.some(
        (asset) => asset.assetType === nativeAssetType,
      );

      if (!hasNativeAsset) {
        // Create a placeholder native asset with zero balance
        // This will be updated when assets are actually fetched
        const network = getNetworkFromToken(nativeAssetType);

        missingNativeAssets.push({
          assetType: nativeAssetType,
          keyringAccountId: account.id,
          network,
          address,
          symbol: 'SOL',
          decimals: 9,
          rawAmount: '0',
          uiAmount: '0',
        });
      }
    }

    return [...savedAssets, ...missingNativeAssets];
  }
}
